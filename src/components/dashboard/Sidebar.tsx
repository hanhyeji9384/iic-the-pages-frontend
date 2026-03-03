// ============================================================
// Sidebar 컴포넌트
// 지도 뷰의 왼쪽 사이드바입니다.
// 매장 검색, 필터(상태/브랜드/채널/국가/분류), 매장 목록을 제공합니다.
// ============================================================

import React, { useState } from "react";
import { Store, FilterState, getStoreClass } from "../../types";
import { StoreCard } from "./StoreCard";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../ui/accordion";
import { Button } from "../ui/button";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Filter,
  MapPin,
  Store as StoreIcon,
  Check,
  RotateCcw,
  CheckSquare,
  Home,
  Tag,
  Shapes,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../ui/collapsible";
import { Separator } from "../ui/separator";
import { toast } from "sonner";
import { dataClient } from "../../utils/dataClient";
import { BrandDefinition } from "../../types";

// 사이드바가 받는 속성(props) 정의
interface SidebarProps {
  stores: Store[];                                     // 전체 매장 목록
  filters: FilterState;                                // 현재 적용된 필터 상태
  onSearch: (query: string) => void;                   // 검색어 변경 시 실행
  searchQuery?: string;                                // 현재 검색어
  onFilterChange: (filters: FilterState) => void;      // 필터 변경 시 실행
  onStoreClick: (store: Store) => void;                // 매장 카드 클릭 시 실행
  iicCount: number;                                    // IIC 매장 수
  compCount: number;                                   // 경쟁사 매장 수
  onRefreshData?: () => void;                          // 데이터 새로고침 콜백
  competitorBrandsList?: BrandDefinition[];            // 경쟁사 브랜드 목록
  preferredBrandsList?: BrandDefinition[];             // 선호 브랜드 목록
}

/**
 * 지도 뷰 왼쪽 사이드바
 * 매장 검색, 다중 필터, 매장 카드 목록을 제공합니다.
 */
export function Sidebar({
  stores,
  filters,
  onSearch,
  searchQuery = "",
  onFilterChange,
  onStoreClick,
  iicCount,
  compCount,
  onRefreshData,
  competitorBrandsList = [],
  preferredBrandsList = [],
}: SidebarProps) {
  // 아코디언 및 필터 섹션 펼침/접힘 상태들
  const [activeTab, setActiveTab] = useState("iic");
  const [isStatusExpanded, setIsStatusExpanded] = useState(false);
  const [isBrandExpanded, setIsBrandExpanded] = useState(false);
  const [isChannelExpanded, setIsChannelExpanded] = useState(false);
  const [isClassExpanded, setIsClassExpanded] = useState(false);
  const [isCountryExpanded, setIsCountryExpanded] = useState(false);
  const [isCompetitorBrandExpanded, setIsCompetitorBrandExpanded] = useState(false);
  const [isPreferredBrandExpanded, setIsPreferredBrandExpanded] = useState(false);
  const [isSmartGlassExpanded, setIsSmartGlassExpanded] = useState(false);

  // 아코디언 현재 열린 항목 상태
  const [accordionValue, setAccordionValue] = useState<string | undefined>("iic");

  // 활성화된 필터가 있으면 해당 섹션을 자동으로 펼침
  React.useEffect(() => {
    let shouldExpandIIC = false;
    if (
      filters.status &&
      filters.status.length > 0 &&
      filters.status.length < (statusList?.length || 5)
    ) {
      setIsStatusExpanded(true);
      shouldExpandIIC = true;
    }
    if (
      filters.brand &&
      filters.brand.length > 0 &&
      filters.brand.length < (brandsList?.length || 5)
    ) {
      setIsBrandExpanded(true);
      shouldExpandIIC = true;
    }
    if (
      filters.channel &&
      filters.channel.length > 0 &&
      filters.channel.length < (channelsList?.length || 7)
    ) {
      setIsChannelExpanded(true);
      shouldExpandIIC = true;
    }
    if (
      filters.storeClass &&
      filters.storeClass.length > 0 &&
      filters.storeClass.length < (classesList?.length || 2)
    ) {
      setIsClassExpanded(true);
      shouldExpandIIC = true;
    }
    if (
      filters.country &&
      filters.country.length > 0 &&
      filters.country.length < (regionsList?.length || 8)
    ) {
      setIsCountryExpanded(true);
      shouldExpandIIC = true;
    }

    if (shouldExpandIIC) {
      setAccordionValue("iic");
    }

    if (filters.competitorBrands && filters.competitorBrands.length > 0) {
      setIsCompetitorBrandExpanded(true);
    }
    if (filters.preferredBrands && filters.preferredBrands.length > 0) {
      setIsPreferredBrandExpanded(true);
    }
    if (filters.smartGlass && filters.smartGlass.length > 0) {
      setIsSmartGlassExpanded(true);
    }
  }, [filters]);

  // 파이프라인 상태 목록
  const statusList = [
    { key: "Open", label: "Open" },
    { key: "Construction", label: "Construction" },
    { key: "Signed", label: "Signed" },
    { key: "Confirmed", label: "Confirmed" },
    { key: "Planned", label: "Planned" },
  ];

  // IIC 브랜드 목록
  const brandsList = [
    "Gentle Monster",
    "Tamburins",
    "Nudake",
    "Atiissu",
    "Nuflaat",
  ];

  // 채널(유통 형태) 목록
  const channelsList = [
    "FS",
    "Department Store",
    "Mall",
    "Duty Free",
    "Premium Outlet",
    "Pop-up",
    "Haus",
  ];

  // 매장 분류 목록
  const classesList = ["Type-based", "Standalone"];

  // 지역/국가 목록 (키워드 배열로 매장 위치 매칭)
  const regionsList = [
    {
      label: "한국",
      keywords: ["South Korea", "Korea", "Seoul", "Busan"],
    },
    {
      label: "일본",
      keywords: ["Japan", "Tokyo", "Osaka", "Kyoto"],
    },
    {
      label: "중국",
      keywords: [
        "China",
        "Hong Kong",
        "Taiwan",
        "Macau",
        "Shanghai",
        "Beijing",
      ],
    },
    {
      label: "동남아",
      keywords: [
        "Singapore",
        "Thailand",
        "Vietnam",
        "Malaysia",
        "Indonesia",
        "Philippines",
      ],
    },
    {
      label: "미주",
      keywords: [
        "USA",
        "Canada",
        "Mexico",
        "United States",
        "America",
      ],
    },
    {
      label: "유럽",
      keywords: [
        "UK",
        "France",
        "Germany",
        "Italy",
        "Spain",
        "Europe",
        "United Kingdom",
        "London",
        "Paris",
        "Berlin",
      ],
    },
    {
      label: "중동",
      keywords: ["UAE", "Saudi Arabia", "Dubai", "Middle East"],
    },
    { label: "호주", keywords: ["Australia", "New Zealand"] },
    {
      label: "기타",
      keywords: [
        "Other",
        "India",
        "Brazil",
        "Argentina",
        "South Africa",
        "Russia",
        "Unknown",
      ],
    },
  ];

  // 스마트 글라스 브랜드 목록
  const smartGlassBrandsList = [
    "Meta",
    "XREAL",
    "Rokid",
    "TCL RayNeo",
    "Vuzix",
  ];

  // 데이터 레이어 목록 (지도 오버레이)
  const dataLayersList = ["Pipeline", "Traffic Heatmap"];

  // --- 관계형 필터 로직 ---

  // IIC 브랜드명 소문자 목록
  const iicBrandsNormalized = brandsList.map((b) => b.toLowerCase());

  // 매장이 상태 필터에 해당하는지 확인 (구 상태명 → 신 상태명 호환)
  const matchesStatus = (s: Store, statusFilters: string[]) => {
    if (!statusFilters || statusFilters.length === 0) return true;

    const normalized =
      s.status === "Space"
        ? "Construction"
        : s.status === "Contract"
          ? "Signed"
          : s.status === "Confirm"
            ? "Confirmed"
            : s.status === "Plan"
              ? "Planned"
              : s.status;

    return (
      statusFilters.includes(normalized) ||
      statusFilters.includes(s.status)
    );
  };

  // 매장이 브랜드 필터에 해당하는지 확인
  const matchesBrand = (s: Store, brandFilters: string[]) => {
    if (!brandFilters || brandFilters.length === 0) return true;
    return (
      s.brand &&
      brandFilters
        .map((b) => b.toLowerCase())
        .includes(s.brand.toLowerCase())
    );
  };

  // 매장이 채널 필터에 해당하는지 확인
  const matchesChannel = (s: Store, channelFilters: string[]) => {
    if (!channelFilters || channelFilters.length === 0) return true;
    return s.type && channelFilters.includes(s.type);
  };

  // 매장이 지역 필터에 해당하는지 확인 (도시명/국가명 키워드 매칭)
  const matchesCountry = (s: Store, countryFilters: string[]) => {
    if (!countryFilters || countryFilters.length === 0) return true;
    const country = s.location.country ? s.location.country.toLowerCase() : "";
    const city = s.location.city ? s.location.city.toLowerCase() : "";
    return countryFilters.some((regionLabel) => {
      const region = regionsList.find((r) => r.label === regionLabel);
      return region
        ? region.keywords.some(
            (k) =>
              country.includes(k.toLowerCase()) ||
              city.includes(k.toLowerCase()),
          )
        : false;
    });
  };

  // 매장이 IIC 브랜드인지 확인
  const isIICStore = (s: Store) => {
    return (
      s.brand &&
      iicBrandsNormalized.includes(s.brand.toLowerCase())
    );
  };

  // 상태별 매장 수 계산 (다른 필터 조건 적용 후)
  const countByStatus = (dataStatuses: string[]) =>
    stores.filter(
      (s) =>
        isIICStore(s) &&
        dataStatuses.includes(s.status) &&
        matchesBrand(s, filters.brand || []) &&
        matchesChannel(s, filters.channel || []) &&
        matchesCountry(s, filters.country || []),
    ).length;

  const statusCounts = {
    Open: countByStatus(["Open"]),
    Construction: countByStatus(["Space", "Construction"]),
    Signed: countByStatus(["Contract", "Signed"]),
    Confirmed: countByStatus(["Confirm", "Confirmed"]),
    Planned: countByStatus(["Plan", "Planned"]),
  };

  // 브랜드별 매장 수 계산
  const getBrandCount = (brandName: string) => {
    return stores.filter(
      (s) =>
        isIICStore(s) &&
        s.brand &&
        s.brand.toLowerCase() === brandName.toLowerCase() &&
        matchesStatus(s, filters.status || []) &&
        matchesChannel(s, filters.channel || []) &&
        matchesCountry(s, filters.country || []),
    ).length;
  };

  // 채널별 매장 수 계산
  const getChannelCount = (channelName: string) => {
    return stores.filter(
      (s) =>
        isIICStore(s) &&
        s.type &&
        s.type === channelName &&
        matchesStatus(s, filters.status || []) &&
        matchesBrand(s, filters.brand || []) &&
        matchesCountry(s, filters.country || []),
    ).length;
  };

  // 매장 분류별 수 계산
  const getClassCount = (className: string) => {
    return stores.filter(
      (s) =>
        isIICStore(s) &&
        getStoreClass(s.type) === className &&
        matchesStatus(s, filters.status || []) &&
        matchesBrand(s, filters.brand || []) &&
        matchesChannel(s, filters.channel || []) &&
        matchesCountry(s, filters.country || []),
    ).length;
  };

  // 지역별 매장 수 계산
  const getRegionCount = (regionLabel: string) => {
    return stores.filter((s) => {
      if (!isIICStore(s)) return false;
      const country = s.location.country ? s.location.country.toLowerCase() : "";
      const city = s.location.city ? s.location.city.toLowerCase() : "";
      const region = regionsList.find((r) => r.label === regionLabel);
      const matchesThisRegion = region
        ? region.keywords.some(
            (k) =>
              country.includes(k.toLowerCase()) ||
              city.includes(k.toLowerCase()),
          )
        : false;

      return (
        matchesThisRegion &&
        matchesStatus(s, filters.status || []) &&
        matchesBrand(s, filters.brand || []) &&
        matchesChannel(s, filters.channel || [])
      );
    }).length;
  };

  // 경쟁사/선호/스마트글라스 브랜드별 매장 수 계산
  const getCompetitorBrandCount = (brandName: string) => {
    return (stores || []).filter(
      (s) =>
        s.brand &&
        s.brand.toLowerCase() === brandName.toLowerCase(),
    ).length;
  };
  const getPreferredBrandCount = (brandName: string) => {
    return (stores || []).filter(
      (s) =>
        s.brand &&
        s.brand.toLowerCase() === brandName.toLowerCase(),
    ).length;
  };
  const getSmartGlassCount = (brandName: string) => {
    return (stores || []).filter(
      (s) =>
        s.brand &&
        s.brand.toLowerCase() === brandName.toLowerCase(),
    ).length;
  };

  // 특정 필터 항목이 선택되어 있는지 확인
  const isSelected = (category: keyof FilterState, value: string) => {
    return (filters[category] || []).includes(value);
  };

  // 필터 항목을 선택/해제하는 함수
  const toggleFilter = (category: keyof FilterState, value: string) => {
    const current = filters[category] || [];
    const updated = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    onFilterChange({ ...filters, [category]: updated });
  };

  // 전체 선택 / 전체 해제 토글 액션 생성
  const getToggleAction = (category: keyof FilterState, allValues: string[]) => {
    const current = filters[category] || [];
    const isFull =
      current.length === allValues.length &&
      allValues.length > 0;

    return {
      label: isFull ? "해제" : "전체",
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onFilterChange({
          ...filters,
          [category]: isFull ? [] : allValues,
        });
      },
    };
  };

  // 모든 필터를 초기값으로 리셋하는 함수
  const handleResetFilters = () => {
    onFilterChange({
      status: statusList.map((s) => s.key),
      brand: brandsList,
      channel: channelsList,
      storeClass: classesList,
      country: regionsList.map((r) => r.label),
      competitorBrands: [],
      preferredBrands: [],
      smartGlass: [],
      dataLayers: [],
    });
  };

  // 데이터를 초기화하고 샘플 데이터로 복원하는 함수
  const handleResetData = async () => {
    if (
      confirm(
        "모든 데이터를 초기화하고 최신 샘플 데이터로 복원하시겠습니까? (추가하신 데이터는 삭제됩니다)",
      )
    ) {
      try {
        await dataClient.seed(true);
        if (onRefreshData) onRefreshData();
        toast.success("데이터가 초기화되었습니다.");
      } catch (e) {
        toast.error("데이터 초기화 실패");
      }
    }
  };

  // IIC 브랜드 집합 (소문자)
  const iicBrandsSet = new Set(brandsList.map((b) => b.toLowerCase()));

  // 필터를 적용한 IIC 매장 목록 계산
  let filteredIICStores = stores.filter(
    (s) => s.brand && iicBrandsSet.has(s.brand.toLowerCase()),
  );

  // 상태 필터 적용
  if (filters.status && filters.status.length > 0) {
    filteredIICStores = filteredIICStores.filter((s) =>
      matchesStatus(s, filters.status!),
    );
  }

  // 브랜드 필터 적용
  if (filters.brand && filters.brand.length > 0) {
    filteredIICStores = filteredIICStores.filter(
      (s) => s.brand && filters.brand!.includes(s.brand),
    );
  }

  // 채널 필터 적용
  if (filters.channel && filters.channel.length > 0) {
    filteredIICStores = filteredIICStores.filter(
      (s) => s.type && filters.channel!.includes(s.type),
    );
  }

  // 매장 분류 필터 적용
  if (filters.storeClass && filters.storeClass.length > 0) {
    filteredIICStores = filteredIICStores.filter((s) => {
      const cls = getStoreClass(s.type);
      return cls && filters.storeClass!.includes(cls);
    });
  }

  // 지역/국가 필터 적용
  if (filters.country && filters.country.length > 0) {
    filteredIICStores = filteredIICStores.filter((s) => {
      const country = s.location.country ? s.location.country.toLowerCase() : "";
      const city = s.location.city ? s.location.city.toLowerCase() : "";
      return filters.country!.some((regionLabel) => {
        const region = regionsList.find((r) => r.label === regionLabel);
        return region
          ? region.keywords.some(
              (k) =>
                country.includes(k.toLowerCase()) ||
                city.includes(k.toLowerCase()),
            )
          : false;
      });
    });
  }

  // 경쟁사/선호 브랜드 필터 적용한 매장 목록
  const competitorStores = stores.filter(
    (s) =>
      s.brandCategory === "competitor" &&
      (filters.competitorBrands || []).includes(s.brand),
  );
  const preferredStores = stores.filter(
    (s) =>
      s.brandCategory === "preferred" &&
      (filters.preferredBrands || []).includes(s.brand),
  );

  // 선택된 타 브랜드 총 수 (배지에 표시)
  const otherBrandsCount =
    (filters.competitorBrands?.length || 0) +
    (filters.preferredBrands?.length || 0) +
    (filters.smartGlass?.length || 0);

  return (
    <div className="w-[325px] bg-white border-r flex flex-col h-full shadow-lg relative z-10">
      {/* 검색 헤더 */}
      <div className="p-4 border-b space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search stores, brands..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>

      {/* 필터 아코디언 + 매장 목록 */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          {/* 필터 영역: 최대 높이 40%로 제한하여 매장 목록 공간 확보 */}
          <div className="p-4 pb-0 overflow-y-auto max-h-[40%] shrink-0 border-b border-gray-50">
            <Accordion
              type="single"
              collapsible
              value={accordionValue}
              onValueChange={setAccordionValue}
              className="w-full border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white"
            >
              {/* PIPE-LINE 필터 섹션 (IIC 매장용) */}
              <AccordionItem
                value="iic"
                className="border-b border-gray-100 last:border-0"
              >
                <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline border-b border-gray-100">
                  <div className="flex items-center font-bold uppercase tracking-wide text-gray-900 text-[12.5px]">
                    <span className="text-blue-600 mr-2">
                      <CheckSquare className="w-5 h-5" />
                    </span>
                    PIPE-LINE
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-0">
                  <div className="px-4 py-2 bg-white space-y-1">
                    {/* 브랜드 필터 */}
                    <div className="py-2 border-b border-gray-100">
                      <div
                        className="flex justify-between items-center cursor-pointer group mb-2"
                        onClick={() => setIsBrandExpanded(!isBrandExpanded)}
                      >
                        <span className="text-gray-700 font-medium text-[12.5px]">
                          Brand ({(filters.brand || []).length}/
                          {brandsList.length})
                        </span>
                        <div className="flex items-center space-x-1">
                          <span
                            className="text-[10.5px] text-blue-600 font-medium hover:underline cursor-pointer"
                            onClick={getToggleAction("brand", brandsList).onClick}
                          >
                            {getToggleAction("brand", brandsList).label}
                          </span>
                          {isBrandExpanded ? (
                            <ChevronUp className="w-3 h-3 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {isBrandExpanded && (
                        <div className="space-y-1 pl-0">
                          {brandsList.map((brand) => {
                            const count = getBrandCount(brand);
                            if (count === 0) return null;

                            const checked = isSelected("brand", brand);
                            return (
                              <div
                                key={brand}
                                className="flex items-center justify-between py-1.5 group cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1"
                                onClick={() => toggleFilter("brand", brand)}
                              >
                                <div className="flex items-center space-x-2.5">
                                  <div
                                    className={`w-4 h-4 rounded-[4px] flex items-center justify-center transition-colors ${checked ? "bg-slate-900 group-hover:bg-slate-800" : "bg-gray-200 group-hover:bg-gray-300"}`}
                                  >
                                    {checked && (
                                      <Check className="w-3 h-3 text-white stroke-[3px]" />
                                    )}
                                  </div>
                                  <span className="text-gray-600 text-[12.5px] font-medium">
                                    {brand}
                                  </span>
                                </div>
                                <span className="text-gray-400 text-[12.5px] font-normal">
                                  {count.toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 상태(Status) 필터 */}
                    <div className="py-2 border-b border-gray-100">
                      <div
                        className="flex justify-between items-center cursor-pointer group mb-2"
                        onClick={() => setIsStatusExpanded(!isStatusExpanded)}
                      >
                        <span className="text-gray-700 font-medium text-[12.5px]">
                          Status (
                          {(filters.status || []).length}/
                          {statusList.length})
                        </span>
                        <div className="flex items-center space-x-1">
                          <span
                            className="text-[10.5px] text-blue-600 font-medium hover:underline cursor-pointer"
                            onClick={
                              getToggleAction(
                                "status",
                                statusList.map((s) => s.key),
                              ).onClick
                            }
                          >
                            {
                              getToggleAction(
                                "status",
                                statusList.map((s) => s.key),
                              ).label
                            }
                          </span>
                          {isStatusExpanded ? (
                            <ChevronUp className="w-3 h-3 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {isStatusExpanded && (
                        <div className="space-y-1 pl-0">
                          {statusList.map((status) => {
                            const count =
                              statusCounts[
                                status.key as keyof typeof statusCounts
                              ] || 0;
                            if (count === 0) return null;

                            const checked = isSelected("status", status.key);
                            return (
                              <div
                                key={status.key}
                                className="flex items-center justify-between py-1.5 group cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1"
                                onClick={() => toggleFilter("status", status.key)}
                              >
                                <div className="flex items-center space-x-2.5">
                                  <div
                                    className={`w-4 h-4 rounded-[4px] flex items-center justify-center transition-colors ${checked ? "bg-slate-900 group-hover:bg-slate-800" : "bg-gray-200 group-hover:bg-gray-300"}`}
                                  >
                                    {checked && (
                                      <Check className="w-3 h-3 text-white stroke-[3px]" />
                                    )}
                                  </div>
                                  <span className="text-gray-600 text-[12.5px] font-medium">
                                    {status.label}
                                  </span>
                                </div>
                                <span className="text-gray-400 text-[12.5px] font-normal">
                                  {count.toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 지역/국가 필터 */}
                    <div className="py-2 border-b border-gray-100">
                      <div
                        className="flex justify-between items-center cursor-pointer group mb-2"
                        onClick={() => setIsCountryExpanded(!isCountryExpanded)}
                      >
                        <span className="text-gray-700 font-medium text-[12.5px]">
                          Country (
                          {(filters.country || []).length}/
                          {regionsList.length})
                        </span>
                        <div className="flex items-center space-x-1">
                          <span
                            className="text-[10.5px] text-blue-600 font-medium hover:underline cursor-pointer"
                            onClick={
                              getToggleAction(
                                "country",
                                regionsList.map((r) => r.label),
                              ).onClick
                            }
                          >
                            {
                              getToggleAction(
                                "country",
                                regionsList.map((r) => r.label),
                              ).label
                            }
                          </span>
                          {isCountryExpanded ? (
                            <ChevronUp className="w-3 h-3 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {isCountryExpanded && (
                        <div className="space-y-1 pl-0">
                          {regionsList.map((region) => {
                            const count = getRegionCount(region.label);
                            if (count === 0) return null;

                            const checked = isSelected("country", region.label);
                            return (
                              <div
                                key={region.label}
                                className="flex items-center justify-between py-1.5 group cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1"
                                onClick={() => toggleFilter("country", region.label)}
                              >
                                <div className="flex items-center space-x-2.5">
                                  <div
                                    className={`w-4 h-4 rounded-[4px] flex items-center justify-center transition-colors ${checked ? "bg-slate-900 group-hover:bg-slate-800" : "bg-gray-200 group-hover:bg-gray-300"}`}
                                  >
                                    {checked && (
                                      <Check className="w-3 h-3 text-white stroke-[3px]" />
                                    )}
                                  </div>
                                  <span className="text-gray-600 text-[12.5px] font-medium">
                                    {region.label}
                                  </span>
                                </div>
                                <span className="text-gray-400 text-[12.5px] font-normal">
                                  {count.toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 채널 필터 */}
                    <div className="py-2">
                      <div
                        className="flex justify-between items-center cursor-pointer group mb-2"
                        onClick={() => setIsChannelExpanded(!isChannelExpanded)}
                      >
                        <span className="text-gray-700 font-medium text-[12.5px]">
                          Channel (
                          {(filters.channel || []).length}/
                          {channelsList.length})
                        </span>
                        <div className="flex items-center space-x-1">
                          <span
                            className="text-[10.5px] text-blue-600 font-medium hover:underline cursor-pointer"
                            onClick={getToggleAction("channel", channelsList).onClick}
                          >
                            {getToggleAction("channel", channelsList).label}
                          </span>
                          {isChannelExpanded ? (
                            <ChevronUp className="w-3 h-3 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {isChannelExpanded && (
                        <div className="space-y-1 pl-0">
                          {channelsList.map((channel) => {
                            const count = getChannelCount(channel);
                            if (count === 0) return null;

                            const checked = isSelected("channel", channel);
                            return (
                              <div
                                key={channel}
                                className="flex items-center justify-between py-1.5 group cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1"
                                onClick={() => toggleFilter("channel", channel)}
                              >
                                <div className="flex items-center space-x-2.5">
                                  <div
                                    className={`w-4 h-4 rounded-[4px] flex items-center justify-center transition-colors ${checked ? "bg-slate-900 group-hover:bg-slate-800" : "bg-gray-200 group-hover:bg-gray-300"}`}
                                  >
                                    {checked && (
                                      <Check className="w-3 h-3 text-white stroke-[3px]" />
                                    )}
                                  </div>
                                  <span className="text-gray-600 text-[12.5px] font-medium">
                                    {channel}
                                  </span>
                                </div>
                                <span className="text-gray-400 text-[12.5px] font-normal">
                                  {count.toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 매장 분류(Class) 필터 */}
                    <div className="mt-3">
                      <div
                        className="flex justify-between items-center cursor-pointer group mb-2"
                        onClick={() => setIsClassExpanded(!isClassExpanded)}
                      >
                        <span className="text-gray-700 font-medium text-[12.5px]">
                          Class (
                          {(filters.storeClass || []).length}/
                          {classesList.length})
                        </span>
                        <div className="flex items-center space-x-1">
                          <span
                            className="text-[10.5px] text-blue-600 font-medium hover:underline cursor-pointer"
                            onClick={getToggleAction("storeClass", classesList).onClick}
                          >
                            {getToggleAction("storeClass", classesList).label}
                          </span>
                          {isClassExpanded ? (
                            <ChevronUp className="w-3 h-3 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {isClassExpanded && (
                        <div className="space-y-1 pl-0">
                          {classesList.map((cls) => {
                            const count = getClassCount(cls);
                            if (count === 0) return null;

                            const checked = isSelected("storeClass", cls);
                            return (
                              <div
                                key={cls}
                                className="flex items-center justify-between py-1.5 group cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1"
                                onClick={() => toggleFilter("storeClass", cls)}
                              >
                                <div className="flex items-center space-x-2.5">
                                  <div
                                    className={`w-4 h-4 rounded-[4px] flex items-center justify-center transition-colors ${checked ? "bg-slate-900 group-hover:bg-slate-800" : "bg-gray-200 group-hover:bg-gray-300"}`}
                                  >
                                    {checked && (
                                      <Check className="w-3 h-3 text-white stroke-[3px]" />
                                    )}
                                  </div>
                                  <span
                                    className={`text-[12.5px] font-medium ${cls === "Type-based" ? "text-violet-600" : "text-teal-600"}`}
                                  >
                                    {cls}
                                  </span>
                                </div>
                                <span className="text-gray-400 text-[12.5px] font-normal">
                                  {count.toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Other Brands 필터 섹션 (경쟁사/선호/스마트글라스) */}
              <AccordionItem
                value="brands"
                className="border-b border-gray-100 last:border-0"
              >
                <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline border-b border-gray-100">
                  <div className="flex items-center font-bold text-gray-700 w-full text-[12.5px]">
                    <Filter className="w-5 h-5 mr-2 text-gray-500" />
                    Other Brands
                    {otherBrandsCount > 0 && (
                      <span className="ml-2 bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 text-[10.5px] font-semibold">
                        {otherBrandsCount}
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-0 overflow-visible">
                  <div className="px-4 py-2 bg-white space-y-1">
                    {/* 경쟁사 브랜드 필터 */}
                    <div className="py-2 border-b border-gray-100">
                      <Collapsible
                        open={isCompetitorBrandExpanded}
                        onOpenChange={setIsCompetitorBrandExpanded}
                      >
                        <div className="flex justify-between items-center group mb-2">
                          <CollapsibleTrigger asChild>
                            <div className="flex-1 flex justify-between items-center cursor-pointer">
                              <span className="text-gray-700 font-medium text-[12.5px]">
                                Competitors (
                                {(filters.competitorBrands || []).length}
                                /{competitorBrandsList.length})
                              </span>
                            </div>
                          </CollapsibleTrigger>
                          <div className="flex items-center space-x-1">
                            <span
                              className="text-[10.5px] text-blue-600 font-medium hover:underline cursor-pointer"
                              onClick={
                                getToggleAction(
                                  "competitorBrands",
                                  competitorBrandsList.map((b) => b.name),
                                ).onClick
                              }
                            >
                              {
                                getToggleAction(
                                  "competitorBrands",
                                  competitorBrandsList.map((b) => b.name),
                                ).label
                              }
                            </span>
                            <CollapsibleTrigger asChild>
                              <div className="cursor-pointer p-1">
                                {isCompetitorBrandExpanded ? (
                                  <ChevronUp className="w-3 h-3 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 text-gray-400" />
                                )}
                              </div>
                            </CollapsibleTrigger>
                          </div>
                        </div>

                        <CollapsibleContent>
                          <div className="space-y-1 pl-0 pb-2">
                            {competitorBrandsList.map((brandDef) => {
                              const brand = brandDef.name;
                              const count = getCompetitorBrandCount(brand);
                              // 추가한 브랜드는 count가 0이어도 표시

                              const checked = isSelected("competitorBrands", brand);
                              return (
                                <div
                                  key={brand}
                                  className="flex items-center justify-between py-1.5 group cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1"
                                  onClick={() => toggleFilter("competitorBrands", brand)}
                                >
                                  <div className="flex items-center space-x-2.5">
                                    <div
                                      className={`w-4 h-4 rounded-[4px] flex items-center justify-center transition-colors ${checked ? "bg-slate-900 group-hover:bg-slate-800" : "bg-gray-200 group-hover:bg-gray-300"}`}
                                    >
                                      {checked && (
                                        <Check className="w-3 h-3 text-white stroke-[3px]" />
                                      )}
                                    </div>
                                    {brandDef.logo && (
                                      <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                                        <img
                                          src={brandDef.logo}
                                          alt={brand}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    )}
                                    <span className="text-gray-600 text-[12.5px] font-medium truncate max-w-[150px]">
                                      {brand}
                                    </span>
                                  </div>
                                  <span className="text-gray-400 text-[12.5px] font-normal">
                                    {count.toLocaleString()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>

                    {/* 선호 브랜드 필터 */}
                    <div className="py-2 border-b border-gray-100">
                      <Collapsible
                        open={isPreferredBrandExpanded}
                        onOpenChange={setIsPreferredBrandExpanded}
                      >
                        <div className="flex justify-between items-center group mb-2">
                          <CollapsibleTrigger asChild>
                            <div className="flex-1 flex justify-between items-center cursor-pointer">
                              <span className="text-gray-700 font-medium text-[12.5px]">
                                Preferred (
                                {(filters.preferredBrands || []).length}
                                /{preferredBrandsList.length})
                              </span>
                            </div>
                          </CollapsibleTrigger>
                          <div className="flex items-center space-x-1">
                            <span
                              className="text-[10.5px] text-blue-600 font-medium hover:underline cursor-pointer"
                              onClick={
                                getToggleAction(
                                  "preferredBrands",
                                  preferredBrandsList.map((b) => b.name),
                                ).onClick
                              }
                            >
                              {
                                getToggleAction(
                                  "preferredBrands",
                                  preferredBrandsList.map((b) => b.name),
                                ).label
                              }
                            </span>
                            <CollapsibleTrigger asChild>
                              <div className="cursor-pointer p-1">
                                {isPreferredBrandExpanded ? (
                                  <ChevronUp className="w-3 h-3 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 text-gray-400" />
                                )}
                              </div>
                            </CollapsibleTrigger>
                          </div>
                        </div>

                        <CollapsibleContent>
                          <div className="space-y-1 pl-0 pb-2">
                            {preferredBrandsList.map((brandDef) => {
                              const brand = brandDef.name;
                              const count = getPreferredBrandCount(brand);
                              // 추가한 브랜드는 count가 0이어도 표시

                              const checked = isSelected("preferredBrands", brand);
                              return (
                                <div
                                  key={brand}
                                  className="flex items-center justify-between py-1.5 group cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1"
                                  onClick={() => toggleFilter("preferredBrands", brand)}
                                >
                                  <div className="flex items-center space-x-2.5">
                                    <div
                                      className={`w-4 h-4 rounded-[4px] flex items-center justify-center transition-colors ${checked ? "bg-slate-900 group-hover:bg-slate-800" : "bg-gray-200 group-hover:bg-gray-300"}`}
                                    >
                                      {checked && (
                                        <Check className="w-3 h-3 text-white stroke-[3px]" />
                                      )}
                                    </div>
                                    {brandDef.logo && (
                                      <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                                        <img
                                          src={brandDef.logo}
                                          alt={brand}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    )}
                                    <span className="text-gray-600 text-[12.5px] font-medium truncate max-w-[150px]">
                                      {brand}
                                    </span>
                                  </div>
                                  <span className="text-gray-400 text-[12.5px] font-normal">
                                    {count.toLocaleString()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>

                    {/* 스마트 글라스 브랜드 필터 */}
                    <div className="py-2">
                      <Collapsible
                        open={isSmartGlassExpanded}
                        onOpenChange={setIsSmartGlassExpanded}
                      >
                        <div className="flex justify-between items-center group mb-2">
                          <CollapsibleTrigger asChild>
                            <div className="flex-1 flex justify-between items-center cursor-pointer">
                              <span className="text-gray-700 font-medium text-[12.5px]">
                                SMART GLASS (
                                {(filters.smartGlass || []).length}
                                /{smartGlassBrandsList.length})
                              </span>
                            </div>
                          </CollapsibleTrigger>
                          <div className="flex items-center space-x-1">
                            <span
                              className="text-[10.5px] text-blue-600 font-medium hover:underline cursor-pointer"
                              onClick={
                                getToggleAction("smartGlass", smartGlassBrandsList).onClick
                              }
                            >
                              {getToggleAction("smartGlass", smartGlassBrandsList).label}
                            </span>
                            <CollapsibleTrigger asChild>
                              <div className="cursor-pointer p-1">
                                {isSmartGlassExpanded ? (
                                  <ChevronUp className="w-3 h-3 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 text-gray-400" />
                                )}
                              </div>
                            </CollapsibleTrigger>
                          </div>
                        </div>

                        <CollapsibleContent>
                          <div className="space-y-1 pl-0 pb-2">
                            {smartGlassBrandsList.map((brand) => {
                              const count = getSmartGlassCount(brand);
                              if (
                                count === 0 &&
                                !isSelected("smartGlass", brand)
                              )
                                return null;

                              const checked = isSelected("smartGlass", brand);
                              return (
                                <div
                                  key={brand}
                                  className="flex items-center justify-between py-1.5 group cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1"
                                  onClick={() => toggleFilter("smartGlass", brand)}
                                >
                                  <div className="flex items-center space-x-2.5">
                                    <div
                                      className={`w-4 h-4 rounded-[4px] flex items-center justify-center transition-colors ${checked ? "bg-slate-900 group-hover:bg-slate-800" : "bg-gray-200 group-hover:bg-gray-300"}`}
                                    >
                                      {checked && (
                                        <Check className="w-3 h-3 text-white stroke-[3px]" />
                                      )}
                                    </div>
                                    <span className="text-gray-600 text-[12.5px] font-medium">
                                      {brand}
                                    </span>
                                  </div>
                                  <span className="text-gray-400 text-[12.5px] font-normal">
                                    {count.toLocaleString()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 데이터 레이어 필터 섹션 */}
              <AccordionItem
                value="layers"
                className="border-b border-gray-100 last:border-0"
              >
                <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline">
                  <div className="flex items-center font-bold uppercase tracking-wide text-gray-700 text-[12.5px]">
                    <Filter className="w-4 h-4 mr-2 text-gray-400" />
                    Data Layers
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-4 py-2 bg-white space-y-1">
                    {dataLayersList.map((layer) => {
                      const checked = isSelected("dataLayers", layer);
                      return (
                        <div
                          key={layer}
                          className="flex items-center justify-between py-1.5 group cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1"
                          onClick={() => toggleFilter("dataLayers", layer)}
                        >
                          <div className="flex items-center space-x-2.5">
                            <div
                              className={`w-4 h-4 rounded-[4px] flex items-center justify-center transition-colors ${checked ? "bg-slate-900 group-hover:bg-slate-800" : "bg-gray-200 group-hover:bg-gray-300"}`}
                            >
                              {checked && (
                                <Check className="w-3 h-3 text-white stroke-[3px]" />
                              )}
                            </div>
                            <span className="text-gray-600 text-[12.5px] font-medium">
                              {layer}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* 필터 초기화 버튼 */}
            <Button
              variant="outline"
              className="w-full mt-3 mb-2 border-gray-200 text-gray-700 hover:bg-gray-50 text-[12.5px]"
              onClick={handleResetFilters}
            >
              필터 초기화
            </Button>
          </div>

          {/* 매장 목록 영역 (나머지 공간을 차지하며 스크롤 가능) */}
          <div className="px-4 py-3 flex-1 flex flex-col min-h-0 bg-gray-50/30">
            <div className="text-[12.5px] text-gray-500 mb-2 font-medium shrink-0">
              {iicCount.toLocaleString()}개 매장 •{" "}
              {compCount.toLocaleString()}개 타 브랜드
            </div>

            <div className="flex-1 overflow-y-auto pr-4 -mr-4 scrollbar-thin scrollbar-thumb-gray-200">
              <div className="space-y-4 pb-10">
                {/* IIC STORES 그룹 */}
                <Collapsible defaultOpen className="mb-4">
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-gray-50 rounded-md -mx-2 px-2 group cursor-pointer">
                    <div className="flex items-center text-blue-600 font-bold text-[12.5px] uppercase">
                      <Home className="w-4 h-4 mr-2" />
                      IIC STORES
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 group-data-[state=open]:rotate-180 transition-transform" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="pt-1 pb-2 space-y-3">
                      {filteredIICStores.map((store) => (
                        <StoreCard
                          key={store.id}
                          store={store}
                          onClick={() => onStoreClick(store)}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* COMPETITORS 그룹 */}
                <Collapsible defaultOpen className="mb-4">
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-gray-50 rounded-md -mx-2 px-2 group cursor-pointer">
                    <div className="flex items-center text-red-600 font-bold text-[12.5px] uppercase">
                      <Tag className="w-4 h-4 mr-2" />
                      COMPETITORS
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 group-data-[state=open]:rotate-180 transition-transform" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="pt-1 pb-2 space-y-3">
                      {competitorStores.map((store) => (
                        <StoreCard
                          key={store.id}
                          store={store}
                          onClick={() => onStoreClick(store)}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* PREFERRED BRANDS 그룹 (선호 브랜드가 있을 때만 표시) */}
                {preferredStores.length > 0 && (
                  <Collapsible defaultOpen className="mb-4">
                    <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-gray-50 rounded-md -mx-2 px-2 group cursor-pointer">
                      <div className="flex items-center text-purple-600 font-bold text-[12.5px] uppercase">
                        <Shapes className="w-4 h-4 mr-2" />
                        PREFERRED BRANDS
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400 group-data-[state=open]:rotate-180 transition-transform" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="pt-1 pb-2 space-y-3">
                        {preferredStores.map((store) => (
                          <StoreCard
                            key={store.id}
                            store={store}
                            onClick={() => onStoreClick(store)}
                          />
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
