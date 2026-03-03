// ============================================================
// dataClient.ts - Supabase REST API 클라이언트
// 이 파일은 Supabase 백엔드 서버와 통신하는 모든 API 함수를 모아놓은 곳입니다.
// 비전공자 설명: 앱이 서버에 "데이터를 보내줘" 또는 "데이터를 저장해줘"라고 요청할 때
// 사용하는 '통신 창구' 역할입니다.
// ============================================================

import { projectId, publicAnonKey } from './supabase/info';
import { Store, BrandDefinition } from '../types';
import { SavedLine } from './mockLineServer';

// Supabase Edge Function 기본 주소 (모든 API 요청이 이 주소로 전송됩니다)
const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-51087ee6`;

// 데이터 클라이언트 — 서버와의 모든 데이터 통신을 담당하는 함수들의 모음입니다.
export const dataClient = {
  // ============================================================
  // 시딩(초기 데이터 심기)
  // 서버 DB가 비어있을 때 초기 샘플 데이터를 심습니다.
  // force=true이면 기존 데이터를 지우고 다시 심습니다.
  // ============================================================
  seed: async (force = false) => {
    try {
      const res = await fetch(`${BASE_URL}/seed?force=${force}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (!res.ok) throw new Error('Failed to seed data');
      return res.json();
    } catch (e) {
      console.error("Seed error:", e);
      return { message: "Error seeding" };
    }
  },

  // ============================================================
  // IIC 매장 관련 API (조회, 추가, 수정, 삭제)
  // IIC 계열 브랜드(젠틀몬스터, 탬버린즈 등)의 매장 데이터를 관리합니다.
  // ============================================================

  // IIC 매장 전체 목록을 서버에서 가져옵니다.
  getIICStores: async (): Promise<Store[]> => {
    try {
      const res = await fetch(`${BASE_URL}/stores/iic`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (!res.ok) throw new Error('Failed to fetch IIC stores');
      return res.json();
    } catch (e) {
      console.error("Fetch IIC error:", e);
      // 오류 발생 시 빈 배열을 반환해 앱이 중단되지 않도록 합니다.
      return [];
    }
  },

  // 새 IIC 매장을 서버에 추가합니다.
  addStore: async (store: any): Promise<Store> => {
    const res = await fetch(`${BASE_URL}/stores/iic`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(store) // 매장 데이터를 JSON 형식으로 변환해 전송합니다.
    });
    if (!res.ok) throw new Error('Failed to add store');
    return res.json();
  },

  // 기존 IIC 매장 정보를 수정합니다.
  // id: 수정할 매장의 고유 ID, store: 수정된 매장 데이터 전체
  updateIICStore: async (id: string, store: Store): Promise<Store> => {
    const res = await fetch(`${BASE_URL}/stores/iic/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(store)
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Update IIC Store failed: ${res.status} ${res.statusText}`, errorText);
      throw new Error(`Failed to update IIC store: ${res.status} ${errorText}`);
    }
    return res.json();
  },

  // IIC 매장을 삭제합니다.
  // id: 삭제할 매장의 고유 ID
  deleteStore: async (id: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/stores/iic/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${publicAnonKey}` }
    });
    if (!res.ok) throw new Error('Failed to delete store');
  },

  // ============================================================
  // 경쟁사 매장 관련 API (조회, 추가, 수정, 삭제)
  // 경쟁사 또는 인접 브랜드 매장 데이터를 관리합니다.
  // ============================================================

  // 경쟁사 매장 전체 목록을 서버에서 가져옵니다.
  getCompStores: async (): Promise<Store[]> => {
    try {
      const res = await fetch(`${BASE_URL}/stores/comp`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (!res.ok) throw new Error('Failed to fetch Comp stores');
      return res.json();
    } catch (e) {
      console.error("Fetch Comp error:", e);
      return [];
    }
  },

  // 새 경쟁사 매장을 서버에 추가합니다.
  addCompStore: async (store: any): Promise<Store> => {
    const res = await fetch(`${BASE_URL}/stores/comp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(store)
    });
    if (!res.ok) throw new Error('Failed to add comp store');
    return res.json();
  },

  // 기존 경쟁사 매장 정보를 수정합니다.
  updateCompStore: async (id: string, store: Store): Promise<Store> => {
    const res = await fetch(`${BASE_URL}/stores/comp/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(store)
    });
    if (!res.ok) throw new Error('Failed to update competitor store');
    return res.json();
  },

  // 경쟁사 매장을 삭제합니다.
  deleteCompStore: async (id: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/stores/comp/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${publicAnonKey}` }
    });
    if (!res.ok) throw new Error('Failed to delete comp store');
  },

  // ============================================================
  // 파이프라인(라인) 관련 API (조회, 추가, 삭제)
  // 지도 위에 그려지는 연결선(파이프라인)을 관리합니다.
  // ============================================================

  // 저장된 모든 파이프라인 목록을 서버에서 가져옵니다.
  getPipelines: async (): Promise<SavedLine[]> => {
    try {
      const res = await fetch(`${BASE_URL}/pipelines`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (!res.ok) throw new Error('Failed to fetch pipelines');
      return res.json();
    } catch (e) {
      console.error("Fetch pipeline error:", e);
      return [];
    }
  },

  // 새 파이프라인을 서버에 추가합니다.
  addPipeline: async (line: Partial<SavedLine>): Promise<SavedLine> => {
    const res = await fetch(`${BASE_URL}/pipelines`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(line)
    });
    if (!res.ok) throw new Error('Failed to add pipeline');
    return res.json();
  },

  // 파이프라인을 삭제합니다.
  deletePipeline: async (id: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/pipelines/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${publicAnonKey}` }
    });
    if (!res.ok) throw new Error('Failed to delete pipeline');
  },

  // ============================================================
  // 트래픽 존(유동인구 구역) 관련 API
  // 지도에서 유동인구 히트맵 구역 데이터를 관리합니다.
  // ============================================================

  // 저장된 모든 트래픽 존 목록을 서버에서 가져옵니다.
  getTrafficZones: async (): Promise<any[]> => {
    try {
      const res = await fetch(`${BASE_URL}/traffic-zones`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (!res.ok) throw new Error('Failed to fetch traffic zones');
      return res.json();
    } catch (e) {
      console.error("Fetch traffic zones error:", e);
      return [];
    }
  },

  // 새 트래픽 존을 서버에 저장합니다.
  saveTrafficZone: async (zone: any): Promise<any> => {
    const res = await fetch(`${BASE_URL}/traffic-zones`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(zone)
    });
    if (!res.ok) throw new Error('Failed to save traffic zone');
    return res.json();
  },

  // 트래픽 존을 삭제합니다.
  deleteTrafficZone: async (id: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/traffic-zones/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${publicAnonKey}` }
    });
    if (!res.ok) throw new Error('Failed to delete traffic zone');
  },

  // ============================================================
  // 협상 이력(Negotiation History) 관련 API
  // 매장별 협상 과정 기록을 관리합니다.
  // ============================================================

  // 특정 매장의 협상 이력을 서버에서 가져옵니다.
  // storeId: 조회할 매장의 고유 ID
  getNegotiationHistory: async (storeId: string): Promise<any[]> => {
    try {
      const res = await fetch(`${BASE_URL}/negotiation-history/${storeId}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (!res.ok) return [];
      return res.json();
    } catch (e) {
      console.error("Fetch negotiation history error:", e);
      return [];
    }
  },

  // 특정 매장의 협상 이력을 서버에 저장/업데이트합니다.
  updateNegotiationHistory: async (storeId: string, history: any[]): Promise<void> => {
    const res = await fetch(`${BASE_URL}/negotiation-history/${storeId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(history)
    });
    if (!res.ok) throw new Error('Failed to update negotiation history');
  },

  // ============================================================
  // 체크포인트(Checkpoints) 관련 API
  // 매장별 진행 단계 체크포인트 데이터를 관리합니다.
  // ============================================================

  // 특정 매장의 체크포인트 목록을 서버에서 가져옵니다.
  getCheckpoints: async (storeId: string): Promise<any[]> => {
    try {
      const res = await fetch(`${BASE_URL}/checkpoints/${storeId}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (!res.ok) return [];
      return res.json();
    } catch (e) {
      console.error("Fetch checkpoints error:", e);
      return [];
    }
  },

  // 특정 매장의 체크포인트 목록을 서버에 저장/업데이트합니다.
  updateCheckpoints: async (storeId: string, checkpoints: any[]): Promise<void> => {
    const res = await fetch(`${BASE_URL}/checkpoints/${storeId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkpoints)
    });
    if (!res.ok) throw new Error('Failed to update checkpoints');
  },

  // ============================================================
  // 목표(Goals) 관련 API
  // 전체 파이프라인 목표 수치를 관리합니다. (예: 올해 오픈 목표 n개)
  // ============================================================

  // 저장된 목표 데이터를 서버에서 가져옵니다.
  getGoals: async (): Promise<any> => {
    try {
      const res = await fetch(`${BASE_URL}/goals`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (!res.ok) return {};
      return res.json();
    } catch (e) {
      console.error("Fetch goals error:", e);
      return {};
    }
  },

  // 목표 데이터를 서버에 저장합니다.
  saveGoals: async (goals: any): Promise<void> => {
    const res = await fetch(`${BASE_URL}/goals`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(goals)
    });
    if (!res.ok) throw new Error('Failed to save goals');
  },

  // ============================================================
  // 브랜드 목록 관련 API (경쟁사 / 선호 브랜드)
  // 지도에 표시할 경쟁사/선호 브랜드 정의를 관리합니다.
  // ============================================================

  // 경쟁사 브랜드 목록을 서버에서 가져옵니다.
  getCompetitorBrands: async (): Promise<BrandDefinition[]> => {
    try {
      const res = await fetch(`${BASE_URL}/brands/competitor`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (!res.ok) return [];
      return res.json();
    } catch (e) {
      console.error("Fetch competitor brands error:", e);
      return [];
    }
  },

  // 경쟁사 브랜드 목록을 서버에 저장합니다.
  saveCompetitorBrands: async (brands: BrandDefinition[]): Promise<BrandDefinition[]> => {
    const res = await fetch(`${BASE_URL}/brands/competitor`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(brands)
    });
    if (!res.ok) throw new Error('Failed to save competitor brands');
    return res.json();
  },

  // 선호/인접 브랜드 목록을 서버에서 가져옵니다.
  getPreferredBrands: async (): Promise<BrandDefinition[]> => {
    try {
      const res = await fetch(`${BASE_URL}/brands/preferred`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (!res.ok) return [];
      return res.json();
    } catch (e) {
      console.error("Fetch preferred brands error:", e);
      return [];
    }
  },

  // 선호/인접 브랜드 목록을 서버에 저장합니다.
  savePreferredBrands: async (brands: BrandDefinition[]): Promise<BrandDefinition[]> => {
    const res = await fetch(`${BASE_URL}/brands/preferred`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(brands)
    });
    if (!res.ok) throw new Error('Failed to save preferred brands');
    return res.json();
  },

  // ============================================================
  // 일정 이벤트(Schedule Events) 관련 API
  // 캘린더에 표시할 일정 이벤트 데이터를 관리합니다.
  // ============================================================

  // 저장된 모든 일정 이벤트를 서버에서 가져옵니다.
  getScheduleEvents: async (): Promise<any[]> => {
    try {
      const res = await fetch(`${BASE_URL}/schedule-events`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (!res.ok) return [];
      return res.json();
    } catch (e) {
      console.error("Fetch schedule events error:", e);
      return [];
    }
  },

  // 일정 이벤트 목록을 서버에 저장합니다.
  saveScheduleEvents: async (events: any[]): Promise<any[]> => {
    const res = await fetch(`${BASE_URL}/schedule-events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(events)
    });
    if (!res.ok) throw new Error('Failed to save schedule events');
    return res.json();
  },

  // ============================================================
  // 파일 업로드 API
  // 매장 사진 등의 파일을 Supabase Storage에 업로드합니다.
  // ============================================================

  // 파일을 서버에 업로드하고, 접근 가능한 URL을 반환받습니다.
  // file: 업로드할 파일 객체 (예: 사진 파일)
  // 반환값: { path: 저장 경로, url: 접근 가능한 서명된 URL }
  uploadFile: async (file: File): Promise<{ path: string, url: string }> => {
    // 파일은 JSON이 아닌 FormData 형식으로 전송합니다.
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
        // Content-Type은 FormData 사용 시 브라우저가 자동으로 설정합니다.
      },
      body: formData
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to upload file: ${res.statusText}`);
    }
    return res.json();
  }
};
