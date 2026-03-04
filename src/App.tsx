// ============================================================
// App.tsx - 앱의 최상위 컴포넌트
// 전체 화면 레이아웃과 네비게이션 상태를 관리합니다.
// 비전공자 설명: 이 파일은 앱의 "뼈대"입니다. 어떤 화면을 보여줄지,
// 현재 어떤 메뉴가 선택됐는지 등 핵심 상태를 여기서 관리합니다.
// ============================================================

import React, { useState, useMemo } from 'react';
import { LandingPage } from './components/dashboard/LandingPage';
import { Header } from './components/dashboard/Header';
import { Sidebar } from './components/dashboard/Sidebar';
import { MapCanvas } from './components/dashboard/MapCanvas';
import { StoreDetail } from './components/dashboard/StoreDetail';
import { CandidateStoreDetail } from './components/dashboard/CandidateStoreDetail';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProgressBoard } from './components/dashboard/ProgressBoard';
import { PipelineList } from './components/dashboard/PipelineList';
import { PnLView } from './components/dashboard/PnLView';
import { ScheduleView } from './components/dashboard/ScheduleView';
import { LineManagerPanel } from './components/dashboard/LineManagerPanel';
import { AddEntityPanel } from './components/dashboard/AddEntityPanel';
import { TrafficManagerPanel, TrafficZone } from './components/dashboard/TrafficManagerPanel';
import { SettingsDialog } from './components/dashboard/SettingsDialog';
// 관리자 페이지
import { AdminPage } from './components/dashboard/AdminPage';
// Progress View (목표 대비 진행률 대시보드)
import { ProgressView } from './components/dashboard/ProgressView';
import {
  Store,
  FilterState,
  BrandDefinition,
  INITIAL_FILTERS,
  isIICBrand,
  getStoreClass,
} from './types';
import { INITIAL_COMPETITOR_BRANDS, INITIAL_PREFERRED_BRANDS } from './app/data/stores';
import { SavedLine, Coordinate } from './utils/mockLineServer';
import { SavedEntity, api } from './utils/mockApi';
import { dataClient } from './utils/dataClient';
import { toast } from 'sonner';

// ============================================================
// 앱 전체 상태 초기값
// ============================================================

export default function App() {
  // ──────────────────────────────────────────────────────────
  // 인증(Authentication) 상태
  // ──────────────────────────────────────────────────────────

  /** 사용자 인증 완료 여부 (mock 모드: 항상 true) */
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  /** 인증 상태 확인 중 여부 (mock 모드: 항상 false) */
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  /** 관리자 페이지 표시 여부 */
  const [showAdmin, setShowAdmin] = useState(false);

  /** 현재 로그인한 사용자 이메일 */
  const [userEmail, setUserEmail] = useState('');

  /** 현재 로그인한 사용자 역할 (admin/editor/viewer) */
  const [userRole, setUserRole] = useState('viewer');

  // ──────────────────────────────────────────────────────────
  // 네비게이션 상태
  // ──────────────────────────────────────────────────────────

  /** 랜딩 페이지 표시 여부 */
  const [showLanding, setShowLanding] = useState(true);

  /** 현재 선택된 Level 1 메뉴 (Expansion / Prism) */
  const [activeLevel1, setActiveLevel1] = useState('Expansion');

  /** 현재 선택된 Level 2 메뉴 (Stores / Wholesale / Lens) */
  const [activeLevel2, setActiveLevel2] = useState('Stores');

  /** 현재 선택된 탭 (ProgressBoard, PipelineList 등) */
  const [activeTab, setActiveTab] = useState('ProgressBoard');

  // ──────────────────────────────────────────────────────────
  // 매장 데이터 상태
  // ──────────────────────────────────────────────────────────

  /**
   * 전체 매장 데이터 목록
   * 서버에서 로드한 IIC 매장 + 경쟁사 매장을 합친 배열
   */
  const [allStores, setAllStores] = useState<Store[]>([]);

  /** 현재 선택된 매장 (상세 패널 표시용) */
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  // ──────────────────────────────────────────────────────────
  // 필터 & 검색 상태
  // ──────────────────────────────────────────────────────────

  /** 검색창에 입력된 검색어 */
  const [searchQuery, setSearchQuery] = useState('');

  /** 사이드바 필터 상태 */
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  // ──────────────────────────────────────────────────────────
  // 알림 모드 상태
  // ──────────────────────────────────────────────────────────

  /** 저매출 알림 모드 활성 여부 (IIC 매장 중 매출이 낮은 곳을 강조) */
  const [showLowSalesAlert, setShowLowSalesAlert] = useState(false);

  /** 계약 만료 알림 모드 활성 여부 (계약 만료가 임박한 매장 강조) */
  const [showExpirationAlert, setShowExpirationAlert] = useState(false);

  // ──────────────────────────────────────────────────────────
  // 연도 선택 상태 (PnL, Dashboard, Map 등에서 공통 사용)
  // ──────────────────────────────────────────────────────────

  /** 현재 선택된 연도 (연간 매출 데이터 표시 기준) */
  const [selectedYear, setSelectedYear] = useState(2025);

  // ──────────────────────────────────────────────────────────
  // 브랜드 목록 상태 (경쟁사 / 선호 브랜드)
  // ──────────────────────────────────────────────────────────

  /** 경쟁사 브랜드 목록 (설정에서 편집 가능) */
  const [competitorBrandsList, setCompetitorBrandsList] = useState<BrandDefinition[]>(
    INITIAL_COMPETITOR_BRANDS
  );

  /** 선호/인접 브랜드 목록 (설정에서 편집 가능) */
  const [preferredBrandsList, setPreferredBrandsList] = useState<BrandDefinition[]>(
    INITIAL_PREFERRED_BRANDS
  );

  // ──────────────────────────────────────────────────────────
  // PipelineList 초기 필터 (ProgressBoard에서 클릭해서 진입할 때)
  // ──────────────────────────────────────────────────────────

  /** PipelineList 진입 시 사전 선택할 파이프라인 상태 */
  const [pipelineInitialStatus, setPipelineInitialStatus] = useState<string | undefined>(undefined);

  /** PipelineList 진입 시 사전 선택할 브랜드 */
  const [pipelineInitialBrand, setPipelineInitialBrand] = useState<string | undefined>(undefined);

  /** PipelineList 진입 시 사전 선택할 연도 범위 */
  const [pipelineInitialYears, setPipelineInitialYears] = useState<number[] | undefined>(undefined);

  /** PipelineList 진입 시 사전 선택할 국가/지역 */
  const [pipelineInitialCountry, setPipelineInitialCountry] = useState<string | undefined>(undefined);

  /** PipelineList 진입 시 사전 선택할 매장 분류 */
  const [pipelineInitialClass, setPipelineInitialClass] = useState<string | undefined>(undefined);

  // ──────────────────────────────────────────────────────────
  // 설정 다이얼로그 상태
  // ──────────────────────────────────────────────────────────

  /** 설정 다이얼로그 열림/닫힘 여부 */
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // ──────────────────────────────────────────────────────────
  // 지도 도구(Tool) 상태
  // ──────────────────────────────────────────────────────────

  /**
   * 현재 활성화된 지도 도구
   * 'pipeline': 파이프라인 연결선 그리기
   * 'store': IIC 매장 추가
   * 'comp': 경쟁사 매장 추가
   * 'traffic': 트래픽 구역 그리기
   * null: 일반 모드 (Sidebar 표시)
   */
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // ──────────────────────────────────────────────────────────
  // 파이프라인 연결선(Line) 상태
  // ──────────────────────────────────────────────────────────

  /** 파이프라인 라인 추가 모드 활성 여부 */
  const [isAddLineMode, setIsAddLineMode] = useState(false);

  /** 라인 그리기 중 선택된 좌표 포인트들 */
  const [selectedPoints, setSelectedPoints] = useState<Coordinate[]>([]);

  /** 저장된 파이프라인 연결선 목록 */
  const [lines, setLines] = useState<SavedLine[]>([]);

  /** 현재 포커스(강조)된 파이프라인 선 (목록 클릭 시 지도에서 해당 선 강조) */
  const [focusedLine, setFocusedLine] = useState<SavedLine | null>(null);

  // ──────────────────────────────────────────────────────────
  // 매장 엔티티 추가 상태
  // ──────────────────────────────────────────────────────────

  /** 매장 위치 선택 모드 활성 여부 */
  const [isAddEntityMode, setIsAddEntityMode] = useState(false);

  /** 지도에서 선택된 새 매장 위치 좌표 */
  const [selectedEntityLocation, setSelectedEntityLocation] = useState<Coordinate | null>(null);

  /** 저장된 엔티티(매장) 목록 */
  const [savedEntities, setSavedEntities] = useState<SavedEntity[]>([]);

  // ──────────────────────────────────────────────────────────
  // 트래픽 구역(Traffic Zone) 상태
  // ──────────────────────────────────────────────────────────

  /** 트래픽 원 그리기 모드 활성 여부 */
  const [isTrafficDrawingMode, setIsTrafficDrawingMode] = useState(false);

  /** 현재 그리는 트래픽 원의 중심 좌표 */
  const [trafficCenter, setTrafficCenter] = useState<Coordinate | null>(null);

  /** 현재 그리는 트래픽 원의 반지름 (미터 단위) */
  const [trafficRadius, setTrafficRadius] = useState(0);

  /** 트래픽 원 색상 */
  const [trafficColor, setTrafficColor] = useState('#F97316');

  /** 트래픽 원 투명도 (0~1) */
  const [trafficOpacity, setTrafficOpacity] = useState(0.4);

  /** 저장된 트래픽 구역 목록 */
  const [savedTrafficZones, setSavedTrafficZones] = useState<TrafficZone[]>([]);

  /** 현재 포커스(강조)된 트래픽 구역 */
  const [focusedTrafficZone, setFocusedTrafficZone] = useState<TrafficZone | null>(null);

  // ──────────────────────────────────────────────────────────
  // IIC 브랜드 목록 (소문자, 필터 검사용)
  // ──────────────────────────────────────────────────────────

  /** IIC 계열 브랜드명 소문자 목록 (필터 일치 여부 확인에 사용) */
  const iicBrands = ['gentle monster', 'tamburins', 'nudake', 'atiissu', 'nuflaat'];

  // ──────────────────────────────────────────────────────────
  // 국가/지역 매핑 (국가명 → 지역 레이블)
  // ──────────────────────────────────────────────────────────

  /**
   * 국가명 키워드를 지역 레이블로 매핑하는 목록
   * 예: 'Seoul' → '한국', 'Tokyo' → '일본'
   */
  const regionsList = [
    { label: '한국', keywords: ['South Korea', 'Korea', 'Seoul', 'Busan'] },
    { label: '일본', keywords: ['Japan', 'Tokyo', 'Osaka', 'Kyoto'] },
    { label: '중국', keywords: ['China', 'Hong Kong', 'Taiwan', 'Macau', 'Shanghai', 'Beijing'] },
    { label: '동남아', keywords: ['Singapore', 'Thailand', 'Vietnam', 'Malaysia', 'Indonesia', 'Philippines'] },
    { label: '미주', keywords: ['USA', 'Canada', 'Mexico', 'United States', 'America'] },
    { label: '유럽', keywords: ['UK', 'France', 'Germany', 'Italy', 'Spain', 'Europe', 'United Kingdom', 'London', 'Paris', 'Berlin'] },
    { label: '중동', keywords: ['UAE', 'Saudi Arabia', 'Dubai', 'Middle East'] },
    { label: '호주', keywords: ['Australia', 'New Zealand'] },
    { label: '기타', keywords: ['Other', 'India', 'Brazil', 'Argentina', 'South Africa', 'Russia', 'Unknown'] }
  ];

  // ──────────────────────────────────────────────────────────
  // 계약 만료 판별 함수
  // ──────────────────────────────────────────────────────────

  /**
   * 해당 매장이 계약 만료가 임박한지 판별합니다.
   * IIC 매장: 6개월 이내 만료
   * 기타 브랜드: 2년 이내 만료
   */
  const isExpiringStore = (s: Store) => {
    if (!s.contract?.endDate) return false;

    // 기준일: 오늘 날짜
    const today = new Date('2026-03-03');
    const endDate = new Date(s.contract.endDate);
    const diffTime = endDate.getTime() - today.getTime();
    // 월 단위 차이 계산 (30.44일 = 평균 한 달)
    const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44);
    // 연 단위 차이 계산 (365.25일 = 평균 1년)
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);

    const isIIC = isIICBrand(s.brand) || s.brandCategory === 'iic';

    if (isIIC) {
      // IIC 매장은 6개월 이내 만료 시 알림
      return diffMonths >= 0 && diffMonths <= 6;
    } else {
      // 기타 브랜드는 2년 이내 만료 시 알림
      return diffYears >= 0 && diffYears <= 2;
    }
  };

  // ──────────────────────────────────────────────────────────
  // 서버 데이터 로드 함수
  // ──────────────────────────────────────────────────────────

  /**
   * 서버에서 모든 데이터를 다시 불러옵니다.
   * IIC 매장 + 경쟁사 매장 + 파이프라인 라인 + 트래픽 구역 + 브랜드 목록
   */
  const refreshData = async () => {
    try {
      const [iic, comp, pipe, zones, compBrands, prefBrands] = await Promise.all([
        dataClient.getIICStores(),
        dataClient.getCompStores(),
        dataClient.getPipelines(),
        dataClient.getTrafficZones(),
        dataClient.getCompetitorBrands(),
        dataClient.getPreferredBrands()
      ]);
      // IIC 매장 + 경쟁사 매장 합치기
      const combined = [...iic, ...comp];
      setAllStores(combined);
      setLines(pipe);
      setSavedTrafficZones(zones);

      // 서버에 저장된 브랜드 목록이 있으면 업데이트
      if (compBrands && compBrands.length > 0) {
        setCompetitorBrandsList(compBrands);
      }
      if (prefBrands && prefBrands.length > 0) {
        setPreferredBrandsList(prefBrands);
      }
    } catch (e) {
      console.error("Refresh error:", e);
    }
  };

  // ──────────────────────────────────────────────────────────
  // Mock 모드: 인증 없이 바로 사용 (Supabase 제거됨)
  // ──────────────────────────────────────────────────────────

  // ──────────────────────────────────────────────────────────
  // 앱 시작 시 데이터 초기화 (1회 실행)
  // ──────────────────────────────────────────────────────────

  React.useEffect(() => {
    const initData = async () => {
      try {
        // localStorage에 초기 데이터 심기 (최초 1회)
        await dataClient.seed();
        // 전체 데이터 로드
        await refreshData();
      } catch (e) {
        console.error(e);
        toast.error("데이터를 불러오지 못했습니다.");
      }
      // Mock 엔티티 데이터 로드
      api.getEntities().then(setSavedEntities);
    };
    initData();
  }, []); // 앱 마운트 시 1회 실행

  // ──────────────────────────────────────────────────────────
  // 브랜드 목록 업데이트 핸들러
  // ──────────────────────────────────────────────────────────

  /**
   * 경쟁사 브랜드 목록을 업데이트하고 서버에 저장합니다.
   */
  const handleUpdateCompetitorBrands = (brands: BrandDefinition[]) => {
    setCompetitorBrandsList(brands);
    dataClient.saveCompetitorBrands(brands).catch(e => {
      console.error("Failed to save competitor brands", e);
      toast.error("브랜드 저장 실패");
    });
  };

  /**
   * 선호/인접 브랜드 목록을 업데이트하고 서버에 저장합니다.
   */
  const handleUpdatePreferredBrands = (brands: BrandDefinition[]) => {
    setPreferredBrandsList(brands);
    dataClient.savePreferredBrands(brands).catch(e => {
      console.error("Failed to save preferred brands", e);
      toast.error("브랜드 저장 실패");
    });
  };

  // ──────────────────────────────────────────────────────────
  // 파생 데이터 (useMemo로 성능 최적화)
  // ──────────────────────────────────────────────────────────

  /**
   * 검색어 + 연도별 매출 기준으로 정렬된 사이드바용 매장 목록
   * Sidebar 컴포넌트에 전달됩니다.
   */
  const storesForSidebar = useMemo(() => {
    let result = allStores;
    // 검색어가 있으면 이름/도시/국가로 필터링
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(store =>
        store.name.toLowerCase().includes(lowerQuery) ||
        store.location.city.toLowerCase().includes(lowerQuery) ||
        store.location.country.toLowerCase().includes(lowerQuery)
      );
    }
    // 선택된 연도의 연간 매출 기준 내림차순 정렬
    return [...result].sort((a, b) => {
      const salesA = a.financial?.yearlySales?.find(s => s.year === selectedYear)?.amount || 0;
      const salesB = b.financial?.yearlySales?.find(s => s.year === selectedYear)?.amount || 0;
      return salesB - salesA;
    });
  }, [allStores, searchQuery, selectedYear]);

  /**
   * 필터 조건에 맞는 매장 목록 (지도에 표시될 매장들)
   * 알림 모드, 브랜드/상태/채널/국가 필터를 순서대로 적용합니다.
   */
  const filteredStores = useMemo(() => {
    // 계약 만료 알림 모드: 만료 임박 매장만 표시
    if (showExpirationAlert) {
      return allStores.filter(s => isExpiringStore(s));
    }

    // 저매출 알림 모드: 매출이 낮은 IIC 매장만 표시
    if (showLowSalesAlert) {
      return allStores.filter(s => {
        const isIIC = isIICBrand(s.brand) || s.brandCategory === 'iic';
        if (!isIIC) return false;

        // 선택된 연도의 연간 매출 계산
        const salesYear = s.financial?.yearlySales?.find(sy => sy.year === selectedYear)?.amount || 0;
        if (salesYear <= 0) return false;

        // 일 평균 매출(만원 단위) 계산
        const dailySales = Math.ceil(salesYear / 365);
        const dailySalesMan = Math.ceil(dailySales / 10000);

        // 기준값: 일 평균 1,100만원 이하이면 저매출로 분류
        return dailySalesMan <= 1100;
      });
    }

    let result = storesForSidebar;

    // 브랜드 필터: IIC + 경쟁사 + 선호 + 스마트글라스 브랜드 합산
    const brandFilters = filters.brand || [];
    const compFilters = filters.competitorBrands || [];
    const prefFilters = filters.preferredBrands || [];
    const glassFilters = filters.smartGlass || [];

    const allowedBrands = [
      ...brandFilters,
      ...compFilters,
      ...prefFilters,
      ...glassFilters
    ].map(b => b.toLowerCase());

    // 선택된 브랜드가 하나도 없으면 빈 배열 반환
    if (allowedBrands.length === 0) {
      return [];
    }

    // 브랜드 이름으로 필터링 (대소문자 무관)
    result = result.filter(s => s.brand && allowedBrands.includes(s.brand.toLowerCase()));

    // 상태 필터: IIC 매장에만 적용 (경쟁사/선호 브랜드는 상태 무관)
    if (filters.status && filters.status.length > 0) {
      result = result.filter(s => {
        const isIIC = s.brandCategory === 'iic' || (!s.brandCategory && iicBrands.includes((s.brand || '').toLowerCase()));

        // 경쟁사/선호 브랜드는 상태 필터 무시
        if (!isIIC) return true;

        // 구 상태명 → 신 상태명 정규화 (데이터 호환성)
        const normalizedStatus =
          s.status === 'Plan' ? 'Planned' :
          s.status === 'Confirm' ? 'Confirmed' :
          s.status === 'Contract' ? 'Signed' :
          s.status === 'Space' ? 'Construction' :
          s.status;

        return filters.status.includes(normalizedStatus) || filters.status.includes(s.status);
      });
    } else {
      // 상태 필터가 없으면 IIC 매장은 모두 숨김 (경쟁사/선호만 표시)
      result = result.filter(s => {
        const isIIC = s.brandCategory === 'iic' || (!s.brandCategory && iicBrands.includes((s.brand || '').toLowerCase()));
        return !isIIC;
      });
    }

    // 채널 필터: IIC 매장에만 적용
    if (filters.channel && filters.channel.length > 0) {
      result = result.filter(s => {
        const isIIC = s.brandCategory === 'iic' || (!s.brandCategory && iicBrands.includes((s.brand || '').toLowerCase()));
        if (!isIIC) return true; // 경쟁사/선호 브랜드는 채널 필터 무시
        return s.type && filters.channel.includes(s.type);
      });
    } else {
      // 채널 필터 없으면 IIC 매장 숨김
      result = result.filter(s => {
        const isIIC = s.brandCategory === 'iic' || (!s.brandCategory && iicBrands.includes((s.brand || '').toLowerCase()));
        return !isIIC;
      });
    }

    // 매장 분류 필터 (Type-based / Standalone): IIC 매장에만 적용
    if (filters.storeClass && filters.storeClass.length > 0) {
      result = result.filter(s => {
        const isIIC = s.brandCategory === 'iic' || (!s.brandCategory && iicBrands.includes((s.brand || '').toLowerCase()));
        if (!isIIC) return true; // 경쟁사/선호 브랜드는 분류 필터 무시
        const cls = getStoreClass(s.type);
        return cls && filters.storeClass!.includes(cls);
      });
    }

    // 국가/지역 필터
    if (filters.country && filters.country.length > 0) {
      result = result.filter(s => {
        const country = s.location.country ? s.location.country.toLowerCase() : '';
        const city = s.location.city ? s.location.city.toLowerCase() : '';
        return filters.country.some(regionLabel => {
          const region = regionsList.find(r => r.label === regionLabel);
          return region ? region.keywords.some(k => country.includes(k.toLowerCase()) || city.includes(k.toLowerCase())) : false;
        });
      });
    }

    return result;
  }, [storesForSidebar, filters, showLowSalesAlert, showExpirationAlert, selectedYear, allStores]);

  /**
   * 오픈 중인 IIC 매장 수
   * 헤더의 "Total Stores" 카운터에 사용됩니다.
   */
  const totalIICCount = useMemo(() => {
    return allStores.filter((s) => {
      const isIIC = isIICBrand(s.brand) || s.brandCategory === 'iic';
      return isIIC && s.status === 'Open';
    }).length;
  }, [allStores]);

  // ──────────────────────────────────────────────────────────
  // 필터 관련 파생 카운트 (사이드바 배지에 표시)
  // ──────────────────────────────────────────────────────────

  /** 현재 필터 기준으로 표시되는 IIC 매장 수 */
  const iicFilteredCount = useMemo(() => {
    return filteredStores.filter(s => {
      const isIIC = s.brandCategory === 'iic' || (!s.brandCategory && iicBrands.includes((s.brand || '').toLowerCase()));
      return isIIC;
    }).length;
  }, [filteredStores]);

  /** 현재 필터 기준으로 표시되는 경쟁사/선호 브랜드 매장 수 */
  const otherFilteredCount = useMemo(() => {
    return filteredStores.filter(s => {
      const isIIC = s.brandCategory === 'iic' || (!s.brandCategory && iicBrands.includes((s.brand || '').toLowerCase()));
      return !isIIC;
    }).length;
  }, [filteredStores]);

  // ──────────────────────────────────────────────────────────
  // 지도 레이어 표시 여부 (필터 또는 도구 선택에 따라 결정)
  // ──────────────────────────────────────────────────────────

  /** 파이프라인 연결선을 지도에 표시할지 여부 */
  const showLines = activeTool === 'pipeline' || (filters.dataLayers && filters.dataLayers.includes('Pipeline'));

  /** 트래픽 히트맵 레이어를 지도에 표시할지 여부 */
  const showTrafficLayer = activeTool === 'traffic' || (filters.dataLayers && filters.dataLayers.includes('트래픽 히트맵'));

  // ──────────────────────────────────────────────────────────
  // 이벤트 핸들러
  // ──────────────────────────────────────────────────────────

  /**
   * Level 1 메뉴 변경 처리
   * Expansion / Prism 전환 시 기본 화면으로 이동합니다.
   */
  const handleLevel1Change = (level1: string) => {
    setShowLanding(false);
    setActiveLevel1(level1);
    setSelectedStore(null);

    if (level1 === 'Expansion') {
      setActiveLevel2('Stores');
      setActiveTab('ProgressBoard');
    } else if (level1 === 'Prism') {
      setActiveLevel2('');
      setActiveTab('');
    }
  };

  /**
   * Level 2 메뉴 변경 처리
   * Stores / Wholesale / Lens 전환 시 해당 기본 탭으로 이동합니다.
   */
  const handleLevel2Change = (level2: string) => {
    setActiveLevel2(level2);
    setSelectedStore(null);

    if (level2 === 'Stores') {
      setActiveTab('ProgressBoard');
    } else if (level2 === 'Wholesale') {
      setActiveTab('WholesaleOverview');
    } else if (level2 === 'Lens') {
      setActiveTab('LensOverview');
    } else {
      setActiveTab('');
    }
  };

  /**
   * 탭 변경 처리
   * PipelineList를 벗어날 때 초기 필터를 초기화합니다.
   * Map/Store Info 탭에서 벗어날 때 도구와 포커스 라인을 초기화합니다.
   */
  const handleTabChange = (tab: string) => {
    // PipelineList를 떠날 때 초기 필터 상태 리셋
    if (activeTab === 'PipelineList' && tab !== 'PipelineList') {
      setPipelineInitialStatus(undefined);
      setPipelineInitialBrand(undefined);
      setPipelineInitialYears(undefined);
      setPipelineInitialCountry(undefined);
      setPipelineInitialClass(undefined);
    }
    // 탭 변경 시 선택된 매장 초기화
    setSelectedStore(null);
    setActiveTab(tab);

    // Store Info / Map 탭에서 벗어날 때 도구와 포커스 라인 초기화
    if (tab === 'Store Info') {
      handleToolChange(null);
      setFocusedLine(null);
    }
  };

  /**
   * 로고 클릭 처리 - 랜딩 페이지로 복귀
   */
  const handleLogoClick = () => {
    setShowLanding(true);
    setActiveLevel1('Expansion');
    setActiveLevel2('Stores');
    setActiveTab('ProgressBoard');
    setSelectedStore(null);
    setFilters({ ...INITIAL_FILTERS });
    setPipelineInitialStatus(undefined);
    setPipelineInitialBrand(undefined);
    setPipelineInitialYears(undefined);
    setPipelineInitialCountry(undefined);
    setPipelineInitialClass(undefined);
  };

  /**
   * ProgressBoard에서 PipelineList로 이동 (초기 필터 함께 전달)
   */
  const handleNavigateToPipelineList = (
    status: string,
    brand?: string,
    context?: { years?: number[]; country?: string; storeClass?: string }
  ) => {
    // 전역 필터 초기화 후 PipelineList 진입
    setSearchQuery('');
    setFilters(INITIAL_FILTERS);

    setPipelineInitialStatus(status);
    setPipelineInitialBrand(brand);
    setPipelineInitialYears(context?.years);
    setPipelineInitialCountry(context?.country);
    setPipelineInitialClass(context?.storeClass);
    setActiveTab('PipelineList');
  };

  /**
   * 매장 클릭 처리 - 해당 매장의 상세 패널을 엽니다.
   */
  const handleStoreClick = (store: Store) => {
    setSelectedStore(store);
  };

  /**
   * 매장 정보 업데이트 처리
   * 서버에 저장 후 로컬 상태도 즉시 업데이트합니다.
   */
  const handleStoreUpdate = async (updatedStore: Store) => {
    try {
      // IIC 브랜드 여부에 따라 다른 API 사용
      const isIIC = isIICBrand(updatedStore.brand) || updatedStore.brandCategory === 'iic';

      if (isIIC) {
        await dataClient.updateIICStore(updatedStore.id, updatedStore);
      } else {
        await dataClient.updateCompStore(updatedStore.id, updatedStore);
      }

      // 전체 새로고침 없이 해당 매장 데이터만 업데이트 (성능 최적화)
      setAllStores(prev => prev.map(s => s.id === updatedStore.id ? updatedStore : s));
      setSelectedStore(updatedStore);

      toast.success(`${updatedStore.name} 정보가 업데이트되었습니다.`);
    } catch (error) {
      console.error('Failed to update store:', error);
      toast.error(`매장 정보 업데이트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      throw error;
    }
  };

  /**
   * 매장 삭제 처리
   * 서버에서 삭제 후 로컬 상태에서도 제거합니다.
   */
  const handleStoreDelete = async (storeId: string) => {
    try {
      // 삭제할 매장 찾기
      const store = allStores.find(s => s.id === storeId);
      if (!store) {
        throw new Error('Store not found');
      }

      const isIIC = iicBrands.includes(store.brand.toLowerCase());

      if (isIIC) {
        await dataClient.deleteStore(storeId);
      } else {
        await dataClient.deleteCompStore(storeId);
      }

      // 로컬 상태에서 해당 매장 제거
      setAllStores(prev => prev.filter(s => s.id !== storeId));
      // 상세 패널 닫기
      setSelectedStore(null);
    } catch (error) {
      console.error('Failed to delete store:', error);
      throw error;
    }
  };

  /**
   * 지도 도구 변경 처리
   * 도구를 전환할 때 이전 도구의 임시 상태를 초기화합니다.
   */
  const handleToolChange = (tool: string | null) => {
    setActiveTool(tool);
    // 파이프라인 도구를 해제하거나 다른 도구로 전환 시 라인 모드 초기화
    if (tool !== 'pipeline') {
      setIsAddLineMode(false);
      setSelectedPoints([]);
    }
    // 매장 추가 도구 해제 시 초기화
    if (tool !== 'store' && tool !== 'comp') {
      setIsAddEntityMode(false);
      setSelectedEntityLocation(null);
    }
    // 트래픽 도구 해제 시 초기화
    if (tool !== 'traffic') {
      setIsTrafficDrawingMode(false);
      setTrafficCenter(null);
      setTrafficRadius(0);
      setFocusedTrafficZone(null);
    }
  };

  /**
   * 검색창의 위치 선택 결과를 지도 엔티티 위치로 반영합니다.
   * (매장 추가 모드에서 검색으로 위치를 선택할 때 사용)
   */
  const handleSearchLocationSelect = (coord: { lat: number; lng: number }) => {
    if ((activeTool === 'store' || activeTool === 'comp') && isAddEntityMode) {
      setSelectedEntityLocation(coord);
      toast.success("검색 위치가 폼에 반영되었습니다.");
    }
  };

  /**
   * 모든 필터 선택 / 해제 토글
   * 이미 모두 선택된 상태이면 초기값으로 리셋하고,
   * 그렇지 않으면 모든 필터를 선택합니다.
   */
  const handleSelectAllFilters = () => {
    const statusList = ['Open', 'Construction', 'Signed', 'Confirmed', 'Planned'];
    const brandsList = ['Gentle Monster', 'Tamburins', 'Nudake', 'Atiissu', 'Nuflaat'];
    const channelsList = ['FS', 'Department Store', 'Mall', 'Duty Free', 'Premium Outlet', 'Pop-up', 'Haus'];
    const allRegions = ['한국', '일본', '중국', '동남아', '미주', '유럽', '중동', '호주', '기타'];
    const smartGlassBrandsList = ['Meta', 'XREAL', 'Rokid', 'TCL RayNeo', 'Vuzix'];

    // 경쟁사/선호/스마트글라스 필터가 이미 최대로 선택됐는지 확인 (전체 선택 상태 판별 기준)
    const isCompetitorFull = filters.competitorBrands?.length === competitorBrandsList.length;
    const isPreferredFull = filters.preferredBrands?.length === preferredBrandsList.length;
    const isSmartGlassFull = filters.smartGlass?.length === smartGlassBrandsList.length;

    const isAllSelected = isCompetitorFull && isPreferredFull && isSmartGlassFull;

    if (isAllSelected) {
      // 이미 전체 선택 상태이면 기본값으로 리셋
      setFilters(INITIAL_FILTERS);
      toast.info("필터 선택이 해제되었습니다.");
    } else {
      // 모든 필터 선택 (데이터 레이어는 제외)
      setFilters({
        status: statusList,
        brand: brandsList,
        channel: channelsList,
        country: allRegions,
        storeClass: ['Type-based', 'Standalone'],
        competitorBrands: competitorBrandsList.map(b => b.name),
        preferredBrands: preferredBrandsList.map(b => b.name),
        smartGlass: smartGlassBrandsList,
        dataLayers: [], // 데이터 레이어는 전체 선택에서 제외
      });
      toast.success("모든 필터가 선택되었습니다.");
    }
  };

  /**
   * 지도 클릭 처리
   * 활성화된 도구에 따라 다른 동작을 수행합니다:
   * - pipeline: 파이프라인 포인트 추가
   * - store/comp: 매장 위치 선택
   * - traffic: 트래픽 원 중심/반지름 설정 (Haversine 공식 사용)
   */
  const handleMapClick = (coord: { lat: number; lng: number }) => {
    // 파이프라인 도구: 최대 2개 포인트 선택
    if (activeTool === 'pipeline' && isAddLineMode) {
      if (selectedPoints.length < 2) {
        setSelectedPoints(prev => [...prev, coord]);
      } else {
        toast.info("포인트를 초기화하고 새로 선택하세요.");
      }
    }
    // 매장 추가 도구: 클릭한 위치를 매장 위치로 선택
    if ((activeTool === 'store' || activeTool === 'comp') && isAddEntityMode) {
      setSelectedEntityLocation(coord);
    }
    // 트래픽 도구: 첫 클릭 = 중심, 두 번째 클릭 = 반지름 계산
    if (activeTool === 'traffic' && isTrafficDrawingMode) {
      if (!trafficCenter) {
        // 첫 번째 클릭: 원의 중심 설정
        setTrafficCenter(coord);
      } else {
        // 두 번째 클릭: Haversine 공식으로 두 좌표 간 거리(반지름) 계산
        const R = 6371000; // 지구 반지름(미터)
        const lat1 = trafficCenter.lat * Math.PI / 180;
        const lat2 = coord.lat * Math.PI / 180;
        const deltaLat = (coord.lat - trafficCenter.lat) * Math.PI / 180;
        const deltaLng = (coord.lng - trafficCenter.lng) * Math.PI / 180;

        const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
          Math.cos(lat1) * Math.cos(lat2) *
          Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        setTrafficRadius(distance);
      }
    }
  };

  /**
   * 지도 마우스 이동 처리
   * 트래픽 원 그리기 중 마우스 위치에 따라 반지름을 실시간으로 업데이트합니다.
   */
  const handleMapMouseMove = (coord: { lat: number; lng: number }) => {
    // 중심이 설정됐고 아직 반지름이 확정되지 않은 상태에서만 실시간 업데이트
    if (activeTool === 'traffic' && isTrafficDrawingMode && trafficCenter && trafficRadius === 0) {
      const R = 6371000; // 지구 반지름(미터)
      const lat1 = trafficCenter.lat * Math.PI / 180;
      const lat2 = coord.lat * Math.PI / 180;
      const deltaLat = (coord.lat - trafficCenter.lat) * Math.PI / 180;
      const deltaLng = (coord.lng - trafficCenter.lng) * Math.PI / 180;

      const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      setTrafficRadius(distance);
    }
  };

  /**
   * 필터 변경 처리
   */
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  // ──────────────────────────────────────────────────────────
  // 지도 탭 좌측 패널 렌더링
  // ──────────────────────────────────────────────────────────

  /**
   * Map / Store Info 탭의 좌측 패널을 렌더링합니다.
   * 활성화된 도구에 따라 다른 패널을 표시합니다:
   * - pipeline: 파이프라인 연결선 관리 패널
   * - store/comp: 매장 추가 패널
   * - traffic: 트래픽 구역 관리 패널
   * - null (기본): 사이드바 (필터 + 매장 목록)
   */
  const renderLeftPanel = () => {
    // 파이프라인 연결선 도구
    if (activeTool === 'pipeline') {
      return (
        <LineManagerPanel
          onLinesUpdate={(newLines) => {
            setLines(newLines);
            // UI 상태 유지를 위해 refreshData() 대신 직접 업데이트
          }}
          onModeChange={setIsAddLineMode}
          onSelectionChange={setSelectedPoints}
          onFocusLine={(line) => {
            setFocusedLine(line);
          }}
          selectedPoints={selectedPoints}
          isAddMode={isAddLineMode}
        />
      );
    }

    // 매장 추가 도구 (IIC 또는 경쟁사)
    if (activeTool === 'store' || activeTool === 'comp') {
      return (
        <AddEntityPanel
          mode={activeTool === 'store' ? 'iic' : 'competitor'}
          onEntitiesUpdate={async (entities) => {
            setSavedEntities(entities);
            // 전체 새로고침 대신 매장 데이터만 다시 로드 (성능 최적화)
            try {
              const [iic, comp] = await Promise.all([
                dataClient.getIICStores(),
                dataClient.getCompStores()
              ]);
              setAllStores([...iic, ...comp]);
            } catch (e) {
              console.error("Update error:", e);
            }
          }}
          onModeChange={setIsAddEntityMode}
          onSelectionChange={setSelectedEntityLocation}
          onFocusEntity={(entity) => {
            // 엔티티와 같은 ID를 가진 매장을 찾아 상세 패널 열기
            const store = allStores.find(s => s.id === entity.id);
            if (store) setSelectedStore(store);
          }}
          selectedLocation={selectedEntityLocation}
          isAddMode={isAddEntityMode}
          existingEntities={savedEntities}
          customCompetitorBrands={competitorBrandsList}
          customPreferredBrands={preferredBrandsList}
        />
      );
    }

    // 트래픽 구역 도구
    if (activeTool === 'traffic') {
      return (
        <TrafficManagerPanel
          currentCenter={trafficCenter}
          currentRadius={trafficRadius}
          onCenterChange={setTrafficCenter}
          onRadiusChange={setTrafficRadius}
          isDrawing={isTrafficDrawingMode}
          onDrawingModeChange={setIsTrafficDrawingMode}
          color={trafficColor}
          onColorChange={setTrafficColor}
          opacity={trafficOpacity}
          onOpacityChange={setTrafficOpacity}
          savedZones={savedTrafficZones}
          onSaveZone={async (zone) => {
            try {
              await dataClient.saveTrafficZone(zone);
              // 전체 새로고침 없이 로컬 상태에 추가
              setSavedTrafficZones(prev => [...prev, zone]);
            } catch (e) {
              toast.error("트래픽 구역 저장 실패");
            }
          }}
          onDeleteZone={async (id) => {
            try {
              await dataClient.deleteTrafficZone(id);
              // 전체 새로고침 없이 로컬 상태에서 제거
              setSavedTrafficZones(prev => prev.filter(z => z.id !== id));
            } catch (e) {
              toast.error("트래픽 구역 삭제 실패");
            }
          }}
          onFocusZone={(zone) => setFocusedTrafficZone(zone)}
        />
      );
    }

    // 기본: 사이드바 (필터 + 매장 목록)
    return (
      <Sidebar
        stores={storesForSidebar}
        filters={filters}
        onSearch={(query) => setSearchQuery(query)}
        searchQuery={searchQuery}
        onFilterChange={handleFilterChange}
        onStoreClick={handleStoreClick}
        iicCount={iicFilteredCount}
        compCount={otherFilteredCount}
        onRefreshData={refreshData}
        competitorBrandsList={competitorBrandsList}
        preferredBrandsList={preferredBrandsList}
      />
    );
  };

  // ──────────────────────────────────────────────────────────
  // 탭별 콘텐츠 렌더링
  // ──────────────────────────────────────────────────────────

  /**
   * 현재 탭에 맞는 콘텐츠를 렌더링합니다.
   * 각 뷰 컴포넌트에 필요한 props를 전달합니다.
   */
  const renderContent = () => {
    switch (activeTab) {
      // ── Dashboard (분석 차트) ──
      case 'Dashboard':
        return (
          <DashboardView
            stores={allStores}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
          />
        );

      // ── Progress View (목표 대비 진행률) ──
      case 'ProgressView':
        return (
          <ProgressView stores={allStores} />
        );

      // ── Progress Board ──
      case 'ProgressBoard':
        return (
          <ProgressBoard
            stores={allStores}
            onNavigateToStoreInfo={(status, brand) => {
              handleTabChange('Map');
              setFilters((prev) => ({
                ...prev,
                status: status ? [status] : prev.status,
                brand: brand
                  ? Array.isArray(brand)
                    ? brand
                    : [brand]
                  : prev.brand,
              }));
            }}
            onNavigateToStoreDetail={(store) => {
              handleTabChange('Map');
              setSelectedStore(store);
            }}
            onNavigateToExpansion={(status, brand) => {
              handleTabChange('Map');
              setFilters((prev) => ({
                ...prev,
                status: status ? [status] : prev.status,
                brand: brand
                  ? Array.isArray(brand)
                    ? brand
                    : [brand]
                  : prev.brand,
              }));
            }}
            onNavigateToPipelineList={handleNavigateToPipelineList}
          />
        );

      // ── Pipeline List ──
      case 'PipelineList':
        return (
          <div className="flex flex-1 overflow-hidden min-h-0 relative">
            <PipelineList
              stores={allStores}
              initialStatus={pipelineInitialStatus}
              initialBrand={pipelineInitialBrand}
              initialYears={pipelineInitialYears}
              initialCountryRegion={pipelineInitialCountry}
              initialClass={pipelineInitialClass}
              onStoreClick={(store) => {
                handleTabChange('Map');
                setSelectedStore(store);
              }}
              onCountryClick={(countryRegion) => {
                handleTabChange('Map');
                setFilters((prev) => ({
                  ...prev,
                  country: [countryRegion],
                }));
              }}
            />
            {/* PipelineList 위에 떠 있는 매장 상세 패널 */}
            {selectedStore && (
              <div className="absolute top-0 right-0 h-full z-20 shadow-2xl animate-in slide-in-from-right duration-300">
                {/* 파이프라인 진행 중인 매장(후보 매장) 상세 */}
                {['Plan', 'Confirm', 'Contract', 'Space', 'Planned', 'Confirmed', 'Signed', 'Construction', 'Reject', 'Pending'].includes(selectedStore.status) ? (
                  <CandidateStoreDetail
                    store={selectedStore}
                    onClose={() => setSelectedStore(null)}
                    onUpdate={handleStoreUpdate}
                    onDelete={handleStoreDelete}
                  />
                ) : (
                  /* 오픈 매장 상세 */
                  <StoreDetail
                    store={selectedStore}
                    onClose={() => setSelectedStore(null)}
                    activeTab={activeTab}
                    onUpdate={handleStoreUpdate}
                    onDelete={handleStoreDelete}
                  />
                )}
              </div>
            )}
          </div>
        );

      // ── P&L (손익계산서) ──
      case 'PnL':
        return (
          <div className="flex flex-1 overflow-hidden min-h-0 relative">
            <PnLView
              stores={allStores}
              initialStatus={pipelineInitialStatus}
              initialBrand={pipelineInitialBrand}
              initialYears={pipelineInitialYears}
              initialCountryRegion={pipelineInitialCountry}
              initialClass={pipelineInitialClass}
              onStoreUpdate={handleStoreUpdate}
            />
          </div>
        );

      // ── Schedule (일정 캘린더) ──
      case 'Schedule':
        return (
          <div className="flex flex-1 overflow-hidden min-h-0 relative">
            <ScheduleView />
          </div>
        );

      // ── Map / Store Info (지도 뷰) ──
      case 'Map':
      case 'Store Info':
        return (
          <main className="flex flex-1 overflow-hidden min-h-0 relative">
            {/* 좌측 패널: 도구에 따라 Sidebar / LineManagerPanel / AddEntityPanel / TrafficManagerPanel */}
            {renderLeftPanel()}

            {/* 지도 캔버스 */}
            <MapCanvas
              stores={filteredStores}
              allStores={allStores}
              onStoreClick={handleStoreClick}
              activeTool={activeTool}
              onToolChange={handleToolChange}
              onMapClick={handleMapClick}
              onMapMouseMove={handleMapMouseMove}
              lines={showLines ? lines : undefined}
              entities={savedEntities}
              tempMarker={selectedEntityLocation}
              isSalesMode={activeTab === 'Map'}
              focusStore={selectedStore}
              focusLine={focusedLine}
              showLowSalesAlert={showLowSalesAlert}
              onToggleLowSalesAlert={() => {
                setShowLowSalesAlert(!showLowSalesAlert);
                // 두 알림 모드는 동시에 활성화 불가
                if (!showLowSalesAlert) setShowExpirationAlert(false);
              }}
              showExpirationAlert={showExpirationAlert}
              onToggleExpirationAlert={() => {
                setShowExpirationAlert(!showExpirationAlert);
                if (!showExpirationAlert) setShowLowSalesAlert(false);
              }}
              onSelectAll={handleSelectAllFilters}
              trafficCenter={trafficCenter}
              trafficRadius={trafficRadius}
              trafficColor={trafficColor}
              trafficOpacity={trafficOpacity}
              savedTrafficZones={savedTrafficZones}
              focusTrafficZone={focusedTrafficZone}
              showHeatmap={showTrafficLayer}
              isTrafficDrawingMode={isTrafficDrawingMode}
              onTrafficZoneClick={(zone) => {
                setFocusedTrafficZone(zone);
                toast.info(`선택된 구역: ${zone.name}`);
              }}
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetSearch={() => setSearchQuery('')}
              onSearchLocationSelect={handleSearchLocationSelect}
              customCompetitorBrands={competitorBrandsList}
              customPreferredBrands={preferredBrandsList}
            />

            {/* 매장 상세 패널 (지도 위에 오버레이로 표시) */}
            {selectedStore && (
              <div className="absolute top-0 right-0 h-full z-20 shadow-2xl animate-in slide-in-from-right duration-300">
                {/* 파이프라인 진행 중인 매장(후보 매장) 상세 */}
                {['Plan', 'Confirm', 'Contract', 'Space', 'Planned', 'Confirmed', 'Signed', 'Construction', 'Reject', 'Pending'].includes(selectedStore.status) ? (
                  <CandidateStoreDetail
                    store={selectedStore}
                    onClose={() => setSelectedStore(null)}
                    onUpdate={handleStoreUpdate}
                    onDelete={handleStoreDelete}
                  />
                ) : (
                  /* 오픈 매장 상세 */
                  <StoreDetail
                    store={selectedStore}
                    onClose={() => setSelectedStore(null)}
                    activeTab={activeTab}
                    onUpdate={handleStoreUpdate}
                    onDelete={handleStoreDelete}
                  />
                )}
              </div>
            )}
          </main>
        );

      // ── Wholesale / Lens / Prism 준비 중 ──
      default:
        return (
          <div className="flex-1 flex items-center justify-center bg-gray-50/50">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-400">
                  {activeLevel1 === 'Prism' ? 'Prism' : `${activeLevel2} – ${activeTab}`}
                </h3>
                <p className="text-sm text-gray-400 mt-1">Coming Soon</p>
              </div>
            </div>
          </div>
        );
    }
  };

  // ──────────────────────────────────────────────────────────
  // 렌더링
  // ──────────────────────────────────────────────────────────
  return (
    /**
     * 최상위 컨테이너
     * - 전체 화면 높이/너비 고정 (스크롤 없음, 내부에서만 스크롤)
     * - 반응형 폰트 크기: 1440px 미만=13px, QHD(2560px)=16px
     */
    <div
      className={`
        flex flex-col h-screen w-screen overflow-hidden bg-gray-100
        text-[13px]
        min-[1440px]:text-[14px]
        min-[1920px]:text-[15px]
        min-[2560px]:text-[16px]
      `}
    >
      {/* ───── 관리자 페이지 또는 메인 대시보드 ───── */}
      {showAdmin ? (
        /* ───── 관리자 페이지 ───── */
        <div className="max-w-[2560px] w-full mx-auto h-full flex flex-col bg-white shadow-2xl">
          <Header
            activeLevel1={activeLevel1}
            activeLevel2={activeLevel2}
            activeTab={activeTab}
            onLevel1Change={handleLevel1Change}
            onLevel2Change={handleLevel2Change}
            onTabChange={handleTabChange}
            totalStores={totalIICCount}
            onSettingsClick={() => setIsSettingsOpen(true)}
            onLogoClick={handleLogoClick}
          />
          <AdminPage
            onBack={() => setShowAdmin(false)}
            userName={userEmail.split('@')[0]}
            userRole={userRole}
          />
        </div>
      ) : showLanding ? (
        /* ───── 랜딩 페이지 ───── */
        <LandingPage
          onEnter={(level1) => {
            setShowLanding(false);
            handleLevel1Change(level1);
          }}
        />
      ) : (
        // ───── 메인 대시보드 ─────
        <div className="max-w-[2560px] w-full mx-auto h-full flex flex-col bg-white shadow-2xl">

          {/* 헤더 네비게이션 */}
          <Header
            activeLevel1={activeLevel1}
            activeLevel2={activeLevel2}
            activeTab={activeTab}
            onLevel1Change={handleLevel1Change}
            onLevel2Change={handleLevel2Change}
            onTabChange={handleTabChange}
            totalStores={totalIICCount}
            onSettingsClick={() => setIsSettingsOpen(true)}
            onLogoClick={handleLogoClick}
          />

          {/* 탭별 콘텐츠 영역 */}
          {renderContent()}

          {/* 설정 다이얼로그 (헤더 설정 버튼 클릭 시 열림) */}
          <SettingsDialog
            open={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
            competitorBrands={competitorBrandsList}
            preferredBrands={preferredBrandsList}
            onUpdateCompetitorBrands={handleUpdateCompetitorBrands}
            onUpdatePreferredBrands={handleUpdatePreferredBrands}
          />
        </div>
      )}
    </div>
  );
}
