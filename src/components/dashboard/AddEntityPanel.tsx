// ============================================================
// AddEntityPanel 컴포넌트
// 지도 위에 IIC 매장 또는 경쟁사/선호 브랜드 매장을 추가하고 관리하는 패널입니다.
// mode에 따라 IIC Store Manager 또는 Competitor & Preferred Manager로 동작합니다.
// ============================================================

import { useState, useEffect } from "react";
import {
  MapPin,
  Plus,
  Trash2,
  Eye,
  RotateCcw,
  Loader2,
  Building2,
  Users,
  Save,
  X,
  Navigation,
  Edit2
} from "lucide-react";
import { SavedEntity } from "../../utils/mockApi";
import { dataClient } from "../../utils/dataClient";
import { BrandDefinition } from "../../types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";

// IIC 계열 브랜드 목록
const IIC_BRANDS = ['Gentle Monster', 'Tamburins', 'Nudake', 'Atiissu', 'Nuflaat'];

// 경쟁사 브랜드 목록 (스마트 글라스 브랜드 포함)
const COMPETITOR_BRANDS = [
  'RayBan', 'Aesop', 'Pesade',
  'London Bagel Museum', 'Misu A Barbe', 'Matin Kim', 'Polga', 'Seletti',
  'ALO',
  // Smart Glass Brands
  'Meta', 'XREAL', 'Rokid', 'TCL RayNeo', 'Vuzix'
];

// 선호/인접 브랜드 목록
const PREFERRED_BRANDS = [
  'Acne studios', 'Alexander Wang', 'Ami', 'Apple', 'Balenciaga',
  'Louis Vuitton', 'Lululemon', 'Miu Miu', 'Off-white', 'Hermès', 'Thom Browne',
  'Burberry', 'Bottega Veneta', 'Dior', 'Cartier', 'Adidas', 'Chanel', 'PRADA',
  'Nike', 'Samsung', 'Google'
];

// 한국어 국가명을 영문으로 변환하는 헬퍼 함수
const convertKoreanCountryToEnglish = (countryName: string): string => {
  const countryMap: { [key: string]: string } = {
    '대한민국': 'South Korea',
    '한국': 'South Korea',
    '미국': 'USA',
    '영국': 'UK',
    '프랑스': 'France',
    '독일': 'Germany',
    '이탈리아': 'Italy',
    '스페인': 'Spain',
    '중국': 'China',
    '일본': 'Japan',
    '싱가포르': 'Singapore',
    '태국': 'Thailand',
    '베트남': 'Vietnam',
    '말레이시아': 'Malaysia',
    '인도네시아': 'Indonesia',
    '필리핀': 'Philippines',
    '캐나다': 'Canada',
    '멕시코': 'Mexico',
    '호주': 'Australia',
    '오스트레일리아': 'Australia',
    '뉴질랜드': 'New Zealand',
    '인도': 'India',
    '브라질': 'Brazil',
    '아르헨티나': 'Argentina',
    '남아프리카공화국': 'South Africa',
    '남아프리카': 'South Africa',
    '러시아': 'Russia',
    '아랍에미리트': 'UAE',
    'UAE': 'UAE',
    '사우디아라비아': 'Saudi Arabia',
    '홍콩': 'Hong Kong',
    '대만': 'Taiwan',
    '마카오': 'Macau'
  };

  const result = countryMap[countryName] || countryName;
  console.log(`Country conversion: "${countryName}" → "${result}"`);
  return result;
};

// 좌표(위도/경도) 데이터 타입
interface Coordinate {
  lat: number;
  lng: number;
}

// 미리 채워진 데이터 형식 (검색으로 장소를 선택했을 때 전달됨)
export interface PrefilledData {
  name?: string;
  address?: string;
  location?: Coordinate;
}

// 컴포넌트가 받는 속성(props) 정의
interface AddEntityPanelProps {
  mode: 'iic' | 'competitor';                                      // 패널 모드: IIC 매장 또는 경쟁사
  onEntitiesUpdate: (entities: SavedEntity[]) => void;             // 항목 목록이 변경될 때 실행
  onModeChange: (isAddMode: boolean) => void;                      // 지도 클릭 추가 모드 변경
  onSelectionChange: (location: Coordinate | null) => void;        // 선택된 위치 변경
  onFocusEntity: (entity: SavedEntity) => void;                    // 특정 항목으로 지도 포커스
  selectedLocation: Coordinate | null;                             // 지도에서 선택된 위치
  isAddMode: boolean;                                              // 지도 클릭 추가 모드 활성화 여부
  existingEntities: SavedEntity[];                                 // 이미 저장된 항목 목록
  prefilledData?: PrefilledData | null;                            // 검색으로 미리 채워질 데이터
  customCompetitorBrands?: BrandDefinition[];                      // 사용자 정의 경쟁사 브랜드
  customPreferredBrands?: BrandDefinition[];                       // 사용자 정의 선호 브랜드
}

/**
 * 지도 매장/브랜드 추가 관리 패널
 * mode에 따라 IIC 매장 또는 경쟁사/선호 브랜드를 추가·수정·삭제합니다.
 */
export function AddEntityPanel({
  mode,
  onEntitiesUpdate,
  onModeChange,
  onSelectionChange,
  onFocusEntity,
  selectedLocation,
  isAddMode,
  existingEntities,
  prefilledData,
  customCompetitorBrands = [],
  customPreferredBrands = []
}: AddEntityPanelProps) {
  // 상태에 따른 배지 색상 반환 함수
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Plan': return 'bg-slate-400';
      case 'Confirm': return 'bg-[#c084fc]';
      case 'Contract': return 'bg-cyan-500';
      case 'Space': return 'bg-sky-500';
      case 'Open': return 'bg-[#7FC7D9]';
      case 'Close': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  // 폼 입력 상태들
  const [editingId, setEditingId] = useState<string | null>(null);          // 현재 수정 중인 항목 ID
  const [name, setName] = useState("");                                       // 매장 이름
  const [brand, setBrand] = useState("");                                     // 브랜드명
  const [brandCategory, setBrandCategory] = useState<'competitor' | 'preferred'>('competitor'); // 경쟁사/선호 구분
  const [status, setStatus] = useState(mode === 'iic' ? "Plan" : "Open");   // 파이프라인 상태
  const [lat, setLat] = useState("");                                         // 위도
  const [lng, setLng] = useState("");                                         // 경도
  const [area, setArea] = useState("");                                       // 면적(㎡)
  const [rent, setRent] = useState("");                                       // 월 임대료
  const [rentType, setRentType] = useState<'fixed' | 'commission'>('fixed'); // 임대 방식
  const [rentCommission, setRentCommission] = useState("");                   // 수수료율
  const [deposit, setDeposit] = useState("");                                 // 보증금
  const [investment, setInvestment] = useState("");                           // 투자비
  const [operatingProfitRatio, setOperatingProfitRatio] = useState("");      // 예상 영업이익률
  const [openDate, setOpenDate] = useState("");                               // 오픈일
  const [contractStart, setContractStart] = useState("");                    // 계약 시작일
  const [contractEnd, setContractEnd] = useState("");                        // 계약 종료일
  const [yearlySales, setYearlySales] = useState<{year: number, amount: number}[]>([]); // 연간 매출 데이터
  const [notes, setNotes] = useState("");                                     // 메모
  const [address, setAddress] = useState("");                                 // 주소
  const [city, setCity] = useState("");                                       // 도시명
  const [country, setCountry] = useState("");                                 // 국가명
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);       // 역지오코딩 로딩 상태

  // 기존 브랜드 목록에 사용자 정의 브랜드를 합쳐서 정렬
  const availableCompetitorBrands = Array.from(new Set([
    ...COMPETITOR_BRANDS,
    ...customCompetitorBrands.map(b => b.name)
  ])).sort();

  const availablePreferredBrands = Array.from(new Set([
    ...PREFERRED_BRANDS,
    ...customPreferredBrands.map(b => b.name)
  ])).sort();

  // 숫자에 천 단위 쉼표를 추가하는 헬퍼 함수
  const formatWithCommas = (val: string | number | undefined) => {
    if (val === undefined || val === null || val === "") return "";
    const s = val.toString().replace(/,/g, "");
    if (isNaN(Number(s))) return val.toString();
    return Number(s).toLocaleString();
  };

  // 쉼표를 제거하여 순수 숫자 문자열로 변환
  const parseNumber = (val: string) => {
    return val.replace(/,/g, "");
  };

  // 날짜 형식을 YYYY-MM-DD로 통일하는 헬퍼 함수 (YYYY-DD-MM 형식도 처리)
  const smartDateParse = (value: string): string => {
    if (!value) return "";
    let cleaned = value.replace(/[^0-9.-]/g, "").replace(/\./g, "-");
    const parts = cleaned.split("-");

    if (parts.length === 3) {
      const year = parts[0];
      const p1 = parts[1];
      const p2 = parts[2];

      if (year.length === 4) {
        const val1 = parseInt(p1, 10);
        const val2 = parseInt(p2, 10);

        // p1이 12보다 크면 YYYY-DD-MM 형식으로 간주
        if (val1 > 12 && val2 <= 12) {
          return `${year}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
        }
        return `${year}-${p1.padStart(2, '0')}-${p2.padStart(2, '0')}`;
      }
    }
    return value;
  };

  // 2025년 연간 매출을 기반으로 월 매출을 계산 (UI 피드백용)
  const displayedMonthlySales = (() => {
    const currentYear = 2025;
    const today = new Date('2025-12-27');
    const openD = new Date(openDate);
    const openYear = openD.getFullYear();
    const sales2025 = yearlySales.find(s => s.year === currentYear)?.amount || 0;

    if (openDate) {
      if (openYear === currentYear) {
        const yearsDiff = today.getFullYear() - openD.getFullYear();
        const monthsDiff = today.getMonth() - openD.getMonth();
        const monthsElapsed = (yearsDiff * 12) + monthsDiff;
        const divisor = monthsElapsed - 12;
        return divisor > 0 ? Math.ceil(sales2025 / divisor) : 0;
      } else if (openYear < currentYear) {
        return Math.ceil(sales2025 / 12);
      }
    }
    return 0;
  })();

  // 미리 채워진 데이터가 변경되면 폼 필드를 자동으로 채움
  useEffect(() => {
    if (prefilledData) {
      if (prefilledData.name) setName(prefilledData.name);
      if (prefilledData.location) {
        setLat(prefilledData.location.lat.toFixed(6));
        setLng(prefilledData.location.lng.toFixed(6));
        // 마커 표시를 위해 선택 위치도 업데이트
        onSelectionChange(prefilledData.location);
      }
      if (prefilledData.address) {
        setNotes(prev => prev ? `${prev}\nAddress: ${prefilledData.address}` : `Address: ${prefilledData.address}`);
      }
    }
  }, [prefilledData]);

  // 지도에서 선택된 위치가 바뀌면 위도/경도 입력란에 반영
  useEffect(() => {
    if (selectedLocation) {
      setLat(selectedLocation.lat.toFixed(6));
      setLng(selectedLocation.lng.toFixed(6));
    } else {
      setLat("");
      setLng("");
    }
  }, [selectedLocation]);

  // 수수료 방식일 때 임대료를 자동으로 계산
  useEffect(() => {
    if (rentType === 'commission') {
      const sales2025 = yearlySales.find(s => s.year === 2025)?.amount || 0;
      const comm = parseFloat(rentCommission) || 0;
      const calculatedRent = Math.ceil(sales2025 * (comm / 100));
      // rent 상태는 만원 단위
      setRent((calculatedRent / 10000).toString());
    }
  }, [rentType, rentCommission, yearlySales]);

  // 폼을 초기 상태로 리셋하는 함수
  const handleResetForm = () => {
    setEditingId(null);
    setName("");
    setBrand("");
    setBrandCategory("competitor");
    setStatus(mode === 'iic' ? "Plan" : "Open");
    setLat("");
    setLng("");
    setArea("");
    setRent("");
    setRentType('fixed');
    setRentCommission("");
    setDeposit("");
    setInvestment("");
    setOperatingProfitRatio("");
    setOpenDate("");
    setContractStart("");
    setContractEnd("");
    setYearlySales([]);
    setNotes("");
    setAddress("");
    setCity("");
    setCountry("");
    onSelectionChange(null);
  };

  // 좌표로부터 주소/도시/국가 정보를 가져오는 역지오코딩 함수
  const handleReverseGeocode = async () => {
    if (!window.google?.maps?.Geocoder) {
      toast.error("Google Maps API가 아직 로드되지 않았습니다.");
      return;
    }

    if (!lat || !lng) {
      toast.error("위도/경도를 먼저 입력해주세요.");
      return;
    }

    setIsGeocodingLoading(true);
    try {
      const geocoder = new window.google.maps.Geocoder();
      const latlng = { lat: parseFloat(lat), lng: parseFloat(lng) };

      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const addressComponents = results[0].address_components;
          let newCity = '';
          let newCountry = '';

          for (const component of addressComponents) {
            if (component.types.includes('locality')) {
              newCity = component.long_name;
            } else if (component.types.includes('administrative_area_level_1') && !newCity) {
              newCity = component.long_name;
            }
            if (component.types.includes('country')) {
              newCountry = component.short_name === 'US' ? 'USA' :
                        component.short_name === 'GB' ? 'UK' :
                        component.short_name === 'KR' ? 'South Korea' :
                        convertKoreanCountryToEnglish(component.long_name);
            }
          }

          setCity(newCity || city);
          setCountry(newCountry || country);
          setAddress(results[0].formatted_address || address);

          toast.success(`위치 정보가 업데이트되었습니다: ${newCity}, ${newCountry}`);
        } else {
          toast.error('좌표로부터 주소를 찾을 수 없습니다.');
        }
        setIsGeocodingLoading(false);
      });
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      toast.error('주소 검색 중 오류가 발생했습니다.');
      setIsGeocodingLoading(false);
    }
  };

  // 매장/브랜드를 저장(추가 또는 수정)하는 함수
  const handleAddEntity = async () => {
    // 필수 항목 유효성 검사
    if (!name) {
      toast.error("Name is required");
      return;
    }
    if (!lat || !lng) {
      toast.error("Location is required");
      return;
    }

    const isUpdate = !!editingId;
    const newId = editingId || Date.now().toString();
    const todayStr = new Date().toISOString().split("T")[0];

    // IIC 매장의 경우 상태 변경 날짜를 추적
    let changOpenDate = "";
    let changCloseDate = "";

    if (mode === 'iic') {
      const existing = existingEntities.find(e => e.id === editingId) as any;
      const oldStatus = existing?.status;
      const existingOpenDate = existing?.ChangOpenDate || "";
      const existingCloseDate = existing?.ChangCloseDate || "";

      // Open 상태로 변경되면 오픈 날짜를 오늘로 기록
      if ((!isUpdate && status === 'Open') || (isUpdate && oldStatus !== 'Open' && status === 'Open')) {
        changOpenDate = todayStr;
      } else if (isUpdate && oldStatus === 'Open' && status !== 'Open') {
        changOpenDate = ""; // Open에서 다른 상태로 변하면 빈값으로 초기화
      } else if (isUpdate) {
        changOpenDate = existingOpenDate;
      }

      // Close 상태로 변경되면 폐점 날짜를 오늘로 기록
      if ((!isUpdate && status === 'Close') || (isUpdate && oldStatus !== 'Close' && status === 'Close')) {
        changCloseDate = todayStr;
      } else if (isUpdate && oldStatus === 'Close' && status !== 'Close') {
        changCloseDate = ""; // Close에서 다른 상태로 변하면 빈값으로 초기화
      } else if (isUpdate) {
        changCloseDate = existingCloseDate;
      }
    }

    // 저장할 엔티티 객체 생성
    const newEntity: SavedEntity = {
      id: newId,
      type: mode,
      name,
      brand,
      location: {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      },
      status: mode === 'competitor' ? 'Open' : status,
      area: area ? parseFloat(area) : undefined,
      monthlyRent: rent ? parseFloat(rent) : undefined,
      deposit: deposit ? parseFloat(deposit) : undefined,
      createdAt: isUpdate ? (existingEntities.find(e => e.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    };

    try {
      // 서버에 저장할 통합 Store 객체 형식
      const storeData: any = {
          id: newId,
          code: isUpdate ? (existingEntities.find(e => e.id === editingId) as any)?.code || `${mode.toUpperCase()}-${newId}` : `${mode.toUpperCase()}-${newId}`,
          name: newEntity.name,
          brand: newEntity.brand,
          brandCategory: mode === 'iic' ? 'iic' : brandCategory,
          status: newEntity.status,
          ChangOpenDate: changOpenDate,
          ChangCloseDate: changCloseDate,
          type: 'FS', // 기본 채널 유형
          location: {
              ...newEntity.location,
              address: address || notes || 'Unknown',
              city: city || 'Seoul',
              country: country || 'South Korea',
              region: city || '한국'
          },
          area: newEntity.area || 0,
          openDate: openDate || undefined,
          contract: {
              startDate: contractStart || '',
              endDate: contractEnd || '',
              renewalOption: false
          },
          financial: {
              monthlyRent: (newEntity.monthlyRent || 0) * 10000,
              monthlySales: displayedMonthlySales,
              investment: (investment ? parseFloat(investment) : 0) * 10000,
              expectedOperatingProfitRatio: operatingProfitRatio ? parseFloat(operatingProfitRatio) : undefined,
              salesPerSqm: (area && parseFloat(area) > 0) ? Math.ceil(displayedMonthlySales / parseFloat(area)) : 0,
              deposit: (newEntity.deposit || 0) * 10000,
              currency: 'KRW',
              rentType,
              rentCommission: rentCommission ? parseFloat(rentCommission) : undefined,
              yearlySales: yearlySales
          },
          images: {},
          createdAt: newEntity.createdAt,
          updatedAt: newEntity.createdAt,
          isCompetitor: mode === 'competitor' // 경쟁사 여부 플래그
      };

      // 수정이면 update, 신규이면 add API 호출
      if (isUpdate) {
        if (mode === 'iic') {
          await dataClient.updateIICStore(newId, storeData);
        } else {
          await dataClient.updateCompStore(newId, storeData);
        }
      } else {
        if (mode === 'iic') {
          await dataClient.addStore(storeData);
        } else {
          await dataClient.addCompStore(storeData);
        }
      }

      // 로컬 상태 업데이트
      let updatedEntities;
      if (isUpdate) {
        updatedEntities = existingEntities.map(e => e.id === editingId ? newEntity : e);
      } else {
        updatedEntities = [newEntity, ...existingEntities];
      }

      onEntitiesUpdate(updatedEntities);
      toast.success(`${mode === 'iic' ? 'IIC Store' : 'Competitor'} ${isUpdate ? 'updated' : 'saved'}!`);
      handleResetForm();
      // onModeChange(false); // 연속 추가를 위해 지도 클릭 모드는 유지
    } catch (error: any) {
      console.error("Failed to save:", error);
      toast.error(`Failed to save: ${error.message}`);
    }
  };

  // 저장된 항목을 삭제하는 함수
  const handleDeleteEntity = async (id: string) => {
    try {
        if (mode === 'iic') {
            await dataClient.deleteStore(id);
        } else {
            await dataClient.deleteCompStore(id);
        }
        const updated = existingEntities.filter(e => e.id !== id);
        onEntitiesUpdate(updated);
        toast.success("Item deleted");
    } catch (error) {
        console.error("Failed to delete:", error);
        toast.error("Failed to delete");
    }
  };

  // 기존 항목을 수정하기 위해 폼에 데이터를 불러오는 함수
  const handleEditItem = (entity: SavedEntity) => {
    setEditingId(entity.id);
    setName(entity.name);
    setBrand(entity.brand);
    setStatus(entity.status);
    setLat(entity.location.lat.toString());
    setLng(entity.location.lng.toString());
    setArea(entity.area?.toString() || "");
    setRent(entity.monthlyRent?.toString() || "");
    setDeposit(entity.deposit?.toString() || "");

    // 전체 매장 데이터가 있는 경우 재무 정보도 불러옴
    const store = (entity as any).fullStoreData;
    if (store?.financial) {
      setRentType(store.financial.rentType || 'fixed');
      setRentCommission(store.financial.rentCommission?.toString() || "");
      setInvestment(store.financial.investment ? (store.financial.investment / 10000).toString() : "");
      setOperatingProfitRatio(store.financial.expectedOperatingProfitRatio?.toString() || "");
      setYearlySales(store.financial.yearlySales || []);
      setOpenDate(store.openDate || "");
      setContractStart(store.contract?.startDate || "");
      setContractEnd(store.contract?.endDate || "");
    }

    // 지도에서 해당 항목으로 이동
    onFocusEntity(entity);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r w-[350px]">
      {/* 패널 헤더: 모드에 따라 다른 제목과 아이콘 표시 */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          {mode === 'iic' ? (
            <Building2 className="w-5 h-5 text-blue-600" />
          ) : (
            <Users className="w-5 h-5 text-orange-600" />
          )}
          <h2 className="font-bold text-lg text-gray-900">
            {mode === 'iic' ? 'IIC Store Manager' : 'Competitor & Preferred Manager'}
          </h2>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* 추가/수정 폼 섹션 */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                {editingId ? 'Edit Item' : (mode === 'iic' ? 'Add IIC Store' : 'Add Brand')}
              </h3>
              {/* 지도 클릭 모드 토글 버튼 */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Map Click Mode</span>
                <Button
                  variant={isAddMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => onModeChange(!isAddMode)}
                  className={isAddMode ? "bg-blue-600" : ""}
                >
                  {isAddMode ? "ON" : "OFF"}
                </Button>
              </div>
            </div>

            <Card className="border-gray-200 shadow-sm">
              <CardContent className="p-4 space-y-4">
                {/* 기본 정보 입력란 */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Basic Information</Label>
                  <Input
                    placeholder="Name"
                    className="h-8 text-xs"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {/* 경쟁사 모드일 때 Competitor/Preferred 구분 버튼 */}
                  {mode === 'competitor' && (
                    <div className="flex gap-2">
                      <Button
                        variant={brandCategory === 'competitor' ? "default" : "outline"}
                        size="sm"
                        className="flex-1 h-8 text-[10px]"
                        onClick={() => setBrandCategory('competitor')}
                      >
                        Competitor
                      </Button>
                      <Button
                        variant={brandCategory === 'preferred' ? "default" : "outline"}
                        size="sm"
                        className="flex-1 h-8 text-[10px]"
                        onClick={() => setBrandCategory('preferred')}
                      >
                        Preferred
                      </Button>
                    </div>
                  )}
                  {/* 브랜드 선택 드롭다운 */}
                  <Select value={brand} onValueChange={setBrand}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select Brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {(mode === 'iic'
                        ? IIC_BRANDS
                        : (brandCategory === 'competitor' ? availableCompetitorBrands : availablePreferredBrands)
                      ).map((b) => (
                        <SelectItem key={b} value={b} className="text-xs">
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* IIC 모드일 때만 파이프라인 상태 선택 */}
                  {mode === 'iic' && (
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Plan">Plan</SelectItem>
                      <SelectItem value="Confirm">Confirm</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Space">Space</SelectItem>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Close">Close</SelectItem>
                    </SelectContent>
                  </Select>
                  )}
                </div>

                {/* 위치 정보 입력란 */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Location (Click Map or Enter)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Lat"
                      className="h-8 text-xs"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      type="number"
                    />
                    <Input
                      placeholder="Lng"
                      className="h-8 text-xs"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      type="number"
                    />
                  </div>
                  {/* 좌표 → 주소/도시/국가 자동 변환 버튼 */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleReverseGeocode}
                    disabled={isGeocodingLoading || !lat || !lng}
                    className="w-full h-8 text-[10px]"
                  >
                    {isGeocodingLoading ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        로딩 중...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3 h-3 mr-2" />
                        좌표로부터 도시/국가 정보 가져오기
                      </>
                    )}
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="도시"
                      className="h-8 text-xs"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                    <Input
                      placeholder="국가"
                      className="h-8 text-xs"
                      value={country}
                      onChange={(e) => {
                        const value = e.target.value;
                        // 한국어 국가명 입력 시 자동으로 영문으로 변환
                        setCountry(convertKoreanCountryToEnglish(value));
                      }}
                    />
                  </div>
                  <Input
                    placeholder="주소"
                    className="h-8 text-xs"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                {/* 날짜 및 계약 정보 (현재 숨김 처리 - false 조건으로 렌더링 안 됨) */}
                {false && mode === 'iic' && (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Dates & Contract</Label>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-gray-400">오픈일</Label>
                    <Input
                      type="text"
                      placeholder="YYYY-MM-DD (또는 YYYY-DD-MM)"
                      className="h-8 text-xs"
                      value={openDate}
                      onChange={(e) => setOpenDate(smartDateParse(e.target.value))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-400">계약 시작</Label>
                      <Input
                        type="text"
                        placeholder="YYYY-MM-DD"
                        className="h-8 text-xs"
                        value={contractStart}
                        onChange={(e) => setContractStart(smartDateParse(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-400">계약 종료</Label>
                      <Input
                        type="text"
                        placeholder="YYYY-MM-DD"
                        className="h-8 text-xs"
                        value={contractEnd}
                        onChange={(e) => setContractEnd(smartDateParse(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
                )}

                {/* 재무 정보 (현재 숨김 처리) */}
                {false && mode === 'iic' && (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Financials (만원 단위)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Area (㎡)"
                      className="h-8 text-xs"
                      value={formatWithCommas(area)}
                      onChange={(e) => setArea(parseNumber(e.target.value))}
                    />
                    <div className="space-y-1">
                      <select
                        className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-[10px] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={rentType}
                        onChange={(e) => setRentType(e.target.value as 'fixed' | 'commission')}
                      >
                        <option value="fixed">고정</option>
                        <option value="commission">수수료</option>
                      </select>
                    </div>
                  </div>

                  {rentType === 'commission' && (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="수수료 (%)"
                        className="h-8 text-xs"
                        value={formatWithCommas(rentCommission)}
                        onChange={(e) => setRentCommission(parseNumber(e.target.value))}
                      />
                      <div className="flex items-center text-[10px] text-gray-400 italic">
                        매출 × % 자동계산
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="임대료 (월)"
                      className={`h-8 text-xs ${rentType === 'commission' ? 'bg-gray-50' : ''}`}
                      disabled={rentType === 'commission'}
                      value={formatWithCommas(rent)}
                      onChange={(e) => setRent(parseNumber(e.target.value))}
                    />
                    <Input
                      placeholder="보증금"
                      className="h-8 text-xs"
                      value={formatWithCommas(deposit)}
                      onChange={(e) => setDeposit(parseNumber(e.target.value))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-400">월 매출 (자동 계산)</Label>
                      <Input
                        placeholder="자동 계산"
                        disabled
                        className="h-8 text-xs bg-gray-50"
                        value={formatWithCommas(displayedMonthlySales / 10000)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-400">투자비</Label>
                      <Input
                        placeholder="투자비"
                        className="h-8 text-xs"
                        value={formatWithCommas(investment)}
                        onChange={(e) => setInvestment(parseNumber(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] text-gray-400">예상 영업이익률 (%)</Label>
                    <Input
                      placeholder="%"
                      className="h-8 text-xs"
                      value={operatingProfitRatio}
                      onChange={(e) => setOperatingProfitRatio(e.target.value)}
                      type="number"
                    />
                  </div>
                </div>
                )}

                {/* 연간 매출 입력 (현재 숨김 처리) */}
                {false && mode === 'iic' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-500">연 매출 (만원 단위)</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => {
                        const currentYear = new Date().getFullYear();
                        const nextYear = yearlySales.length > 0
                          ? Math.min(...yearlySales.map(s => s.year)) - 1
                          : currentYear;
                        setYearlySales([...yearlySales, { year: nextYear, amount: 0 }].sort((a, b) => b.year - a.year));
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" /> 추가
                    </Button>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {yearlySales.map((item, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <select
                          className="h-7 rounded-md border text-[10px] px-1 bg-white"
                          value={item.year}
                          onChange={(e) => {
                            const updated = [...yearlySales];
                            updated[index] = { ...updated[index], year: Number(e.target.value) };
                            setYearlySales(updated.sort((a, b) => b.year - a.year));
                          }}
                        >
                          {Array.from({ length: 11 }, (_, i) => 2030 - i).map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                        <Input
                          placeholder="매출"
                          className="h-7 text-[10px] flex-1"
                          value={formatWithCommas(item.amount / 10000)}
                          onChange={(e) => {
                            const val = Number(parseNumber(e.target.value)) * 10000;
                            const updated = [...yearlySales];
                            updated[index] = { ...updated[index], amount: val };
                            setYearlySales(updated);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500"
                          onClick={() => setYearlySales(yearlySales.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                )}

                {/* 메모 입력란 */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Notes</Label>
                  <Textarea
                    placeholder="Additional notes..."
                    className="text-xs min-h-[60px]"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {/* 저장/초기화 버튼 */}
                <div className="pt-2 flex flex-col gap-2">
                  <Button onClick={handleAddEntity} className="w-full bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" /> {editingId ? 'Update' : 'Save'} {mode === 'iic' ? 'Store' : 'Item'}
                  </Button>
                  <Button variant="ghost" onClick={handleResetForm} className="w-full text-xs h-8 text-gray-500">
                    <RotateCcw className="w-3 h-3 mr-2" /> {editingId ? 'Cancel Edit' : 'Reset Form'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 저장된 항목 목록 섹션 */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Saved Items</h3>
              <Badge variant="secondary" className="text-xs font-normal">
                {existingEntities.filter(e => e.type === mode).length} items
              </Badge>
            </div>

            <div className="space-y-2">
              {existingEntities.filter(e => e.type === mode).length === 0 ? (
                // 저장된 항목이 없을 때 표시하는 빈 상태 메시지
                <div className="text-center py-8 text-gray-400 text-sm border rounded-lg bg-gray-50 border-dashed">
                  No items added yet.
                </div>
              ) : (
                // 저장된 항목 카드 목록
                existingEntities
                  .filter(e => e.type === mode)
                  .map(entity => (
                  <div key={entity.id} className="bg-white border rounded-lg p-3 shadow-sm flex items-start gap-3 group hover:border-blue-200 transition-colors">
                    <div className="mt-1">
                       {mode === 'iic' ? (
                         <Building2 className="w-4 h-4 text-blue-500" />
                       ) : (
                         <Users className="w-4 h-4 text-orange-500" />
                       )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-gray-900 truncate">
                          {entity.name.length > 15 ? `${entity.name.substring(0, 15)}...` : entity.name}
                        </span>
                        <Badge className={`${getStatusColor(entity.status)} text-white border-0 text-[10px] h-5 px-1`}>{entity.status}</Badge>
                      </div>
                      <div className="text-[10px] text-gray-500 space-y-0.5">
                        <div>{entity.brand}</div>
                        <div className="truncate">{entity.location.lat.toFixed(4)}, {entity.location.lng.toFixed(4)}</div>
                      </div>
                    </div>
                    {/* 수정/보기/삭제 버튼 (hover 시 표시) */}
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditItem(entity)}>
                        <Edit2 className="w-3 h-3 text-gray-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onFocusEntity(entity)}>
                        <Eye className="w-3 h-3 text-gray-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-red-50" onClick={() => handleDeleteEntity(entity.id)}>
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
