// ============================================================
// dataClient.ts - 로컬 Mock 데이터 클라이언트
// Supabase 없이 localStorage + 인메모리 데이터로 모든 CRUD를 처리합니다.
// 비전공자 설명: 실제 서버 대신 브라우저 저장소(localStorage)를 사용하는
// '가짜 서버' 역할입니다. 앱을 새로고침해도 데이터가 유지됩니다.
// ============================================================

import { Store, BrandDefinition } from '../types';
import { SavedLine } from './mockLineServer';
import { IIC_STORES, INITIAL_COMPETITOR_BRANDS, INITIAL_PREFERRED_BRANDS } from '../app/data/stores';

// ─── localStorage 키 상수 ──────────────────────────────────────────────────
const STORAGE_KEYS = {
  IIC_STORES: 'thepages_iic_stores',
  COMP_STORES: 'thepages_comp_stores',
  PIPELINES: 'thepages_pipelines',
  TRAFFIC_ZONES: 'thepages_traffic_zones',
  NEGOTIATION_HISTORY: 'thepages_negotiation_history',
  CHECKPOINTS: 'thepages_checkpoints',
  GOALS: 'thepages_goals',
  COMPETITOR_BRANDS: 'thepages_competitor_brands',
  PREFERRED_BRANDS: 'thepages_preferred_brands',
  SCHEDULE_EVENTS: 'thepages_schedule_events',
  SEEDED: 'thepages_seeded',
} as const;

// ─── localStorage 유틸 ───────────────────────────────────────────────────────
// 데이터를 JSON 형태로 브라우저에 저장/불러오기하는 도우미 함수들

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(`[Mock] localStorage 읽기 실패 (${key}):`, e);
  }
  return fallback;
}

function saveToStorage(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`[Mock] localStorage 저장 실패 (${key}):`, e);
  }
}

// ─── 고유 ID 생성 ──────────────────────────────────────────────────────────
// UUID 형태의 고유 식별자를 만듭니다.
function generateId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── 비동기 지연 시뮬레이션 ───────────────────────────────────────────────
// 실제 서버 통신처럼 짧은 지연을 넣어 자연스러운 UX를 제공합니다.
const delay = (ms = 100) => new Promise(r => setTimeout(r, ms));

// ============================================================
// 데이터 클라이언트 — 모든 데이터 통신을 담당하는 함수들의 모음
// ============================================================
export const dataClient = {

  // ─── 시딩(초기 데이터 심기) ───────────────────────────────────────────────
  // 앱 최초 실행 시 stores.ts의 샘플 데이터를 localStorage에 심습니다.
  seed: async (force = false) => {
    await delay(50);
    const alreadySeeded = localStorage.getItem(STORAGE_KEYS.SEEDED);
    if (alreadySeeded && !force) {
      return { message: 'Already seeded' };
    }
    // IIC 매장 초기 데이터
    saveToStorage(STORAGE_KEYS.IIC_STORES, IIC_STORES);
    // 경쟁사 매장은 빈 배열로 시작 (필요 시 추가)
    if (!loadFromStorage(STORAGE_KEYS.COMP_STORES, null)) {
      saveToStorage(STORAGE_KEYS.COMP_STORES, []);
    }
    // 브랜드 목록 초기화
    if (!loadFromStorage(STORAGE_KEYS.COMPETITOR_BRANDS, null)) {
      saveToStorage(STORAGE_KEYS.COMPETITOR_BRANDS, INITIAL_COMPETITOR_BRANDS);
    }
    if (!loadFromStorage(STORAGE_KEYS.PREFERRED_BRANDS, null)) {
      saveToStorage(STORAGE_KEYS.PREFERRED_BRANDS, INITIAL_PREFERRED_BRANDS);
    }
    localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
    console.log('[Mock] 초기 데이터 시딩 완료');
    return { message: 'Seeded successfully' };
  },

  // ============================================================
  // IIC 매장 관련 (조회, 추가, 수정, 삭제)
  // ============================================================

  // IIC 매장 전체 목록을 가져옵니다.
  getIICStores: async (): Promise<Store[]> => {
    await delay();
    return loadFromStorage<Store[]>(STORAGE_KEYS.IIC_STORES, IIC_STORES);
  },

  // 새 IIC 매장을 추가합니다.
  addStore: async (store: any): Promise<Store> => {
    await delay();
    const stores = loadFromStorage<Store[]>(STORAGE_KEYS.IIC_STORES, []);
    const newStore: Store = { ...store, id: store.id || generateId() };
    stores.push(newStore);
    saveToStorage(STORAGE_KEYS.IIC_STORES, stores);
    return newStore;
  },

  // IIC 매장 정보를 수정합니다.
  updateIICStore: async (id: string, store: Store): Promise<Store> => {
    await delay();
    const stores = loadFromStorage<Store[]>(STORAGE_KEYS.IIC_STORES, []);
    const idx = stores.findIndex(s => s.id === id);
    if (idx === -1) throw new Error(`Store not found: ${id}`);
    stores[idx] = { ...store, id };
    saveToStorage(STORAGE_KEYS.IIC_STORES, stores);
    return stores[idx];
  },

  // IIC 매장을 삭제합니다.
  deleteStore: async (id: string): Promise<void> => {
    await delay();
    const stores = loadFromStorage<Store[]>(STORAGE_KEYS.IIC_STORES, []);
    saveToStorage(STORAGE_KEYS.IIC_STORES, stores.filter(s => s.id !== id));
  },

  // ============================================================
  // 경쟁사 매장 관련 (조회, 추가, 수정, 삭제)
  // ============================================================

  // 경쟁사 매장 전체 목록을 가져옵니다.
  getCompStores: async (): Promise<Store[]> => {
    await delay();
    return loadFromStorage<Store[]>(STORAGE_KEYS.COMP_STORES, []);
  },

  // 새 경쟁사 매장을 추가합니다.
  addCompStore: async (store: any): Promise<Store> => {
    await delay();
    const stores = loadFromStorage<Store[]>(STORAGE_KEYS.COMP_STORES, []);
    const newStore: Store = { ...store, id: store.id || generateId() };
    stores.push(newStore);
    saveToStorage(STORAGE_KEYS.COMP_STORES, stores);
    return newStore;
  },

  // 경쟁사 매장 정보를 수정합니다.
  updateCompStore: async (id: string, store: Store): Promise<Store> => {
    await delay();
    const stores = loadFromStorage<Store[]>(STORAGE_KEYS.COMP_STORES, []);
    const idx = stores.findIndex(s => s.id === id);
    if (idx === -1) throw new Error(`Comp store not found: ${id}`);
    stores[idx] = { ...store, id };
    saveToStorage(STORAGE_KEYS.COMP_STORES, stores);
    return stores[idx];
  },

  // 경쟁사 매장을 삭제합니다.
  deleteCompStore: async (id: string): Promise<void> => {
    await delay();
    const stores = loadFromStorage<Store[]>(STORAGE_KEYS.COMP_STORES, []);
    saveToStorage(STORAGE_KEYS.COMP_STORES, stores.filter(s => s.id !== id));
  },

  // ============================================================
  // 파이프라인(라인) 관련 (조회, 추가, 삭제)
  // ============================================================

  // 저장된 파이프라인 목록을 가져옵니다.
  getPipelines: async (): Promise<SavedLine[]> => {
    await delay();
    return loadFromStorage<SavedLine[]>(STORAGE_KEYS.PIPELINES, []);
  },

  // 새 파이프라인을 추가합니다.
  addPipeline: async (line: Partial<SavedLine>): Promise<SavedLine> => {
    await delay();
    const lines = loadFromStorage<SavedLine[]>(STORAGE_KEYS.PIPELINES, []);
    const newLine: SavedLine = {
      id: line.id || generateId(),
      title: line.title || 'Untitled',
      point1: line.point1 || { lat: 0, lng: 0 },
      point2: line.point2 || { lat: 0, lng: 0 },
      color: line.color || '#EF4444',
      thickness: line.thickness || 2,
      createdAt: new Date().toISOString(),
    };
    lines.push(newLine);
    saveToStorage(STORAGE_KEYS.PIPELINES, lines);
    return newLine;
  },

  // 파이프라인을 삭제합니다.
  deletePipeline: async (id: string): Promise<void> => {
    await delay();
    const lines = loadFromStorage<SavedLine[]>(STORAGE_KEYS.PIPELINES, []);
    saveToStorage(STORAGE_KEYS.PIPELINES, lines.filter(l => l.id !== id));
  },

  // ============================================================
  // 트래픽 존(유동인구 구역) 관련
  // ============================================================

  // 트래픽 존 목록을 가져옵니다.
  getTrafficZones: async (): Promise<any[]> => {
    await delay();
    return loadFromStorage<any[]>(STORAGE_KEYS.TRAFFIC_ZONES, []);
  },

  // 새 트래픽 존을 저장합니다.
  saveTrafficZone: async (zone: any): Promise<any> => {
    await delay();
    const zones = loadFromStorage<any[]>(STORAGE_KEYS.TRAFFIC_ZONES, []);
    const newZone = { ...zone, id: zone.id || generateId() };
    zones.push(newZone);
    saveToStorage(STORAGE_KEYS.TRAFFIC_ZONES, zones);
    return newZone;
  },

  // 트래픽 존을 삭제합니다.
  deleteTrafficZone: async (id: string): Promise<void> => {
    await delay();
    const zones = loadFromStorage<any[]>(STORAGE_KEYS.TRAFFIC_ZONES, []);
    saveToStorage(STORAGE_KEYS.TRAFFIC_ZONES, zones.filter(z => z.id !== id));
  },

  // ============================================================
  // 협상 이력(Negotiation History) 관련
  // ============================================================

  // 특정 매장의 협상 이력을 가져옵니다.
  getNegotiationHistory: async (storeId: string): Promise<any[]> => {
    await delay();
    const all = loadFromStorage<Record<string, any[]>>(STORAGE_KEYS.NEGOTIATION_HISTORY, {});
    return all[storeId] || [];
  },

  // 특정 매장의 협상 이력을 저장합니다.
  updateNegotiationHistory: async (storeId: string, history: any[]): Promise<void> => {
    await delay();
    const all = loadFromStorage<Record<string, any[]>>(STORAGE_KEYS.NEGOTIATION_HISTORY, {});
    all[storeId] = history;
    saveToStorage(STORAGE_KEYS.NEGOTIATION_HISTORY, all);
  },

  // ============================================================
  // 체크포인트(Checkpoints) 관련
  // ============================================================

  // 특정 매장의 체크포인트를 가져옵니다.
  getCheckpoints: async (storeId: string): Promise<any[]> => {
    await delay();
    const all = loadFromStorage<Record<string, any[]>>(STORAGE_KEYS.CHECKPOINTS, {});
    return all[storeId] || [];
  },

  // 특정 매장의 체크포인트를 저장합니다.
  updateCheckpoints: async (storeId: string, checkpoints: any[]): Promise<void> => {
    await delay();
    const all = loadFromStorage<Record<string, any[]>>(STORAGE_KEYS.CHECKPOINTS, {});
    all[storeId] = checkpoints;
    saveToStorage(STORAGE_KEYS.CHECKPOINTS, all);
  },

  // ============================================================
  // 목표(Goals) 관련
  // ============================================================

  // 목표 데이터를 가져옵니다.
  getGoals: async (): Promise<any> => {
    await delay();
    return loadFromStorage<any[]>(STORAGE_KEYS.GOALS, []);
  },

  // 목표 데이터를 저장합니다.
  saveGoals: async (goals: any): Promise<void> => {
    await delay();
    saveToStorage(STORAGE_KEYS.GOALS, goals);
  },

  // ============================================================
  // 브랜드 목록 관련 (경쟁사 / 선호 브랜드)
  // ============================================================

  // 경쟁사 브랜드 목록을 가져옵니다.
  getCompetitorBrands: async (): Promise<BrandDefinition[]> => {
    await delay();
    return loadFromStorage<BrandDefinition[]>(STORAGE_KEYS.COMPETITOR_BRANDS, INITIAL_COMPETITOR_BRANDS);
  },

  // 경쟁사 브랜드 목록을 저장합니다.
  saveCompetitorBrands: async (brands: BrandDefinition[]): Promise<BrandDefinition[]> => {
    await delay();
    saveToStorage(STORAGE_KEYS.COMPETITOR_BRANDS, brands);
    return brands;
  },

  // 선호/인접 브랜드 목록을 가져옵니다.
  getPreferredBrands: async (): Promise<BrandDefinition[]> => {
    await delay();
    return loadFromStorage<BrandDefinition[]>(STORAGE_KEYS.PREFERRED_BRANDS, INITIAL_PREFERRED_BRANDS);
  },

  // 선호/인접 브랜드 목록을 저장합니다.
  savePreferredBrands: async (brands: BrandDefinition[]): Promise<BrandDefinition[]> => {
    await delay();
    saveToStorage(STORAGE_KEYS.PREFERRED_BRANDS, brands);
    return brands;
  },

  // ============================================================
  // 일정 이벤트(Schedule Events) 관련
  // ============================================================

  // 일정 이벤트 목록을 가져옵니다.
  getScheduleEvents: async (): Promise<any[]> => {
    await delay();
    return loadFromStorage<any[]>(STORAGE_KEYS.SCHEDULE_EVENTS, []);
  },

  // 일정 이벤트 목록을 저장합니다.
  saveScheduleEvents: async (events: any[]): Promise<any[]> => {
    await delay();
    saveToStorage(STORAGE_KEYS.SCHEDULE_EVENTS, events);
    return events;
  },

  // ============================================================
  // 파일 업로드 (로컬 mock — 파일을 base64 URL로 변환)
  // ============================================================

  // 파일을 base64 데이터 URL로 변환하여 반환합니다.
  // 실제 서버 없이도 이미지 미리보기가 가능합니다.
  uploadFile: async (file: File): Promise<{ path: string; url: string }> => {
    await delay(200);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        resolve({ path: `mock/${file.name}`, url });
      };
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsDataURL(file);
    });
  },
};
