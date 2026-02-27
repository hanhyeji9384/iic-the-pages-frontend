// ============================================================
// PipelineList - 파이프라인 리스트 테이블
// 모든 파이프라인 매장을 상세한 표 형태로 보여주며
// 국가/브랜드/상태/채널/연도/분류 등 다양한 필터를 제공합니다.
// 레퍼런스 프로젝트(PB_1080)의 디자인과 완전히 동일하게 구현되었습니다.
// ============================================================

import React, { useMemo, useState } from 'react';
import { Store, getStoreClass } from '../../types';
import {
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  ChevronsUpDown,
  Calendar,
} from 'lucide-react';

// ============================================================
// 타입 정의
// ============================================================

// 정렬 키 타입
type SortKey =
  | 'country'
  | 'city'
  | 'name'
  | 'brand'
  | 'openDate'
  | 'area'
  | 'channel'
  | 'status'
  | 'sales'
  | 'capex'
  | 'margin';

interface PipelineListProps {
  stores: Store[];
  /** 초기 상태 필터 (ProgressBoard에서 클릭해서 진입할 때) */
  initialStatus?: string;
  /** 초기 브랜드 필터 */
  initialBrand?: string;
  /** 초기 연도 필터 */
  initialYears?: number[];
  /** 초기 국가/지역 필터 */
  initialCountryRegion?: string;
  /** 초기 매장 분류 필터 */
  initialClass?: string;
  /** 매장 클릭 시 콜백 */
  onStoreClick?: (store: Store) => void;
  /** 국가 클릭 시 콜백 */
  onCountryClick?: (countryRegion: string) => void;
}

// ============================================================
// IIC 브랜드 목록
// ============================================================
const IIC_BRAND_LIST = ['Gentle Monster', 'Tamburins', 'Nudake', 'Atiissu', 'Nuflaat'];

// ============================================================
// 지역명 → 국가명 매핑 (초기 필터 적용용)
// ============================================================
const REGION_MAP: Record<string, string[]> = {
  한국: ['south korea', 'korea'],
  일본: ['japan'],
  중국: ['china', 'hong kong', 'taiwan', 'macau'],
  동남아: ['singapore', 'vietnam', 'thailand', 'malaysia', 'indonesia', 'philippines'],
  미주: ['usa', 'united states', 'canada', 'mexico', 'america'],
  유럽: ['uk', 'united kingdom', 'france', 'germany', 'italy', 'spain', 'netherlands', 'sweden', 'switzerland', 'belgium', 'denmark'],
  중동: ['uae', 'united arab emirates', 'saudi', 'qatar', 'kuwait', 'dubai'],
  호주: ['australia', 'new zealand'],
};

// ============================================================
// 국가 → 한국어 지역명 변환 함수
// ============================================================
function countryToRegion(country: string): string | null {
  const c = country.toLowerCase();
  const regionMapping: { label: string; keywords: string[] }[] = [
    { label: '한국', keywords: ['south korea', 'korea'] },
    { label: '일본', keywords: ['japan'] },
    { label: '중국', keywords: ['china', 'hong kong', 'taiwan', 'macau'] },
    { label: '동남아', keywords: ['singapore', 'vietnam', 'thailand', 'malaysia', 'indonesia', 'philippines'] },
    { label: '미주', keywords: ['usa', 'united states', 'canada', 'mexico', 'america'] },
    { label: '유럽', keywords: ['uk', 'united kingdom', 'france', 'germany', 'italy', 'spain', 'netherlands', 'sweden', 'switzerland', 'belgium', 'denmark'] },
    { label: '중동', keywords: ['uae', 'united arab emirates', 'saudi arabia', 'qatar', 'kuwait', 'dubai'] },
    { label: '호주', keywords: ['australia', 'new zealand'] },
  ];
  for (const region of regionMapping) {
    if (region.keywords.some((k) => c.includes(k))) return region.label;
  }
  return '기타';
}

// ============================================================
// 지역 순서 (정렬용)
// ============================================================
function getRegionRank(country: string): number {
  if (!country) return 99;
  const c = country.toLowerCase();
  if (c.includes('korea')) return 1;
  if (c === 'japan') return 2;
  if (['china', 'hong kong', 'macau', 'taiwan'].some((k) => c.includes(k))) return 3;
  if (['singapore', 'vietnam', 'thailand', 'malaysia', 'indonesia', 'philippines'].some((k) => c.includes(k))) return 4;
  if (['usa', 'united states', 'canada', 'mexico', 'america'].some((k) => c.includes(k))) return 5;
  if (['uk', 'united kingdom', 'france', 'germany', 'italy', 'spain', 'netherlands', 'sweden', 'switzerland', 'belgium', 'denmark'].some((k) => c.includes(k))) return 6;
  if (['uae', 'united arab emirates', 'saudi', 'qatar', 'kuwait', 'dubai'].some((k) => c.includes(k))) return 7;
  if (['australia', 'new zealand'].some((k) => c.includes(k))) return 8;
  return 9;
}

// ============================================================
// 통화 포맷 함수 (억/만 단위)
// ============================================================
function formatCurrencyWithUnit(amount?: number): string {
  if (amount === undefined || amount === null || amount === 0) return '-';
  if (amount >= 100000000) {
    return `${Math.round(amount / 100000000).toLocaleString()}억`;
  }
  return `${Math.round(amount / 10000).toLocaleString()}만`;
}

// ============================================================
// PipelineList 메인 컴포넌트
// ============================================================

export const PipelineList: React.FC<PipelineListProps> = ({
  stores,
  initialStatus,
  initialBrand,
  initialYears,
  initialCountryRegion,
  initialClass,
  onStoreClick,
  onCountryClick,
}) => {
  // 필터 상태 (배열: 복수 선택 가능)
  const [selectedCountry, setSelectedCountry] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>(initialBrand || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus || 'all');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedAnalysisYears, setSelectedAnalysisYears] = useState<number[]>(initialYears || []);
  const [selectedClass, setSelectedClass] = useState<string>(initialClass || 'all');

  // 정렬 상태
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey | null;
    direction: 'asc' | 'desc';
  }>({
    key: null,
    direction: 'asc',
  });

  // 드롭다운 열림 상태
  const [countryOpen, setCountryOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);

  // 외부에서 초기 필터 전달받을 때 처리
  React.useEffect(() => {
    if (initialStatus) setSelectedStatus(initialStatus);
    if (initialBrand) setSelectedBrand(initialBrand);
    if (initialYears) setSelectedAnalysisYears(initialYears);
    if (initialCountryRegion) {
      const keywords = REGION_MAP[initialCountryRegion];
      if (keywords) {
        const pipelineStatuses = ['Plan', 'Planned', 'Confirmed', 'Signed', 'Construction', 'Space', 'Contract', 'Reject', 'Pending'];
        const pipelineCountries = Array.from(
          new Set(
            stores
              .filter((s) => pipelineStatuses.includes(s.status))
              .map((s) => s.location.country)
          )
        );
        const matchingCountries = pipelineCountries.filter((c) =>
          keywords.some((k) => c.toLowerCase().includes(k))
        );
        if (matchingCountries.length > 0) setSelectedCountry(matchingCountries);
      }
    }
    if (initialClass) setSelectedClass(initialClass);
  }, [initialStatus, initialBrand, initialYears, initialCountryRegion, initialClass]);

  // 정렬 핸들러
  const handleSort = (key: SortKey) => {
    setSortConfig((current) => {
      if (current.key === key) {
        if (current.direction === 'asc') return { key, direction: 'desc' };
        return { key: null, direction: 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // 오픈 예정일 가져오기
  const getOpenDate = (store: Store) => {
    return (
      store.openDate ||
      (store as any).ChangOpenDate ||
      store.contract?.startDate ||
      '9999-12-31'
    );
  };

  // ──────────────────────────────────────────────────────────
  // 파이프라인 매장 필터링 + 정렬
  // ──────────────────────────────────────────────────────────
  const pipelineStores = useMemo(() => {
    const pipelineStatuses = [
      'Plan', 'Planned', 'Confirmed', 'Signed', 'Construction',
      'Space', 'Contract', 'Reject', 'Pending',
    ];

    const filtered = stores.filter((store) => {
      const isPipeline = pipelineStatuses.includes(store.status);
      if (!isPipeline) return false;

      // IIC 브랜드만 표시
      if (!IIC_BRAND_LIST.includes(store.brand || '')) return false;

      const matchCountry =
        selectedCountry.length === 0 ||
        selectedCountry.includes(store.location.country);
      const matchCity =
        selectedCity === 'all' || store.location.city === selectedCity;
      const matchBrand =
        selectedBrand === 'all' || store.brand === selectedBrand;
      const matchStatus =
        selectedStatus === 'all' || store.status === selectedStatus;
      const matchChannel =
        selectedChannel === 'all' || store.type === selectedChannel;

      // 분석 연도 필터
      const matchYear =
        selectedAnalysisYears.length === 0 ||
        (() => {
          const dateStr =
            store.openDate ||
            (store as any).ChangOpenDate ||
            store.contract?.startDate;
          if (!dateStr) return false;
          const year = new Date(dateStr).getFullYear();
          return selectedAnalysisYears.includes(year);
        })();

      // 매장 분류 필터
      const matchClass =
        selectedClass === 'all' || getStoreClass(store.type) === selectedClass;

      return matchCountry && matchCity && matchBrand && matchStatus && matchChannel && matchYear && matchClass;
    });

    // 정렬 로직
    const sorted = [...filtered].sort((a, b) => {
      if (!sortConfig.key) {
        // 기본 정렬: 지역 순서 → 오픈 예정일
        const rankA = getRegionRank(a.location.country);
        const rankB = getRegionRank(b.location.country);
        if (rankA !== rankB) return rankA - rankB;
        return getOpenDate(a).localeCompare(getOpenDate(b));
      }

      let valA: any = '';
      let valB: any = '';

      switch (sortConfig.key) {
        case 'country':
          valA = getRegionRank(a.location.country);
          valB = getRegionRank(b.location.country);
          break;
        case 'city':
          valA = a.location.city || '';
          valB = b.location.city || '';
          break;
        case 'name':
          valA = a.name || '';
          valB = b.name || '';
          break;
        case 'brand':
          valA = a.brand || '';
          valB = b.brand || '';
          break;
        case 'openDate':
          valA = getOpenDate(a);
          valB = getOpenDate(b);
          break;
        case 'area':
          valA = a.area || 0;
          valB = b.area || 0;
          break;
        case 'channel':
          valA = a.type || '';
          valB = b.type || '';
          break;
        case 'status':
          valA = a.status || '';
          valB = b.status || '';
          break;
        case 'sales':
          valA = a.financial?.estimatedSales || a.financial?.monthlySales || 0;
          valB = b.financial?.estimatedSales || b.financial?.monthlySales || 0;
          break;
        case 'capex':
          valA = a.financial?.investment || 0;
          valB = b.financial?.investment || 0;
          break;
        case 'margin':
          valA = a.financial?.estimatedMargin || (a.financial as any)?.expectedOperatingProfitRatio || 0;
          valB = b.financial?.estimatedMargin || (b.financial as any)?.expectedOperatingProfitRatio || 0;
          break;
        default:
          return 0;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [
    stores, selectedCountry, selectedCity, selectedBrand, selectedStatus,
    selectedChannel, selectedAnalysisYears, selectedClass, sortConfig,
  ]);

  // ──────────────────────────────────────────────────────────
  // 필터 옵션 목록 (데이터 기반으로 동적 생성)
  // ──────────────────────────────────────────────────────────
  const filterOptions = useMemo(() => {
    const pipelineStatuses = [
      'Plan', 'Planned', 'Confirmed', 'Signed', 'Construction',
      'Space', 'Contract', 'Reject', 'Pending',
    ];
    const allPipelineStores = stores.filter((store) =>
      pipelineStatuses.includes(store.status)
    );

    const countries = Array.from(new Set(allPipelineStores.map((s) => s.location.country))).sort();
    const availableCities =
      selectedCountry.length === 0
        ? allPipelineStores
        : allPipelineStores.filter((s) => selectedCountry.includes(s.location.country));
    const cities = Array.from(new Set(availableCities.map((s) => s.location.city))).sort();
    const statuses = Array.from(new Set(allPipelineStores.map((s) => s.status))).sort();
    const channels = Array.from(new Set(allPipelineStores.map((s) => s.type))).sort();
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 16 }, (_, i) => currentYear - 5 + i);

    return { countries, cities, brands: IIC_BRAND_LIST, statuses, channels, years };
  }, [stores, selectedCountry]);

  // 활성 필터 여부
  const hasActiveFilters =
    selectedCountry.length > 0 ||
    selectedCity !== 'all' ||
    selectedBrand !== 'all' ||
    selectedStatus !== 'all' ||
    selectedChannel !== 'all' ||
    selectedAnalysisYears.length > 0 ||
    selectedClass !== 'all';

  // 필터 초기화
  const clearFilters = () => {
    setSelectedCountry([]);
    setSelectedCity('all');
    setSelectedBrand('all');
    setSelectedStatus('all');
    setSelectedChannel('all');
    setSelectedAnalysisYears([]);
    setSelectedClass('all');
  };

  // 예상 매출 가져오기
  const getExpectedSales = (store: Store) => {
    if (store.financial?.estimatedSales) return store.financial.estimatedSales;
    if (store.financial?.monthlySales) return store.financial.monthlySales;
    return 0;
  };

  // 정렬 아이콘 렌더링
  const renderSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key)
      return <ArrowUpDown className="w-3 h-3 text-slate-300 ml-1 inline-block" />;
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-600 ml-1 inline-block" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 ml-1 inline-block" />
    );
  };

  // 정렬 가능한 테이블 헤더 컴포넌트
  const SortableHeader = ({
    label,
    sortKey,
    align = 'center',
  }: {
    label: string;
    sortKey: SortKey;
    align?: 'left' | 'center' | 'right';
  }) => (
    <th
      className={`py-3 px-4 border-r border-slate-200 ${
        align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
      } font-bold text-slate-800 cursor-pointer hover:bg-slate-100 transition-colors select-none`}
      onClick={() => handleSort(sortKey)}
    >
      <div
        className={`flex items-center ${
          align === 'center'
            ? 'justify-center'
            : align === 'right'
            ? 'justify-end'
            : 'justify-start'
        }`}
      >
        {label}
        {renderSortIcon(sortKey)}
      </div>
    </th>
  );

  // 매출 합계
  const totalSales = pipelineStores.reduce(
    (sum, store) => sum + (getExpectedSales(store) || 0), 0
  );
  const totalCapex = pipelineStores.reduce(
    (sum, store) => sum + (store.financial?.investment || 0), 0
  );

  // ──────────────────────────────────────────────────────────
  // 렌더링
  // ──────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-auto bg-slate-50 p-2 min-h-0">
      <div className="w-full mx-auto space-y-4 pb-20 px-2">

        {/* ───── 필터 행 ───── */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-start mb-2">
          <div className="flex items-center space-x-2">
            <div className="flex items-center gap-2 flex-wrap">

              {/* 국가 다중 선택 드롭다운 */}
              <div className="relative">
                <button
                  onClick={() => setCountryOpen(!countryOpen)}
                  className="inline-flex items-center justify-between w-[140px] h-9 rounded-md border border-input bg-white px-3 py-2 text-sm font-normal hover:bg-accent hover:text-accent-foreground"
                >
                  <span className="truncate text-left">
                    {selectedCountry.length === 0
                      ? 'Country'
                      : selectedCountry.length === 1
                      ? selectedCountry[0]
                      : `${selectedCountry.length} selected`}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </button>
                {countryOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setCountryOpen(false)}
                    />
                    <div className="absolute top-full mt-1 left-0 z-50 bg-white border border-slate-200 rounded-md shadow-lg w-[200px] max-h-60 overflow-y-auto">
                      <div className="p-1">
                        <input
                          type="text"
                          placeholder="Search country..."
                          className="w-full px-3 py-2 text-sm border-b border-slate-100 outline-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                        {filterOptions.countries.map((country) => (
                          <div
                            key={country}
                            onClick={() => {
                              setSelectedCountry((prev) =>
                                prev.includes(country)
                                  ? prev.filter((c) => c !== country)
                                  : [...prev, country]
                              );
                            }}
                            className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 rounded-sm"
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                selectedCountry.includes(country)
                                  ? 'opacity-100 text-blue-600'
                                  : 'opacity-0'
                              }`}
                            />
                            {country}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* 도시 선택 */}
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="h-9 w-[140px] rounded-md border border-input bg-white px-3 py-2 text-sm outline-none cursor-pointer hover:bg-accent"
              >
                <option value="all">All Cities</option>
                {filterOptions.cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* 브랜드 선택 */}
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="h-9 w-[140px] rounded-md border border-input bg-white px-3 py-2 text-sm outline-none cursor-pointer hover:bg-accent"
              >
                <option value="all">All Brands</option>
                {filterOptions.brands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>

              {/* 상태 선택 */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-9 w-[140px] rounded-md border border-input bg-white px-3 py-2 text-sm outline-none cursor-pointer hover:bg-accent"
              >
                <option value="all">All Statuses</option>
                {filterOptions.statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* 채널 선택 */}
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="h-9 w-[140px] rounded-md border border-input bg-white px-3 py-2 text-sm outline-none cursor-pointer hover:bg-accent"
              >
                <option value="all">All Channels</option>
                {filterOptions.channels.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* 분석 연도 다중 선택 */}
              <div className="relative">
                <button
                  onClick={() => setYearOpen(!yearOpen)}
                  className="inline-flex items-center justify-between w-[160px] h-9 rounded-md border border-input bg-white px-3 py-2 text-sm font-normal hover:bg-accent"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Calendar className="h-3.5 w-3.5 shrink-0 opacity-50" />
                    <span className="truncate">
                      {selectedAnalysisYears.length === 0
                        ? 'Analysis Year'
                        : selectedAnalysisYears.length === 1
                        ? `${selectedAnalysisYears[0]}`
                        : `${selectedAnalysisYears.length} Years`}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </button>
                {yearOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setYearOpen(false)}
                    />
                    <div className="absolute top-full mt-1 left-0 z-50 bg-white border border-slate-200 rounded-md shadow-lg w-[160px] max-h-60 overflow-y-auto">
                      <div className="p-1">
                        {filterOptions.years.map((year) => (
                          <div
                            key={year}
                            onClick={() => {
                              setSelectedAnalysisYears((prev) =>
                                prev.includes(year)
                                  ? prev.filter((y) => y !== year)
                                  : [...prev, year].sort((a, b) => a - b)
                              );
                            }}
                            className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 rounded-sm"
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                selectedAnalysisYears.includes(year)
                                  ? 'opacity-100 text-blue-600'
                                  : 'opacity-0'
                              }`}
                            />
                            {year}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* 매장 분류 선택 */}
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="h-9 w-[150px] rounded-md border border-input bg-white px-3 py-2 text-sm outline-none cursor-pointer hover:bg-accent"
              >
                <option value="all">All Classes</option>
                <option value="Type-based">Type-based</option>
                <option value="Standalone">Standalone</option>
              </select>
            </div>

            {/* 필터 초기화 버튼 */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="h-9 w-9 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                title="Clear filters"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* 총 파이프라인 수 표시 */}
            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm ml-2">
              <span className="text-sm font-medium text-slate-500 mr-2">Total Pipelines:</span>
              <span className="text-lg font-bold text-blue-600">{pipelineStores.length}</span>
            </div>
          </div>
        </div>

        {/* ───── 파이프라인 테이블 ───── */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-base">
              {/* 테이블 헤더: 각 컬럼은 클릭으로 정렬 가능 */}
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <SortableHeader label="국가" sortKey="country" />
                  <SortableHeader label="도시" sortKey="city" />
                  <SortableHeader label="매장명" sortKey="name" />
                  <SortableHeader label="브랜드" sortKey="brand" />
                  <SortableHeader label="예상 오픈일" sortKey="openDate" />
                  <SortableHeader label="면적" sortKey="area" />
                  <SortableHeader label="채널" sortKey="channel" />
                  <SortableHeader label="Class" sortKey="status" />
                  <SortableHeader label="상태 (단계)" sortKey="status" />
                  <SortableHeader label="예상 월 매출액" sortKey="sales" align="right" />
                  <SortableHeader label="투자비" sortKey="capex" align="right" />
                  <SortableHeader label="예상 영업이익률" sortKey="margin" />
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {pipelineStores.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400">
                      No pipeline stores found.
                    </td>
                  </tr>
                ) : (
                  pipelineStores.map((store) => {
                    const expectedSales = getExpectedSales(store);
                    const capex = store.financial?.investment || 0;
                    const opm =
                      store.financial?.estimatedMargin ||
                      (store.financial as any)?.expectedOperatingProfitRatio ||
                      0;

                    return (
                      <tr
                        key={store.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        {/* 국가: 클릭 시 지도에서 해당 국가 필터 적용 */}
                        <td className="py-3 px-4 border-r border-slate-100 text-center text-slate-800 font-semibold">
                          <button
                            onClick={() => {
                              const region = countryToRegion(store.location.country);
                              if (region) onCountryClick?.(region);
                            }}
                            className="hover:underline hover:text-blue-600 focus:outline-none text-inherit font-inherit cursor-pointer"
                            title={`View ${store.location.country} on map`}
                          >
                            {store.location.country}
                          </button>
                        </td>

                        {/* 도시 */}
                        <td className="py-3 px-4 border-r border-slate-100 text-center text-slate-800 font-semibold">
                          {store.location.city}
                        </td>

                        {/* 매장명: 클릭 시 상세 패널 오픈 */}
                        <td className="py-3 px-4 border-r border-slate-100 text-center font-bold text-slate-900">
                          <button
                            onClick={() => onStoreClick?.(store)}
                            className="hover:underline hover:text-blue-600 focus:outline-none text-inherit font-inherit"
                          >
                            {store.name}
                          </button>
                        </td>

                        {/* 브랜드 */}
                        <td className="py-3 px-4 border-r border-slate-100 text-center text-slate-800 font-semibold">
                          {store.brand}
                        </td>

                        {/* 예상 오픈일 */}
                        <td className="py-3 px-4 border-r border-slate-100 text-center text-slate-800 font-semibold">
                          {store.openDate ||
                            (store as any).ChangOpenDate ||
                            store.contract?.startDate ||
                            '-'}
                        </td>

                        {/* 면적 */}
                        <td className="py-3 px-4 border-r border-slate-100 text-center text-slate-800 font-semibold">
                          {(store as any).size || store.area || '-'}
                        </td>

                        {/* 채널 (유통 방식) */}
                        <td className="py-3 px-4 border-r border-slate-100 text-center text-slate-800 font-semibold">
                          {store.type}
                        </td>

                        {/* 매장 분류 배지 */}
                        <td className="py-3 px-4 border-r border-slate-100 text-center">
                          {getStoreClass(store.type) ? (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                getStoreClass(store.type) === 'Type-based'
                                  ? 'bg-violet-100 text-violet-700'
                                  : 'bg-teal-100 text-teal-700'
                              }`}
                            >
                              {getStoreClass(store.type)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>

                        {/* 파이프라인 상태 배지 */}
                        <td className="py-3 px-4 border-r border-slate-100 text-center">
                          <span
                            className={`
                              inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold
                              ${
                                store.status === 'Open'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : store.status === 'Construction' || store.status === 'Space'
                                  ? 'bg-blue-100 text-blue-800'
                                  : store.status === 'Signed' || store.status === 'Contract'
                                  ? 'bg-pink-100 text-pink-800'
                                  : store.status === 'Confirmed' || store.status === 'Confirm'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : store.status === 'Reject'
                                  ? 'bg-red-100 text-red-800'
                                  : store.status === 'Pending'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-slate-100 text-slate-800'
                              }
                            `}
                          >
                            {store.status}
                          </span>
                        </td>

                        {/* 예상 월 매출액 */}
                        <td className="py-3 px-4 border-r border-slate-100 text-right text-slate-800 font-mono font-semibold">
                          {formatCurrencyWithUnit(expectedSales)}
                        </td>

                        {/* 투자비 */}
                        <td className="py-3 px-4 border-r border-slate-100 text-right text-slate-800 font-mono font-semibold">
                          {formatCurrencyWithUnit(capex)}
                        </td>

                        {/* 예상 영업이익률 */}
                        <td className="py-3 px-4 text-center text-slate-800 font-semibold">
                          {opm > 0 ? `${opm}%` : '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* 합계 행 */}
              {pipelineStores.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold">
                    <td
                      colSpan={9}
                      className="py-3 px-4 text-right text-slate-500 font-semibold text-sm"
                    >
                      합계 ({pipelineStores.length}개 매장)
                    </td>
                    <td className="py-3 px-4 border-r border-slate-200 text-right text-blue-700 font-mono font-bold">
                      {formatCurrencyWithUnit(totalSales)}
                    </td>
                    <td className="py-3 px-4 border-r border-slate-200 text-right text-blue-700 font-mono font-bold">
                      {formatCurrencyWithUnit(totalCapex)}
                    </td>
                    <td className="py-3 px-4" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
