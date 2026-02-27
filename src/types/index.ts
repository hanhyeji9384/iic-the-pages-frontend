// ============================================================
// IIC THE PAGES - 공통 타입 정의
// 이 파일은 프로젝트 전체에서 사용하는 데이터 구조(타입)를 정의합니다.
// 비전공자 설명: 타입이란 "이 변수에 어떤 종류의 값이 들어갈 수 있는지"를 미리 정해놓은 규칙입니다.
// ============================================================

// ----------------------------------------------------------
// 매장 분류: 백화점/몰 계열(Type-based) vs 독립 매장(Standalone)
// ----------------------------------------------------------
export type StoreClass = 'Type-based' | 'Standalone';

// Type-based 채널 목록 (백화점, 몰, 면세점, 프리미엄 아울렛)
const TYPE_BASED_CHANNELS = ['Department Store', 'Mall', 'Duty Free', 'Premium Outlet'];

// Standalone 채널 목록 (플래그십스토어, 팝업, 하우스)
const STANDALONE_CHANNELS = ['FS', 'Pop-up', 'Haus'];

/**
 * 채널명을 보고 매장 분류를 반환합니다.
 * 예: 'Mall' → 'Type-based', 'FS' → 'Standalone'
 */
export function getStoreClass(channel: string | undefined): StoreClass | null {
  if (!channel) return null;
  if (TYPE_BASED_CHANNELS.includes(channel)) return 'Type-based';
  if (STANDALONE_CHANNELS.includes(channel)) return 'Standalone';
  return null;
}

// ----------------------------------------------------------
// 매장(Store) 데이터 구조
// IIC 브랜드 매장과 경쟁사 매장 모두 이 형식으로 저장됩니다.
// ----------------------------------------------------------
export interface Store {
  /** 매장 고유 식별자 (UUID) */
  id: string;

  /** 매장 이름 */
  name: string;

  /** 브랜드명 (예: Gentle Monster, Tamburins) */
  brand: string;

  /** 채널 유형 (예: FS, Mall, Department Store) */
  type: string;

  /** 위치 정보 */
  location: {
    city: string;
    country: string;
    lat: number;  // 위도 (지도에서 세로 좌표)
    lng: number;  // 경도 (지도에서 가로 좌표)
  };

  /** 매장 규모 (예: '200sqm') */
  size?: string;

  /** 매장 면적 (단위: 평방미터) */
  area?: number;

  /** 임대료 정보 */
  rent?: string;

  /**
   * 파이프라인 상태
   * Plan → Confirm → Contract → Space → Open 순서로 진행
   * Close: 폐점, Planed/Confirmed/Signed/Construction: 이전 상태명과의 호환
   */
  status:
    | 'Plan'
    | 'Confirm'
    | 'Contract'
    | 'Space'
    | 'Open'
    | 'Close'
    | 'Planed'
    | 'Planned'
    | 'Confirmed'
    | 'Signed'
    | 'Construction';

  /** 파이프라인이 해당 연도에 기록된 연도 */
  statusYear?: number;

  /**
   * 브랜드 카테고리
   * iic: IIC 계열 브랜드 (젠틀몬스터, 탬버린즈 등)
   * competitor: 경쟁사 브랜드
   * preferred: 인접/선호 브랜드
   */
  brandCategory?: 'iic' | 'competitor' | 'preferred';

  /** 예상 또는 실제 오픈 날짜 (YYYY-MM-DD 형식) */
  openDate?: string;

  /** 변경된 오픈 날짜 */
  ChangOpenDate?: string;

  /** 변경된 폐점 날짜 */
  ChangCloseDate?: string;

  /** 계약 정보 */
  contract?: {
    startDate: string;      // 계약 시작일
    endDate: string;        // 계약 종료일
    renewalOption: boolean; // 갱신 옵션 여부
    documentUrl?: string;   // 계약서 파일 URL
  };

  /** 재무 정보 */
  financial?: {
    monthlyRent: number;            // 월 임대료
    currency: string;               // 통화 (예: KRW, USD)
    monthlySales: number;           // 월 매출
    salesPerSqm: number;            // 평방미터당 매출
    investment: number;             // 총 투자비
    investmentInterior?: number;    // 인테리어 투자비
    investmentFurniture?: number;   // 가구 투자비
    investmentFacade?: number;      // 파사드 투자비
    investmentOther?: number;       // 기타 투자비
    deposit?: number;               // 보증금
    rentType?: 'fixed' | 'commission'; // 임대 방식 (고정 vs 수수료)
    rentCommission?: number;        // 수수료율 (%)
    expectedOperatingProfitRatio?: number; // 예상 영업이익률 (%)
    estimatedSales?: number;        // 예상 월 매출 (후보 매장용)
    estimatedMargin?: number;       // 예상 마진율 (%)
    /** 연도별 매출 데이터 */
    yearlySales?: {
      year: number;
      amount: number; // 연간 매출 (KRW 기준)
    }[];
  };

  /** 매장 사진 */
  images?: {
    front?: string;     // 정면 사진 URL
    side?: string;      // 측면 사진 URL
    interior?: string;  // 내부 사진 URL
    floorplan?: string; // 평면도 URL
  };

  /** 협상 이력 (날짜순 기록) */
  negotiationHistory?: {
    date: string;
    notes: string;
    user: string; // 담당자 이름
  }[];
}

// ----------------------------------------------------------
// 필터 상태 - 사이드바에서 선택 가능한 필터 조합
// ----------------------------------------------------------
export interface FilterState {
  /** 파이프라인 상태 필터 (예: ['Open', 'Construction']) */
  status: string[];

  /** IIC 브랜드 필터 (예: ['Gentle Monster', 'Tamburins']) */
  brand: string[];

  /** 채널 유형 필터 (예: ['FS', 'Mall']) */
  channel: string[];

  /** 국가/지역 필터 (예: ['한국', '일본']) */
  country: string[];

  /** 매장 분류 필터 (Type-based, Standalone) */
  storeClass?: string[];

  /** 경쟁사 브랜드 필터 */
  competitorBrands?: string[];

  /** 선호/인접 브랜드 필터 */
  preferredBrands?: string[];

  /** 스마트 글라스 브랜드 필터 */
  smartGlass?: string[];

  /** 지도 데이터 레이어 (Pipeline, 트래픽 히트맵) */
  dataLayers?: string[];
}

// ----------------------------------------------------------
// 지도 뷰 모드
// ----------------------------------------------------------
export type MapViewMode = 'Map' | 'Satellite';

// ----------------------------------------------------------
// 브랜드 정의 - 경쟁사/선호 브랜드 목록에 사용
// ----------------------------------------------------------
export interface BrandDefinition {
  /** 브랜드명 */
  name: string;

  /** 브랜드 로고 이미지 (URL 또는 base64) */
  logo?: string;

  /** 지도 마커 커스텀 이미지 (URL 또는 base64) */
  markerImage?: string;
}

// ----------------------------------------------------------
// 앱 내비게이션 관련 타입
// ----------------------------------------------------------

/** 최상위 메뉴 (Expansion / Prism) */
export type Level1Key = 'Expansion' | 'Prism';

/** 2단계 메뉴 (Stores / Wholesale / Lens) */
export type Level2Key = 'Stores' | 'Wholesale' | 'Lens' | '';

/**
 * 3단계 탭 메뉴
 * ProgressBoard: 파이프라인 진행 현황 보드
 * PipelineList: 파이프라인 리스트 테이블
 * PnL: 손익계산서 (P&L)
 * Schedule: 일정 캘린더
 * Map: 지도 뷰 (매장 위치)
 */
export type TabKey =
  | 'ProgressBoard'
  | 'PipelineList'
  | 'PnL'
  | 'Schedule'
  | 'Map'
  | 'Store Info'
  | 'Dashboard'
  | 'WholesaleOverview'
  | 'LensOverview'
  | '';

// ----------------------------------------------------------
// 파이프라인 상태 색상 매핑
// ----------------------------------------------------------
export const PIPELINE_STATUS_COLORS: Record<string, string> = {
  Plan: '#64748B',         // 슬레이트 (계획 단계)
  Planned: '#64748B',
  Confirm: '#9694FF',      // 퍼플 (확인 단계)
  Confirmed: '#9694FF',
  Contract: '#EE99C2',     // 핑크 (계약 단계)
  Signed: '#EE99C2',
  Space: '#0ea5e9',        // 하늘색 (공간 준비 단계)
  Construction: '#0ea5e9',
  Open: '#7FC7D9',         // 청록 (오픈)
  Close: '#94a3b8',        // 회색 (폐점)
};

// ----------------------------------------------------------
// IIC 브랜드 목록 (소문자)
// ----------------------------------------------------------
export const IIC_BRANDS_LOWERCASE = [
  'gentle monster',
  'tamburins',
  'nudake',
  'atiissu',
  'nuflaat',
];

/**
 * 브랜드명이 IIC 계열인지 확인합니다.
 */
export function isIICBrand(brand: string | undefined): boolean {
  if (!brand) return false;
  const normalized = brand.toLowerCase().trim();
  return IIC_BRANDS_LOWERCASE.some((b) => normalized.includes(b));
}

// ----------------------------------------------------------
// 초기 필터 기본값
// ----------------------------------------------------------
export const INITIAL_FILTERS: FilterState = {
  status: ['Open', 'Construction', 'Signed', 'Confirmed', 'Planned'],
  brand: ['Gentle Monster', 'Tamburins', 'Nudake', 'Atiissu', 'Nuflaat'],
  channel: ['FS', 'Department Store', 'Mall', 'Duty Free', 'Premium Outlet', 'Pop-up', 'Haus'],
  country: ['한국', '일본', '중국', '동남아', '미주', '유럽', '중동', '호주', '기타'],
  storeClass: ['Type-based', 'Standalone'],
  competitorBrands: [],
  preferredBrands: [],
  smartGlass: [],
  dataLayers: [],
};
