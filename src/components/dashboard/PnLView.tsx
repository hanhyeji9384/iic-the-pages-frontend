// ============================================================
// PnLView 컴포넌트 (P&L = Profit & Loss, 손익계산서)
// 파이프라인 매장별 손익 항목을 테이블 형식으로 보여줍니다.
// 행(Row)은 P&L 항목(CAPEX, Sales, COGS 등), 열(Column)은 매장명입니다.
// 매장 열 헤더를 클릭하면 해당 매장의 P&L 수치를 편집할 수 있습니다.
// [수식 기반] Sales, CAPEX, Rent 3개만 입력하면 나머지 비용은 자동 계산됩니다.
// ============================================================

import React, { useMemo, useState } from "react";
import { Store, getStoreClass } from "../../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  X,
  Check,
  ChevronsUpDown,
  Calendar,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { toast } from "sonner";

// 이 컴포넌트가 받는 데이터의 형태를 정의합니다.
interface PnLViewProps {
  stores: Store[];                                          // 전체 매장 데이터 배열
  initialStatus?: string;                                   // 초기 상태 필터값
  initialBrand?: string;                                    // 초기 브랜드 필터값
  initialYears?: number[];                                  // 초기 연도 필터값
  initialCountryRegion?: string;                            // 초기 지역 필터값
  initialClass?: string;                                    // 초기 클래스 필터값
  onStoreUpdate?: (updatedStore: Store) => Promise<void>;   // 매장 데이터 저장 함수
}

// P&L 테이블 행 정의
// key: 재무 데이터 필드명, type: 행 색상 구분, formula: 자동 계산 수식 설명
// type이 "input"인 항목은 직접 입력, "cost"는 수식으로 자동 계산 (rent 제외)
const PNL_ROWS = [
  { key: "capex", label: "CAPEX", type: "input", formula: null },
  { key: "sales", label: "Sales", type: "revenue", formula: null },
  { key: "cogs", label: "COGS", type: "cost", formula: "Sales × 15%" },
  { key: "personnel", label: "Personnel", type: "cost", formula: "Sales × 13%" },
  { key: "rent", label: "Rent", type: "cost", formula: null },
  { key: "depreciation", label: "Depreciation", type: "cost", formula: "CAPEX ÷ 48" },
  { key: "payment", label: "Payment", type: "cost", formula: "Sales × 2%" },
  { key: "others", label: "Others", type: "cost", formula: "Sales × 5%" },
  { key: "storeOP", label: "Store-level OP", type: "profit", formula: "Sales − Σ Costs" },
] as const;

// PnLKey: PNL_ROWS에서 사용되는 key들의 타입을 자동으로 추출합니다.
type PnLKey = (typeof PNL_ROWS)[number]["key"];

// 편집 가능한 P&L 필드 — Sales, CAPEX, Rent 3개만 직접 입력합니다.
// 나머지 비용 항목(COGS, 인건비, 감가상각, 수수료, 기타)은 수식으로 자동 계산됩니다.
const EDITABLE_PNL_FIELDS = [
  { key: "sales", label: "Sales (월 매출)", description: "월간 예상 매출액 — 모든 비용 항목의 기준값" },
  { key: "capex", label: "CAPEX (투자비)", description: "총 투자비 — Depreciation = CAPEX ÷ 48 으로 월 상각" },
  { key: "rent", label: "Rent (임차료)", description: "월간 임대료 (직접 입력)" },
] as const;

// 매장의 재무 데이터에서 수식 기반으로 P&L 수치를 계산하는 함수
// Sales, CAPEX, Rent 값을 기준으로 나머지 비용을 자동 산출합니다.
function getStorePnL(store: Store): Record<PnLKey, number> {
  const fin = store.financial as any;
  // 3가지 입력값 추출
  const sales = fin?.estimatedSales ?? fin?.monthlySales ?? 0;
  const capex = fin?.capex ?? 0;
  const rent = fin?.monthlyRent ?? 0;

  // 수식 기반 비용 자동 계산
  const cogs = sales * 0.15;           // 매출원가 = 매출 × 15%
  const personnel = sales * 0.13;      // 인건비 = 매출 × 13%
  const depreciation = capex / 48;     // 감가상각 = 투자비 ÷ 48개월
  const payment = sales * 0.02;        // 지급수수료 = 매출 × 2%
  const others = sales * 0.05;         // 기타비용 = 매출 × 5%

  // Store-level OP = 매출 − (원가 + 인건비 + 임차료 + 감가상각 + 수수료 + 기타)
  const storeOP = sales - (cogs + personnel + rent + depreciation + payment + others);

  return { sales, capex, cogs, personnel, rent, depreciation, payment, others, storeOP };
}

// 영업이익률(OP Margin %)을 안전하게 계산하는 헬퍼 함수
function getOPMargin(storeOP: number, sales: number): number {
  if (!sales || sales === 0) return 0;
  return (storeOP / sales) * 100;
}

// P&L 손익계산서 뷰 컴포넌트
export const PnLView: React.FC<PnLViewProps> = ({
  stores,
  initialStatus,
  initialBrand,
  initialYears,
  initialCountryRegion,
  initialClass,
  onStoreUpdate,
}) => {
  // 필터 상태들
  const [selectedCountry, setSelectedCountry] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>(initialBrand || "all");
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus || "all");
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [selectedAnalysisYears, setSelectedAnalysisYears] = useState<number[]>(initialYears || []);
  const [selectedClass, setSelectedClass] = useState<string>(initialClass || "all");

  // 편집 다이얼로그 상태
  const [editStore, setEditStore] = useState<Store | null>(null);           // 편집 중인 매장
  const [editValues, setEditValues] = useState<Record<string, number>>({});  // 편집 중인 수치들
  const [isSaving, setIsSaving] = useState(false);                          // 저장 중 여부

  // 외부에서 initialXxx props가 변경되면 필터 상태를 동기화합니다.
  React.useEffect(() => {
    if (initialStatus) setSelectedStatus(initialStatus);
    if (initialBrand) setSelectedBrand(initialBrand);
    if (initialYears) setSelectedAnalysisYears(initialYears);
    if (initialCountryRegion) {
      // 지역명(한국, 일본 등)을 실제 국가명 키워드로 매핑합니다.
      const regionMap: Record<string, string[]> = {
        "한국": ["south korea", "korea"],
        "일본": ["japan"],
        "중국": ["china", "hong kong", "taiwan", "macau"],
        "동남아": ["singapore", "vietnam", "thailand", "malaysia", "indonesia", "philippines"],
        "미주": ["usa", "united states", "canada", "mexico", "america"],
        "유럽": ["uk", "united kingdom", "france", "germany", "italy", "spain", "netherlands", "sweden", "switzerland", "belgium", "denmark"],
        "중동": ["uae", "united arab emirates", "saudi", "qatar", "kuwait", "dubai"],
        "호주": ["australia", "new zealand"],
      };
      const keywords = regionMap[initialCountryRegion];
      if (keywords) {
        const pipelineStatuses = ["Plan", "Planned", "Confirmed", "Signed", "Construction", "Space", "Contract", "Reject", "Pending"];
        const pipelineCountries = Array.from(
          new Set(stores.filter((s) => pipelineStatuses.includes(s.status)).map((s) => s.location.country))
        );
        const matchingCountries = pipelineCountries.filter((c) =>
          keywords.some((k) => c.toLowerCase().includes(k))
        );
        if (matchingCountries.length > 0) setSelectedCountry(matchingCountries);
      }
    }
    if (initialClass) setSelectedClass(initialClass);
  }, [initialStatus, initialBrand, initialYears, initialCountryRegion, initialClass]);

  // 파이프라인 매장 필터링 및 정렬 (PipelineList와 동일한 로직)
  const pipelineStores = useMemo(() => {
    // 파이프라인에 해당하는 상태 목록
    const pipelineStatuses = ["Plan", "Planned", "Confirmed", "Signed", "Construction", "Space", "Contract", "Reject", "Pending"];

    // 국가별 표시 우선순위 함수 (한국 > 일본 > 중국 > 동남아 > 미주 > 유럽 > 중동 > 호주 > 기타)
    const getRegionRank = (country: string) => {
      if (!country) return 99;
      const c = country.toLowerCase();
      if (c.includes("korea")) return 1;
      if (c === "japan") return 2;
      if (["china", "hong kong", "macau", "taiwan"].some((k) => c.includes(k))) return 3;
      if (["singapore", "vietnam", "thailand", "malaysia", "indonesia", "philippines"].some((k) => c.includes(k))) return 4;
      if (["usa", "united states", "canada", "mexico", "america"].some((k) => c.includes(k))) return 5;
      if (["uk", "united kingdom", "france", "germany", "italy", "spain", "netherlands", "sweden", "switzerland", "belgium", "denmark"].some((k) => c.includes(k))) return 6;
      if (["uae", "united arab emirates", "saudi", "qatar", "kuwait", "dubai"].some((k) => c.includes(k))) return 7;
      if (["australia", "new zealand"].some((k) => c.includes(k))) return 8;
      return 9;
    };

    // 모든 필터 조건을 적용하여 매장 목록을 필터링합니다.
    const filtered = stores.filter((store) => {
      const isPipeline = pipelineStatuses.includes(store.status);
      const matchCountry = selectedCountry.length === 0 || selectedCountry.includes(store.location.country);
      const matchCity = selectedCity === "all" || store.location.city === selectedCity;
      const matchBrand = selectedBrand === "all" || store.brand === selectedBrand;
      const matchStatus = selectedStatus === "all" || store.status === selectedStatus;
      const matchChannel = selectedChannel === "all" || store.type === selectedChannel;
      const matchYear =
        selectedAnalysisYears.length === 0 ||
        (() => {
          // 오픈일 또는 계약 시작일에서 연도를 추출하여 필터링
          const dateStr = store.openDate || store.ChangOpenDate || store.contract?.startDate;
          if (!dateStr) return false;
          const year = new Date(dateStr).getFullYear();
          return selectedAnalysisYears.includes(year);
        })();
      const matchClass = selectedClass === "all" || getStoreClass(store.type) === selectedClass;

      return isPipeline && matchCountry && matchCity && matchBrand && matchStatus && matchChannel && matchYear && matchClass;
    });

    // 지역 우선순위 기준으로 정렬하고, 같은 지역이면 날짜 순으로 정렬
    return [...filtered].sort((a, b) => {
      const rankA = getRegionRank(a.location.country);
      const rankB = getRegionRank(b.location.country);
      if (rankA !== rankB) return rankA - rankB;
      const dateA = a.openDate || a.ChangOpenDate || a.contract?.startDate || "9999-12-31";
      const dateB = b.openDate || b.ChangOpenDate || b.contract?.startDate || "9999-12-31";
      return dateA.localeCompare(dateB);
    });
  }, [stores, selectedCountry, selectedCity, selectedBrand, selectedStatus, selectedChannel, selectedAnalysisYears, selectedClass]);

  // 필터 드롭다운에 표시할 옵션 목록을 계산합니다.
  const filterOptions = useMemo(() => {
    const pipelineStatuses = ["Plan", "Planned", "Confirmed", "Signed", "Construction", "Space", "Contract", "Reject", "Pending"];
    const allPipelineStores = stores.filter((store) => pipelineStatuses.includes(store.status));

    const countries = Array.from(new Set(allPipelineStores.map((s) => s.location.country))).sort();
    // 국가가 선택되어 있으면 해당 국가의 도시만 표시
    const availableCities = selectedCountry.length === 0 ? allPipelineStores : allPipelineStores.filter((s) => selectedCountry.includes(s.location.country));
    const cities = Array.from(new Set(availableCities.map((s) => s.location.city))).sort();
    const brands = Array.from(new Set(allPipelineStores.map((s) => s.brand))).sort();
    const statuses = Array.from(new Set(allPipelineStores.map((s) => s.status))).sort();
    const channels = Array.from(new Set(allPipelineStores.map((s) => s.type))).sort();
    // 현재 연도 기준 과거 5년 ~ 미래 10년 범위의 연도 목록
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 16 }, (_, i) => currentYear - 5 + i);

    return { countries, cities, brands, statuses, channels, years };
  }, [stores, selectedCountry]);

  // 모든 필터를 초기 상태로 되돌리는 함수
  const clearFilters = () => {
    setSelectedCountry([]);
    setSelectedCity("all");
    setSelectedBrand("all");
    setSelectedStatus("all");
    setSelectedChannel("all");
    setSelectedAnalysisYears([]);
    setSelectedClass("all");
  };

  // 하나라도 필터가 설정되어 있는지 확인
  const hasActiveFilters =
    selectedCountry.length > 0 ||
    selectedCity !== "all" ||
    selectedBrand !== "all" ||
    selectedStatus !== "all" ||
    selectedChannel !== "all" ||
    selectedAnalysisYears.length > 0 ||
    selectedClass !== "all";

  // 금액을 '억', '만' 단위의 한국식 문자열로 변환하는 함수
  const formatCurrencyWithUnit = (amount: number) => {
    if (amount === 0) return "-";
    const isNegative = amount < 0;
    const abs = Math.abs(amount);
    let formatted: string;
    if (abs >= 100000000) {
      // 1억 이상: '억' 단위
      formatted = `${Math.round(abs / 100000000).toLocaleString()}억`;
    } else if (abs >= 10000) {
      // 1만 이상: '만' 단위
      formatted = `${Math.round(abs / 10000).toLocaleString()}만`;
    } else {
      // 1만 미만: 그대로 표시
      formatted = abs.toLocaleString();
    }
    return isNegative ? `-${formatted}` : formatted;
  };

  // 필터된 매장들의 P&L 항목별 합계를 계산합니다.
  const totals = useMemo(() => {
    const result: Record<PnLKey, number> = { sales: 0, capex: 0, cogs: 0, personnel: 0, rent: 0, depreciation: 0, payment: 0, others: 0, storeOP: 0 };
    for (const store of pipelineStores) {
      const pnl = getStorePnL(store);
      for (const row of PNL_ROWS) {
        result[row.key] += pnl[row.key];
      }
    }
    return result;
  }, [pipelineStores]);

  // 매장 헤더 클릭 시 편집 다이얼로그를 여는 함수
  // Sales, CAPEX, Rent 3개 값만 편집 상태에 로드합니다.
  const handleStoreHeaderClick = (store: Store) => {
    const fin = store.financial as any;
    setEditValues({
      sales: fin?.estimatedSales ?? fin?.monthlySales ?? 0,
      capex: fin?.capex ?? 0,
      rent: fin?.monthlyRent ?? 0,
    });
    setEditStore(store);
  };

  // 편집 중인 3개 입력값으로 나머지 비용을 실시간 자동 계산합니다.
  // 수식: COGS=Sales×15%, Personnel=Sales×13%, Depreciation=CAPEX÷48, Payment=Sales×2%, Others=Sales×5%
  const editDerived = useMemo(() => {
    const sales = editValues.sales || 0;
    const capex = editValues.capex || 0;
    const rent = editValues.rent || 0;
    const cogs = sales * 0.15;
    const personnel = sales * 0.13;
    const depreciation = capex / 48;
    const payment = sales * 0.02;
    const others = sales * 0.05;
    // OP = 매출 − (원가 + 인건비 + 임차료 + 감가상각 + 수수료 + 기타)
    const storeOP = sales - (cogs + personnel + rent + depreciation + payment + others);
    const opMargin = sales > 0 ? (storeOP / sales) * 100 : 0;
    return { cogs, personnel, depreciation, payment, others, rent, storeOP, opMargin };
  }, [editValues]);

  // P&L 수치를 저장하는 함수 — Sales, CAPEX, Rent 3개만 저장합니다.
  const handleSavePnL = async () => {
    if (!editStore || !onStoreUpdate) return;
    setIsSaving(true);
    try {
      const sales = editValues.sales || 0;
      const capex = editValues.capex || 0;
      const rent = editValues.rent || 0;
      // 편집된 3개 수치만 매장 데이터에 반영합니다.
      const updatedStore: Store = {
        ...editStore,
        financial: {
          ...editStore.financial,
          estimatedSales: sales,
          monthlySales: sales,
          capex: capex,
          monthlyRent: rent,
        } as any,
      };
      await onStoreUpdate(updatedStore);
      setEditStore(null);
      toast.success(`${editStore.name} P&L 정보가 저장되었습니다.`);
    } catch (e) {
      console.error("P&L save error:", e);
      toast.error("P&L 정보 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 텍스트 입력값에서 쉼표를 제거하고 숫자로 변환하는 함수
  const handleEditValueChange = (key: string, rawValue: string) => {
    const cleaned = rawValue.replace(/,/g, ""); // 쉼표 제거
    if (cleaned === "" || cleaned === "-") {
      setEditValues((prev) => ({ ...prev, [key]: 0 }));
      return;
    }
    const num = Number(cleaned);
    if (!isNaN(num)) {
      setEditValues((prev) => ({ ...prev, [key]: num }));
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50 p-2 min-h-0 font-sans">
      <div className="w-full mx-auto space-y-4 pb-20 px-2">

        {/* 필터 바 — PipelineList와 동일한 필터 구조 */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-start mb-2">
          <div className="flex items-center space-x-2">
            <div className="flex items-center gap-2">

              {/* 국가 다중 선택 드롭다운 */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-[140px] justify-between bg-white font-normal border-input hover:bg-accent hover:text-accent-foreground",
                      selectedCountry.length === 0 && "text-muted-foreground"
                    )}
                  >
                    <span className="truncate">
                      {selectedCountry.length === 0
                        ? "Country"
                        : selectedCountry.length === 1
                          ? selectedCountry[0]
                          : `${selectedCountry.length} selected`}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search country..." />
                    <CommandList>
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandGroup>
                        {filterOptions.countries.map((country) => (
                          <CommandItem
                            key={country}
                            value={country}
                            onSelect={() => {
                              // 이미 선택된 국가면 제거, 아니면 추가
                              setSelectedCountry((prev) =>
                                prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]
                              );
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", selectedCountry.includes(country) ? "opacity-100" : "opacity-0")} />
                            {country}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* 도시 선택 드롭다운 */}
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-[140px] bg-white">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {filterOptions.cities.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 브랜드 선택 드롭다운 */}
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="w-[140px] bg-white">
                  <SelectValue placeholder="Brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {filterOptions.brands.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 상태 선택 드롭다운 */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[140px] bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {filterOptions.statuses.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 채널 선택 드롭다운 */}
              <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                <SelectTrigger className="w-[140px] bg-white">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  {filterOptions.channels.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 분석 연도 다중 선택 드롭다운 */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-[160px] justify-between bg-white font-normal border-input hover:bg-accent hover:text-accent-foreground",
                      selectedAnalysisYears.length === 0 && "text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Calendar className="h-3.5 w-3.5 shrink-0 opacity-50" />
                      <span className="truncate">
                        {selectedAnalysisYears.length === 0
                          ? "Analysis Year"
                          : selectedAnalysisYears.length === 1
                            ? `${selectedAnalysisYears[0]}`
                            : `${selectedAnalysisYears.length} Years`}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[160px] p-0" align="start">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        {filterOptions.years.map((year) => (
                          <CommandItem
                            key={year}
                            value={String(year)}
                            onSelect={() => {
                              // 이미 선택된 연도면 제거, 아니면 추가 (항상 오름차순 정렬)
                              setSelectedAnalysisYears((prev) =>
                                prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year].sort((a, b) => a - b)
                              );
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", selectedAnalysisYears.includes(year) ? "opacity-100" : "opacity-0")} />
                            {year}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* 매장 분류 선택 드롭다운 */}
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[150px] bg-white">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="Type-based">
                    <span className="text-violet-600 font-semibold">Type-based</span>
                  </SelectItem>
                  <SelectItem value="Standalone">
                    <span className="text-teal-600 font-semibold">Standalone</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 필터가 활성화된 경우에만 초기화 버튼 표시 */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearFilters}
                className="h-9 w-9 text-slate-500 hover:text-slate-900"
                title="Clear filters"
              >
                <X className="h-4 w-4" />
              </Button>
            )}

            {/* 현재 표시 중인 매장 수 */}
            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm ml-2">
              <span className="text-sm font-medium text-slate-500 mr-2">Stores:</span>
              <span className="text-lg font-bold text-blue-600">{pipelineStores.length}</span>
            </div>
          </div>
        </div>

        {/* P&L 테이블 — 행: P&L 항목, 열: 매장명 */}
        {pipelineStores.length === 0 ? (
          // 매장이 없을 때 안내 메시지
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-12 text-center text-slate-400">
            No pipeline stores found.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-200">
                    {/* P&L 항목명 열 헤더 (고정) */}
                    <th className="py-3 px-4 text-left font-bold text-slate-700 border-r-2 border-slate-200 sticky left-0 bg-slate-50 z-10 min-w-[160px] min-[2560px]:min-w-[200px]">
                      P&L Item
                    </th>
                    {/* 합계 열 헤더 */}
                    <th className="py-3 px-4 text-right font-bold text-slate-900 border-r-2 border-slate-300 bg-blue-50/60 min-w-[120px] min-[2560px]:min-w-[140px]">
                      Total
                    </th>
                    {/* 각 매장 열 헤더 — 클릭하면 편집 다이얼로그 열림 */}
                    {pipelineStores.map((store) => (
                      <th
                        key={store.id}
                        className="py-2 px-3 text-center font-semibold text-slate-700 border-r border-slate-200 min-w-[110px] min-[2560px]:min-w-[130px] cursor-pointer hover:bg-blue-50 transition-colors group"
                        onClick={() => handleStoreHeaderClick(store)}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[11px] min-[2560px]:text-xs leading-tight truncate max-w-[110px] group-hover:text-blue-600 group-hover:underline transition-colors" title={`${store.name} — 클릭하여 P&L 수정`}>
                            {store.name}
                          </span>
                          <span className="text-[9px] min-[2560px]:text-[10px] text-slate-400 font-normal">
                            {store.brand}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PNL_ROWS.map((row) => {
                    const isProfit = row.type === "profit";   // Store-level OP 행 여부
                    const isRevenue = row.type === "revenue"; // Sales 행 여부
                    const isInput = row.type === "input";     // CAPEX 행 여부 (직접 입력 항목)
                    const totalVal = totals[row.key];
                    // 영업이익 행일 때만 전체 OP Margin % 계산
                    const totalOPMargin = isProfit ? getOPMargin(totals.storeOP, totals.sales) : 0;

                    return (
                      <tr
                        key={row.key}
                        className={cn(
                          "border-b border-slate-100 transition-colors hover:bg-slate-50/50",
                          // 영업이익 행: 파란 그라데이션 배경 + 상단 굵은 테두리
                          isProfit && "bg-gradient-to-r from-blue-50/40 to-transparent border-t-2 border-t-slate-200",
                          // 매출 행: 녹색 배경
                          isRevenue && "bg-emerald-50/30",
                          // CAPEX 행: 앰버(호박색) 배경
                          isInput && "bg-amber-50/30"
                        )}
                      >
                        {/* 행 레이블 (P&L 항목명, 왼쪽 고정) */}
                        <td
                          className={cn(
                            "py-3 px-4 border-r-2 border-slate-200 sticky left-0 z-10 font-semibold min-[2560px]:text-base",
                            isProfit ? "bg-blue-50/60 text-blue-800 font-bold"
                              : isRevenue ? "bg-emerald-50/50 text-emerald-800 font-bold"
                              : isInput ? "bg-amber-50/50 text-amber-800 font-bold"
                              : "bg-white text-slate-700"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span>{row.label}</span>
                          </div>
                        </td>
                        {/* 합계 열 */}
                        <td
                          className={cn(
                            "py-3 px-4 text-right border-r-2 border-slate-300 font-bold tabular-nums min-[2560px]:text-base",
                            isProfit
                              ? totalVal >= 0 ? "text-blue-700 bg-blue-50/60" : "text-red-600 bg-red-50/40"
                              : isRevenue ? "text-emerald-700 bg-emerald-50/40"
                              : isInput ? "text-amber-700 bg-amber-50/40"
                              : "text-slate-800 bg-slate-50/40"
                          )}
                        >
                          {/* 영업이익 행은 금액 + OP Margin % 배지 표시 */}
                          {isProfit ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <span>{totalVal !== 0 ? formatCurrencyWithUnit(totalVal) : "-"}</span>
                              <span className={cn(
                                "text-[10px] min-[2560px]:text-xs font-semibold px-1.5 py-0.5 rounded-full",
                                totalOPMargin >= 0 ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-600"
                              )}>
                                {totalOPMargin.toFixed(1)}%
                              </span>
                            </div>
                          ) : (
                            totalVal !== 0 ? formatCurrencyWithUnit(totalVal) : "-"
                          )}
                        </td>
                        {/* 매장별 P&L 수치 */}
                        {pipelineStores.map((store) => {
                          const pnl = getStorePnL(store);
                          const val = pnl[row.key];
                          // 영업이익 행일 때만 개별 매장 OP Margin % 계산
                          const storeOPMargin = isProfit ? getOPMargin(pnl.storeOP, pnl.sales) : 0;
                          return (
                            <td
                              key={store.id}
                              className={cn(
                                "py-3 px-3 text-right border-r border-slate-100 tabular-nums min-[2560px]:text-base",
                                // 영업이익이 음수면 빨간색, 양수면 파란색
                                isProfit && val < 0 && "text-red-500",
                                isProfit && val >= 0 && "text-blue-600",
                                // 매출은 녹색
                                isRevenue && "text-emerald-700",
                                // CAPEX는 앰버
                                isInput && "text-amber-700"
                              )}
                            >
                              {/* 영업이익 행은 금액 + OP Margin % 배지 표시 */}
                              {isProfit ? (
                                <div className="flex flex-col items-end gap-0.5">
                                  <span>{val !== 0 ? formatCurrencyWithUnit(val) : "-"}</span>
                                  <span className={cn(
                                    "text-[9px] min-[2560px]:text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                                    storeOPMargin >= 0 ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-500"
                                  )}>
                                    {storeOPMargin.toFixed(1)}%
                                  </span>
                                </div>
                              ) : (
                                val !== 0 ? formatCurrencyWithUnit(val) : "-"
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* P&L 편집 다이얼로그 — 매장 헤더 클릭 시 열립니다. */}
      {/* Sales, CAPEX, Rent 3개만 입력하면 나머지는 수식으로 자동 계산됩니다. */}
      <Dialog open={!!editStore} onOpenChange={(open) => { if (!open) setEditStore(null); }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <span>P&L 수정</span>
              <span className="text-sm font-normal text-slate-500">—</span>
              <span className="text-base font-semibold text-blue-700">{editStore?.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {editStore?.brand} · {editStore?.location.city}, {editStore?.location.country}
            </DialogDescription>
          </DialogHeader>

          {/* 편집 필드 — 3개의 직접 입력 항목 */}
          <div className="space-y-4 py-3 max-h-[65vh] overflow-y-auto pr-1">
            {EDITABLE_PNL_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={`pnl-${field.key}`} className="text-[12px] font-bold text-slate-700">
                  {field.label}
                </Label>
                {/* 통화 기호 ₩를 왼쪽에 고정하고 숫자를 오른쪽 정렬로 표시 */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-medium">₩</span>
                  <Input
                    id={`pnl-${field.key}`}
                    type="text"
                    value={(editValues[field.key] || 0).toLocaleString()}
                    onChange={(e) => handleEditValueChange(field.key, e.target.value)}
                    className="h-9 text-sm pl-7 pr-3 font-mono tabular-nums text-right"
                    placeholder="0"
                  />
                </div>
                {/* 빠른 금액 입력 버튼 (만원 / 억원 단위) */}
                <div className="flex gap-1.5">
                  {[100, 500, 1000, 5000].map((manUnit) => (
                    <button
                      key={manUnit}
                      type="button"
                      onClick={() => setEditValues((prev) => ({ ...prev, [field.key]: manUnit * 10000 }))}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    >
                      {manUnit}만
                    </button>
                  ))}
                  {[1, 5, 10].map((ukUnit) => (
                    <button
                      key={`uk-${ukUnit}`}
                      type="button"
                      onClick={() => setEditValues((prev) => ({ ...prev, [field.key]: ukUnit * 100000000 }))}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-blue-200 text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      {ukUnit}억
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* 자동 계산 항목 미리보기 (읽기 전용) */}
            <div className="mt-3 pt-3 border-t border-dashed border-slate-200">
              <p className="text-[11px] font-semibold text-slate-500 mb-2">자동 계산 항목</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {[
                  { label: "COGS", formula: "Sales × 15%", value: editDerived.cogs },
                  { label: "Personnel", formula: "Sales × 13%", value: editDerived.personnel },
                  { label: "Depreciation", formula: "CAPEX ÷ 48", value: editDerived.depreciation },
                  { label: "Payment", formula: "Sales × 2%", value: editDerived.payment },
                  { label: "Others", formula: "Sales × 5%", value: editDerived.others },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium text-slate-600">{item.label}</span>
                      <span className="text-[9px] text-slate-400 bg-slate-50 px-1 py-0.5 rounded">{item.formula}</span>
                    </div>
                    <span className="text-[11px] font-mono tabular-nums text-slate-700">
                      {item.value !== 0 ? formatCurrencyWithUnit(Math.round(item.value)) : "-"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Store-level OP 자동 계산 결과 표시 (읽기 전용) */}
            <div className="mt-4 pt-4 border-t-2 border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-blue-800">Store-level OP</span>
                <div className="flex items-center gap-3">
                  {/* 영업이익 금액 — 음수면 빨간색 */}
                  <span className={cn(
                    "text-lg font-bold tabular-nums",
                    editDerived.storeOP >= 0 ? "text-blue-700" : "text-red-600"
                  )}>
                    ₩{editDerived.storeOP !== 0 ? formatCurrencyWithUnit(editDerived.storeOP) : "0"}
                  </span>
                  {/* 영업이익률 배지 */}
                  <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    editDerived.opMargin >= 0 ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-600"
                  )}>
                    {editDerived.opMargin.toFixed(1)}%
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Sales − (COGS + Personnel + Rent + Depreciation + Payment + Others) 로 자동 계산됩니다.
              </p>
            </div>
          </div>

          {/* 다이얼로그 하단 버튼 */}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditStore(null)} disabled={isSaving}>
              취소
            </Button>
            <Button onClick={handleSavePnL} disabled={isSaving || !onStoreUpdate}>
              {isSaving ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
