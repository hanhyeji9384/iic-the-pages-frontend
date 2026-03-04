// ============================================================================
// supabaseDataClient — RDB Direct Mode (KV store 미사용)
// ============================================================================
// 모든 데이터를 Supabase RDB 테이블에서 직접 쿼리합니다.
// 앱 시작 시 RDB 연결 상태를 진단하고 콘솔에 상세 로그를 출력합니다.
// Goals: goals 테이블 (country 정보는 notes 필드에 JSON 저장)
// ScheduleEvents: schedule_events 테이블 (UI 메타데이터는 description에 JSON)
// uploadFile: Edge Function 유지 (Storage 버킷 접근 필요)
// ============================================================================

import { supabase } from './supabase/client';
import { projectId, publicAnonKey } from './supabase/info';
import { Store, BrandDefinition } from '../types';
import { SavedLine } from './mockLineServer';
import { TrafficZone } from '../components/dashboard/TrafficManagerPanel';
import { mapDbRowToStore, mapDbBrandToDef } from './storeMapper';

// ---------------------------------------------------------------------------
// Edge Function helpers (uploadFile + KV fallback)
// ---------------------------------------------------------------------------
const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-ed83bf0f`;
const authHeaders = () => ({ 'Authorization': `Bearer ${publicAnonKey}` });
const jsonHeaders = () => ({
  'Authorization': `Bearer ${publicAnonKey}`,
  'Content-Type': 'application/json',
});

// ---------------------------------------------------------------------------
// RDB 상태 진단 (앱 시작 시 1회)
// ---------------------------------------------------------------------------
let _rdbDiagnosis: {
  brandsOk: boolean;
  storesOk: boolean;
  viewOk: boolean;
  brandsCount: number;
  storesCount: number;
} | null = null;

async function diagnoseRdb() {
  if (_rdbDiagnosis) return _rdbDiagnosis;

  const result = { brandsOk: false, storesOk: false, viewOk: false, brandsCount: 0, storesCount: 0 };

  // 1. brands 테이블 확인
  const { data: brands, error: brandsErr } = await supabase.from('brands').select('id', { count: 'exact', head: false }).limit(5);
  if (brandsErr) {
    console.error('[RDB Diagnosis] brands 테이블 접근 실패:', brandsErr.message, brandsErr.code, brandsErr.hint);
  } else {
    result.brandsOk = true;
    result.brandsCount = brands?.length || 0;
  }

  // 2. stores 테이블 확인
  const { data: stores, error: storesErr } = await supabase.from('stores').select('id', { count: 'exact', head: false }).limit(5);
  if (storesErr) {
    console.error('[RDB Diagnosis] stores 테이블 접근 실패:', storesErr.message, storesErr.code, storesErr.hint);
  } else {
    result.storesOk = true;
    result.storesCount = stores?.length || 0;
  }

  // 3. v_store_full 뷰 확인
  const { data: viewRows, error: viewErr } = await supabase.from('v_store_full').select('id, store_name, brand_name, brand_type').limit(3);
  if (viewErr) {
    console.error('[RDB Diagnosis] v_store_full 뷰 접근 실패:', viewErr.message, viewErr.code, viewErr.hint);
    console.warn('[RDB Diagnosis] 해결법: Supabase SQL Editor에서 supabase-database-guide.sql의 STEP 4 (Views & Functions)를 실행하세요.');
  } else {
    result.viewOk = true;
    console.log('[RDB Diagnosis] v_store_full 뷰 샘플:', viewRows);
  }

  console.log(`[RDB Diagnosis] 결과: brands=${result.brandsOk}(${result.brandsCount}건), stores=${result.storesOk}(${result.storesCount}건), v_store_full=${result.viewOk}`);

  _rdbDiagnosis = result;
  return result;
}

// 앱 로드 시 진단 자동 실행
diagnoseRdb();

// ---------------------------------------------------------------------------
// RDB helpers
// ---------------------------------------------------------------------------
async function enrichStores(rows: any[]): Promise<Store[]> {
  if (rows.length === 0) return [];
  const storeIds = rows.map(r => r.id);

  const [imagesRes, yearlySalesRes] = await Promise.all([
    supabase.from('store_images').select('*').in('store_id', storeIds).order('sort_order'),
    supabase.from('yearly_sales').select('*').in('store_id', storeIds).order('year'),
  ]);

  const imagesByStore = new Map<string, any[]>();
  (imagesRes.data || []).forEach(img => {
    if (!imagesByStore.has(img.store_id)) imagesByStore.set(img.store_id, []);
    imagesByStore.get(img.store_id)!.push(img);
  });

  const salesByStore = new Map<string, any[]>();
  (yearlySalesRes.data || []).forEach(ys => {
    if (!salesByStore.has(ys.store_id)) salesByStore.set(ys.store_id, []);
    salesByStore.get(ys.store_id)!.push(ys);
  });

  return rows.map(row =>
    mapDbRowToStore(row, imagesByStore.get(row.id) || [], salesByStore.get(row.id) || [])
  );
}

async function findStoreUUID(idOrLegacy: string): Promise<string | null> {
  if (idOrLegacy.match(/^[0-9a-f]{8}-[0-9a-f]{4}-/i)) return idOrLegacy;
  const { data } = await supabase.from('stores').select('id').eq('legacy_id', idOrLegacy).maybeSingle();
  return data?.id || null;
}

const brandIdCache = new Map<string, string>();
async function getBrandId(brandName: string): Promise<string | null> {
  const cached = brandIdCache.get(brandName.toLowerCase());
  if (cached) return cached;
  const { data } = await supabase.from('brands').select('id').ilike('name', brandName).maybeSingle();
  if (data?.id) { brandIdCache.set(brandName.toLowerCase(), data.id); return data.id; }
  return null;
}

// ---------------------------------------------------------------------------
// Month name ↔ number helper (ScheduleEvents)
// ---------------------------------------------------------------------------
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthToDate(month: string | number, year: number): string {
  const m = typeof month === 'string' ? parseInt(month) || (MONTH_NAMES.indexOf(month) + 1) : month;
  return `${year}-${String(m).padStart(2, '0')}-01`;
}

// ============================================================================
// Exported dataClient — RDB Direct
// ============================================================================
export const dataClient = {

  // ─── Seed (no-op in RDB mode) ────────────────────────────────────────────
  seed: async (_force = false) => {
    console.log('[RDB] seed() is no-op — data managed via Supabase SQL Editor');
    return { message: 'RDB mode active' };
  },

  // ─── IIC Stores ──────────────────────────────────────────────────────────
  getIICStores: async (): Promise<Store[]> => {
    try {
      // 진단: v_store_full 뷰에서 brand_type='iic' 매장 조회
      const { data, error } = await supabase.from('v_store_full').select('*').eq('brand_type', 'iic');
      if (error) throw error;
      console.log(`[RDB] getIICStores: ${(data || []).length} rows from v_store_full`);
      
      // 진단: stores 테이블 직접 조회 (is_active 무관) — 누락 원인 파악용
      const { data: rawStores, error: rawErr } = await supabase
        .from('stores')
        .select('id, legacy_id, name, brand_id, brand_category, is_active, status')
        .eq('brand_category', 'iic');
      if (!rawErr && rawStores) {
        const viewIds = new Set((data || []).map((r: any) => r.id));
        const missing = rawStores.filter((r: any) => !viewIds.has(r.id));
        if (missing.length > 0) {
          console.warn(`[RDB] ⚠️ IIC stores in 'stores' but NOT in v_store_full (${missing.length}건):`,
            missing.map((r: any) => `${r.name} (id=${r.id}, is_active=${r.is_active}, status=${r.status}, brand_id=${r.brand_id})`));
          console.warn('[RDB] → 원인: is_active=false 이거나 brands.category≠"iic" 일 가능성. Supabase SQL Editor에서 확인하세요:');
          console.warn('[RDB]   SELECT s.id, s.name, s.is_active, b.category FROM stores s LEFT JOIN brands b ON s.brand_id=b.id WHERE s.brand_category=\'iic\'');
        } else {
          console.log(`[RDB] ✅ stores 테이블과 v_store_full 뷰의 IIC 매장 수 일치: ${rawStores.length}건`);
        }
      }
      
      return enrichStores(data || []);
    } catch (e) { console.error('[RDB] getIICStores failed:', e); return []; }
  },

  addStore: async (store: any): Promise<Store> => {
    const brandId = await getBrandId(store.brand);
    if (!brandId) throw new Error(`Brand not found: ${store.brand}`);
    const { data: newStore, error } = await supabase.from('stores').insert({
      legacy_id: store.id || null, brand_id: brandId, name: store.name,
      channel: store.type || null, status: store.status || 'Plan',
      status_year: store.statusYear || null,
      address: store.location?.address || null, city: store.location?.city || '', country: store.location?.country || '',
      lat: store.location?.lat || 0, lng: store.location?.lng || 0,
      size_label: store.size || null, area_sqm: store.area || null,
      open_date: store.openDate || null, rent_label: store.rent || null,
      brand_category: store.brandCategory || 'iic', visitors: store.visitors || null,
    }).select().single();
    if (error) throw new Error(`addStore failed: ${error.message}`);
    if (store.contract?.startDate) {
      await supabase.from('contracts').insert({ store_id: newStore.id, start_date: store.contract.startDate, end_date: store.contract.endDate, renewal_option: store.contract.renewalOption || false });
    }
    if (store.financial) {
      await supabase.from('store_financials').insert({ store_id: newStore.id, currency: store.financial.currency || 'KRW', monthly_rent: store.financial.monthlyRent || 0, monthly_sales: store.financial.monthlySales || 0, sales_per_sqm: store.financial.salesPerSqm || 0, investment: store.financial.investment || 0 });
    }
    if (store.financial?.yearlySales?.length) {
      await supabase.from('yearly_sales').insert(store.financial.yearlySales.map((ys: any) => ({ store_id: newStore.id, year: ys.year, amount: ys.amount })));
    }
    if (store.images) {
      const imgs = Object.entries(store.images).filter(([_, u]) => u).map(([t, u], i) => ({ store_id: newStore.id, image_type: t, image_url: u as string, sort_order: i }));
      if (imgs.length) await supabase.from('store_images').insert(imgs);
    }
    return { ...store, id: newStore.legacy_id || newStore.id };
  },

  updateIICStore: async (id: string, store: Store): Promise<Store> => {
    const uuid = await findStoreUUID(id);
    if (!uuid) throw new Error(`Store not found: ${id}`);
    const brandId = await getBrandId(store.brand);
    const up: any = { name: store.name, channel: store.type || null, status: store.status, status_year: store.statusYear || null, address: store.location?.address || null, city: store.location?.city || '', country: store.location?.country || '', lat: store.location?.lat, lng: store.location?.lng, size_label: store.size || null, area_sqm: store.area || null, open_date: store.openDate || null, changed_open_date: store.ChangOpenDate || null, changed_close_date: store.ChangCloseDate || null, rent_label: store.rent || null };
    if (brandId) up.brand_id = brandId;
    const { error } = await supabase.from('stores').update(up).eq('id', uuid);
    if (error) throw new Error(`updateIICStore failed: ${error.message}`);
    if (store.contract?.startDate) { await supabase.from('contracts').upsert({ store_id: uuid, start_date: store.contract.startDate, end_date: store.contract.endDate, renewal_option: store.contract.renewalOption || false }, { onConflict: 'store_id' }); }
    if (store.financial) { await supabase.from('store_financials').upsert({ store_id: uuid, currency: store.financial.currency || 'KRW', monthly_rent: store.financial.monthlyRent || 0, monthly_sales: store.financial.monthlySales || 0, sales_per_sqm: store.financial.salesPerSqm || 0, investment: store.financial.investment || 0 }, { onConflict: 'store_id' }); }
    if (store.financial?.yearlySales) { await supabase.from('yearly_sales').delete().eq('store_id', uuid); if (store.financial.yearlySales.length > 0) await supabase.from('yearly_sales').insert(store.financial.yearlySales.map(ys => ({ store_id: uuid, year: ys.year, amount: ys.amount }))); }
    if (store.images) { await supabase.from('store_images').delete().eq('store_id', uuid); const imgs = Object.entries(store.images).filter(([_, u]) => u).map(([t, u], i) => ({ store_id: uuid, image_type: t, image_url: u as string, sort_order: i })); if (imgs.length) await supabase.from('store_images').insert(imgs); }
    return store;
  },

  deleteStore: async (id: string): Promise<void> => {
    const uuid = await findStoreUUID(id);
    if (!uuid) throw new Error(`Store not found: ${id}`);
    const { error } = await supabase.from('stores').delete().eq('id', uuid);
    if (error) throw new Error(`deleteStore failed: ${error.message}`);
  },

  // ─── Competitor / Preferred / Smartglass Stores ──────────────────────────
  getCompStores: async (): Promise<Store[]> => {
    try {
      const { data, error } = await supabase.from('v_store_full').select('*').in('brand_type', ['competitor', 'preferred', 'smartglass']);
      if (error) throw error;
      console.log(`[RDB] getCompStores: ${(data || []).length} rows`);
      return enrichStores(data || []);
    } catch (e) { console.error('[RDB] getCompStores failed:', e); return []; }
  },

  addCompStore: async (store: any): Promise<Store> => {
    let brandId = await getBrandId(store.brand);
    if (!brandId) {
      const { data: nb, error } = await supabase.from('brands').insert({ name: store.brand, category: store.brandCategory || 'competitor' }).select('id').single();
      if (error) throw new Error(`addCompStore brand failed: ${error.message}`);
      brandId = nb.id; brandIdCache.set(store.brand.toLowerCase(), brandId!);
    }
    const { data: ns, error } = await supabase.from('stores').insert({ legacy_id: store.id || null, brand_id: brandId, name: store.name, channel: store.type || null, status: store.status || 'Open', city: store.location?.city || '', country: store.location?.country || '', lat: store.location?.lat || 0, lng: store.location?.lng || 0, size_label: store.size || null, rent_label: store.rent || null, brand_category: store.brandCategory || 'competitor' }).select().single();
    if (error) throw new Error(`addCompStore failed: ${error.message}`);
    return { ...store, id: ns.legacy_id || ns.id };
  },

  updateCompStore: async (id: string, store: Store): Promise<Store> => {
    const uuid = await findStoreUUID(id);
    if (!uuid) throw new Error(`Comp store not found: ${id}`);
    const brandId = await getBrandId(store.brand);
    const up: any = { name: store.name, channel: store.type || null, status: store.status, address: store.location?.address || null, city: store.location?.city || '', country: store.location?.country || '', lat: store.location?.lat, lng: store.location?.lng, size_label: store.size || null, rent_label: store.rent || null };
    if (brandId) up.brand_id = brandId;
    const { error } = await supabase.from('stores').update(up).eq('id', uuid);
    if (error) throw new Error(`updateCompStore failed: ${error.message}`);
    return store;
  },

  deleteCompStore: async (id: string): Promise<void> => {
    const uuid = await findStoreUUID(id);
    if (!uuid) throw new Error(`Comp store not found: ${id}`);
    const { error } = await supabase.from('stores').delete().eq('id', uuid);
    if (error) throw new Error(`deleteCompStore failed: ${error.message}`);
  },

  // ─── Pipelines ───────────────────────────────────────────────────────────
  getPipelines: async (): Promise<SavedLine[]> => {
    try {
      const { data, error } = await supabase.from('pipelines').select('*').order('created_at');
      if (error) throw error;
      return (data || []).map(r => ({ id: r.legacy_id || r.id, title: r.title, point1: { lat: r.point1_lat, lng: r.point1_lng }, point2: { lat: r.point2_lat, lng: r.point2_lng }, color: r.color || '#EF4444', thickness: r.thickness || 2, createdAt: r.created_at }));
    } catch (e) { console.error('[RDB] getPipelines failed:', e); return []; }
  },

  addPipeline: async (line: Partial<SavedLine>): Promise<SavedLine> => {
    const { data, error } = await supabase.from('pipelines').insert({ legacy_id: line.id || null, title: line.title || 'Untitled', point1_lat: line.point1?.lat || 0, point1_lng: line.point1?.lng || 0, point2_lat: line.point2?.lat || 0, point2_lng: line.point2?.lng || 0, color: line.color || '#EF4444', thickness: line.thickness || 2 }).select().single();
    if (error) throw new Error(`addPipeline failed: ${error.message}`);
    return { id: data.legacy_id || data.id, title: data.title, point1: { lat: data.point1_lat, lng: data.point1_lng }, point2: { lat: data.point2_lat, lng: data.point2_lng }, color: data.color, thickness: data.thickness, createdAt: data.created_at };
  },

  deletePipeline: async (id: string): Promise<void> => {
    let { error } = await supabase.from('pipelines').delete().eq('legacy_id', id);
    if (error) { const r = await supabase.from('pipelines').delete().eq('id', id); if (r.error) throw new Error(`deletePipeline failed: ${r.error.message}`); }
  },

  // ─── Traffic Zones ───────────────────────────────────────────────────────
  getTrafficZones: async (): Promise<TrafficZone[]> => {
    try {
      const { data, error } = await supabase.from('traffic_zones').select('*').order('created_at');
      if (error) throw error;
      return (data || []).map(r => ({ id: r.legacy_id || r.id, name: r.name, center: { lat: r.center_lat, lng: r.center_lng }, radius: r.radius, color: r.color || '#3B82F6', opacity: Number(r.opacity) || 0.3, createdAt: r.created_at }));
    } catch (e) { console.error('[RDB] getTrafficZones failed:', e); return []; }
  },

  saveTrafficZone: async (zone: TrafficZone): Promise<TrafficZone> => {
    const { data, error } = await supabase.from('traffic_zones').insert({ legacy_id: zone.id || null, name: zone.name, center_lat: zone.center.lat, center_lng: zone.center.lng, radius: zone.radius, color: zone.color || '#3B82F6', opacity: zone.opacity || 0.3 }).select().single();
    if (error) throw new Error(`saveTrafficZone failed: ${error.message}`);
    return { ...zone, id: data.legacy_id || data.id };
  },

  deleteTrafficZone: async (id: string): Promise<void> => {
    let { error } = await supabase.from('traffic_zones').delete().eq('legacy_id', id);
    if (error) { const r = await supabase.from('traffic_zones').delete().eq('id', id); if (r.error) throw new Error(`deleteTrafficZone failed: ${r.error.message}`); }
  },

  // ─── Negotiation History ─────────────────────────────────────────────────
  getNegotiationHistory: async (storeId: string): Promise<any[]> => {
    try {
      const uuid = await findStoreUUID(storeId);
      if (!uuid) return [];
      const { data, error } = await supabase.from('negotiation_history').select('*').eq('store_id', uuid).order('event_date', { ascending: false });
      if (error) return [];
      return (data || []).map(r => ({ date: r.event_date, notes: r.notes, user: r.user_name }));
    } catch (e) { console.error('[RDB] getNegotiationHistory failed:', e); return []; }
  },

  updateNegotiationHistory: async (storeId: string, history: any[]): Promise<void> => {
    const uuid = await findStoreUUID(storeId);
    if (!uuid) throw new Error(`Store not found: ${storeId}`);
    await supabase.from('negotiation_history').delete().eq('store_id', uuid);
    if (history.length > 0) {
      const { error } = await supabase.from('negotiation_history').insert(history.map(h => ({ store_id: uuid, event_date: h.date, notes: h.notes, user_name: h.user })));
      if (error) throw new Error(`updateNegotiationHistory failed: ${error.message}`);
    }
  },

  // ─── Checkpoints ─────────────────────────────────────────────────────────
  getCheckpoints: async (storeId: string): Promise<any[]> => {
    try {
      const uuid = await findStoreUUID(storeId);
      if (!uuid) return [];
      const { data, error } = await supabase.from('checkpoints').select('*').eq('store_id', uuid).order('sort_order');
      if (error) return [];
      return (data || []).map(r => ({ id: r.id, label: r.label, isCompleted: r.is_completed, completedAt: r.completed_at, completedBy: r.completed_by, sortOrder: r.sort_order }));
    } catch (e) { console.error('[RDB] getCheckpoints failed:', e); return []; }
  },

  updateCheckpoints: async (storeId: string, checkpoints: any[]): Promise<void> => {
    const uuid = await findStoreUUID(storeId);
    if (!uuid) throw new Error(`Store not found: ${storeId}`);
    await supabase.from('checkpoints').delete().eq('store_id', uuid);
    if (checkpoints.length > 0) {
      const { error } = await supabase.from('checkpoints').insert(checkpoints.map((cp, i) => ({ store_id: uuid, label: cp.label, is_completed: cp.isCompleted || false, completed_at: cp.completedAt || null, completed_by: cp.completedBy || null, sort_order: cp.sortOrder ?? i })));
      if (error) throw new Error(`updateCheckpoints failed: ${error.message}`);
    }
  },

  // ─── Goals (RDB goals 테이블) ────────────────────────────────────────────
  // GoalEntry { id, year, country, brand, target } ↔ goals { brand_id, year, target_open, notes }
  // UNIQUE(brand_id, year) 제약 → 같은 brand+year의 country별 목표를 notes에 JSON 배열로 저장
  // ---------------------------------------------------------------------------
  getGoals: async (): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*, brands(name)')
        .order('year');
      if (error) throw error;
      if (!data || data.length === 0) return [];

      // notes 필드에 저장된 JSON 배열을 파싱하여 GoalEntry[] 복원
      const entries: any[] = [];
      for (const row of data) {
        const brandName = (row as any).brands?.name || '';
        try {
          const parsed = JSON.parse(row.notes || '[]');
          if (Array.isArray(parsed)) {
            // notes에 country별 목표 배열이 저장된 경우
            parsed.forEach((item: any) => {
              entries.push({
                id: item.id || row.id,
                year: row.year,
                country: item.country || '한국',
                brand: brandName,
                target: item.target ?? row.target_open ?? 0,
              });
            });
          } else {
            // 단일 목표 (notes가 JSON 배열이 아닌 경우)
            entries.push({
              id: row.id,
              year: row.year,
              country: typeof parsed === 'string' ? parsed : (parsed.country || '한국'),
              brand: brandName,
              target: row.target_open || 0,
            });
          }
        } catch {
          // notes가 일반 문자열인 경우 (country로 취급)
          entries.push({
            id: row.id,
            year: row.year,
            country: row.notes || '한국',
            brand: brandName,
            target: row.target_open || 0,
          });
        }
      }
      console.log(`[RDB] getGoals: ${entries.length} entries from ${data.length} rows`);
      return entries;
    } catch (e) {
      console.error('[RDB] getGoals failed:', e);
      return [];
    }
  },

  saveGoals: async (goals: any): Promise<void> => {
    if (!Array.isArray(goals)) return;
    try {
      // 기존 goals 전부 삭제
      await supabase.from('goals').delete().gte('year', 0);

      if (goals.length === 0) return;

      // brand+year별로 그룹핑 → UNIQUE(brand_id, year) 제약 준수
      const grouped = new Map<string, { brandId: string; year: number; items: any[] }>();
      for (const g of goals) {
        const brandId = await getBrandId(g.brand);
        if (!brandId) { console.warn(`[RDB] saveGoals: brand not found: ${g.brand}`); continue; }
        const key = `${brandId}__${g.year}`;
        if (!grouped.has(key)) {
          grouped.set(key, { brandId, year: g.year, items: [] });
        }
        grouped.get(key)!.items.push({
          id: g.id,
          country: g.country,
          target: g.target,
        });
      }

      // 그룹별로 하나의 row 삽입
      const inserts = Array.from(grouped.values()).map(group => ({
        brand_id: group.brandId,
        year: group.year,
        target_open: group.items.reduce((sum: number, i: any) => sum + (i.target || 0), 0),
        notes: JSON.stringify(group.items),
      }));

      if (inserts.length > 0) {
        const { error } = await supabase.from('goals').insert(inserts);
        if (error) throw new Error(`saveGoals insert failed: ${error.message}`);
      }
      console.log(`[RDB] saveGoals: ${goals.length} entries → ${inserts.length} rows`);
    } catch (e) {
      console.error('[RDB] saveGoals failed:', e);
      throw e;
    }
  },

  // ─── Schedule Events (RDB schedule_events 테이블) ────────────────────────
  // UI 이벤트 { title, subtitle, content, storeName, month, startRow, rowSpan, colIndex, color, year }
  // → RDB { title, event_date, color, description (plain text 또는 JSON) }
  // description이 JSON이면 UI 메타데이터 직접 사용, 아니면 자동 추론
  // ---------------------------------------------------------------------------
  getScheduleEvents: async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('schedule_events')
        .select('*')
        .order('event_date');
      if (error) throw error;
      if (!data || data.length === 0) return [];

      // 지역 키워드 → startRow 매핑
      const REGION_KEYWORDS: [number, RegExp][] = [
        [1, /korea|한국|서울|부산|신세계|갤러리아|롯데|하남|인천|성수|강남|광주|대구|명동|잠실|압구정|현대면세/i],
        [2, /japan|tokyo|osaka|aoyama|ginza|shinsaibashi|parco|kansai|hankyu/i],
        [3, /china|shanghai|beijing|guangzhou|shenzhen|chengdu/i],
        [4, /s\.?e\.?\s*asia|bangkok|malaysia|klcc|taiwan|taichung|singapore|vietnam|indonesia|hanshin|emq/i],
        [5, /u\.?s\.?|usa|america|new\s*york|los\s*angeles|san\s*diego|san\s*jose|nyc|ny\s/i],
        [6, /europe|london|paris|berlin|milan|france|uk|germany|italy/i],
        [7, /middle\s*east|dubai|saudi|uae|abu\s*dhabi/i],
        [8, /australia|melbourne|sydney|시드니|auckland|new\s*zealand/i],
      ];

      function inferStartRow(title: string, desc: string): number {
        const combined = `${title} ${desc}`;
        for (const [row, regex] of REGION_KEYWORDS) {
          if (regex.test(combined)) return row;
        }
        // Collection/Campaign 이벤트는 ISSUE(0) 행
        if (/collection|campaign|bouquet|vege|mm4|smart|f1|disney|팝업/i.test(combined)) return 0;
        return 0; // 기본값: ISSUE
      }

      return data.map(row => {
        // description이 JSON인지 plain text인지 감지
        let meta: any = {};
        let isJsonMeta = false;
        if (row.description) {
          try {
            const parsed = JSON.parse(row.description);
            if (typeof parsed === 'object' && parsed !== null && ('startRow' in parsed || 'month' in parsed)) {
              meta = parsed;
              isJsonMeta = true;
            }
          } catch { /* plain text */ }
        }

        if (isJsonMeta) {
          // JSON 메타데이터가 있는 경우 (앱에서 저장한 이벤트)
          return {
            title: row.title,
            subtitle: meta.subtitle || '',
            content: meta.content || '',
            storeName: meta.storeName || '',
            constructionStartDate: meta.constructionStartDate || '',
            openDate: meta.openDate || '',
            time: meta.time || '',
            month: meta.month || '',
            startRow: meta.startRow ?? 0,
            rowSpan: meta.rowSpan ?? 1,
            colIndex: meta.colIndex ?? 0,
            color: row.color || 'bg-blue-500',
            year: meta.year || (row.event_date ? new Date(row.event_date).getFullYear() : 2026),
            _rdbId: row.id,
          };
        }

        // Plain text description → event_date에서 month/year 추출, 지역 자동 추론
        const eventDate = row.event_date ? new Date(row.event_date + 'T00:00:00Z') : null;
        const year = eventDate ? eventDate.getUTCFullYear() : 2026;
        const monthNum = eventDate ? eventDate.getUTCMonth() + 1 : 1; // 1-based
        const colIndex = monthNum - 1;
        const desc = row.description || '';
        const startRow = inferStartRow(row.title || '', desc);

        return {
          title: row.title || '',
          subtitle: desc.split('\n')[0] || '',
          content: desc,
          storeName: '',
          constructionStartDate: '',
          openDate: '',
          time: '',
          month: String(monthNum),
          startRow,
          rowSpan: 1,
          colIndex,
          color: row.color || 'bg-blue-500',
          year,
          _rdbId: row.id,
        };
      });
    } catch (e) {
      console.error('[RDB] getScheduleEvents failed:', e);
      return [];
    }
  },

  saveScheduleEvents: async (events: any[]): Promise<any[]> => {
    try {
      // 기존 이벤트 전부 삭제
      await supabase.from('schedule_events').delete().gte('created_at', '1970-01-01');

      if (!events || events.length === 0) return [];

      const rows = events.map(evt => ({
        title: evt.title || 'Untitled',
        event_date: monthToDate(evt.month || '1', evt.year || 2026),
        color: evt.color || 'bg-blue-500',
        all_day: true,
        event_type: 'general',
        description: JSON.stringify({
          subtitle: evt.subtitle || '',
          content: evt.content || '',
          storeName: evt.storeName || '',
          constructionStartDate: evt.constructionStartDate || '',
          openDate: evt.openDate || '',
          time: evt.time || '',
          month: evt.month || '',
          startRow: evt.startRow ?? 0,
          rowSpan: evt.rowSpan ?? 1,
          colIndex: evt.colIndex ?? 0,
          year: evt.year || 2026,
        }),
      }));

      const { error } = await supabase.from('schedule_events').insert(rows);
      if (error) throw new Error(`saveScheduleEvents insert failed: ${error.message}`);
      console.log(`[RDB] saveScheduleEvents: ${events.length} events saved`);
      return events;
    } catch (e) {
      console.error('[RDB] saveScheduleEvents failed:', e);
      return events;
    }
  },

  // ─── Brands ──────────────────────────────────────────────────────────────
  getCompetitorBrands: async (): Promise<BrandDefinition[]> => {
    try {
      const { data, error } = await supabase.from('brands').select('*').eq('category', 'competitor').eq('is_active', true);
      if (error) throw error;
      return (data || []).map(mapDbBrandToDef);
    } catch (e) { console.error('[RDB] getCompetitorBrands failed:', e); return []; }
  },

  saveCompetitorBrands: async (brands: BrandDefinition[]): Promise<BrandDefinition[]> => {
    for (const b of brands) { await supabase.from('brands').upsert({ name: b.name, category: 'competitor', logo_url: b.logo || null, marker_image_url: b.markerImage || null }, { onConflict: 'name' }); }
    return brands;
  },

  getPreferredBrands: async (): Promise<BrandDefinition[]> => {
    try {
      const { data, error } = await supabase.from('brands').select('*').eq('category', 'preferred').eq('is_active', true);
      if (error) throw error;
      return (data || []).map(mapDbBrandToDef);
    } catch (e) { console.error('[RDB] getPreferredBrands failed:', e); return []; }
  },

  savePreferredBrands: async (brands: BrandDefinition[]): Promise<BrandDefinition[]> => {
    for (const b of brands) { await supabase.from('brands').upsert({ name: b.name, category: 'preferred', logo_url: b.logo || null, marker_image_url: b.markerImage || null }, { onConflict: 'name' }); }
    return brands;
  },

  // ─── File Upload (Edge Function 유지 — Storage 버킷 접근) ────────────────
  uploadFile: async (file: File): Promise<{ path: string; url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${publicAnonKey}` }, body: formData });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `Upload failed: ${res.statusText}`); }
    return res.json();
  },
};