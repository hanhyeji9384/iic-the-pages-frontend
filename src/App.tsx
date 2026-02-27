// ============================================================
// App.tsx - 앱의 최상위 컴포넌트
// 전체 화면 레이아웃과 네비게이션 상태를 관리합니다.
// 비전공자 설명: 이 파일은 앱의 "뼈대"입니다. 어떤 화면을 보여줄지,
// 현재 어떤 메뉴가 선택됐는지 등 핵심 상태를 여기서 관리합니다.
// ============================================================

import { useState, useMemo } from 'react';
import { LandingPage } from './components/dashboard/LandingPage';
import { Header } from './components/dashboard/Header';
import { ProgressBoard } from './components/dashboard/ProgressBoard';
import { PipelineList } from './components/dashboard/PipelineList';
import { ComingSoon } from './components/dashboard/ComingSoon';
import {
  Store,
  FilterState,
  BrandDefinition,
  INITIAL_FILTERS,
  isIICBrand,
} from './types';
import { IIC_STORES, INITIAL_COMPETITOR_BRANDS, INITIAL_PREFERRED_BRANDS } from './app/data/stores';

// ============================================================
// 앱 전체 상태 초기값
// ============================================================

export default function App() {
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
   * 정적 데이터를 기본값으로 사용하고, 나중에 API로 교체 가능
   */
  const [allStores] = useState<Store[]>(IIC_STORES);

  /** 현재 선택된 매장 (상세 패널 표시용) */
  const [_selectedStore, setSelectedStore] = useState<Store | null>(null);

  // ──────────────────────────────────────────────────────────
  // 필터 & 검색 상태
  // ──────────────────────────────────────────────────────────

  /** 검색창에 입력된 검색어 */
  const [_searchQuery, setSearchQuery] = useState('');

  /** 사이드바 필터 상태 */
  const [_filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  // ──────────────────────────────────────────────────────────
  // 브랜드 목록 상태 (경쟁사 / 선호 브랜드)
  // ──────────────────────────────────────────────────────────

  /** 경쟁사 브랜드 목록 */
  const [_competitorBrandsList] = useState<BrandDefinition[]>(
    INITIAL_COMPETITOR_BRANDS
  );

  /** 선호/인접 브랜드 목록 */
  const [_preferredBrandsList] = useState<BrandDefinition[]>(
    INITIAL_PREFERRED_BRANDS
  );

  // ──────────────────────────────────────────────────────────
  // PipelineList 초기 필터 (ProgressBoard에서 클릭해서 진입할 때)
  // ──────────────────────────────────────────────────────────
  const [pipelineInitialStatus, setPipelineInitialStatus] = useState<string | undefined>(undefined);
  const [pipelineInitialBrand, setPipelineInitialBrand] = useState<string | undefined>(undefined);
  const [pipelineInitialYears, setPipelineInitialYears] = useState<number[] | undefined>(undefined);
  const [pipelineInitialCountry, setPipelineInitialCountry] = useState<string | undefined>(undefined);
  const [pipelineInitialClass, setPipelineInitialClass] = useState<string | undefined>(undefined);

  // ──────────────────────────────────────────────────────────
  // 설정 다이얼로그 상태
  // ──────────────────────────────────────────────────────────
  const [_isSettingsOpen, setIsSettingsOpen] = useState(false);

  // ──────────────────────────────────────────────────────────
  // 파생 데이터 (useMemo로 성능 최적화)
  // ──────────────────────────────────────────────────────────

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

  // ──────────────────────────────────────────────────────────
  // 탭별 콘텐츠 렌더링
  // ──────────────────────────────────────────────────────────

  /**
   * 현재 탭에 맞는 콘텐츠를 렌더링합니다.
   * 각 뷰 컴포넌트에 필요한 props를 전달합니다.
   */
  const renderContent = () => {
    switch (activeTab) {
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
          </div>
        );

      // ── P&L (손익계산서) ──
      case 'PnL':
        return (
          <div className="flex flex-1 overflow-hidden min-h-0">
            <ComingSoon pageName="P&L View" />
          </div>
        );

      // ── Schedule (일정 캘린더) ──
      case 'Schedule':
        return (
          <div className="flex flex-1 overflow-hidden min-h-0">
            <ComingSoon pageName="Schedule View" />
          </div>
        );

      // ── Map (지도 뷰) ──
      case 'Map':
      case 'Store Info':
        return (
          <div className="flex flex-1 overflow-hidden min-h-0">
            <ComingSoon pageName="Map View (Google Maps 연동 예정)" />
          </div>
        );

      // ── Dashboard ──
      case 'Dashboard':
        return (
          <div className="flex flex-1 overflow-hidden min-h-0">
            <ComingSoon pageName="Dashboard View" />
          </div>
        );

      // ── Wholesale / Lens / Prism 준비 중 ──
      default:
        return (
          <ComingSoon
            pageName={
              activeLevel1 === 'Prism'
                ? 'Prism'
                : `${activeLevel2} – ${activeTab}`
            }
          />
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
      {/* ───── 랜딩 페이지 ───── */}
      {showLanding ? (
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
          <main className="flex flex-1 overflow-hidden min-h-0">
            {renderContent()}
          </main>

          {/* TODO: SettingsDialog 컴포넌트 추가 예정 */}
          {/* <SettingsDialog
            open={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
            competitorBrands={competitorBrandsList}
            preferredBrands={preferredBrandsList}
            onUpdateCompetitorBrands={setCompetitorBrandsList}
            onUpdatePreferredBrands={setPreferredBrandsList}
          /> */}
        </div>
      )}
    </div>
  );
}
