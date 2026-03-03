// ============================================================
// StoreDetail 컴포넌트
// 오픈된 IIC 매장(Open 상태)의 상세 정보를 보여주는 오른쪽 사이드 패널입니다.
// 개요, P&L(손익), 이미지, 협상 이력, 리뷰 탭으로 구성됩니다.
// ============================================================

import {
  X,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  MessageSquare,
  Download,
  Users,
  Square,
  Upload,
  Package,
  ArrowRightLeft,
  Trophy,
  Star,
  Search,
  Camera,
  Clock,
  Edit2,
  Trash2,
  Plus,
} from "lucide-react";
import type { Store } from "../../types";
import { getStoreClass } from "../../types";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { useState, useMemo, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { toast } from "sonner";

// 한국어 국가명을 영어로 변환하는 헬퍼 함수
const convertKoreanCountryToEnglish = (
  countryName: string,
): string => {
  // 한국어 국가명 → 영어 국가명 매핑 테이블
  const countryMap: { [key: string]: string } = {
    대한민국: "South Korea",
    한국: "South Korea",
    미국: "USA",
    영국: "UK",
    프랑스: "France",
    독일: "Germany",
    이탈리아: "Italy",
    스페인: "Spain",
    중국: "China",
    일본: "Japan",
    싱가포르: "Singapore",
    태국: "Thailand",
    베트남: "Vietnam",
    말레이시아: "Malaysia",
    인도네시아: "Indonesia",
    필리핀: "Philippines",
    캐나다: "Canada",
    멕시코: "Mexico",
    호주: "Australia",
    오스트레일리아: "Australia",
    뉴질랜드: "New Zealand",
    인도: "India",
    브라질: "Brazil",
    아르헨티나: "Argentina",
    남아프리카공화국: "South Africa",
    남아프리카: "South Africa",
    러시아: "Russia",
    아랍에미리트: "UAE",
    UAE: "UAE",
    사우디아라비아: "Saudi Arabia",
    홍콩: "Hong Kong",
    대만: "Taiwan",
    마카오: "Macau",
  };

  const result = countryMap[countryName] || countryName;
  console.log(
    `Country conversion: "${countryName}" → "${result}"`,
  );
  return result;
};

// 컴포넌트가 받는 속성(props) 정의
interface StoreDetailProps {
  store: Store;          // 표시할 매장 데이터
  onClose: () => void;   // 패널 닫기 콜백
  activeTab?: string;    // 초기 활성 탭 (현재는 사용 안 함)
  onUpdate: (updatedStore: Store) => Promise<void>;  // 매장 정보 업데이트 콜백
  onDelete?: (storeId: string) => Promise<void>;      // 매장 삭제 콜백
}

// 파이프라인 상태별 배경 색상 매핑
const STATUS_COLORS = {
  Plan: "bg-[#64748B]",
  Confirm: "bg-[#9694FF]",
  Contract: "bg-[#EE99C2]",
  Space: "bg-sky-500",
  Open: "bg-[#7FC7D9]",
  Close: "bg-gray-500",
  Planed: "bg-[#64748B]",
  Confirmed: "bg-[#9694FF]",
  Signed: "bg-[#EE99C2]",
  Construction: "bg-sky-500",
};

/**
 * 오픈 매장 상세 정보 패널
 * 매장을 클릭하면 화면 오른쪽에 슬라이드되어 나타납니다.
 */
export function StoreDetail({
  store,
  onClose,
  activeTab,
  onUpdate,
  onDelete,
}: StoreDetailProps) {
  // 수정 폼 데이터 상태 - 각 필드의 현재 입력값을 저장합니다
  const [editData, setEditData] = useState({
    name: store.name,
    status: store.status,
    brand: store.brand,
    type: store.type || "",
    city: store.location.city || "",
    country: store.location.country || "",
    address: store.location.address || "",
    lat: store.location.lat,
    lng: store.location.lng,
    area: store.area || 0,
    openDate: store.openDate || "",
    contract: {
      startDate: store.contract?.startDate || "",
      endDate: store.contract?.endDate || "",
    },
    financial: {
      monthlyRent: store.financial?.monthlyRent || 0,
      currency: store.financial?.currency || "KRW",
      monthlySales: store.financial?.monthlySales || 0,
      salesPerSqm: store.financial?.salesPerSqm || 0,
      investment: store.financial?.investment || 0,
      deposit: store.financial?.deposit || 0,
      rentType: store.financial?.rentType || "fixed",
      rentCommission: store.financial?.rentCommission || 0,
      yearlySales: store.financial?.yearlySales || [],
    },
    images: {
      front: store.images?.front || "",
      side: store.images?.side || "",
      interior: store.images?.interior || "",
      floorplan: store.images?.floorplan || "",
    },
  });

  // 연 매출 기반 월 매출 자동 계산 (현재 연도 기준)
  const displayedMonthlySales = useMemo(() => {
    const currentYear = 2025;
    const today = new Date("2025-12-27");
    const openDateObj = new Date(editData.openDate);
    const openYear = openDateObj.getFullYear();
    // 2025년 연 매출 금액
    const sales2025 =
      editData.financial.yearlySales.find(
        (s) => s.year === currentYear,
      )?.amount || 0;

    if (openYear === currentYear) {
      // 올해 오픈한 경우: 영업 개월 수로 나눔
      const yearsDiff =
        today.getFullYear() - openDateObj.getFullYear();
      const monthsDiff =
        today.getMonth() - openDateObj.getMonth();
      const monthsElapsed = yearsDiff * 12 + monthsDiff;
      const divisor = monthsElapsed - 12;
      return divisor > 0 ? Math.ceil(sales2025 / divisor) : 0;
    } else if (openYear < currentYear) {
      // 이전 연도 오픈: 12개월로 나눔
      return Math.ceil(sales2025 / 12);
    }
    return 0;
  }, [editData.openDate, editData.financial.yearlySales]);

  // 다이얼로그 표시 여부 상태들
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] =
    useState(false);

  // 협상 노트 관련 상태
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // Google Maps 리뷰 및 사진 상태
  const [reviews, setReviews] = useState<
    google.maps.places.PlaceReview[]
  >([]);
  const [placePhotos, setPlacePhotos] = useState<
    google.maps.places.PlacePhoto[]
  >([]);
  const [popularTimes, setPopularTimes] = useState<
    { hour: string; value: number }[]
  >([]);
  const [isLoadingReviews, setIsLoadingReviews] =
    useState(false);
  const [reviewPlaceId, setReviewPlaceId] = useState<
    string | null
  >(null);

  // 매장이 변경되면 리뷰 초기화
  useEffect(() => {
    setReviews([]);
    setPlacePhotos([]);
    setPopularTimes([]);
    setReviewPlaceId(null);
  }, [store.id]);

  // 협상 이력 편집 상태
  const [editingHistoryIndex, setEditingHistoryIndex] =
    useState<number | null>(null);
  const [historyDate, setHistoryDate] = useState("");
  const [historyNotes, setHistoryNotes] = useState("");
  const [historyUser, setHistoryUser] = useState("");

  // 매장 데이터가 변경되면 수정 폼 데이터도 업데이트
  useEffect(() => {
    setEditData({
      name: store.name,
      status: store.status,
      brand: store.brand,
      type: store.type || "",
      city: store.location.city || "",
      country: store.location.country || "",
      address: store.location.address || "",
      lat: store.location.lat,
      lng: store.location.lng,
      area: store.area || 0,
      openDate: store.openDate || "",
      contract: {
        startDate: store.contract?.startDate || "",
        endDate: store.contract?.endDate || "",
      },
      financial: {
        monthlyRent: store.financial?.monthlyRent || 0,
        currency: store.financial?.currency || "KRW",
        monthlySales: store.financial?.monthlySales || 0,
        salesPerSqm: store.financial?.salesPerSqm || 0,
        investment: store.financial?.investment || 0,
        deposit: store.financial?.deposit || 0,
        rentType: store.financial?.rentType || "fixed",
        rentCommission: store.financial?.rentCommission || 0,
        yearlySales: store.financial?.yearlySales || [],
      },
      images: {
        front: store.images?.front || "",
        side: store.images?.side || "",
        interior: store.images?.interior || "",
        floorplan: store.images?.floorplan || "",
      },
    });
  }, [store]);

  // 임대료 표시값 (현재는 고정 임대료 그대로 반환)
  const displayRentValue = useMemo(() => {
    return store.financial?.monthlyRent || 0;
  }, [store.financial]);

  // 숫자에 천 단위 쉼표를 추가하는 함수
  const formatWithCommas = (
    val: string | number | undefined,
  ) => {
    if (val === undefined || val === null || val === "")
      return "";
    const s = val.toString().replace(/,/g, "");
    if (isNaN(Number(s))) return val.toString();
    return Number(s).toLocaleString();
  };

  // 쉼표가 포함된 숫자 문자열에서 쉼표를 제거하는 함수
  const parseNumber = (val: string) => {
    return val.replace(/,/g, "");
  };

  // 다양한 날짜 형식을 YYYY-MM-DD로 변환하는 함수
  const smartDateParse = (value: string): string => {
    if (!value) return "";
    // 숫자와 구분자 이외의 문자 제거, 점(.)을 하이픈(-)으로 변환
    let cleaned = value
      .replace(/[^0-9.-]/g, "")
      .replace(/\./g, "-");
    const parts = cleaned.split("-");

    if (parts.length === 3) {
      const year = parts[0];
      const p1 = parts[1];
      const p2 = parts[2];

      if (year.length === 4) {
        const val1 = parseInt(p1, 10);
        const val2 = parseInt(p2, 10);

        // p1이 12보다 크면 YYYY-DD-MM 형식으로 판단
        if (val1 > 12 && val2 <= 12) {
          return `${year}-${p2.padStart(2, "0")}-${p1.padStart(2, "0")}`;
        }
        // 일반적인 YYYY-MM-DD 형식
        return `${year}-${p1.padStart(2, "0")}-${p2.padStart(2, "0")}`;
      }
    }
    return value;
  };

  // 연 매출 데이터를 차트용 형식으로 변환하는 함수
  const yearlyTrendData = useMemo(() => {
    if (!store.financial?.yearlySales) return [];
    return [...store.financial.yearlySales]
      .sort((a, b) => a.year - b.year)
      .map((s) => ({
        year: `${s.year}년`,
        amount: Math.round(s.amount / 10000), // 만원 단위로 변환
      }));
  }, [store.financial?.yearlySales]);

  // 재고 흐름 차트용 목 데이터 (현재 미사용)
  const stockFlowData = useMemo(() => {
    return [
      { region: "서울 물류센터", in: 120, out: 40 },
      { region: "경기 동부", in: 80, out: 30 },
      { region: "인천 공항", in: 40, out: 90 },
      { region: "부산 항만", in: 20, out: 10 },
    ];
  }, []);

  // 상위 제품 목 데이터 (현재 미사용)
  const topProductsData = useMemo(() => {
    return [
      {
        name: "Gentle Monster X 01",
        sales: 1200,
        growth: "+12%",
      },
      { name: "Lang 01", sales: 980, growth: "+5%" },
      { name: "Lilit 01", sales: 850, growth: "-2%" },
      { name: "Roda 02", sales: 720, growth: "+8%" },
      { name: "Tam 01", sales: 650, growth: "+15%" },
      { name: "Nudake Cake A", sales: 500, growth: "+20%" },
      { name: "Hand Cream 000", sales: 480, growth: "+3%" },
      { name: "Perfume Chamo", sales: 450, growth: "+1%" },
      { name: "Bold Collection", sales: 300, growth: "+30%" },
      { name: "Margiela Collab", sales: 250, growth: "-5%" },
    ];
  }, []);

  // Google Places API를 사용해 매장의 리뷰와 사진을 가져오는 함수
  const fetchGoogleReviews = async () => {
    if (!window.google?.maps?.places?.Place) {
      toast.error(
        "Google Maps API가 아직 로드되지 않았습니다.",
      );
      return;
    }

    setIsLoadingReviews(true);
    try {
      // 매장명 + 브랜드로 장소 검색 요청 생성
      const request = {
        textQuery: `${store.name} ${store.brand}`,
        fields: ["id", "reviews", "photos", "displayName"],
        locationBias: {
          center: {
            lat: store.location.lat,
            lng: store.location.lng,
          },
          radius: 500, // 500m 반경 내 검색
        },
      };

      const { places } =
        await window.google.maps.places.Place.searchByText(
          request,
        );

      if (places && places.length > 0) {
        const place = places[0];

        // 리뷰와 사진 필드 추가 로드
        await place.fetchFields({
          fields: ["reviews", "photos"],
        });

        if (place.reviews && place.reviews.length > 0) {
          // 최신 리뷰가 먼저 표시되도록 날짜 기준 정렬
          const sortedReviews = [...place.reviews].sort(
            (a, b) => {
              const timeA = a.publishTime
                ? a.publishTime.getTime()
                : 0;
              const timeB = b.publishTime
                ? b.publishTime.getTime()
                : 0;
              return timeB - timeA;
            },
          );
          setReviews(sortedReviews);
          setReviewPlaceId(place.id);
        } else {
          setReviews([]);
        }

        if (place.photos && place.photos.length > 0) {
          setPlacePhotos(place.photos);
        } else {
          setPlacePhotos([]);
        }

        // 인기 시간대 목 데이터 생성 (실제 API에서는 제공되지 않아 시뮬레이션)
        const mockPopularTimes = Array.from(
          { length: 24 },
          (_, i) => {
            let value = 0;
            const hour = i;
            if (hour >= 10 && hour <= 22) {
              if (hour >= 12 && hour <= 13)
                value = Math.floor(Math.random() * 30) + 60;
              else if (hour >= 18 && hour <= 19)
                value = Math.floor(Math.random() * 30) + 70;
              else value = Math.floor(Math.random() * 40) + 20;
            } else {
              value = Math.floor(Math.random() * 5);
            }
            return { hour: `${hour}`, value };
          },
        );
        setPopularTimes(mockPopularTimes);

        if (
          (place.reviews && place.reviews.length > 0) ||
          (place.photos && place.photos.length > 0)
        ) {
          toast.success(
            `${place.displayName || store.name}의 정보를 가져왔습니다.`,
          );
        } else {
          toast.info("이 장소에 대한 리뷰나 사진이 없습니다.");
        }
      } else {
        toast.error("Google Maps에서 장소를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      toast.error("리뷰를 가져오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingReviews(false);
    }
  };

  // 파일 첨부 핸들러 - 선택된 파일 목록을 상태에 저장
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files) {
      setAttachedFiles(Array.from(e.target.files));
    }
  };

  // 협상 노트 제출 핸들러 (현재는 콘솔에 출력만 함)
  const handleSubmitNote = () => {
    console.log("Note submitted:", {
      title: noteTitle,
      content: noteContent,
      files: attachedFiles,
      storeId: store.id,
    });

    setNoteTitle("");
    setNoteContent("");
    setAttachedFiles([]);
    setShowNoteDialog(false);
  };

  // 금액 형식 변환 함수 (통화에 따라 다르게 표시)
  const formatCurrency = (
    amount: number | undefined,
    currency: string,
  ) => {
    if (amount === undefined || amount === null) return "N/A";
    if (currency === "KRW") {
      if (amount >= 100000000) {
        return `₩${Math.round(amount / 100000000).toLocaleString()}억`;
      }
      return `₩${Math.round(amount / 10000).toLocaleString()}만`;
    }
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  };

  // 날짜 문자열을 한국어 형식으로 변환하는 함수
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "미정";
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // 수정 다이얼로그 열기
  const handleEditStore = () => {
    setShowEditDialog(true);
  };

  // 수정 내용을 저장하는 함수 - 상태 변경 날짜도 자동으로 기록
  const handleSaveEdit = async () => {
    // 상태가 Open/Close로 변경된 경우 날짜를 자동으로 기록
    const todayStr = new Date().toISOString().split("T")[0];
    let changOpenDate = store.ChangOpenDate || "";
    let changCloseDate = store.ChangCloseDate || "";

    // Open 상태로 변경된 경우
    if (store.status !== "Open" && editData.status === "Open") {
      changOpenDate = todayStr;
    } else if (
      store.status === "Open" &&
      editData.status !== "Open"
    ) {
      changOpenDate = ""; // Open에서 다른 상태로 변하면 빈값
    }

    // Close 상태로 변경된 경우
    if (
      store.status !== "Close" &&
      editData.status === "Close"
    ) {
      changCloseDate = todayStr;
    } else if (
      store.status === "Close" &&
      editData.status !== "Close"
    ) {
      changCloseDate = ""; // Close에서 다른 상태로 변하면 빈값
    }

    // 변경된 데이터로 매장 객체 생성
    const updatedStore: Store = {
      ...store,
      name: editData.name,
      status: editData.status,
      brand: editData.brand,
      type: editData.type,
      ChangOpenDate: changOpenDate,
      ChangCloseDate: changCloseDate,
      location: {
        ...store.location,
        city: editData.city,
        country: editData.country,
        address: editData.address,
        lat: editData.lat,
        lng: editData.lng,
      },
      area: editData.area,
      openDate: editData.openDate,
      contract: {
        ...store.contract,
        startDate: editData.contract.startDate,
        endDate: editData.contract.endDate,
        renewalOption: store.contract?.renewalOption || false,
      },
      financial: {
        ...store.financial,
        monthlyRent: editData.financial.monthlyRent,
        currency: editData.financial.currency,
        // 월 매출은 자동 계산 값 사용
        monthlySales: isNaN(displayedMonthlySales)
          ? 0
          : displayedMonthlySales,
        // 평당 매출은 면적으로 나눠서 자동 계산
        salesPerSqm:
          editData.area > 0
            ? Math.ceil(
                (isNaN(displayedMonthlySales)
                  ? 0
                  : displayedMonthlySales) / editData.area,
              )
            : 0,
        investment: editData.financial.investment,
        deposit: editData.financial.deposit,
        rentType: "Fixed",
        rentCommission: editData.financial.rentCommission,
        yearlySales: editData.financial.yearlySales,
        // P&L 필드는 PnLView에서 수정된 값을 그대로 유지
        cogs: (store.financial as any)?.cogs,
        depreciation: (store.financial as any)?.depreciation,
        payment: (store.financial as any)?.payment,
        others: (store.financial as any)?.others,
        personnelCost: (store.financial as any)?.personnelCost,
        estimatedSales: (store.financial as any)?.estimatedSales,
        estimatedMargin: (store.financial as any)?.estimatedMargin,
      },
      images: {
        ...store.images,
        front: editData.images.front,
        side: editData.images.side,
        interior: editData.images.interior,
        floorplan: editData.images.floorplan,
      },
    };
    await onUpdate(updatedStore);
    toast.success(
      `${editData.name} 정보가 업데이트되었습니다.`,
    );
    setShowEditDialog(false);
  };

  // 매장 삭제 함수 - 확인 후 삭제 처리
  const handleDeleteStore = async () => {
    if (
      !confirm(
        `${store.name} 매장을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`,
      )
    ) {
      return;
    }

    try {
      if (onDelete) {
        await onDelete(store.id);
        toast.success(`${store.name} 매장이 삭제되었습니다.`);
        onClose();
      } else {
        toast.error("삭제 기능을 사용할 수 없습니다.");
      }
    } catch (error) {
      console.error("Failed to delete store:", error);
      toast.error(`매장 삭제에 실패했습니다: ${error}`);
    }
  };

  // 좌표(위도/경도)로부터 주소 정보를 자동으로 채우는 함수
  const handleReverseGeocode = async () => {
    if (!window.google?.maps?.Geocoder) {
      toast.error(
        "Google Maps API가 아직 로드되지 않았습니다.",
      );
      return;
    }

    try {
      const geocoder = new window.google.maps.Geocoder();
      const latlng = { lat: editData.lat, lng: editData.lng };

      geocoder.geocode(
        { location: latlng },
        (results, status) => {
          if (status === "OK" && results && results[0]) {
            const addressComponents =
              results[0].address_components;
            let city = "";
            let country = "";

            // 주소 구성요소에서 도시명과 국가명 추출
            for (const component of addressComponents) {
              if (component.types.includes("locality")) {
                city = component.long_name;
              } else if (
                component.types.includes(
                  "administrative_area_level_1",
                ) &&
                !city
              ) {
                city = component.long_name;
              }
              if (component.types.includes("country")) {
                country =
                  component.short_name === "US"
                    ? "USA"
                    : component.short_name === "GB"
                      ? "UK"
                      : component.short_name === "KR"
                        ? "South Korea"
                        : convertKoreanCountryToEnglish(
                            component.long_name,
                          );
              }
            }

            setEditData({
              ...editData,
              city: city || editData.city,
              country: country || editData.country,
              address:
                results[0].formatted_address ||
                editData.address,
            });

            toast.success(
              `위치 정보가 업데이트되었습니다: ${city}, ${country}`,
            );
          } else {
            toast.error("좌표로부터 주소를 찾을 수 없습니다.");
          }
        },
      );
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      toast.error("주소 검색 중 오류가 발생했습니다.");
    }
  };

  // 협상 이력 추가 다이얼로그 열기
  const handleAddHistory = () => {
    setEditingHistoryIndex(null);
    setHistoryDate(new Date().toISOString().split("T")[0]);
    setHistoryNotes("");
    setHistoryUser("");
    setShowHistoryDialog(true);
  };

  // 특정 협상 이력 항목을 수정하기 위한 다이얼로그 열기
  const handleEditHistory = (index: number) => {
    const item = store.negotiationHistory![index];
    setEditingHistoryIndex(index);
    setHistoryDate(item.date);
    setHistoryNotes(item.notes);
    setHistoryUser(item.user);
    setShowHistoryDialog(true);
  };

  // 협상 이력 항목 삭제 함수
  const handleDeleteHistory = async (index: number) => {
    if (!confirm("이 협상 이력을 삭제하시겠습니까?")) return;

    const updatedHistory = [
      ...(store.negotiationHistory || []),
    ];
    updatedHistory.splice(index, 1);

    const updatedStore: Store = {
      ...store,
      negotiationHistory: updatedHistory,
    };

    try {
      await onUpdate(updatedStore);
      toast.success("협상 이력이 삭제되었습니다.");
    } catch (error) {
      toast.error("협상 이력 삭제에 실패했습니다.");
    }
  };

  // 협상 이력 저장 함수 - 신규 추가 또는 기존 항목 수정
  const handleSaveHistory = async () => {
    if (!historyDate || !historyNotes || !historyUser) {
      toast.error("모든 필드를 입력해주세요.");
      return;
    }

    const newHistoryItem = {
      date: historyDate,
      notes: historyNotes,
      user: historyUser,
    };

    let updatedHistory = [...(store.negotiationHistory || [])];

    if (editingHistoryIndex !== null) {
      // 기존 항목 수정
      updatedHistory[editingHistoryIndex] = newHistoryItem;
    } else {
      // 새 항목 추가
      updatedHistory.push(newHistoryItem);
    }

    const updatedStore: Store = {
      ...store,
      negotiationHistory: updatedHistory,
    };

    try {
      await onUpdate(updatedStore);
      toast.success(
        editingHistoryIndex !== null
          ? "협상 이력이 수정되었습니다."
          : "협상 이력이 추가되었습니다.",
      );
      setShowHistoryDialog(false);
      setHistoryDate("");
      setHistoryNotes("");
      setHistoryUser("");
      setEditingHistoryIndex(null);
    } catch (error) {
      toast.error("협상 이력 저장에 실패했습니다.");
    }
  };

  return (
    <div className="w-96 bg-white border-l flex flex-col h-full shadow-2xl">
      {/* 패널 헤더 - 매장명, 상태 뱃지, 닫기 버튼 */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              {store.name}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {/* 파이프라인 상태 뱃지 */}
              <Badge
                className={`${STATUS_COLORS[store.status as keyof typeof STATUS_COLORS]} text-white border-0`}
              >
                {store.status}
              </Badge>
              <Badge variant="outline">{store.brand}</Badge>
              {/* 채널 타입 뱃지 */}
              {(store.type || store.channel) && (
                <Badge variant="outline">
                  {store.type || store.channel}
                </Badge>
              )}
              {/* 클래스(Type-based/Location-based) 뱃지 */}
              {getStoreClass(store.type || store.channel) && (
                <Badge
                  className={`border-0 text-white ${
                    getStoreClass(store.type || store.channel) === 'Type-based'
                      ? 'bg-violet-500'
                      : 'bg-teal-500'
                  }`}
                >
                  {getStoreClass(store.type || store.channel)}
                </Badge>
              )}
            </div>
          </div>
          {/* 패널 닫기 버튼 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 콘텐츠 영역 - 탭으로 구성 */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="overview" className="w-full">
          {/* 탭 네비게이션 */}
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4 h-auto p-0 flex-nowrap overflow-x-auto scrollbar-hide">
            {[
              "overview",
              "financial",
              "images",
              "history",
              "reviews",
            ].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                onClick={() => {
                  // 리뷰 탭 클릭 시 Google 리뷰를 자동으로 불러옴
                  if (tab === "reviews") {
                    fetchGoogleReviews();
                  }
                }}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-500 data-[state=active]:text-black py-3 px-4 capitalize whitespace-nowrap"
              >
                {tab === "overview"
                  ? "개요"
                  : tab === "financial"
                    ? "P&L"
                    : tab === "images"
                      ? "이미지"
                      : tab === "history"
                        ? "협상 이력"
                        : "리뷰"}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* 개요 탭 - 위치, 면적, 채널, 일정 등 기본 정보 */}
          <TabsContent
            value="overview"
            className="p-4 space-y-4 m-0"
          >
            {/* 위치 정보 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 font-medium">
                  위치
                </span>
              </div>
              <div className="pl-6 space-y-1 text-sm text-gray-600">
                <div>
                  {store.location.address || "주소 정보 없음"}
                </div>
                <div>
                  {store.location.city},{" "}
                  {store.location.country}
                </div>
                <div className="text-xs text-gray-500">
                  {store.location.region} •{" "}
                  {store.location.lat.toFixed(4)},{" "}
                  {store.location.lng.toFixed(4)}
                </div>
              </div>
            </div>

            {/* 매장 면적 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Square className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 font-medium">
                  면적
                </span>
              </div>
              <div className="pl-6 text-sm text-gray-600">
                {store.area
                  ? `${store.area.toLocaleString()}㎡ (${(store.area * 0.3025).toLocaleString(undefined, { maximumFractionDigits: 0 })}평)`
                  : store.size}
              </div>
            </div>

            {/* 채널 및 Class 정보 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 font-medium">
                  채널 / Class
                </span>
              </div>
              <div className="pl-6 space-y-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">채널</span>
                  <span className="text-gray-900">{store.type || store.channel || '-'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Class</span>
                  {getStoreClass(store.type || store.channel) ? (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      getStoreClass(store.type || store.channel) === 'Type-based'
                        ? 'bg-violet-100 text-violet-700'
                        : 'bg-teal-100 text-teal-700'
                    }`}>
                      {getStoreClass(store.type || store.channel)}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
              </div>
            </div>

            {/* 주요 일정 - 오픈일, 계약 시작/종료일 */}
            <div className="border-t pt-4 mt-4">
              <div className="text-sm text-gray-700 mb-2 font-medium">
                주요 일정
              </div>
              <div className="space-y-2 pl-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> 오픈일
                  </span>
                  <span className="text-gray-900">
                    {formatDate(store.openDate)}
                  </span>
                </div>
                {store.contract && (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 계약 시작
                      </span>
                      <span className="text-gray-900">
                        {formatDate(store.contract.startDate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 계약 종료
                      </span>
                      <span className="text-gray-900">
                        {formatDate(store.contract.endDate)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 방문객 수 및 계약서 링크 */}
            <div className="space-y-4 pt-2">
              {store.status === "Open" && store.visitors && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 font-medium">
                      월 방문객
                    </span>
                  </div>
                  <div className="pl-6 text-sm text-gray-600">
                    {store.visitors.toLocaleString()}명
                  </div>
                </div>
              )}

              {store.contract?.documentUrl && (
                <div className="pl-6">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    <FileText className="w-3 h-3 mr-2" />
                    계약서 보기
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* P&L 탭 - 재무 정보 및 매출 추이 차트 */}
          <TabsContent
            value="financial"
            className="p-4 space-y-4 m-0"
          >
            {store.financial ? (
              <>
                {/* 임대료 (고정 + 수수료) */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 font-medium">
                      임대료 (고정/수수료)
                    </span>
                  </div>
                  <div className="pl-6 text-gray-900 font-semibold flex items-center gap-2">
                    <span>
                      {formatCurrency(
                        store.financial.monthlyRent,
                        store.financial.currency,
                      )}
                    </span>
                    <span className="text-gray-400">/</span>
                    <span>
                      {store.financial.rentCommission || 0}%
                    </span>
                  </div>
                </div>

                {/* Open 매장이면서 매출 데이터가 있는 경우에만 매출 정보 표시 */}
                {store.status === "Open" &&
                  store.financial.monthlySales > 0 && (
                    <>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700 font-medium">
                            월 매출
                          </span>
                        </div>
                        <div className="pl-6 text-emerald-600 font-bold">
                          {formatCurrency(
                            store.financial.monthlySales,
                            store.financial.currency,
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700 font-medium">
                            평당 매출
                          </span>
                        </div>
                        <div className="pl-6 text-sm text-gray-600">
                          {formatCurrency(
                            store.financial.salesPerSqm,
                            store.financial.currency,
                          )}
                          /㎡
                        </div>
                      </div>
                    </>
                  )}

                {/* 보증금 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 font-medium">
                      보증금
                    </span>
                  </div>
                  <div className="pl-6 text-sm text-gray-600">
                    {formatCurrency(
                      store.financial.deposit,
                      store.financial.currency,
                    )}
                  </div>
                </div>

                {/* 투자비 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 font-medium">
                      투자비
                    </span>
                  </div>
                  <div className="pl-6 text-sm text-gray-600">
                    {formatCurrency(
                      store.financial.investment,
                      store.financial.currency,
                    )}
                  </div>
                </div>
              </>
            ) : (
              // 재무 데이터가 없는 Plan 상태 매장용 안내 메시지
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 font-medium">
                      임대료 (월)
                    </span>
                  </div>
                  <div className="pl-6 text-gray-900 font-semibold text-sm">
                    ₩0만
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 font-medium">
                      투자비
                    </span>
                  </div>
                  <div className="pl-6 text-gray-900 font-semibold text-sm">
                    ₩0만
                  </div>
                </div>
                <div className="text-center py-8 text-gray-400 text-xs border-t mt-4">
                  <p>
                    Plan 상태의 매장은 재무 데이터가 아직
                    집계되지 않았습니다.
                  </p>
                </div>
              </div>
            )}

            {/* 연 매출 추이 라인 차트 */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  매출 추이
                </h3>
              </div>
              <div className="h-[200px] w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={
                      store.status === "Plan"
                        ? []
                        : yearlyTrendData
                    }
                    margin={{
                      top: 5,
                      right: 20,
                      bottom: 5,
                      left: 0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis dataKey="year" />
                    <YAxis hide />
                    {store.status !== "Plan" && (
                      <>
                        <RechartsTooltip
                          formatter={(value: number) => {
                            if (value >= 10000) {
                              return [
                                `₩${Math.round(value / 10000).toLocaleString()}억`,
                                "매출",
                              ];
                            }
                            return [
                              `₩${value.toLocaleString()}만`,
                              "매출",
                            ];
                          }}
                          labelStyle={{ color: "#374151" }}
                          contentStyle={{
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          name="연 매출"
                          stroke="#2563EB"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          connectNulls
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
                {store.status === "Plan" && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-gray-400 text-xs">
                      데이터 없음
                    </span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* 이미지 탭 - 매장 정면, 측면, 내부, 도면 사진 */}
          <TabsContent
            value="images"
            className="p-4 space-y-4 m-0"
          >
            {store.images ? (
              <>
                {store.images.front && (
                  <div>
                    <div className="text-sm text-gray-700 mb-2">
                      정면
                    </div>
                    <ImageWithFallback
                      src={store.images.front}
                      alt="Store front"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
                {store.images.side && (
                  <div>
                    <div className="text-sm text-gray-700 mb-2">
                      측면
                    </div>
                    <ImageWithFallback
                      src={store.images.side}
                      alt="Store side"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
                {store.images.interior && (
                  <div>
                    <div className="text-sm text-gray-700 mb-2">
                      내부
                    </div>
                    <ImageWithFallback
                      src={store.images.interior}
                      alt="Store interior"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
                {store.images.floorplan && (
                  <div>
                    <div className="text-sm text-gray-700 mb-2">
                      도면
                    </div>
                    <ImageWithFallback
                      src={store.images.floorplan}
                      alt="Floor plan"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
              </>
            ) : (
              // 이미지가 없는 경우 안내 메시지 표시
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>등록된 이미지가 없습니다</p>
              </div>
            )}
          </TabsContent>

          {/* 협상 이력 탭 - 협상 진행 기록 타임라인 */}
          <TabsContent value="history" className="p-4 m-0">
            <div className="mb-4">
              <Button
                onClick={handleAddHistory}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                협상 이력 추가
              </Button>
            </div>

            {store.negotiationHistory &&
            store.negotiationHistory.length > 0 ? (
              <div className="space-y-4">
                {store.negotiationHistory.map((item, index) => (
                  <div
                    key={index}
                    className="border-l-2 border-blue-500 pl-4 pb-4 relative group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500">
                          {formatDate(item.date)}
                        </span>
                      </div>
                      {/* hover 시 표시되는 수정/삭제 버튼 */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            handleEditHistory(index)
                          }
                        >
                          <Edit2 className="w-3 h-3 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            handleDeleteHistory(index)
                          }
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">
                      {item.notes}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.user}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              // 협상 이력이 없는 경우 빈 상태 표시
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>협상 이력이 없습니다</p>
              </div>
            )}
          </TabsContent>

          {/* 리뷰 탭 - Google Maps 리뷰 및 사진 */}
          <TabsContent
            value="reviews"
            className="p-4 m-0 space-y-4"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">
                  Google Reviews & Photos
                </span>
              </div>
              {isLoadingReviews && (
                <span className="text-[10px] text-gray-400 animate-pulse">
                  정보 업데이트 중...
                </span>
              )}
            </div>

            {/* Google 방문자 사진 갤러리 */}
            {placePhotos.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    방문자 사진
                  </span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {placePhotos
                    .slice(0, 5)
                    .map((photo, index) => (
                      <div
                        key={index}
                        className="flex-shrink-0 w-24 h-24 rounded-md overflow-hidden border border-gray-200 relative group cursor-pointer"
                        onClick={() =>
                          window.open(
                            photo.getURI({ maxWidth: 800 }),
                            "_blank",
                          )
                        }
                      >
                        <img
                          src={photo.getURI({
                            maxWidth: 200,
                            maxHeight: 200,
                          })}
                          alt={`Store photo ${index + 1}`}
                          className="w-full h-full object-cover transition-transform hover:scale-110 duration-300"
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 리뷰 목록 */}
            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((review, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-3 rounded-lg border border-gray-100"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {review.authorAttribution && (
                          <>
                            {review.authorAttribution
                              .photoUri && (
                              <img
                                src={
                                  review.authorAttribution
                                    .photoUri
                                }
                                alt="Profile"
                                className="w-6 h-6 rounded-full"
                              />
                            )}
                            <span className="text-xs font-bold text-gray-900">
                              {
                                review.authorAttribution
                                  .displayName
                              }
                            </span>
                          </>
                        )}
                      </div>
                      {/* 별점 표시 */}
                      <div className="flex text-yellow-400">
                        {Array.from({ length: 5 }).map(
                          (_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${(review.rating || 0) > i ? "fill-current" : "text-gray-300"}`}
                            />
                          ),
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed mb-1">
                      {typeof review.text === "string"
                        ? review.text
                        : (review.text as any)?.text}
                    </p>
                    <div className="text-[10px] text-gray-400">
                      {review.relativePublishTimeDescription}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // 리뷰가 없는 경우 안내 메시지
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-xs">
                  아직 불러온 리뷰가 없습니다.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* 하단 액션 버튼 영역 */}
      <div className="p-4 border-t space-y-2 bg-gray-50">
        <div className="flex gap-2 mb-2">
          {/* 수정 버튼 */}
          <Button
            variant="outline"
            className="flex-1 bg-white border-gray-200 text-gray-700"
            onClick={handleEditStore}
          >
            수정
          </Button>
          {/* activeTab이 "Expansion"인 경우만 삭제 버튼 표시 */}
          {activeTab === "Expansion" && (
            <Button
              variant="outline"
              className="flex-1 bg-white border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleDeleteStore}
            >
              삭제
            </Button>
          )}
        </div>
      </div>

      {/* 매장 정보 수정 다이얼로그 */}
      <Dialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>매장 정보 수정</DialogTitle>
            <DialogDescription>
              매장의 기본 정보, 재무 정보 및 이미지를 수정할 수
              있습니다.
            </DialogDescription>
          </DialogHeader>
          {/* 수정 다이얼로그 내부 탭 (개요 / P/L / 이미지) */}
          <Tabs
            defaultValue="overview"
            className="flex-1 overflow-hidden flex flex-col"
          >
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0 mb-4">
              <TabsTrigger
                value="overview"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent text-gray-500 data-[state=active]:text-black py-2 px-4"
              >
                개요
              </TabsTrigger>
              <TabsTrigger
                value="financial"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent text-gray-500 data-[state=active]:text-black py-2 px-4"
              >
                P/L
              </TabsTrigger>
              <TabsTrigger
                value="images"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent text-gray-500 data-[state=active]:text-black py-2 px-4"
              >
                이미지
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto pr-2">
              {/* 개요 탭 - 기본 정보 수정 */}
              <TabsContent
                value="overview"
                className="space-y-4 m-0"
              >
                <div className="space-y-2">
                  <Label htmlFor="edit-name">매장명</Label>
                  <Input
                    id="edit-name"
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* 상태 선택 */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">상태</Label>
                    <select
                      id="edit-status"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={editData.status}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          status: e.target.value as any,
                        })
                      }
                    >
                      <option value="Planed">Planed</option>
                      <option value="Confirmed">
                        Confirmed
                      </option>
                      <option value="Signed">Signed</option>
                      <option value="Construction">
                        Construction
                      </option>
                      <option value="Open">Open</option>
                      <option value="Close">Close</option>
                    </select>
                  </div>
                  {/* 채널 선택 */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-channel">채널</Label>
                    <select
                      id="edit-channel"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={editData.type}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          type: e.target.value,
                        })
                      }
                    >
                      <option value="">채널 선택</option>
                      <option value="FS">FS</option>
                      <option value="Department Store">
                        Department Store
                      </option>
                      <option value="Mall">Mall</option>
                      <option value="Duty Free">
                        Duty Free
                      </option>
                      <option value="Premium Outlet">
                        Premium Outlet
                      </option>
                      <option value="Pop-up">Pop-up</option>
                      <option value="Haus">Haus</option>
                    </select>
                  </div>
                </div>
                {/* 브랜드 */}
                <div className="space-y-2">
                  <Label htmlFor="edit-brand">브랜드</Label>
                  <Input
                    id="edit-brand"
                    value={editData.brand}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        brand: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* 도시 */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-city">도시</Label>
                    <Input
                      id="edit-city"
                      value={editData.city}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          city: e.target.value,
                        })
                      }
                      placeholder="예: New York"
                    />
                  </div>
                  {/* 국가 선택 드롭다운 */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-country">국가</Label>
                    <select
                      id="edit-country"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={editData.country}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          country: e.target.value,
                        })
                      }
                    >
                      <option value="">국가 선택</option>
                      <optgroup label="미주">
                        <option value="USA">USA</option>
                        <option value="Canada">Canada</option>
                        <option value="Mexico">Mexico</option>
                      </optgroup>
                      <optgroup label="유럽">
                        <option value="UK">UK</option>
                        <option value="France">France</option>
                        <option value="Germany">Germany</option>
                        <option value="Italy">Italy</option>
                        <option value="Spain">Spain</option>
                        <option value="Netherlands">
                          Netherlands
                        </option>
                        <option value="Belgium">Belgium</option>
                        <option value="Switzerland">
                          Switzerland
                        </option>
                      </optgroup>
                      <optgroup label="중동">
                        <option value="UAE">UAE</option>
                        <option value="Saudi Arabia">
                          Saudi Arabia
                        </option>
                        <option value="Qatar">Qatar</option>
                        <option value="Kuwait">Kuwait</option>
                      </optgroup>
                      <optgroup label="동남아">
                        <option value="Singapore">
                          Singapore
                        </option>
                        <option value="Thailand">
                          Thailand
                        </option>
                        <option value="Vietnam">Vietnam</option>
                        <option value="Malaysia">
                          Malaysia
                        </option>
                        <option value="Indonesia">
                          Indonesia
                        </option>
                        <option value="Philippines">
                          Philippines
                        </option>
                      </optgroup>
                      <optgroup label="동아시아">
                        <option value="South Korea">
                          South Korea
                        </option>
                        <option value="China">China</option>
                        <option value="Hong Kong">
                          Hong Kong
                        </option>
                        <option value="Taiwan">Taiwan</option>
                        <option value="Macau">Macau</option>
                        <option value="Japan">Japan</option>
                      </optgroup>
                      <optgroup label="기타">
                        <option value="Australia">
                          Australia
                        </option>
                        <option value="New Zealand">
                          New Zealand
                        </option>
                      </optgroup>
                    </select>
                  </div>
                </div>
                {/* 주소 */}
                <div className="space-y-2">
                  <Label htmlFor="edit-address">주소</Label>
                  <Input
                    id="edit-address"
                    value={editData.address}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        address: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* 위도 */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-lat">
                      위도 (Latitude)
                    </Label>
                    <Input
                      id="edit-lat"
                      type="number"
                      step="0.000001"
                      value={editData.lat}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          lat: Number(e.target.value),
                        })
                      }
                      placeholder="예: 37.5665"
                    />
                  </div>
                  {/* 경도 */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-lng">
                      경도 (Longitude)
                    </Label>
                    <Input
                      id="edit-lng"
                      type="number"
                      step="0.000001"
                      value={editData.lng}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          lng: Number(e.target.value),
                        })
                      }
                      placeholder="예: 126.9780"
                    />
                  </div>
                </div>
                {/* 좌표로부터 주소 자동 채우기 버튼 */}
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleReverseGeocode}
                    className="w-full"
                  >
                    <MapPin className="w-3 h-3 mr-2" />
                    좌표로부터 도시/국가 정보 가져오기
                  </Button>
                </div>
                {/* 면적 */}
                <div className="space-y-2">
                  <Label htmlFor="edit-area">면적 (㎡)</Label>
                  <Input
                    id="edit-area"
                    value={formatWithCommas(editData.area)}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        area: Number(
                          parseNumber(e.target.value),
                        ),
                      })
                    }
                  />
                </div>
              </TabsContent>

              {/* P/L 탭 - 재무 정보 수정 */}
              <TabsContent
                value="financial"
                className="space-y-4 m-0"
              >
                <div className="grid grid-cols-2 gap-4">
                  {/* 오픈일 */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-open-date">
                      오픈일
                    </Label>
                    <Input
                      id="edit-open-date"
                      type="text"
                      placeholder="YYYY-MM-DD (또는 YYYY-DD-MM)"
                      value={editData.openDate}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          openDate: smartDateParse(
                            e.target.value,
                          ),
                        })
                      }
                    />
                  </div>
                  {/* 통화 선택 */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-currency">통화</Label>
                    <select
                      id="edit-currency"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={editData.financial.currency}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          financial: {
                            ...editData.financial,
                            currency: e.target.value,
                          },
                        })
                      }
                    >
                      <option value="KRW">KRW (₩)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="SGD">SGD (S$)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* 계약 시작일 */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-contract-start">
                      계약 시작일
                    </Label>
                    <Input
                      id="edit-contract-start"
                      type="text"
                      placeholder="YYYY-MM-DD"
                      value={editData.contract.startDate}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          contract: {
                            ...editData.contract,
                            startDate: smartDateParse(
                              e.target.value,
                            ),
                          },
                        })
                      }
                    />
                  </div>
                  {/* 계약 종료일 */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-contract-end">
                      계약 종료일
                    </Label>
                    <Input
                      id="edit-contract-end"
                      type="text"
                      placeholder="YYYY-MM-DD"
                      value={editData.contract.endDate}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          contract: {
                            ...editData.contract,
                            endDate: smartDateParse(
                              e.target.value,
                            ),
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* 고정 임대료 */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-monthly-rent">
                      고정 임대료
                    </Label>
                    <Input
                      id="edit-monthly-rent"
                      placeholder="원화 (전체 금액 입력)"
                      value={formatWithCommas(
                        editData.financial.monthlyRent,
                      )}
                      onChange={(e) => {
                        const val = Number(
                          parseNumber(e.target.value),
                        );
                        setEditData({
                          ...editData,
                          financial: {
                            ...editData.financial,
                            monthlyRent: val,
                          },
                        });
                      }}
                    />
                  </div>
                  {/* 임대 수수료(%) */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-rent-commission">
                      임대 수수료 (%)
                    </Label>
                    <Input
                      id="edit-rent-commission"
                      type="number"
                      step="0.1"
                      placeholder="%"
                      value={editData.financial.rentCommission}
                      onChange={(e) => {
                        const commission = Number(
                          e.target.value,
                        );
                        setEditData({
                          ...editData,
                          financial: {
                            ...editData.financial,
                            rentCommission: commission,
                          },
                        });
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* 보증금 */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-deposit">보증금</Label>
                    <Input
                      id="edit-deposit"
                      placeholder="원화 (전체 금액 입력)"
                      value={formatWithCommas(
                        editData.financial.deposit,
                      )}
                      onChange={(e) => {
                        const val = Number(
                          parseNumber(e.target.value),
                        );
                        setEditData({
                          ...editData,
                          financial: {
                            ...editData.financial,
                            deposit: val,
                          },
                        });
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* 월 매출 - 자동 계산 값으로 비활성화 */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-monthly-sales">
                      월 매출 (자동 계산)
                    </Label>
                    <Input
                      id="edit-monthly-sales"
                      disabled
                      className="bg-gray-50"
                      placeholder="연 매출 입력 시 자동 계산됩니다"
                      value={formatWithCommas(
                        displayedMonthlySales,
                      )}
                    />
                    <p className="text-[10px] text-gray-400">
                      * 오픈일 및 연 매출 기준 자동 산출
                    </p>
                  </div>
                  {/* 투자비 */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-investment">
                      투자비
                    </Label>
                    <Input
                      id="edit-investment"
                      placeholder="원화 (전체 금액 입력)"
                      value={formatWithCommas(
                        editData.financial.investment,
                      )}
                      onChange={(e) => {
                        const val = Number(
                          parseNumber(e.target.value),
                        );
                        setEditData({
                          ...editData,
                          financial: {
                            ...editData.financial,
                            investment: val,
                          },
                        });
                      }}
                    />
                  </div>
                </div>

                {/* 평당 매출 */}
                <div className="space-y-2">
                  <Label htmlFor="edit-sales-per-sqm">
                    평당 매출 (㎡당)
                  </Label>
                  <Input
                    id="edit-sales-per-sqm"
                    placeholder="원화 (전체 금액 입력)"
                    value={formatWithCommas(
                      editData.financial.salesPerSqm,
                    )}
                    onChange={(e) => {
                      const val = Number(
                        parseNumber(e.target.value),
                      );
                      setEditData({
                        ...editData,
                        financial: {
                          ...editData.financial,
                          salesPerSqm: val,
                        },
                      });
                    }}
                  />
                </div>

                {/* 연 매출 내역 - 연도별로 추가/삭제 가능 */}
                <div className="pt-4 border-t space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-bold">
                      연 매출 내역 (만원 단위)
                    </Label>
                    {/* 새 연도 추가 버튼 */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentYear =
                          new Date().getFullYear();
                        const nextYear =
                          editData.financial.yearlySales
                            .length > 0
                            ? Math.min(
                                ...editData.financial.yearlySales.map(
                                  (s) => s.year,
                                ),
                              ) - 1
                            : currentYear;

                        setEditData((prev) => ({
                          ...prev,
                          financial: {
                            ...prev.financial,
                            yearlySales: [
                              ...prev.financial.yearlySales,
                              { year: nextYear, amount: 0 },
                            ].sort((a, b) => b.year - a.year),
                          },
                        }));
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" /> 추가
                    </Button>
                  </div>

                  {editData.financial.yearlySales.length ===
                  0 ? (
                    // 연 매출 내역이 없는 경우
                    <div className="text-center py-4 text-gray-400 text-sm border border-dashed rounded-lg">
                      등록된 연 매출 내역이 없습니다.
                    </div>
                  ) : (
                    // 연 매출 목록 표시
                    <div className="space-y-3">
                      {editData.financial.yearlySales.map(
                        (item, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3"
                          >
                            {/* 연도 선택 드롭다운 */}
                            <div className="flex-1">
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={item.year}
                                onChange={(e) => {
                                  const newYear = Number(
                                    e.target.value,
                                  );
                                  setEditData((prev) => {
                                    const updated = [
                                      ...prev.financial
                                        .yearlySales,
                                    ];
                                    updated[index] = {
                                      ...updated[index],
                                      year: newYear,
                                    };
                                    return {
                                      ...prev,
                                      financial: {
                                        ...prev.financial,
                                        yearlySales:
                                          updated.sort(
                                            (a, b) =>
                                              b.year - a.year,
                                          ),
                                      },
                                    };
                                  });
                                }}
                              >
                                {Array.from(
                                  { length: 21 },
                                  (_, i) => 2030 - i,
                                ).map((y) => (
                                  <option key={y} value={y}>
                                    {y}년
                                  </option>
                                ))}
                              </select>
                            </div>
                            {/* 매출 금액 입력 */}
                            <div className="flex-[2]">
                              <Input
                                placeholder="매출 (전체 금액 입력)"
                                value={formatWithCommas(
                                  item.amount,
                                )}
                                onChange={(e) => {
                                  const val = Number(
                                    parseNumber(e.target.value),
                                  );
                                  setEditData((prev) => {
                                    const updated = [
                                      ...prev.financial
                                        .yearlySales,
                                    ];
                                    updated[index] = {
                                      ...updated[index],
                                      amount: val,
                                    };

                                    return {
                                      ...prev,
                                      financial: {
                                        ...prev.financial,
                                        yearlySales: updated,
                                      },
                                    };
                                  });
                                }}
                              />
                            </div>
                            {/* 해당 연도 항목 삭제 버튼 */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setEditData((prev) => ({
                                  ...prev,
                                  financial: {
                                    ...prev.financial,
                                    yearlySales:
                                      prev.financial.yearlySales.filter(
                                        (_, i) => i !== index,
                                      ),
                                  },
                                }));
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* 이미지 탭 - 이미지 URL 수정 */}
              <TabsContent
                value="images"
                className="space-y-4 m-0"
              >
                {/* 정면 이미지 URL */}
                <div className="space-y-2">
                  <Label htmlFor="edit-image-front">
                    정면 이미지 URL
                  </Label>
                  <Input
                    id="edit-image-front"
                    placeholder="https://example.com/front.jpg"
                    value={editData.images.front}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        images: {
                          ...editData.images,
                          front: e.target.value,
                        },
                      })
                    }
                  />
                  {editData.images.front && (
                    <div className="mt-2">
                      <ImageWithFallback
                        src={editData.images.front}
                        alt="Front preview"
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>
                {/* 측면 이미지 URL */}
                <div className="space-y-2">
                  <Label htmlFor="edit-image-side">
                    측면 이미지 URL
                  </Label>
                  <Input
                    id="edit-image-side"
                    placeholder="https://example.com/side.jpg"
                    value={editData.images.side}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        images: {
                          ...editData.images,
                          side: e.target.value,
                        },
                      })
                    }
                  />
                  {editData.images.side && (
                    <div className="mt-2">
                      <ImageWithFallback
                        src={editData.images.side}
                        alt="Side preview"
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>
                {/* 내부 이미지 URL */}
                <div className="space-y-2">
                  <Label htmlFor="edit-image-interior">
                    내부 이미지 URL
                  </Label>
                  <Input
                    id="edit-image-interior"
                    placeholder="https://example.com/interior.jpg"
                    value={editData.images.interior}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        images: {
                          ...editData.images,
                          interior: e.target.value,
                        },
                      })
                    }
                  />
                  {editData.images.interior && (
                    <div className="mt-2">
                      <ImageWithFallback
                        src={editData.images.interior}
                        alt="Interior preview"
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>
                {/* 도면 이미지 URL */}
                <div className="space-y-2">
                  <Label htmlFor="edit-image-floorplan">
                    도면 이미지 URL
                  </Label>
                  <Input
                    id="edit-image-floorplan"
                    placeholder="https://example.com/floorplan.jpg"
                    value={editData.images.floorplan}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        images: {
                          ...editData.images,
                          floorplan: e.target.value,
                        },
                      })
                    }
                  />
                  {editData.images.floorplan && (
                    <div className="mt-2">
                      <ImageWithFallback
                        src={editData.images.floorplan}
                        alt="Floorplan preview"
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
          {/* 수정 다이얼로그 하단 버튼 */}
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
            >
              취소
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="bg-black hover:bg-gray-800"
            >
              수정 완료
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 협상 노트 추가 다이얼로그 (현재 미사용) */}
      <Dialog
        open={showNoteDialog}
        onOpenChange={setShowNoteDialog}
      >
        <DialogContent className="sm:max-w-[600px] h-[500px] flex flex-col">
          <DialogHeader>
            <DialogTitle>협상 노트 추가</DialogTitle>
            <DialogDescription>
              협상 노트를 작성하고 관련 파일을 첨부할 수
              있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="노트 제목"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">내용</Label>
              <Textarea
                id="content"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="노트 내용"
                className="min-h-[200px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="files">파일 첨부</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
                <Input
                  id="files"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>
              {attachedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-sm text-gray-700">
                    첨부된 파일 ({attachedFiles.length})
                  </div>
                  <div className="space-y-1">
                    {attachedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded"
                      >
                        <Upload className="w-4 h-4 text-gray-500" />
                        <span className="flex-1 truncate">
                          {file.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowNoteDialog(false)}
            >
              취소
            </Button>
            <Button onClick={handleSubmitNote}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 협상 이력 추가/수정 다이얼로그 */}
      <Dialog
        open={showHistoryDialog}
        onOpenChange={setShowHistoryDialog}
      >
        <DialogContent className="sm:max-w-[600px] h-[500px] flex flex-col">
          <DialogHeader>
            <DialogTitle>협상 이력 추가/수정</DialogTitle>
            <DialogDescription>
              협상 이력의 날짜, 내용 및 담당자 정보를
              입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-y-auto">
            {/* 날짜 입력 */}
            <div className="space-y-2">
              <Label htmlFor="history-date">날짜</Label>
              <Input
                id="history-date"
                type="text"
                value={historyDate}
                onChange={(e) =>
                  setHistoryDate(smartDateParse(e.target.value))
                }
                placeholder="YYYY-MM-DD"
              />
            </div>
            {/* 노트 내용 입력 */}
            <div className="space-y-2">
              <Label htmlFor="history-notes">노트</Label>
              <Textarea
                id="history-notes"
                value={historyNotes}
                onChange={(e) =>
                  setHistoryNotes(e.target.value)
                }
                placeholder="노트 내용"
                className="min-h-[200px]"
              />
            </div>
            {/* 담당자 이름 입력 */}
            <div className="space-y-2">
              <Label htmlFor="history-user">사용자</Label>
              <Input
                id="history-user"
                value={historyUser}
                onChange={(e) => setHistoryUser(e.target.value)}
                placeholder="사용자 이름"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowHistoryDialog(false)}
            >
              취소
            </Button>
            <Button onClick={handleSaveHistory}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
