// ============================================================
// storeMapper.ts — RDB 데이터베이스 행 ↔ 프론트엔드 Store 타입 변환
// 비전공자 설명: 데이터베이스에서 가져온 데이터 형태를
// 화면에서 사용하는 형태로 변환해주는 "번역기" 역할입니다.
// ============================================================

import { Store, BrandDefinition } from '../types';

/**
 * v_store_full 뷰(데이터베이스 조회 결과) → 프론트엔드 Store 타입으로 변환
 * images(사진), yearlySales(연도별 매출)는 별도로 조회 후 합칩니다.
 */
export function mapDbRowToStore(
  row: any,
  images?: any[],
  yearlySales?: any[],
  negotiationHistory?: any[]
): Store {
  // 재무 정보가 하나라도 있으면 financial 객체를 만듭니다
  const hasFinancial = row.monthly_rent != null || row.investment != null || (yearlySales && yearlySales.length > 0);

  return {
    id: row.legacy_id || row.id,
    name: row.store_name || row.name,
    brand: row.brand_name,
    type: row.channel || '',
    location: {
      city: row.city || '',
      country: row.country || '',
      address: row.address || '',
      lat: Number(row.lat),
      lng: Number(row.lng),
    },
    size: row.size_label || undefined,
    area: row.area_sqm ? Number(row.area_sqm) : undefined,
    rent: row.rent_label || undefined,
    status: row.status,
    statusYear: row.status_year || undefined,
    brandCategory: (row.brand_type || row.brand_category) as Store['brandCategory'],
    openDate: row.open_date || undefined,
    ChangOpenDate: row.changed_open_date || undefined,
    ChangCloseDate: row.changed_close_date || undefined,
    contract: row.contract_start ? {
      startDate: row.contract_start,
      endDate: row.contract_end,
      renewalOption: row.renewal_option || false,
      documentUrl: row.contract_doc || undefined,
    } : undefined,
    financial: hasFinancial ? {
      monthlyRent: Number(row.monthly_rent) || 0,
      currency: row.currency || 'KRW',
      monthlySales: Number(row.monthly_sales) || 0,
      salesPerSqm: Number(row.sales_per_sqm) || 0,
      investment: Number(row.investment) || 0,
      deposit: row.deposit ? Number(row.deposit) : undefined,
      rentType: row.financial_rent_type || undefined,
      rentCommission: row.rent_commission ? Number(row.rent_commission) : undefined,
      expectedOperatingProfitRatio: row.expected_op_ratio ? Number(row.expected_op_ratio) : undefined,
      estimatedSales: row.estimated_sales ? Number(row.estimated_sales) : undefined,
      estimatedMargin: row.estimated_margin ? Number(row.estimated_margin) : undefined,
      yearlySales: (yearlySales || []).map(ys => ({ year: ys.year, amount: Number(ys.amount) })),
    } : undefined,
    images: images && images.length > 0 ? {
      front: images.find(i => i.image_type === 'front')?.image_url,
      side: images.find(i => i.image_type === 'side')?.image_url,
      interior: images.find(i => i.image_type === 'interior')?.image_url,
      floorplan: images.find(i => i.image_type === 'floorplan')?.image_url,
    } : undefined,
    negotiationHistory: negotiationHistory && negotiationHistory.length > 0
      ? negotiationHistory.map(h => ({
          date: h.event_date,
          notes: h.notes,
          user: h.user_name,
        }))
      : undefined,
  } as Store;
}

/**
 * RDB brands 테이블 행 → BrandDefinition 타입으로 변환
 */
export function mapDbBrandToDef(row: any): BrandDefinition {
  return {
    name: row.name,
    logo: row.logo_url || undefined,
    markerImage: row.marker_image_url || undefined,
  };
}
