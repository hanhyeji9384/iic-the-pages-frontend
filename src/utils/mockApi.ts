// ============================================================
// mockApi.ts - 로컬 Mock API (저장된 엔티티 관리)
// 이 파일은 매장(IIC/경쟁사) 데이터를 실제 서버 없이 가짜로 저장하고 관리합니다.
// 비전공자 설명: 백엔드(서버)가 완성되기 전에도 앱이 정상 작동하도록 해주는 '임시 창고' 역할입니다.
// ============================================================

import { Store } from '../types';

// 저장된 엔티티(매장/경쟁사) 하나의 데이터 구조
// 지도나 목록에 저장된 항목을 나타냅니다.
export interface SavedEntity {
  id: string;                        // 엔티티 고유 식별자
  type: 'iic' | 'competitor';        // 종류: IIC 브랜드 매장 또는 경쟁사 매장
  name: string;                      // 매장/엔티티 이름
  brand: string;                     // 브랜드명
  location: { lat: number; lng: number }; // 지도 좌표 (위도/경도)
  address?: string;                  // 주소 (선택 사항)
  status: string;                    // 파이프라인 상태 (예: Open, Planned)
  area?: number;                     // 매장 면적 (㎡ 단위, 선택 사항)
  monthlyRent?: number;              // 월 임대료 (선택 사항)
  deposit?: number;                  // 보증금 (선택 사항)
  createdAt: string;                 // 생성 일시 (ISO 문자열)
}

// 메모리에 임시 저장되는 엔티티 목록 (앱 새로고침 시 초기화됨)
let savedStores: SavedEntity[] = [];

// API 기능 모음 (실제 서버 API처럼 사용할 수 있는 함수들)
export const api = {
  // IIC 매장 데이터를 저장합니다.
  // 실제 앱에서는 DB에 저장되지만, 여기서는 성공 시뮬레이션만 합니다.
  saveStore: async (storeData: any) => {
    // 저장 요청처럼 500ms 지연을 시뮬레이션합니다.
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("Saved Store:", storeData);
    // 실제 앱에서는 DB에 저장합니다. 여기서는 성공을 시뮬레이션합니다.
    return storeData;
  },

  // 경쟁사 매장 데이터를 저장합니다.
  saveCompetitor: async (competitorData: any) => {
    // 저장 요청처럼 500ms 지연을 시뮬레이션합니다.
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("Saved Competitor:", competitorData);
    return competitorData;
  },

  // IIC 매장을 삭제합니다.
  // id에 해당하는 매장을 목록에서 제거합니다.
  deleteStore: async (id: string) => {
    // 삭제 요청처럼 300ms 지연을 시뮬레이션합니다.
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log("Deleted Store:", id);
    return true;
  },

  // 경쟁사 매장을 삭제합니다.
  deleteCompetitor: async (id: string) => {
    // 삭제 요청처럼 300ms 지연을 시뮬레이션합니다.
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log("Deleted Competitor:", id);
    return true;
  },

  // 저장된 모든 엔티티(매장) 목록을 가져옵니다.
  // 초기 데이터가 필요할 때 사용합니다.
  getEntities: async (): Promise<SavedEntity[]> => {
    return [...savedStores];
  }
};
