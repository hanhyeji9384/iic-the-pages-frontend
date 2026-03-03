// ============================================================
// CandidateStoreDetail 컴포넌트
// 파이프라인 단계 중인 후보점(미오픈 매장)의 상세 정보를 보여주는 패널입니다.
// Summary, P&L, Details(협상 이력), Committee(체크포인트) 탭으로 구성됩니다.
// 협상 이력과 체크포인트는 Supabase 백엔드에서 관리합니다.
// ============================================================

import {
  X,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  MessageSquare,
  Square,
  Clock,
  Edit2,
  Trash2,
  Plus,
  History as HistoryIcon,
  CheckCircle2,
  AlertCircle,
  Building2,
  Handshake,
  TrendingDown,
  Info,
  TrendingUp,
  Trophy,
  Star,
  Camera,
  Loader2,
  Navigation,
  Users,
} from "lucide-react";
import type { Store } from "../../types";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { dataClient } from "../../utils/dataClient";

// 컴포넌트가 받는 속성(props) 정의
interface CandidateStoreDetailProps {
  store: Store;          // 표시할 후보점 데이터
  onClose: () => void;   // 패널 닫기 콜백
  onUpdate: (updatedStore: Store) => Promise<void>;  // 후보점 업데이트 콜백
  onDelete?: (storeId: string) => Promise<void>;      // 후보점 삭제 콜백
}

// 파이프라인 상태별 배경 색상 매핑
const STATUS_COLORS = {
  Plan: "bg-[#64748B]",
  Confirm: "bg-[#9694FF]",
  Contract: "bg-[#EE99C2]",
  Space: "bg-sky-500",
  Open: "bg-[#7FC7D9]",
  Closed: "bg-gray-500",
  Planned: "bg-[#64748B]",
  Confirmed: "bg-[#9694FF]",
  Signed: "bg-[#EE99C2]",
  Construction: "bg-sky-500",
  Reject: "bg-red-500",
  Pending: "bg-orange-400",
};

// 파이프라인 상태별 한국어 레이블 매핑
const STATUS_LABELS = {
  Plan: "Planned (기획)",
  Confirm: "Confirmed (확정)",
  Contract: "Signed (계약완료)",
  Space: "Construction (공사중)",
  Planned: "Planned (기획)",
  Confirmed: "Confirmed (확정)",
  Signed: "Signed (계약완료)",
  Construction: "Construction (공사중)",
  Reject: "Reject (반려)",
  Pending: "Pending (보류)",
};

/**
 * 후보점 상세 정보 패널
 * 파이프라인 단계 중인 후보점을 클릭하면 화면 오른쪽에 나타납니다.
 */
export function CandidateStoreDetail({
  store,
  onClose,
  onUpdate,
  onDelete,
}: CandidateStoreDetailProps) {
  // 다이얼로그 표시 여부 상태들
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] =
    useState(false);

  // 협상 이력 목록 상태 - Supabase에서 불러온 데이터
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] =
    useState(false);

  // 체크포인트(Committee Review) 목록 상태
  const [checkpointsList, setCheckpointsList] = useState<any[]>(
    [],
  );
  const [isLoadingCheckpoints, setIsLoadingCheckpoints] =
    useState(false);
  const [showCheckpointDialog, setShowCheckpointDialog] =
    useState(false);
  // 수정 중인 체크포인트의 인덱스 (null이면 신규 추가)
  const [editingCheckpointIndex, setEditingCheckpointIndex] =
    useState<number | null>(null);
  const [checkpointDate, setCheckpointDate] = useState("");
  const [checkpointNotes, setCheckpointNotes] = useState("");
  const [checkpointUser, setCheckpointUser] = useState("");
  const [checkpointImages, setCheckpointImages] = useState<
    string[]
  >([]);
  const [
    isUploadingCheckpointImage,
    setIsUploadingCheckpointImage,
  ] = useState(false);
  const [checkpointPdf, setCheckpointPdf] = useState<string | null>(
    null,
  );
  const [isUploadingCheckpointPdf, setIsUploadingCheckpointPdf] =
    useState(false);

  // 좌표 기반 주소 조회 로딩 상태
  const [isGeocodingLoading, setIsGeocodingLoading] =
    useState(false);

  // 협상 이력 편집 상태
  const [editingHistoryIndex, setEditingHistoryIndex] =
    useState<number | null>(null);
  const [historyDate, setHistoryDate] = useState("");
  const [historyNotes, setHistoryNotes] = useState("");
  const [historyUser, setHistoryUser] = useState("");
  const [historyImages, setHistoryImages] = useState<string[]>(
    [],
  );
  const [isUploadingImage, setIsUploadingImage] =
    useState(false);

  // 상세보기 및 이미지 미리보기 상태
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<
    any | null
  >(null);
  const [selectedHistory, setSelectedHistory] = useState<
    any | null
  >(null);
  const [previewImage, setPreviewImage] = useState<
    string | null
  >(null);

  // 현재 활성화된 탭
  const [activeTab, setActiveTab] = useState("overview");

  // 수정 폼 데이터 - 후보점의 모든 편집 가능한 필드를 저장
  const [editData, setEditData] = useState({
    name: store.name,
    status: store.status,
    brand: store.brand,
    type: store.type || (store as any).channel || "",
    city: store.location.city || "",
    country: store.location.country || "",
    address: store.location.address || "",
    area: store.area || 0,
    openDate: store.openDate || "",
    handoverDate: (store as any).handoverDate || "",
    constructionStartDate:
      (store as any).constructionStartDate || "",
    currentStatus: (store as any).currentStatus || "공실",
    contract: {
      startDate: store.contract?.startDate || "",
      endDate: store.contract?.endDate || "",
    },
    financial: {
      monthlyRent: store.financial?.monthlyRent || 0,
      rentCommission: (store.financial as any)?.rentCommission || 0,
      rentType: (store.financial as any)?.rentType || "Fixed",
      investment: store.financial?.investment || 0,
      deposit: store.financial?.deposit || 0,
      estimatedSales:
        (store.financial as any)?.estimatedSales || 0,
      estimatedMargin:
        (store.financial as any)?.estimatedMargin || 0,
      personnelCost:
        (store.financial as any)?.personnelCost || 0,
      investmentInterior:
        (store.financial as any)?.investmentInterior || 0,
      investmentFurniture:
        (store.financial as any)?.investmentFurniture || 0,
      investmentFacade:
        (store.financial as any)?.investmentFacade || 0,
      investmentOther:
        (store.financial as any)?.investmentOther || 0,
      // P&L 필드 - PnLView에서 관리되는 수익 계산 데이터
      cogs: (store.financial as any)?.cogs ?? 0,
      depreciation: (store.financial as any)?.depreciation ?? 0,
      payment: (store.financial as any)?.payment ?? 0,
      others: (store.financial as any)?.others ?? 0,
    },
  });

  // 금액을 억/만원 단위로 읽기 좋게 변환하는 함수
  const formatCurrencyWithUnit = (amount?: number) => {
    if (amount === undefined || amount === null || amount === 0) return '0';
    if (amount >= 100000000) {
      return `${Math.round(amount / 100000000).toLocaleString()}억`;
    }
    // 1억 미만은 만원 단위로 표시
    return `${Math.round(amount / 10000).toLocaleString()}만`;
  };

  // 협상 이력을 날짜 기준 내림차순으로 정렬
  const sortedHistoryList = useMemo(() => {
    return historyList
      .map((item, index) => ({ item, index }))
      .sort(
        (a, b) =>
          new Date(b.item.date).getTime() -
          new Date(a.item.date).getTime(),
      );
  }, [historyList]);

  // 체크포인트를 날짜 기준 내림차순으로 정렬
  const sortedCheckpointsList = useMemo(() => {
    return checkpointsList
      .map((item, index) => ({ item, index }))
      .sort(
        (a, b) =>
          new Date(b.item.date).getTime() -
          new Date(a.item.date).getTime(),
      );
  }, [checkpointsList]);

  // 매장 데이터가 변경되면 수정 폼과 이력 데이터도 새로 불러옴
  useEffect(() => {
    setEditData({
      name: store.name,
      status: store.status,
      brand: store.brand,
      type: store.type || (store as any).channel || "",
      city: store.location.city || "",
      country: store.location.country || "",
      address: store.location.address || "",
      area: store.area || 0,
      openDate: store.openDate || "",
      handoverDate: (store as any).handoverDate || "",
      constructionStartDate:
        (store as any).constructionStartDate || "",
      currentStatus: (store as any).currentStatus || "공실",
      contract: {
        startDate: store.contract?.startDate || "",
        endDate: store.contract?.endDate || "",
      },
      financial: {
        monthlyRent: store.financial?.monthlyRent || 0,
        rentCommission: (store.financial as any)?.rentCommission || 0,
        rentType: (store.financial as any)?.rentType || "Fixed",
        investment: store.financial?.investment || 0,
        deposit: store.financial?.deposit || 0,
        estimatedSales:
          (store.financial as any)?.estimatedSales || 0,
        estimatedMargin:
          (store.financial as any)?.estimatedMargin || 0,
        personnelCost:
          (store.financial as any)?.personnelCost || 0,
        investmentInterior:
          (store.financial as any)?.investmentInterior || 0,
        investmentFurniture:
          (store.financial as any)?.investmentFurniture || 0,
        investmentFacade:
          (store.financial as any)?.investmentFacade || 0,
        investmentOther:
          (store.financial as any)?.investmentOther || 0,
        cogs: (store.financial as any)?.cogs ?? 0,
        depreciation: (store.financial as any)?.depreciation ?? 0,
        payment: (store.financial as any)?.payment ?? 0,
        others: (store.financial as any)?.others ?? 0,
      } as any,
    });
    // 매장이 바뀌면 협상 이력과 체크포인트를 새로 불러옴
    fetchHistory();
    fetchCheckpoints();
  }, [store]);

  // Supabase에서 협상 이력을 불러오는 함수
  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await dataClient.getNegotiationHistory(
        store.id,
      );
      setHistoryList(data);
    } catch (e) {
      console.error("Failed to fetch history:", e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Supabase에서 체크포인트(Committee Review)를 불러오는 함수
  const fetchCheckpoints = async () => {
    setIsLoadingCheckpoints(true);
    try {
      const data = await dataClient.getCheckpoints(store.id);
      setCheckpointsList(data);
    } catch (e) {
      console.error("Failed to fetch checkpoints:", e);
    } finally {
      setIsLoadingCheckpoints(false);
    }
  };

  // 날짜 문자열을 한국어 형식으로 변환하는 함수
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "미정";
    try {
      return new Date(dateString).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString || "미정";
    }
  };

  // 수정 내용을 저장하는 함수 - Open/Close 상태 변경 날짜도 자동 기록
  const handleSaveEdit = async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    let changOpenDate = store.ChangOpenDate || "";
    let changCloseDate = store.ChangCloseDate || "";

    // Open 상태로 변경된 경우 날짜 자동 기록
    if (store.status !== "Open" && editData.status === "Open") {
      changOpenDate = todayStr;
    } else if (
      store.status === "Open" &&
      editData.status !== "Open"
    ) {
      changOpenDate = "";
    }

    // Close 상태로 변경된 경우 날짜 자동 기록
    if (
      store.status !== "Close" &&
      editData.status === "Close"
    ) {
      changCloseDate = todayStr;
    } else if (
      store.status === "Close" &&
      editData.status !== "Close"
    ) {
      changCloseDate = "";
    }

    // 변경된 데이터로 후보점 객체 생성
    const updatedStore: Store = {
      ...store,
      name: editData.name,
      status: editData.status,
      brand: editData.brand,
      type: editData.type,
      channel: editData.type,
      ChangOpenDate: changOpenDate,
      ChangCloseDate: changCloseDate,
      location: {
        ...store.location,
        city: editData.city,
        country: editData.country,
        address: editData.address,
      },
      area: editData.area,
      openDate: editData.openDate,
      handoverDate: editData.handoverDate,
      constructionStartDate: (editData as any)
        .constructionStartDate,
      currentStatus: editData.currentStatus,
      contract: {
        ...store.contract,
        startDate: (editData as any).contract.startDate,
        endDate: (editData as any).contract.endDate,
        renewalOption: store.contract?.renewalOption || false,
      },
      financial: {
        ...store.financial,
        monthlyRent: editData.financial.monthlyRent,
        rentCommission: (editData.financial as any).rentCommission,
        rentType: (editData.financial as any).rentType,
        investment: editData.financial.investment,
        deposit: editData.financial.deposit,
        estimatedSales: editData.financial.estimatedSales,
        estimatedMargin: editData.financial.estimatedMargin,
        personnelCost: (editData.financial as any).personnelCost,
        investmentInterior: (editData.financial as any)
          .investmentInterior,
        investmentFurniture: (editData.financial as any)
          .investmentFurniture,
        investmentFacade: (editData.financial as any)
          .investmentFacade,
        investmentOther: (editData.financial as any)
          .investmentOther,
        // P&L 필드는 PnLView에서 수정된 값을 유지
        cogs: (editData.financial as any).cogs,
        depreciation: (editData.financial as any).depreciation,
        payment: (editData.financial as any).payment,
        others: (editData.financial as any).others,
      } as any,
    };
    await onUpdate(updatedStore);
    setShowEditDialog(false);
    toast.success("후보점 정보가 업데이트되었습니다.");
  };

  // 좌표(위도/경도)로부터 도시/국가 정보를 자동으로 채우는 함수
  const handleReverseGeocode = async () => {
    if (!window.google?.maps?.Geocoder) {
      toast.error(
        "Google Maps API가 아직 로드되지 않았습니다.",
      );
      return;
    }

    setIsGeocodingLoading(true);
    try {
      const geocoder = new window.google.maps.Geocoder();
      const latlng = {
        lat: store.location.lat,
        lng: store.location.lng,
      };

      geocoder.geocode(
        { location: latlng },
        (results, status) => {
          if (status === "OK" && results && results[0]) {
            const addressComponents =
              results[0].address_components;
            let newCity = "";
            let newCountry = "";

            // 한국어 국가명을 영어로 변환하는 내부 헬퍼 함수
            const convertKoreanCountryToEnglish = (
              countryName: string,
            ): string => {
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
                홍콩: "Hong Kong",
              };
              return countryMap[countryName] || countryName;
            };

            // 주소 구성요소에서 도시명과 국가명 추출
            for (const component of addressComponents) {
              if (component.types.includes("locality")) {
                newCity = component.long_name;
              } else if (
                component.types.includes(
                  "administrative_area_level_1",
                ) &&
                !newCity
              ) {
                newCity = component.long_name;
              }
              if (component.types.includes("country")) {
                newCountry =
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

            setEditData((prev) => ({
              ...prev,
              city: newCity || prev.city,
              country: newCountry || prev.country,
              address:
                results[0].formatted_address || prev.address,
            }));

            toast.success(
              `위치 정보가 업데이트되었습니다: ${newCity}, ${newCountry}`,
            );
          } else {
            toast.error("좌표로부터 주소를 찾을 수 없습니다.");
          }
          setIsGeocodingLoading(false);
        },
      );
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      toast.error("주소 검색 중 오류가 발생했습니다.");
      setIsGeocodingLoading(false);
    }
  };

  // 협상 이력 추가 다이얼로그 열기
  const handleAddHistory = () => {
    setEditingHistoryIndex(null);
    setHistoryDate(new Date().toISOString().split("T")[0]);
    setHistoryNotes("");
    setHistoryUser("");
    setHistoryImages([]);
    setShowHistoryDialog(true);
  };

  // 특정 협상 이력 항목을 수정하기 위한 다이얼로그 열기
  const handleEditHistory = (index: number) => {
    const item = historyList[index];
    setEditingHistoryIndex(index);
    setHistoryDate(item.date);
    setHistoryNotes(item.notes);
    setHistoryUser(item.user);
    setHistoryImages(item.images || []);
    setShowHistoryDialog(true);
  };

  // 협상 이력 항목 삭제 함수 - Supabase에서 실제 삭제
  const handleDeleteHistory = async (index: number) => {
    if (!confirm("이 기록을 삭제하시겠습니까?")) return;

    const updatedHistory = historyList.filter(
      (_, i) => i !== index,
    );
    try {
      await dataClient.updateNegotiationHistory(
        store.id,
        updatedHistory,
      );
      setHistoryList(updatedHistory);
      toast.success("기록이 삭제되었습니다.");
    } catch (e) {
      toast.error("기록 삭제 실패");
    }
  };

  // 협상 이력에 첨부할 이미지를 Supabase Storage에 업로드하는 함수
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 최대 10장 제한
    if (historyImages.length + files.length > 10) {
      toast.error("사진은 최대 10장까지 업로드 가능합니다.");
      return;
    }

    setIsUploadingImage(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const result = await dataClient.uploadFile(files[i]);
        uploadedUrls.push(result.url);
      }
      setHistoryImages((prev) => [...prev, ...uploadedUrls]);
      toast.success(
        `${files.length}장의 사진이 업로드되었습니다.`,
      );
    } catch (e: any) {
      console.error("Upload error:", e);
      toast.error(
        e.message || "사진 업로드 중 오류가 발생했습니다.",
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 업로드 목록에서 이미지를 제거하는 함수
  const removeImage = (index: number) => {
    setHistoryImages((prev) =>
      prev.filter((_, i) => i !== index),
    );
  };

  // 협상 이력 저장 함수 - Supabase에 업데이트
  const handleSaveHistory = async () => {
    const newHistoryItem = {
      date: historyDate,
      notes: historyNotes,
      user: historyUser,
      images: historyImages,
    };

    let updatedHistory = [...historyList];
    if (editingHistoryIndex !== null) {
      // 기존 항목 수정
      updatedHistory[editingHistoryIndex] = newHistoryItem;
    } else {
      // 새 항목 추가
      updatedHistory.push(newHistoryItem);
    }

    try {
      await dataClient.updateNegotiationHistory(
        store.id,
        updatedHistory,
      );
      setHistoryList(updatedHistory);
      setShowHistoryDialog(false);
      toast.success("협상 이력이 저장되었습니다.");
    } catch (e) {
      toast.error("협상 이력 저장 실패");
    }
  };

  // 체크포인트 추가 다이얼로그 열기
  const handleAddCheckpoint = () => {
    setEditingCheckpointIndex(null);
    setCheckpointDate(new Date().toISOString().split("T")[0]);
    setCheckpointNotes("");
    setCheckpointUser("");
    setCheckpointImages([]);
    setCheckpointPdf(null);
    setShowCheckpointDialog(true);
  };

  // 특정 체크포인트를 수정하기 위한 다이얼로그 열기
  const handleEditCheckpoint = (index: number) => {
    const item = checkpointsList[index];
    setEditingCheckpointIndex(index);
    setCheckpointDate(item.date);
    setCheckpointNotes(item.notes);
    setCheckpointUser(item.user);
    setCheckpointImages(item.images || []);
    setCheckpointPdf(item.pdf || null);
    setShowCheckpointDialog(true);
  };

  // 체크포인트 삭제 함수 - Supabase에서 실제 삭제
  const handleDeleteCheckpoint = async (index: number) => {
    if (!confirm("이 체크포인트를 삭제하시겠습니까?")) return;

    const updatedCheckpoints = checkpointsList.filter(
      (_, i) => i !== index,
    );
    try {
      await dataClient.updateCheckpoints(
        store.id,
        updatedCheckpoints,
      );
      setCheckpointsList(updatedCheckpoints);
      toast.success("체크포인트가 삭제되었습니다.");
    } catch (e) {
      toast.error("체크포인트 삭제 실패");
    }
  };

  // 체크포인트에 첨부할 PDF를 Supabase Storage에 업로드하는 함수
  const handleCheckpointPdfUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // PDF 파일만 허용
    if (file.type !== "application/pdf") {
      toast.error("PDF 파일만 업로드 가능합니다.");
      return;
    }

    setIsUploadingCheckpointPdf(true);
    try {
      const result = await dataClient.uploadFile(file);
      setCheckpointPdf(result.url);
      toast.success("PDF 파일이 업로드되었습니다.");
    } catch (e: any) {
      console.error("PDF Upload error:", e);
      toast.error(e.message || "PDF 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploadingCheckpointPdf(false);
    }
  };

  // 체크포인트에 첨부할 이미지를 Supabase Storage에 업로드하는 함수
  const handleCheckpointImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 최대 10장 제한
    if (checkpointImages.length + files.length > 10) {
      toast.error("사진은 최대 10장까지 업로드 가능합니다.");
      return;
    }

    setIsUploadingCheckpointImage(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const result = await dataClient.uploadFile(files[i]);
        uploadedUrls.push(result.url);
      }
      setCheckpointImages((prev) => [...prev, ...uploadedUrls]);
      toast.success(
        `${files.length}장의 사진이 업로드되었습니다.`,
      );
    } catch (e: any) {
      console.error("Upload error:", e);
      toast.error(
        e.message || "사진 업로드 중 오류가 발생했습니다.",
      );
    } finally {
      setIsUploadingCheckpointImage(false);
    }
  };

  // 체크포인트 이미지 목록에서 특정 이미지를 제거하는 함수
  const removeCheckpointImage = (index: number) => {
    setCheckpointImages((prev) =>
      prev.filter((_, i) => i !== index),
    );
  };

  // 체크포인트 저장 함수 - Supabase에 업데이트
  const handleSaveCheckpoint = async () => {
    const newCheckpointItem = {
      date: checkpointDate,
      notes: checkpointNotes,
      user: checkpointUser,
      images: checkpointImages,
      pdf: checkpointPdf,
    };

    let updatedCheckpoints = [...checkpointsList];
    if (editingCheckpointIndex !== null) {
      // 기존 항목 수정
      updatedCheckpoints[editingCheckpointIndex] =
        newCheckpointItem;
    } else {
      // 새 항목 추가
      updatedCheckpoints.push(newCheckpointItem);
    }

    try {
      await dataClient.updateCheckpoints(
        store.id,
        updatedCheckpoints,
      );
      setCheckpointsList(updatedCheckpoints);
      setShowCheckpointDialog(false);
      toast.success("체크포인트가 저장되었습니다.");
    } catch (e) {
      toast.error("체크포인트 저장 실패");
    }
  };

  return (
    <div className="w-96 bg-white border-l flex flex-col h-full shadow-2xl overflow-hidden">
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
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
            // 탭 전환 시 최신 데이터 다시 불러오기
            fetchHistory();
            fetchCheckpoints();
          }}
          className="w-full"
        >
          {/* 탭 네비게이션 */}
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4 h-auto p-0 flex-nowrap overflow-x-auto scrollbar-hide">
            {[
              { id: "overview", label: "Summary" },
              { id: "pl", label: "P&L" },
              { id: "negotiation", label: "Details" },
              { id: "reviews", label: "Committee" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-500 data-[state=active]:text-black py-3 px-4 capitalize whitespace-nowrap font-medium"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Summary 탭 - 후보점 기본 정보 */}
          <TabsContent
            key={`overview-${activeTab}`}
            value="overview"
            className="p-4 space-y-4 m-0"
          >
            {/* 현 상태 (입점 브랜드 또는 공실) */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 font-medium">
                  현 상태
                </span>
              </div>
              <div className="pl-6 text-sm text-gray-600">
                {editData.currentStatus}
              </div>
            </div>

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
                <div className="text-xs text-gray-500">
                  {store.location.city},{" "}
                  {store.location.country}
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
                {store.area?.toLocaleString()}㎡ (
                {Math.round((store.area || 0) * 0.3025)}평)
              </div>
            </div>

            {/* 임차 조건 - 보증금, 임대료 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-3 bg-black rounded-full"></div>
                <span className="text-sm font-bold text-gray-900 uppercase tracking-tight">
                  임차조건
                </span>
              </div>
              <div className="pl-4 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-[11px] text-gray-400 font-medium">
                    보증금
                  </div>
                  <div className="text-sm font-bold text-gray-800">
                    ₩
                    {formatCurrencyWithUnit(store.financial?.deposit || 0)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] text-gray-400 font-medium">
                    임대료(고정/수수료)
                  </div>
                  <div className="text-sm font-bold text-gray-800">
                    <span>
                      ₩{formatCurrencyWithUnit(store.financial?.monthlyRent || 0)}
                    </span>
                    <span className="text-gray-300 mx-1">/</span>
                    <span>
                      {(store.financial as any)?.rentCommission || 0}%
                    </span>
                  </div>
                </div>

                {/* 계약 기간 (있는 경우만 표시) */}
                {(store.contract?.startDate ||
                  store.contract?.endDate) && (
                  <div className="col-span-2 space-y-1 pt-2 border-t border-dashed border-gray-100">
                    <div className="text-[11px] text-gray-400 font-medium">
                      계약기간
                    </div>
                    <div className="text-sm font-bold text-gray-800 tracking-tight">
                      {store.contract?.startDate} ~{" "}
                      {store.contract?.endDate}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 주요 일정 - Handover, 공사착공, 오픈예정 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-3 bg-black rounded-full"></div>
                <span className="text-sm font-bold text-gray-900 uppercase tracking-tight">
                  주요일정
                </span>
              </div>
              <div className="pl-4 space-y-3">
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-xs text-gray-500 font-medium">
                    Handover date
                  </span>
                  <span className="text-sm font-semibold text-gray-700">
                    {formatDate(editData.handoverDate)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-xs text-gray-500 font-medium">
                    공사착공일
                  </span>
                  <span className="text-sm font-semibold text-gray-700">
                    {formatDate(
                      (editData as any).constructionStartDate,
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-xs text-gray-500 font-medium">
                    오픈예정일
                  </span>
                  <span className="text-sm font-semibold text-gray-700">
                    {formatDate(editData.openDate)}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* P/L 탭 - 예상 재무 정보 */}
          <TabsContent
            value="pl"
            key={`pl-${activeTab}`}
            className="p-4 space-y-4 m-0"
          >
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-4 shadow-sm">
                {/* 예상 월 매출 */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[11px] text-gray-400 font-medium mb-1">
                      예상 매출 (월)
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      ₩
                      {formatCurrencyWithUnit(editData.financial.estimatedSales)}
                    </div>
                  </div>
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>

                <div className="h-px bg-gray-100"></div>

                {/* 예상 투자비 및 세부 내역 */}
                <div className="flex justify-between items-start">
                  <div className="w-full">
                    <div className="text-[11px] text-gray-400 font-medium mb-1">
                      예상 투자비
                    </div>
                    <div className="text-xl font-bold text-gray-900 mb-2">
                      ₩
                      {formatCurrencyWithUnit(editData.financial.investment)}
                    </div>
                    {/* 투자비 항목별 세부 내역 */}
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400">
                          인테리어
                        </span>
                        <span className="text-[10px] font-bold text-gray-600">
                          {formatCurrencyWithUnit((editData.financial as any).investmentInterior || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400">
                          집기
                        </span>
                        <span className="text-[10px] font-bold text-gray-600">
                          {formatCurrencyWithUnit((editData.financial as any).investmentFurniture || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400">
                          파사드
                        </span>
                        <span className="text-[10px] font-bold text-gray-600">
                          {formatCurrencyWithUnit((editData.financial as any).investmentFacade || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400">
                          기타
                        </span>
                        <span className="text-[10px] font-bold text-gray-600">
                          {formatCurrencyWithUnit((editData.financial as any).investmentOther || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <DollarSign className="w-4 h-4 text-orange-500 shrink-0" />
                </div>

                <div className="h-px bg-gray-100"></div>

                {/* 인건비 (월) */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[11px] text-gray-400 font-medium mb-1">
                      인건비 (월)
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      ₩
                      {formatCurrencyWithUnit((editData.financial as any).personnelCost || 0)}
                    </div>
                  </div>
                  <Users className="w-4 h-4 text-purple-500" />
                </div>

                <div className="h-px bg-gray-100"></div>

                {/* 예상 영업이익률 */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[11px] text-gray-400 font-medium mb-1">
                      예상 영업이익률
                    </div>
                    <div className="text-xl font-bold text-blue-600">
                      {editData.financial.estimatedMargin}%
                    </div>
                  </div>
                  <Trophy className="w-4 h-4 text-green-500" />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Details 탭 - 협상 진행 단계 및 이력 */}
          <TabsContent
            key={`negotiation-${activeTab}`}
            value="negotiation"
            className="flex-1 overflow-y-auto p-5 m-0 bg-slate-50/30"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Handshake className="w-4 h-4 text-blue-600" />{" "}
                협상 진행 단계
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddHistory}
                className="h-8 text-[11px] font-bold"
              >
                <Plus className="w-3 h-3 mr-1" /> 기록 추가
              </Button>
            </div>

            {/* 파이프라인 단계 시각화 - 5단계로 표시 */}
            <div className="flex items-center justify-between px-2 mb-8 relative">
              {/* 배경 연결선 */}
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0"></div>
              {[
                "Planed",
                "Confirmed",
                "Signed",
                "Construction",
                "Open",
              ].map((step, idx) => {
                const steps = [
                  "Planed",
                  "Confirmed",
                  "Signed",
                  "Construction",
                  "Open",
                ];
                const currentIdx = steps.indexOf(store.status);
                const isCompleted =
                  steps.indexOf(step) < currentIdx;
                const isCurrent = step === store.status;

                return (
                  <div
                    key={step}
                    className="relative z-10 flex flex-col items-center"
                  >
                    {/* 단계 원형 아이콘 - 완료: 파란색, 현재: 파란색+링, 미래: 회색 */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold transition-all ${
                        isCurrent
                          ? "bg-blue-600 text-white ring-4 ring-blue-100"
                          : isCompleted
                            ? "bg-blue-600 text-white"
                            : "bg-white border-2 border-slate-200 text-slate-400"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span
                      className={`text-[8px] mt-2 font-bold whitespace-nowrap ${isCurrent ? "text-blue-600" : "text-slate-400"}`}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 협상 이력 목록 */}
            <div className="space-y-3">
              {isLoadingHistory ? (
                // 로딩 중 표시
                <div className="text-center py-12 text-gray-400 text-xs animate-pulse">
                  데이터 로딩 중...
                </div>
              ) : sortedHistoryList &&
                sortedHistoryList.length > 0 ? (
                // 협상 이력 카드 목록
                sortedHistoryList.map(({ item, index }) => (
                  <div
                    key={index}
                    className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm group hover:border-blue-200 transition-colors cursor-pointer hover:bg-blue-50/30"
                    onClick={() => setSelectedHistory(item)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span className="text-[11px] font-bold text-slate-500">
                          {item.date}
                        </span>
                        <span className="text-[10px] text-slate-300">
                          |
                        </span>
                        <span className="text-[11px] font-bold text-blue-600">
                          {item.user}
                        </span>
                      </div>
                      {/* hover 시 표시되는 수정/삭제 버튼 */}
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditHistory(index);
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteHistory(index);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    {/* 노트 내용 미리보기 (3줄 제한) */}
                    <p className="text-xs text-gray-700 leading-relaxed font-medium mb-3 line-clamp-3">
                      {item.notes}
                    </p>

                    {/* 첨부 이미지 썸네일 */}
                    {item.images && item.images.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {item.images.map(
                          (img: string, i: number) => (
                            <div
                              key={i}
                              className="relative h-16 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-slate-100 hover:opacity-80 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewImage(img);
                              }}
                            >
                              <img
                                src={img}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                // 이력이 없는 경우 빈 상태 표시
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                  <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">
                    등록된 협상 기록이 없습니다.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Committee 탭 - 체크포인트(Committee Review) */}
          <TabsContent
            key={`reviews-${activeTab}`}
            value="reviews"
            className="flex-1 overflow-y-auto p-5 m-0 bg-slate-50/30"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />{" "}
                Committee Review
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddCheckpoint}
                className="h-8 text-[11px] font-bold"
              >
                <Plus className="w-3 h-3 mr-1" />
                추가
              </Button>
            </div>

            {/* 체크포인트 카드 목록 */}
            <div className="space-y-3">
              {isLoadingCheckpoints ? (
                // 로딩 중 표시
                <div className="text-center py-12 text-gray-400 text-xs animate-pulse">
                  데이터 로딩 중...
                </div>
              ) : sortedCheckpointsList &&
                sortedCheckpointsList.length > 0 ? (
                sortedCheckpointsList.map(({ item, index }) => (
                  <div
                    key={index}
                    className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm group hover:border-blue-200 transition-colors cursor-pointer hover:bg-blue-50/30"
                    onClick={() => setSelectedCheckpoint(item)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span className="text-[11px] font-bold text-slate-500">
                          {item.date}
                        </span>
                        <span className="text-[10px] text-slate-300">
                          |
                        </span>
                        <span className="text-[11px] font-bold text-blue-600">
                          {item.user}
                        </span>
                      </div>
                      {/* hover 시 표시되는 수정/삭제 버튼 */}
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCheckpoint(index);
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCheckpoint(index);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    {/* 노트 내용 미리보기 (3줄 제한) */}
                    <p className="text-xs text-gray-700 leading-relaxed font-medium mb-3 line-clamp-3">
                      {item.notes}
                    </p>

                    {/* 첨부 이미지 썸네일 */}
                    {item.images && item.images.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {item.images.map(
                          (img: string, i: number) => (
                            <div
                              key={i}
                              className="relative h-16 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-slate-100 hover:opacity-80 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewImage(img);
                              }}
                            >
                              <img
                                src={img}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ),
                        )}
                      </div>
                    )}

                    {/* PDF 첨부 링크 */}
                    {item.pdf && (
                      <div className="mt-2 pt-2 border-t border-dashed border-gray-100">
                        <a
                          href={item.pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline bg-blue-50 px-2 py-1 rounded-md"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          첨부된 PDF 보기
                        </a>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                // 체크포인트가 없는 경우 빈 상태 표시
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                  <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">
                    등록된 체크포인트가 없습니다.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* 하단 액션 버튼 영역 */}
      <div className="p-4 border-t flex gap-2 bg-white">
        {/* 정보 수정 버튼 */}
        <Button
          variant="outline"
          className="flex-1 h-10 text-xs font-bold"
          onClick={() => setShowEditDialog(true)}
        >
          <Edit2 className="w-3 h-3 mr-2" /> 정보 수정
        </Button>
        {/* 삭제 버튼 */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => onDelete?.(store.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* 후보점 정보 수정 다이얼로그 */}
      <Dialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              후보점 정보 수정
            </DialogTitle>
            <DialogDescription>
              후보점의 상세 정보 및 추정 매출 데이터를 수정할 수
              있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2 font-sans">
            {/* 매장명 및 현 상태 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold">
                  매장명
                </Label>
                <Input
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      name: e.target.value,
                    })
                  }
                  className="h-8 text-[11px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold">
                  현 상태 (입점 브랜드/공실)
                </Label>
                <Input
                  value={editData.currentStatus}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      currentStatus: e.target.value,
                    })
                  }
                  className="h-8 text-[11px]"
                />
              </div>
            </div>

            {/* 파이프라인 상태 및 면적 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold">
                  상태
                </Label>
                <select
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[11px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={editData.status}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      status: e.target.value as any,
                    })
                  }
                >
                  <option value="Planed">Planed</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Signed">Signed</option>
                  <option value="Construction">
                    Construction
                  </option>
                  <option value="Open">Open</option>
                  <option value="Close">Close</option>
                  <option value="Reject">Reject</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold">
                  면적 (㎡)
                </Label>
                <Input
                  type="text"
                  value={editData.area?.toLocaleString() ?? ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(
                      /,/g,
                      "",
                    );
                    if (!isNaN(Number(value))) {
                      setEditData({
                        ...editData,
                        area: Number(value),
                      });
                    }
                  }}
                  className="h-8 text-[11px]"
                />
              </div>
            </div>

            {/* 채널 선택 */}
            <div className="space-y-2">
              <Label className="text-[11px] font-bold">
                채널
              </Label>
              <select
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[11px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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

            {/* 주소 */}
            <div className="space-y-2">
              <Label className="text-[11px] font-bold">
                주소
              </Label>
              <Input
                value={editData.address}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    address: e.target.value,
                  })
                }
                className="h-8 text-[11px]"
              />
            </div>

            {/* 좌표로부터 도시/국가 자동 채우기 버튼 */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReverseGeocode}
                disabled={isGeocodingLoading}
                className="w-full h-8 text-[11px] font-bold border-blue-200 text-blue-700 hover:bg-blue-50"
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
            </div>

            {/* 주요 일정 - Handover, 공사착공, 오픈예정 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold">
                  Handover Date
                </Label>
                <Input
                  type="date"
                  value={editData.handoverDate}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      handoverDate: e.target.value,
                    })
                  }
                  className="h-8 text-[11px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold">
                  공사착공일
                </Label>
                <Input
                  type="date"
                  value={
                    (editData as any).constructionStartDate
                  }
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      constructionStartDate: e.target.value,
                    } as any)
                  }
                  className="h-8 text-[11px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold">
                  오픈 예정일
                </Label>
                <Input
                  type="date"
                  value={editData.openDate}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      openDate: e.target.value,
                    })
                  }
                  className="h-8 text-[11px]"
                />
              </div>
            </div>

            <div className="h-px bg-slate-100 my-2"></div>
            <h4 className="text-[11px] font-bold text-blue-600 uppercase">
              Financial (P/L)
            </h4>

            {/* 재무 정보 - 예상 매출, 영업이익률, 인건비 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold">
                  예상 월 매출 (원)
                </Label>
                <Input
                  type="text"
                  value={
                    editData.financial.estimatedSales?.toLocaleString() ??
                    ""
                  }
                  onChange={(e) => {
                    const value = e.target.value.replace(
                      /,/g,
                      "",
                    );
                    if (!isNaN(Number(value))) {
                      setEditData({
                        ...editData,
                        financial: {
                          ...editData.financial,
                          estimatedSales: Number(value),
                        },
                      });
                    }
                  }}
                  className="h-8 text-[11px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold">
                  영업이익률 (%)
                </Label>
                <Input
                  type="text"
                  value={
                    editData.financial.estimatedMargin?.toLocaleString() ??
                    ""
                  }
                  onChange={(e) => {
                    const value = e.target.value.replace(
                      /,/g,
                      "",
                    );
                    if (!isNaN(Number(value))) {
                      setEditData({
                        ...editData,
                        financial: {
                          ...editData.financial,
                          estimatedMargin: Number(value),
                        },
                      });
                    }
                  }}
                  className="h-8 text-[11px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold">
                  인건비 (월)
                </Label>
                <Input
                  type="text"
                  value={
                    (editData.financial as any).personnelCost?.toLocaleString() ??
                    ""
                  }
                  onChange={(e) => {
                    const value = e.target.value.replace(
                      /,/g,
                      "",
                    );
                    if (!isNaN(Number(value))) {
                      setEditData({
                        ...editData,
                        financial: {
                          ...editData.financial,
                          personnelCost: Number(value),
                        } as any,
                      });
                    }
                  }}
                  className="h-8 text-[11px]"
                />
              </div>
            </div>

            {/* 임대 조건 - 고정 임대료, 수수료, 보증금, 총 투자비 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold">
                  고정 임대료 (원)
                </Label>
                <Input
                  type="text"
                  value={
                    editData.financial.monthlyRent?.toLocaleString() ??
                    ""
                  }
                  onChange={(e) => {
                    const value = e.target.value.replace(
                      /,/g,
                      "",
                    );
                    if (!isNaN(Number(value))) {
                      setEditData({
                        ...editData,
                        financial: {
                          ...editData.financial,
                          monthlyRent: Number(value),
                        },
                      });
                    }
                  }}
                  className="h-8 text-[11px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold">
                  수수료 (%)
                </Label>
                <div className="relative">
                  <Input
                    type="text"
                    value={
                      (editData.financial as any).rentCommission?.toLocaleString() ??
                      ""
                    }
                    onChange={(e) => {
                      const value = e.target.value.replace(
                        /,/g,
                        "",
                      );
                      if (!isNaN(Number(value))) {
                        setEditData({
                          ...editData,
                          financial: {
                            ...editData.financial,
                            rentCommission: Number(value),
                          },
                        } as any);
                      }
                    }}
                    className="h-8 text-[11px] pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">
                    %
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold">
                  보증금 (원)
                </Label>
                <Input
                  type="text"
                  value={
                    editData.financial.deposit?.toLocaleString() ??
                    ""
                  }
                  onChange={(e) => {
                    const value = e.target.value.replace(
                      /,/g,
                      "",
                    );
                    if (!isNaN(Number(value))) {
                      setEditData({
                        ...editData,
                        financial: {
                          ...editData.financial,
                          deposit: Number(value),
                        },
                      });
                    }
                  }}
                  className="h-8 text-[11px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold">
                  총 투자비 (원)
                </Label>
                <Input
                  type="text"
                  value={
                    editData.financial.investment?.toLocaleString() ??
                    ""
                  }
                  onChange={(e) => {
                    const value = e.target.value.replace(
                      /,/g,
                      "",
                    );
                    if (!isNaN(Number(value))) {
                      setEditData({
                        ...editData,
                        financial: {
                          ...editData.financial,
                          investment: Number(value),
                        },
                      });
                    }
                  }}
                  className="h-8 text-[11px]"
                />
              </div>
            </div>

            {/* 계약 시작/종료일 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold">
                  계약 시작일
                </Label>
                <Input
                  type="date"
                  value={
                    (editData as any).contract?.startDate || ""
                  }
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      contract: {
                        ...(editData as any).contract,
                        startDate: e.target.value,
                      },
                    })
                  }
                  className="h-8 text-[11px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold">
                  계약 종료일
                </Label>
                <Input
                  type="date"
                  value={
                    (editData as any).contract?.endDate || ""
                  }
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      contract: {
                        ...(editData as any).contract,
                        endDate: e.target.value,
                      },
                    })
                  }
                  className="h-8 text-[11px]"
                />
              </div>
            </div>

            {/* 투자비 세부 항목 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold">
                  인테리어 (원)
                </Label>
                <Input
                  type="text"
                  value={
                    (
                      editData.financial as any
                    ).investmentInterior?.toLocaleString() ?? ""
                  }
                  onChange={(e) => {
                    const value = e.target.value.replace(
                      /,/g,
                      "",
                    );
                    if (!isNaN(Number(value))) {
                      setEditData({
                        ...editData,
                        financial: {
                          ...editData.financial,
                          investmentInterior: Number(value),
                        },
                      });
                    }
                  }}
                  className="h-8 text-[11px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold">
                  집기 (원)
                </Label>
                <Input
                  type="text"
                  value={
                    (
                      editData.financial as any
                    ).investmentFurniture?.toLocaleString() ??
                    ""
                  }
                  onChange={(e) => {
                    const value = e.target.value.replace(
                      /,/g,
                      "",
                    );
                    if (!isNaN(Number(value))) {
                      setEditData({
                        ...editData,
                        financial: {
                          ...editData.financial,
                          investmentFurniture: Number(value),
                        },
                      });
                    }
                  }}
                  className="h-8 text-[11px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold">
                  파사드 (원)
                </Label>
                <Input
                  type="text"
                  value={
                    (
                      editData.financial as any
                    ).investmentFacade?.toLocaleString() ?? ""
                  }
                  onChange={(e) => {
                    const value = e.target.value.replace(
                      /,/g,
                      "",
                    );
                    if (!isNaN(Number(value))) {
                      setEditData({
                        ...editData,
                        financial: {
                          ...editData.financial,
                          investmentFacade: Number(value),
                        },
                      });
                    }
                  }}
                  className="h-8 text-[11px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold">
                  기타 (원)
                </Label>
                <Input
                  type="text"
                  value={
                    (
                      editData.financial as any
                    ).investmentOther?.toLocaleString() ?? ""
                  }
                  onChange={(e) => {
                    const value = e.target.value.replace(
                      /,/g,
                      "",
                    );
                    if (!isNaN(Number(value))) {
                      setEditData({
                        ...editData,
                        financial: {
                          ...editData.financial,
                          investmentOther: Number(value),
                        },
                      });
                    }
                  }}
                  className="h-8 text-[11px]"
                />
              </div>
            </div>
          </div>
          {/* 수정 다이얼로그 하단 버튼 */}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
            >
              취소
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="bg-blue-600 hover:bg-blue-700"
            >
              저장하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 협상 기록 추가/수정 다이얼로그 */}
      <Dialog
        open={showHistoryDialog}
        onOpenChange={setShowHistoryDialog}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              협상 기록 추가/수정
            </DialogTitle>
            <DialogDescription>
              협상 진행 상황에 대한 구체적인 코멘트와 날짜를
              기록합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              {/* 날짜 입력 */}
              <div className="space-y-2">
                <Label className="text-xs font-bold">
                  날짜
                </Label>
                <Input
                  type="date"
                  value={historyDate}
                  onChange={(e) =>
                    setHistoryDate(e.target.value)
                  }
                />
              </div>
              {/* 담당자 입력 */}
              <div className="space-y-2">
                <Label className="text-xs font-bold">
                  담당자
                </Label>
                <Input
                  value={historyUser}
                  onChange={(e) =>
                    setHistoryUser(e.target.value)
                  }
                  placeholder="담당자 이름"
                />
              </div>
            </div>
            {/* 노트 내용 입력 */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">내용</Label>
              <Textarea
                value={historyNotes}
                onChange={(e) =>
                  setHistoryNotes(e.target.value)
                }
                placeholder="협상 내용 및 특이사항을 입력하세요"
                className="min-h-[100px]"
              />
            </div>

            {/* 이미지 첨부 섹션 */}
            <div className="space-y-3">
              <Label className="text-xs font-bold flex items-center justify-between">
                사진 (최대 10장)
                <span className="text-[10px] text-gray-400 font-normal">
                  {historyImages.length}/10
                </span>
              </Label>

              <div className="flex flex-wrap gap-2">
                {/* 업로드된 이미지 썸네일 */}
                {historyImages.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 group"
                  >
                    <img
                      src={url}
                      className="w-full h-full object-cover"
                      alt={`upload-${idx}`}
                    />
                    {/* 이미지 제거 버튼 (hover 시 표시) */}
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}

                {/* 이미지 추가 버튼 (최대 10장까지) */}
                {historyImages.length < 10 && (
                  <label
                    className={`w-16 h-16 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors ${isUploadingImage ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    {isUploadingImage ? (
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-4 h-4 text-slate-400" />
                        <span className="text-[8px] text-slate-400 mt-1 font-bold">
                          추가
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowHistoryDialog(false)}
            >
              취소
            </Button>
            <Button
              onClick={handleSaveHistory}
              className="bg-blue-600 hover:bg-blue-700"
            >
              저장하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 체크포인트(Committee Review) 추가/수정 다이얼로그 */}
      <Dialog
        open={showCheckpointDialog}
        onOpenChange={setShowCheckpointDialog}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              추가/수정
            </DialogTitle>
            <DialogDescription>
              주요 Committee Review 내용 및 주요 상황을 기록합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              {/* 날짜 입력 */}
              <div className="space-y-2">
                <Label className="text-xs font-bold">
                  날짜
                </Label>
                <Input
                  type="date"
                  value={checkpointDate}
                  onChange={(e) =>
                    setCheckpointDate(e.target.value)
                  }
                />
              </div>
              {/* 작성자 입력 */}
              <div className="space-y-2">
                <Label className="text-xs font-bold">
                  작성자
                </Label>
                <Input
                  value={checkpointUser}
                  onChange={(e) =>
                    setCheckpointUser(e.target.value)
                  }
                  placeholder="작성자 이름"
                />
              </div>
            </div>
            {/* 체크포인트 내용 입력 */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">내용</Label>
              <Textarea
                value={checkpointNotes}
                onChange={(e) =>
                  setCheckpointNotes(e.target.value)
                }
                placeholder="체크포인트 내용을 입력하세요"
                className="min-h-[100px]"
              />
            </div>

            {/* 체크포인트 이미지 첨부 섹션 */}
            <div className="space-y-3">
              <Label className="text-xs font-bold flex items-center justify-between">
                사진 (최대 10장)
                <span className="text-[10px] text-gray-400 font-normal">
                  {checkpointImages.length}/10
                </span>
              </Label>

              <div className="flex flex-wrap gap-2">
                {/* 업로드된 이미지 썸네일 */}
                {checkpointImages.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 group"
                  >
                    <img
                      src={url}
                      className="w-full h-full object-cover"
                      alt={`upload-${idx}`}
                    />
                    {/* 이미지 제거 버튼 (hover 시 표시) */}
                    <button
                      onClick={() => removeCheckpointImage(idx)}
                      className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}

                {/* 이미지 추가 버튼 (최대 10장까지) */}
                {checkpointImages.length < 10 && (
                  <label
                    className={`w-16 h-16 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors ${isUploadingCheckpointImage ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    {isUploadingCheckpointImage ? (
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-4 h-4 text-slate-400" />
                        <span className="text-[8px] text-slate-400 mt-1 font-bold">
                          추가
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleCheckpointImageUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* PDF 파일 첨부 섹션 */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">PDF 파일</Label>
              {checkpointPdf ? (
                // PDF가 업로드된 경우 - 링크와 삭제 버튼 표시
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border text-xs">
                  <FileText className="w-4 h-4 text-red-500" />
                  <a
                    href={checkpointPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 truncate hover:underline text-blue-600"
                  >
                    첨부된 PDF 파일
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-gray-400 hover:text-red-500"
                    onClick={() => setCheckpointPdf(null)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                // PDF가 없는 경우 - 업로드 버튼 표시
                <label
                  className={`flex items-center justify-center gap-2 w-full h-9 border rounded-md text-xs cursor-pointer hover:bg-gray-50 transition-colors ${
                    isUploadingCheckpointPdf
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }`}
                >
                  {isUploadingCheckpointPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-gray-600">
                    {isUploadingCheckpointPdf
                      ? "업로드 중..."
                      : "PDF 업로드"}
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleCheckpointPdfUpload}
                    disabled={isUploadingCheckpointPdf}
                  />
                </label>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCheckpointDialog(false)}
            >
              취소
            </Button>
            <Button
              onClick={handleSaveCheckpoint}
              className="bg-blue-600 hover:bg-blue-700"
            >
              저장하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 체크포인트 상세보기 다이얼로그 */}
      <Dialog
        open={!!selectedCheckpoint}
        onOpenChange={(open) =>
          !open && setSelectedCheckpoint(null)
        }
      >
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              체크포인트 상세
            </DialogTitle>
          </DialogHeader>
          {selectedCheckpoint && (
            <div className="space-y-6 py-4">
              {/* 날짜 및 작성자 정보 */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-700">
                    {selectedCheckpoint.date}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                  <span className="text-xs text-blue-400 font-bold">
                    작성자
                  </span>
                  <span className="text-sm font-bold text-blue-700">
                    {selectedCheckpoint.user}
                  </span>
                </div>
              </div>

              {/* 노트 내용 */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {selectedCheckpoint.notes}
                </p>
              </div>

              {/* 첨부 이미지 갤러리 */}
              {selectedCheckpoint.images &&
                selectedCheckpoint.images.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <Camera className="w-4 h-4" /> 첨부 이미지
                      ({selectedCheckpoint.images.length})
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedCheckpoint.images.map(
                        (img: string, i: number) => (
                          <div
                            key={i}
                            className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 border border-slate-200 cursor-zoom-in group shadow-sm hover:shadow-md transition-all"
                            onClick={() => setPreviewImage(img)}
                          >
                            <img
                              src={img}
                              alt=""
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {/* 첨부 PDF 링크 */}
              {selectedCheckpoint.pdf && (
                <div className="pt-2">
                  <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> 첨부 PDF
                  </h4>
                  <a
                    href={selectedCheckpoint.pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all group"
                  >
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
                      <FileText className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-gray-800 mb-0.5 group-hover:text-blue-600 transition-colors">
                        첨부된 PDF 문서 보기
                      </div>
                      <div className="text-xs text-gray-400">
                        클릭하여 문서를 확인하세요
                      </div>
                    </div>
                  </a>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => setSelectedCheckpoint(null)}
              className="w-full sm:w-auto"
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 협상 기록 상세보기 다이얼로그 */}
      <Dialog
        open={!!selectedHistory}
        onOpenChange={(open) =>
          !open && setSelectedHistory(null)
        }
      >
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <HistoryIcon className="w-5 h-5 text-blue-600" />
              협상 기록 상세
            </DialogTitle>
          </DialogHeader>
          {selectedHistory && (
            <div className="space-y-6 py-4">
              {/* 날짜 및 담당자 정보 */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-700">
                    {selectedHistory.date}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                  <span className="text-xs text-blue-400 font-bold">
                    담당자
                  </span>
                  <span className="text-sm font-bold text-blue-700">
                    {selectedHistory.user}
                  </span>
                </div>
              </div>

              {/* 노트 내용 */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {selectedHistory.notes}
                </p>
              </div>

              {/* 첨부 이미지 갤러리 */}
              {selectedHistory.images &&
                selectedHistory.images.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <Camera className="w-4 h-4" /> 첨부 이미지
                      ({selectedHistory.images.length})
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedHistory.images.map(
                        (img: string, i: number) => (
                          <div
                            key={i}
                            className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 border border-slate-200 cursor-zoom-in group shadow-sm hover:shadow-md transition-all"
                            onClick={() => setPreviewImage(img)}
                          >
                            <img
                              src={img}
                              alt=""
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => setSelectedHistory(null)}
              className="w-full sm:w-auto"
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 이미지 라이트박스 미리보기 다이얼로그 */}
      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => !open && setPreviewImage(null)}
      >
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-transparent border-none shadow-none flex items-center justify-center outline-none">
          <DialogTitle className="sr-only">
            이미지 미리보기
          </DialogTitle>
          <div className="relative w-full h-full flex items-center justify-center outline-none">
            {/* 닫기 버튼 */}
            <Button
              variant="ghost"
              className="absolute -top-4 -right-4 text-white hover:bg-white/20 rounded-full w-10 h-10 p-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setPreviewImage(null)}
            >
              <X className="w-6 h-6" />
            </Button>
            {/* 이미지 전체 표시 */}
            {previewImage && (
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
