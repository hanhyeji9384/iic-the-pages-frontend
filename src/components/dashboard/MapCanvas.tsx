// ============================================================
// MapCanvas 컴포넌트
// Google Maps를 기반으로 매장 마커, 파이프라인 연결선, 트래픽 구역,
// 검색창, 스트리트 뷰 등 지도 관련 모든 기능을 담당하는 핵심 컴포넌트입니다.
// ============================================================

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  GoogleMap,
  useJsApiLoader,
  OverlayView,
  Polyline,
  Circle,
  useGoogleMap,
  StreetViewPanorama,
} from "@react-google-maps/api";
import { Store, MapViewMode, FilterState } from "../../types";
import { SavedLine } from "../../utils/mockLineServer";
import { SavedEntity } from "../../utils/mockApi";
import { TrafficZone } from "./TrafficManagerPanel";
import {
  SearchAutocomplete,
  Suggestion,
} from "./SearchAutocomplete";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import {
  Layers,
  Plus,
  Minus,
  MousePointer2,
  Search,
  Bell,
  RotateCcw,
  Store as StoreIcon,
  TrendingUp,
  Building2,
  Users,
  MapPin,
  Shapes,
  Camera,
  CalendarClock,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { YearlyStatusCharts } from "./YearlyStatusCharts";
import { BrandDefinition } from "../../types";

// ============================================================
// 브랜드 아이콘 이미지 (Figma에서 추출한 이미지를 대체하는 빈 문자열)
// 실제 이미지 파일을 src/assets/ 에 추가하고 경로를 업데이트하세요.
// ============================================================
const aiIcon = "";
const selectAllIcon = "";
const appleIcon = "";
const nikeIcon = "";
const balenciagaIcon = "";
const raybanIcon = "";
const lululemonIcon = "";
const burberryIcon = "";
const adidasIcon = "";
const chanelIcon = "";
const aloIcon = "";
const googleIcon = "";
const samsungIcon = "";
const metaIcon = "";
const louisVuittonIcon = "";
const bottegaVenetaIcon = "";
const acneStudiosIcon = "";
const amiIcon = "";
const pradaIcon = "";

// Google Maps 로딩 시 함께 불러올 라이브러리 목록 (컴포넌트 외부에 선언해야 재렌더링 방지)
const GOOGLE_MAPS_LIBRARIES: ("places" | "visualization")[] = [
  "places",
  "visualization",
];

// 지도 컨테이너 스타일 (부모 요소를 꽉 채움)
const containerStyle = {
  width: "100%",
  height: "100%",
};

// 지도 초기 중심 좌표 (세계 지도 중앙 - 동아시아/오세아니아 기준)
const INITIAL_CENTER = {
  lat: 30.0,
  lng: 150.0,
};

// 지도 초기 줌 레벨 (세계 지도 전체 보기)
const INITIAL_ZOOM = 3;

// Google Maps API 키 (없으면 사용자에게 입력 요청 팝업이 뜸)
const GOOGLE_MAPS_API_KEY =
  "AIzaSyBpDAV2mauv7tXM5bGRdzkER3tryTRaubM";

// 밝은 은빛 지도 스타일 (도로명, 지하철역 이름이 잘 보이도록 최적화)
const lightMapStyles = [
  {
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }],
  },
  {
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#f5f5f5" }],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#dadada" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "transit.station",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.icon",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9c9c9" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
];

// Google Maps가 이미 window 객체에 로드되어 있는지 확인하는 함수
const isGoogleMapsLoaded = () => {
  return (
    typeof window !== "undefined" &&
    !!(window as any).google?.maps
  );
};

// ============================================================
// MapCanvas 컴포넌트가 받는 전체 속성(props) 정의
// ============================================================
interface MapCanvasProps {
  stores: Store[];                           // 현재 필터링된 표시할 매장 목록
  allStores?: Store[];                       // 뷰 리셋 시 사용할 전체 매장 목록
  isSalesMode?: boolean;                     // 매출 분석 모드 여부
  onStoreClick?: (store: Store) => void;     // 매장 마커 클릭 콜백
  activeTool?: string | null;                // 현재 활성화된 도구
  onToolChange?: (tool: string | null) => void; // 도구 변경 콜백
  onMapClick?: (coord: { lat: number; lng: number }) => void; // 지도 클릭 콜백
  onMapMouseMove?: (coord: { lat: number; lng: number }) => void; // 마우스 이동 콜백
  onResetSearch?: () => void;                // 검색 초기화 콜백
  lines?: SavedLine[];                       // 파이프라인 연결선 목록
  entities?: SavedEntity[];                  // 엔티티(IIC/경쟁사) 마커 목록
  tempMarker?: { lat: number; lng: number } | null; // 임시 위치 마커
  focusStore?: Store | null;                 // 포커스할 매장 (지도가 해당 매장으로 이동)
  focusLine?: SavedLine | null;              // 포커스할 연결선
  showLowSalesAlert?: boolean;               // 저매출 알림 표시 여부
  onToggleLowSalesAlert?: () => void;        // 저매출 알림 토글 콜백
  showExpirationAlert?: boolean;             // 계약 만료 알림 표시 여부
  onToggleExpirationAlert?: () => void;      // 계약 만료 알림 토글 콜백
  // 트래픽 구역 관련 속성
  trafficCenter?: { lat: number; lng: number } | null;
  trafficRadius?: number;
  trafficColor?: string;
  trafficOpacity?: number;
  savedTrafficZones?: TrafficZone[];
  focusTrafficZone?: TrafficZone | null;
  showHeatmap?: boolean;
  onTrafficZoneClick?: (zone: TrafficZone) => void;
  isTrafficDrawingMode?: boolean;
  // 필터 관련 속성
  filters?: FilterState;
  onFilterChange?: (filters: FilterState) => void;
  onSearchLocationSelect?: (coord: { lat: number; lng: number }) => void;
  onSelectAll?: () => void;
  customCompetitorBrands?: BrandDefinition[];
  customPreferredBrands?: BrandDefinition[];
}

// ============================================================
// DirectMapLayer: Google Maps가 이미 로드된 경우 직접 지도를 렌더링하는 컴포넌트
// ============================================================
const DirectMapLayer: React.FC<{
  stores: Store[];
  viewMode: MapViewMode;
  onZoomIn: () => void;
  onZoomOut: () => void;
  setMapInstance: (map: google.maps.Map | null) => void;
  onStoreClick: (store: Store) => void;
  onViewChange: (changed: boolean) => void;
  onMapClick?: (coord: { lat: number; lng: number }) => void;
  onMapMouseMove?: (coord: { lat: number; lng: number }) => void;
  lines?: SavedLine[];
  entities?: SavedEntity[];
  tempMarker?: { lat: number; lng: number } | null;
  showHeatmap?: boolean;
  showLowSalesAlert?: boolean;
  trafficCenter?: { lat: number; lng: number } | null;
  trafficRadius?: number;
  trafficColor?: string;
  trafficOpacity?: number;
  savedTrafficZones?: TrafficZone[];
  onTrafficZoneClick?: (zone: TrafficZone) => void;
  isTrafficDrawingMode?: boolean;
  isStreetViewActive?: boolean;
  streetViewPos?: { lat: number; lng: number } | null;
  onStreetViewClose?: () => void;
  isSalesMode?: boolean;
  showExpirationAlert?: boolean;
  customCompetitorBrands?: BrandDefinition[];
  customPreferredBrands?: BrandDefinition[];
}> = ({
  stores,
  viewMode,
  setMapInstance,
  onStoreClick,
  onViewChange,
  onMapClick,
  onMapMouseMove,
  lines,
  entities,
  tempMarker,
  showHeatmap,
  showLowSalesAlert,
  showExpirationAlert,
  trafficCenter,
  trafficRadius,
  trafficColor,
  trafficOpacity,
  savedTrafficZones,
  onTrafficZoneClick,
  isTrafficDrawingMode,
  isStreetViewActive,
  streetViewPos,
  onStreetViewClose,
  isSalesMode,
  customCompetitorBrands,
  customPreferredBrands,
}) => {
  // 지도 인스턴스가 로드될 때 부모에게 전달
  const onLoad = useCallback(
    (map: google.maps.Map) => {
      setMapInstance(map);
    },
    [setMapInstance],
  );

  // 지도 언마운트 시 인스턴스 초기화
  const onUnmount = useCallback(() => {
    setMapInstance(null);
  }, [setMapInstance]);

  return (
    <MapRenderer
      stores={stores}
      viewMode={viewMode}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onStoreClick={onStoreClick}
      onViewChange={onViewChange}
      onMapClick={onMapClick}
      onMapMouseMove={onMapMouseMove}
      lines={lines}
      entities={entities}
      tempMarker={tempMarker}
      showHeatmap={showHeatmap}
      showLowSalesAlert={showLowSalesAlert}
      showExpirationAlert={showExpirationAlert}
      trafficCenter={trafficCenter}
      trafficRadius={trafficRadius}
      trafficColor={trafficColor}
      trafficOpacity={trafficOpacity}
      savedTrafficZones={savedTrafficZones}
      onTrafficZoneClick={onTrafficZoneClick}
      isTrafficDrawingMode={isTrafficDrawingMode}
      isStreetViewActive={isStreetViewActive}
      streetViewPos={streetViewPos}
      onStreetViewClose={onStreetViewClose}
      isSalesMode={isSalesMode}
      customCompetitorBrands={customCompetitorBrands}
      customPreferredBrands={customPreferredBrands}
    />
  );
};

// ============================================================
// MapWithLoader: Google Maps 스크립트를 직접 로드하는 컴포넌트
// API 키를 받아서 로딩 후 MapRenderer를 렌더링합니다.
// ============================================================
const MapWithLoader: React.FC<{
  apiKey: string;
  stores: Store[];
  viewMode: MapViewMode;
  onZoomIn: () => void;
  onZoomOut: () => void;
  setMapInstance: (map: google.maps.Map | null) => void;
  onStoreClick: (store: Store) => void;
  onViewChange: (changed: boolean) => void;
  onMapClick?: (coord: { lat: number; lng: number }) => void;
  onMapMouseMove?: (coord: { lat: number; lng: number }) => void;
  lines?: SavedLine[];
  entities?: SavedEntity[];
  tempMarker?: { lat: number; lng: number } | null;
  showHeatmap?: boolean;
  showLowSalesAlert?: boolean;
  trafficCenter?: { lat: number; lng: number } | null;
  trafficRadius?: number;
  trafficColor?: string;
  trafficOpacity?: number;
  savedTrafficZones?: TrafficZone[];
  onTrafficZoneClick?: (zone: TrafficZone) => void;
  isTrafficDrawingMode?: boolean;
  isStreetViewActive?: boolean;
  streetViewPos?: { lat: number; lng: number } | null;
  onStreetViewClose?: () => void;
  isSalesMode?: boolean;
  showExpirationAlert?: boolean;
  customCompetitorBrands?: BrandDefinition[];
  customPreferredBrands?: BrandDefinition[];
}> = ({
  apiKey,
  stores,
  viewMode,
  setMapInstance,
  onStoreClick,
  onViewChange,
  onMapClick,
  onMapMouseMove,
  lines,
  entities,
  tempMarker,
  showHeatmap,
  showLowSalesAlert,
  showExpirationAlert,
  trafficCenter,
  trafficRadius,
  trafficColor,
  trafficOpacity,
  savedTrafficZones,
  onTrafficZoneClick,
  isTrafficDrawingMode,
  isStreetViewActive,
  streetViewPos,
  onStreetViewClose,
  isSalesMode,
  customCompetitorBrands,
  customPreferredBrands,
}) => {
  // useJsApiLoader: Google Maps 스크립트를 비동기로 로드하는 훅
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    language: "ko", // 한국어로 도로명 및 지명 표시
    version: "weekly", // 최신 Places API 지원 버전 사용
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      setMapInstance(map);
    },
    [setMapInstance],
  );

  const onUnmount = useCallback(() => {
    setMapInstance(null);
  }, [setMapInstance]);

  // 로드 실패 시 오류 메시지 표시
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50 text-red-500 p-4 text-center">
        Map failed to load. Please check your API key.
      </div>
    );
  }

  // 로딩 중 스피너 표시
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 bg-[#EAEAEA]">
        <div className="animate-pulse">
          Loading Google Maps...
        </div>
      </div>
    );
  }

  return (
    <MapRenderer
      stores={stores}
      viewMode={viewMode}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onStoreClick={onStoreClick}
      onViewChange={onViewChange}
      onMapClick={onMapClick}
      onMapMouseMove={onMapMouseMove}
      lines={lines}
      entities={entities}
      tempMarker={tempMarker}
      showHeatmap={showHeatmap}
      showLowSalesAlert={showLowSalesAlert}
      showExpirationAlert={showExpirationAlert}
      trafficCenter={trafficCenter}
      trafficRadius={trafficRadius}
      trafficColor={trafficColor}
      trafficOpacity={trafficOpacity}
      savedTrafficZones={savedTrafficZones}
      onTrafficZoneClick={onTrafficZoneClick}
      isTrafficDrawingMode={isTrafficDrawingMode}
      isStreetViewActive={isStreetViewActive}
      streetViewPos={streetViewPos}
      onStreetViewClose={onStreetViewClose}
      isSalesMode={isSalesMode}
      customCompetitorBrands={customCompetitorBrands}
      customPreferredBrands={customPreferredBrands}
    />
  );
};

// ============================================================
// MapRenderer: 실제 지도와 모든 오버레이(마커, 선, 원)를 렌더링하는 컴포넌트
// DirectMapLayer와 MapWithLoader 모두 이 컴포넌트를 사용합니다.
// ============================================================
const MapRenderer: React.FC<{
  stores: Store[];
  viewMode: MapViewMode;
  onLoad: (map: google.maps.Map) => void;
  onUnmount: (map: google.maps.Map) => void;
  onStoreClick: (store: Store) => void;
  onViewChange: (changed: boolean) => void;
  onMapClick?: (coord: { lat: number; lng: number }) => void;
  onMapMouseMove?: (coord: { lat: number; lng: number }) => void;
  lines?: SavedLine[];
  entities?: SavedEntity[];
  tempMarker?: { lat: number; lng: number } | null;
  showHeatmap?: boolean;
  showLowSalesAlert?: boolean;
  trafficCenter?: { lat: number; lng: number } | null;
  trafficRadius?: number;
  trafficColor?: string;
  trafficOpacity?: number;
  savedTrafficZones?: TrafficZone[];
  onTrafficZoneClick?: (zone: TrafficZone) => void;
  isTrafficDrawingMode?: boolean;
  isStreetViewActive?: boolean;
  streetViewPos?: { lat: number; lng: number } | null;
  onStreetViewClose?: () => void;
  isSalesMode?: boolean;
  showExpirationAlert?: boolean;
  customCompetitorBrands?: BrandDefinition[];
  customPreferredBrands?: BrandDefinition[];
}> = ({
  stores,
  viewMode,
  onLoad,
  onUnmount,
  onStoreClick,
  onViewChange,
  onMapClick,
  onMapMouseMove,
  lines,
  entities,
  tempMarker,
  showHeatmap,
  showLowSalesAlert,
  showExpirationAlert,
  trafficCenter,
  trafficRadius,
  trafficColor,
  trafficOpacity,
  savedTrafficZones,
  onTrafficZoneClick,
  isTrafficDrawingMode,
  isStreetViewActive,
  streetViewPos,
  onStreetViewClose,
  isSalesMode,
  customCompetitorBrands,
  customPreferredBrands,
}) => {
  // IIC 소속 브랜드명 목록 (마커 스타일 결정에 사용)
  const iicBrands = [
    "gentle monster",
    "tamburins",
    "nudake",
    "atiissu",
    "nuflaat",
  ];

  // 브랜드 우선순위에 따라 매장 정렬 (우선순위가 높은 브랜드가 마커 상단에 위치)
  const sortedStores = useMemo(() => {
    const brandPriority: Record<string, number> = {
      "gentle monster": 100,
      tamburins: 90,
      nudake: 80,
      atiissu: 70,
      nuflaat: 60,
    };

    return [...stores].sort((a, b) => {
      const aBrand = (a.brand || "").toLowerCase();
      const bBrand = (b.brand || "").toLowerCase();

      const aPriority =
        brandPriority[aBrand] ||
        (a.brandCategory === "preferred" ? 50 : 40);
      const bPriority =
        brandPriority[bBrand] ||
        (b.brandCategory === "preferred" ? 50 : 40);

      // 오름차순 정렬: 우선순위가 높은 항목이 마지막에 렌더링되어 맨 위에 표시됨
      return aPriority - bPriority;
    });
  }, [stores]);

  // 파이프라인 상태별 배경색 클래스 반환 함수 (툴팁에서만 사용)
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Plan":
      case "Planned":
        return "bg-[#64748B]";
      case "Confirm":
      case "Confirmed":
        return "bg-[#9694FF]";
      case "Contract":
      case "Signed":
        return "bg-[#EE99C2]";
      case "Space":
      case "Construction":
        return "bg-sky-500";
      case "Open":
        return "bg-[#7FC7D9]";
      case "Closed":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  // 브랜드명으로부터 마커에 표시할 약어 문자 반환
  const getBrandAbbreviation = (brand: string | undefined) => {
    if (!brand) return "G";
    const b = brand.toLowerCase();
    if (b.includes("gentle monster")) return "G";
    if (b.includes("tamburins")) return "T";
    if (b.includes("nudake")) return "N";
    if (b.includes("atiissu")) return "A";
    if (b.includes("nuflaat")) return "Nf";
    return brand.charAt(0).toUpperCase();
  };

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={INITIAL_CENTER}
      zoom={INITIAL_ZOOM}
      onLoad={onLoad}
      onUnmount={onUnmount}
      mapTypeId={
        viewMode === "Satellite" ? "hybrid" : "roadmap"
      }
      options={{
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        styles: viewMode === "Map" ? lightMapStyles : undefined,
      }}
      onClick={(e) => {
        if (onMapClick && e.latLng) {
          onMapClick({
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
          });
        }
      }}
      onMouseMove={(e) => {
        if (onMapMouseMove && e.latLng) {
          onMapMouseMove({
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
          });
        }
      }}
    >
      {/* 스트리트 뷰 패노라마 - 활성화 시 지도 위에 표시 */}
      {isStreetViewActive && streetViewPos && (
        <StreetViewPanorama
          position={streetViewPos}
          visible={isStreetViewActive}
          onCloseClick={onStreetViewClose}
          options={{
            enableCloseButton: true,
            addressControl: true,
            fullscreenControl: false,
            motionTracking: false,
            motionTrackingControl: false,
            linksControl: true,
            panControl: true,
            zoomControl: true,
            source:
              typeof google !== "undefined"
                ? google.maps.StreetViewSource.OUTDOOR
                : undefined,
            imageDateControl: true,
          }}
        />
      )}

      {/* 지도 뷰 변경 감지 컴포넌트 */}
      <MapEventTracker onViewChange={onViewChange} />

      {/* 현재 그리고 있는 트래픽 원 (반지름이 있을 때) */}
      {trafficCenter && trafficRadius && trafficRadius > 0 && [
        <Circle
          key="traffic-circle"
          center={trafficCenter}
          radius={trafficRadius}
          options={{
            fillColor: trafficColor || "#F97316",
            fillOpacity: trafficOpacity || 0.4,
            strokeColor: trafficColor || "#F97316",
            strokeOpacity: 0.8,
            strokeWeight: 2,
          }}
        />,
        /* 트래픽 원 중심점 마커 */
        <OverlayView
          key="traffic-center-marker"
          position={trafficCenter}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
          <div className="w-3 h-3 bg-white border-2 border-orange-600 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
        </OverlayView>
      ]}

      {/* 중심점만 설정된 상태 (반지름 없음) - 주황색 점으로 표시 */}
      {trafficCenter && (!trafficRadius || trafficRadius === 0) && (
        <OverlayView
          position={trafficCenter}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
          <div className="w-3 h-3 bg-orange-600 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </OverlayView>
      )}

      {/* 저장된 트래픽 구역 목록 렌더링 */}
      {showHeatmap &&
        savedTrafficZones?.map((zone) => [
          <Circle
            key={`${zone.id}-circle`}
            center={zone.center}
            radius={zone.radius}
            options={{
              fillColor: zone.color,
              fillOpacity: zone.opacity,
              strokeColor: zone.color,
              strokeOpacity: 0.8,
              strokeWeight: 2,
              clickable: !isTrafficDrawingMode,
              zIndex: isTrafficDrawingMode ? 1 : 10,
            }}
            onClick={() => {
              if (
                onTrafficZoneClick &&
                !isTrafficDrawingMode
              ) {
                onTrafficZoneClick(zone);
              }
            }}
          />,
          /* 저장된 구역의 중심 마커 */
          <OverlayView
            key={`${zone.id}-marker`}
            position={zone.center}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div
              className={`w-2.5 h-2.5 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-md transition-transform ${
                isTrafficDrawingMode
                  ? "pointer-events-none opacity-70"
                  : "cursor-pointer hover:scale-125"
              }`}
              style={{
                borderWidth: "2px",
                borderStyle: "solid",
                borderColor: zone.color,
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (
                  onTrafficZoneClick &&
                  !isTrafficDrawingMode
                ) {
                  onTrafficZoneClick(zone);
                }
              }}
            />
          </OverlayView>
        ])}

      {/* 파이프라인 연결선 레이어 */}
      <PipelineLayer lines={lines} />

      {/* 엔티티 마커 (IIC 거점 / 경쟁사) */}
      {entities?.map((entity) => (
        <OverlayView
          key={entity.id}
          position={entity.location}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
          <div
            className="relative transform -translate-x-1/2 -translate-y-1/2 group/marker cursor-pointer hover:z-50"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {/* 엔티티 유형에 따라 다른 색상 원 표시 */}
            <div
              className={`w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-transform group-hover/marker:scale-110 ${entity.type === "iic" ? "bg-blue-600" : "bg-orange-500"}`}
            >
              {entity.type === "iic" ? (
                <Building2 className="w-4 h-4 text-white" />
              ) : (
                <Users className="w-4 h-4 text-white" />
              )}
            </div>
            {/* 마우스 오버 시 툴팁 표시 */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/marker:block whitespace-nowrap z-50">
              <div className="bg-white px-3 py-2 rounded shadow-xl text-xs font-medium border border-gray-100 flex flex-col items-center">
                <span className="font-bold text-gray-800">
                  {entity.name}
                </span>
                <span className="text-gray-500 text-[10px]">
                  {entity.brand}
                </span>
                <Badge
                  variant="outline"
                  className={`mt-1 h-4 text-[9px] px-1 py-0 border-0 text-white ${getStatusColor(entity.status)}`}
                >
                  {entity.status}
                </Badge>
              </div>
              <div className="w-2 h-2 bg-white transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 shadow-sm"></div>
            </div>
          </div>
        </OverlayView>
      ))}

      {/* 임시 위치 마커 (검색된 장소 또는 클릭 위치 표시) */}
      {tempMarker && (
        <OverlayView
          position={tempMarker}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
          <div className="transform -translate-x-1/2 -translate-y-full pointer-events-none">
            <MapPin className="w-8 h-8 text-red-500 animate-bounce drop-shadow-md fill-current" />
          </div>
        </OverlayView>
      )}

      {/* 매장 마커 목록 렌더링 */}
      {sortedStores.map((store, index) => {
        // 폐점(Closed) 매장은 마커를 표시하지 않음
        if (
          store.status === "Closed" ||
          store.status === "Close"
        )
          return null;

        // IIC 소속 브랜드 여부 확인
        const isIIC =
          store.brandCategory === "iic" ||
          (!store.brandCategory &&
            iicBrands.includes(
              (store.brand || "").toLowerCase(),
            ));

        // 저매출 알림: 2025년 일 평균 매출이 1,100만원 이하인 Gentle Monster 매장
        let isLowSalesStore = false;
        let formattedDailySales = "";

        const isGentleMonster = (store.brand || "")
          .toLowerCase()
          .includes("gentle monster");

        if (showLowSalesAlert && isGentleMonster) {
          const sales2025 =
            store.financial?.yearlySales?.find(
              (s) => s.year === 2025,
            )?.amount || 0;
          if (sales2025 > 0) {
            const dailySales = Math.ceil(sales2025 / 365);
            const dailySalesMan = Math.ceil(dailySales / 10000);
            if (dailySalesMan <= 1100) {
              isLowSalesStore = true;
              formattedDailySales = `${dailySalesMan.toLocaleString()}만`;
            }
          }
        }

        // 저매출 알림 모드에서 해당 매장이 아니면 마커 숨김
        if (showLowSalesAlert && !isLowSalesStore) return null;

        // 계약 만료 알림: IIC는 6개월, 비IIC는 2년 이내 만료 예정
        let isExpiringStore = false;
        let formattedExpiration = "";

        if (showExpirationAlert && store.contract?.endDate) {
          const today = new Date("2026-01-14");
          const endDate = new Date(store.contract.endDate);
          const diffTime = endDate.getTime() - today.getTime();
          const diffMonths =
            diffTime / (1000 * 60 * 60 * 24 * 30.44);
          const diffYears =
            diffTime / (1000 * 60 * 60 * 24 * 365.25);

          if (isIIC) {
            // IIC 매장: 6개월 이내 만료 예정
            if (diffMonths >= 0 && diffMonths <= 6) {
              isExpiringStore = true;
              formattedExpiration = `${Math.ceil(diffMonths)}개월`;
            }
          } else {
            // 비IIC 매장: 2년 이내 만료 예정
            if (diffYears >= 0 && diffYears <= 2) {
              isExpiringStore = true;
              formattedExpiration = `${Math.ceil(diffYears)}년`;
            }
          }
        }

        // 계약 만료 알림 모드에서 해당 매장이 아니면 마커 숨김
        if (showExpirationAlert && !isExpiringStore) return null;

        const brandName = (store.brand || "").toLowerCase();

        // 경쟁 브랜드 목록 (삼각형 마커로 표시)
        const competitorBrands = [
          "rayban",
          "apple",
          "nike",
          "lululemon",
          "burberry",
          "adidas",
          "chanel",
          "alo",
          "aesop",
          "pesade",
          "london bagel museum",
          "misu a barbe",
          "matin kim",
          "polga",
          "seletti",
        ];

        const isPreferred =
          store.brandCategory === "preferred" &&
          !competitorBrands.includes(brandName);
        const isCompetitor =
          store.brandCategory === "competitor" ||
          competitorBrands.includes(brandName) ||
          (!store.brandCategory && !isIIC);

        // 특정 브랜드 여부 판별 (커스텀 아이콘 사용 여부 결정)
        const isApple = brandName === "apple";
        const isNike = brandName === "nike";
        const isBalenciaga = brandName === "balenciaga";
        const isRayBan = brandName === "rayban";
        const isLululemon = brandName === "lululemon";
        const isBurberry = brandName === "burberry";
        const isAdidas = brandName === "adidas";
        const isChanel = brandName === "chanel";
        const isAlo = brandName === "alo";
        const isGoogle = brandName === "google";
        const isSamsung = brandName === "samsung";
        const isMeta = brandName === "meta";
        const isLouisVuitton = brandName.includes("louis vuitton");
        const isBottegaVeneta = brandName.includes("bottega veneta");
        const isAcneStudios = brandName.includes("acne studios");
        const isAmi = brandName === "ami";
        const isPrada = brandName === "prada";

        // 커스텀 브랜드 마커 이미지 확인
        const customBrand = [
          ...(customCompetitorBrands || []),
          ...(customPreferredBrands || []),
        ].find(
          (b) => b.name.toLowerCase() === brandName,
        );
        const customMarkerImage = customBrand?.markerImage;

        return (
          <OverlayView
            key={`${store.brandCategory || "unknown"}-${store.id}-${index}`}
            position={{
              lat: store.location.lat,
              lng: store.location.lng,
            }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div
              className="relative transform -translate-x-1/2 -translate-y-1/2 group/marker cursor-pointer hover:z-50"
              onClick={(e) => {
                e.stopPropagation();
                onStoreClick(store);
              }}
            >
              {isLowSalesStore ? (
                /* 저매출 매장: 빨간색 원형 마커 + 일매출 배지 */
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-red-600 shadow-xl flex items-center justify-center transition-transform group-hover/marker:scale-110 border-2 border-white animate-pulse">
                    <span className="text-white text-base font-bold font-serif">
                      {getBrandAbbreviation(store.brand)}
                    </span>
                  </div>
                  <Badge className="mt-1 bg-red-600 text-white border-none text-[9px] py-0 px-1 shadow-sm whitespace-nowrap font-bold">
                    {formattedDailySales}
                  </Badge>
                </div>
              ) : isExpiringStore ? (
                /* 계약 만료 임박 매장: 주황색 원형 마커 + 남은 기간 배지 */
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#FE9A00] shadow-xl flex items-center justify-center transition-transform group-hover/marker:scale-110 border-2 border-white animate-pulse">
                    <span className="text-white text-base font-bold font-serif">
                      {getBrandAbbreviation(store.brand)}
                    </span>
                  </div>
                  <Badge className="mt-1 bg-[#FE9A00] text-white border-none text-[9px] py-0 px-1 shadow-sm whitespace-nowrap font-bold">
                    {formattedExpiration}
                  </Badge>
                </div>
              ) : customMarkerImage ? (
                /* 커스텀 마커 이미지가 있는 브랜드 */
                <div
                  className={`w-12 h-12 bg-white shadow-md flex items-center justify-center transition-transform group-hover/marker:scale-110 rounded-full p-2 border-2 ${isCompetitor ? "border-[#CC0000]" : isPreferred ? "border-[#5B21B6]" : "border-gray-100"}`}
                >
                  <img
                    src={customMarkerImage}
                    alt={`${store.brand} Store`}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : isPrada ? (
                /* Prada 전용 마커 */
                <div
                  className={`w-12 h-12 bg-white shadow-md flex items-center justify-center transition-transform group-hover/marker:scale-110 rounded-full p-2 border-2 ${isCompetitor ? "border-[#CC0000]" : isPreferred ? "border-[#5B21B6]" : "border-gray-100"}`}
                >
                  {pradaIcon ? (
                    <img src={pradaIcon} alt="Prada Store" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-700 text-xs font-bold">PR</span>
                  )}
                </div>
              ) : isApple ? (
                /* Apple 전용 마커 */
                <div
                  className={`w-12 h-12 bg-white shadow-md flex items-center justify-center transition-transform group-hover/marker:scale-110 rounded-full p-2 border-2 ${isCompetitor ? "border-[#CC0000]" : isPreferred ? "border-[#5B21B6]" : "border-gray-100"}`}
                >
                  {appleIcon ? (
                    <img src={appleIcon} alt="Apple Store" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-700 text-xs font-bold">AP</span>
                  )}
                </div>
              ) : isNike ? (
                /* Nike 전용 마커 */
                <div
                  className={`w-12 h-12 bg-white shadow-md flex items-center justify-center transition-transform group-hover/marker:scale-110 rounded-full p-2 border-2 ${isCompetitor ? "border-[#CC0000]" : isPreferred ? "border-[#5B21B6]" : "border-gray-100"}`}
                >
                  {nikeIcon ? (
                    <img src={nikeIcon} alt="Nike Store" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-700 text-xs font-bold">NK</span>
                  )}
                </div>
              ) : isBalenciaga ? (
                /* Balenciaga 전용 마커 */
                <div
                  className={`w-12 h-12 bg-white shadow-md flex items-center justify-center transition-transform group-hover/marker:scale-110 rounded-full p-2 border-2 ${isCompetitor ? "border-[#CC0000]" : isPreferred ? "border-[#5B21B6]" : "border-gray-100"}`}
                >
                  {balenciagaIcon ? (
                    <img src={balenciagaIcon} alt="Balenciaga Store" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-700 text-xs font-bold">BA</span>
                  )}
                </div>
              ) : isRayBan ? (
                /* RayBan 전용 마커 */
                <div
                  className={`w-12 h-12 bg-white shadow-md flex items-center justify-center transition-transform group-hover/marker:scale-110 rounded-full p-1.5 border-2 ${isCompetitor ? "border-[#CC0000]" : isPreferred ? "border-[#5B21B6]" : "border-gray-100"}`}
                >
                  {raybanIcon ? (
                    <img src={raybanIcon} alt="RayBan Store" className="w-full h-full object-contain scale-90" />
                  ) : (
                    <span className="text-gray-700 text-xs font-bold">RB</span>
                  )}
                </div>
              ) : isLululemon ? (
                /* Lululemon 전용 마커 */
                <div
                  className={`w-12 h-12 bg-white shadow-md flex items-center justify-center transition-transform group-hover/marker:scale-110 rounded-full p-1.5 border-2 ${isCompetitor ? "border-[#CC0000]" : isPreferred ? "border-[#5B21B6]" : "border-gray-100"}`}
                >
                  {lululemonIcon ? (
                    <img src={lululemonIcon} alt="Lululemon Store" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-700 text-xs font-bold">LU</span>
                  )}
                </div>
              ) : isBurberry ? (
                /* Burberry 전용 마커 */
                <div
                  className={`w-12 h-12 bg-white shadow-md flex items-center justify-center transition-transform group-hover/marker:scale-110 rounded-full p-1.5 border-2 overflow-hidden ${isCompetitor ? "border-[#CC0000]" : isPreferred ? "border-[#5B21B6]" : "border-gray-100"}`}
                >
                  {burberryIcon ? (
                    <img src={burberryIcon} alt="Burberry Store" className="w-full h-full object-contain scale-110" />
                  ) : (
                    <span className="text-gray-700 text-xs font-bold">BU</span>
                  )}
                </div>
              ) : isAdidas ? (
                /* Adidas 전용 마커 */
                <div
                  className={`w-12 h-12 bg-white shadow-md flex items-center justify-center transition-transform group-hover/marker:scale-110 rounded-full p-2 border-2 ${isCompetitor ? "border-[#CC0000]" : isPreferred ? "border-[#5B21B6]" : "border-gray-100"}`}
                >
                  {adidasIcon ? (
                    <img src={adidasIcon} alt="Adidas Store" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-700 text-xs font-bold">AD</span>
                  )}
                </div>
              ) : isChanel ? (
                /* Chanel 전용 마커 */
                <div
                  className={`w-12 h-12 bg-white shadow-md flex items-center justify-center transition-transform group-hover/marker:scale-110 rounded-full p-1.5 border-2 ${isCompetitor ? "border-[#CC0000]" : isPreferred ? "border-[#5B21B6]" : "border-gray-100"}`}
                >
                  {chanelIcon ? (
                    <img src={chanelIcon} alt="Chanel Store" className="w-full h-full object-contain scale-90" />
                  ) : (
                    <span className="text-gray-700 text-xs font-bold">CH</span>
                  )}
                </div>
              ) : isAlo ? (
                /* ALO 전용 마커 */
                <div
                  className={`w-12 h-12 bg-white shadow-md flex items-center justify-center transition-transform group-hover/marker:scale-110 rounded-full p-1.5 border-2 ${isCompetitor ? "border-[#CC0000]" : isPreferred ? "border-[#5B21B6]" : "border-gray-100"}`}
                >
                  {aloIcon ? (
                    <img src={aloIcon} alt="ALO Store" className="w-full h-full object-contain scale-95" />
                  ) : (
                    <span className="text-gray-700 text-xs font-bold">AL</span>
                  )}
                </div>
              ) : isGoogle ? (
                /* Google 전용 마커 */
                <div
                  className={`w-12 h-12 bg-white shadow-md flex items-center justify-center transition-transform group-hover/marker:scale-110 rounded-full p-2 border-2 ${isCompetitor ? "border-[#CC0000]" : isPreferred ? "border-[#5B21B6]" : "border-gray-100"}`}
                >
                  {googleIcon ? (
                    <img src={googleIcon} alt="Google Store" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-700 text-xs font-bold">GO</span>
                  )}
                </div>
              ) : isSamsung ? (
                /* Samsung 전용 마커 */
                <div
                  className={`w-12 h-12 bg-white shadow-md flex items-center justify-center transition-transform group-hover/marker:scale-110 rounded-full p-2 border-2 ${isCompetitor ? "border-[#CC0000]" : isPreferred ? "border-[#5B21B6]" : "border-gray-100"}`}
                >
                  {samsungIcon ? (
                    <img src={samsungIcon} alt="Samsung Store" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-700 text-xs font-bold">SA</span>
                  )}
                </div>
              ) : isMeta ? (
                /* Meta 전용 마커 */
                <div
                  className={`w-12 h-12 bg-white shadow-md flex items-center justify-center transition-transform group-hover/marker:scale-110 rounded-full p-2 border-2 ${isCompetitor ? "border-[#CC0000]" : isPreferred ? "border-[#5B21B6]" : "border-gray-100"}`}
                >
                  {metaIcon ? (
                    <img src={metaIcon} alt="Meta Store" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-700 text-xs font-bold">ME</span>
                  )}
                </div>
              ) : isLouisVuitton ? (
                /* Louis Vuitton 전용 마커 */
                <div
                  className={`w-12 h-12 bg-white shadow-md flex items-center justify-center transition-transform group-hover/marker:scale-110 rounded-full p-2 border-2 ${isCompetitor ? "border-[#CC0000]" : isPreferred ? "border-[#5B21B6]" : "border-gray-100"}`}
                >
                  {louisVuittonIcon ? (
                    <img src={louisVuittonIcon} alt="Louis Vuitton Store" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-700 text-xs font-bold">LV</span>
                  )}
                </div>
              ) : isBottegaVeneta ? (
                /* Bottega Veneta 전용 마커 */
                <div
                  className={`w-12 h-12 bg-white shadow-md flex items-center justify-center transition-transform group-hover/marker:scale-110 rounded-full p-2 border-2 ${isCompetitor ? "border-[#CC0000]" : isPreferred ? "border-[#5B21B6]" : "border-gray-100"}`}
                >
                  {bottegaVenetaIcon ? (
                    <img src={bottegaVenetaIcon} alt="Bottega Veneta Store" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-700 text-xs font-bold">BV</span>
                  )}
                </div>
              ) : isAcneStudios ? (
                /* Acne Studios 전용 마커 */
                <div
                  className={`w-12 h-12 bg-white shadow-md flex items-center justify-center transition-transform group-hover/marker:scale-110 rounded-full p-2 border-2 ${isCompetitor ? "border-[#CC0000]" : isPreferred ? "border-[#5B21B6]" : "border-gray-100"}`}
                >
                  {acneStudiosIcon ? (
                    <img src={acneStudiosIcon} alt="Acne Studios Store" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-700 text-xs font-bold">AS</span>
                  )}
                </div>
              ) : isAmi ? (
                /* AMI 전용 마커 */
                <div
                  className={`w-12 h-12 bg-white shadow-md flex items-center justify-center transition-transform group-hover/marker:scale-110 rounded-full p-2 border-2 ${isCompetitor ? "border-[#CC0000]" : isPreferred ? "border-[#5B21B6]" : "border-gray-100"}`}
                >
                  {amiIcon ? (
                    <img src={amiIcon} alt="AMI Store" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-700 text-xs font-bold">AM</span>
                  )}
                </div>
              ) : isPreferred ? (
                /* 선호 브랜드: 보라색 정사각형 마커 */
                <div className="w-12 h-12 bg-[#7C3AED] shadow-md flex items-center justify-center transition-transform group-hover/marker:scale-110 rounded-sm">
                  <span className="text-white text-[14px] font-bold font-serif leading-none">
                    {getBrandAbbreviation(store.brand)}
                  </span>
                </div>
              ) : isCompetitor ? (
                /* 경쟁 브랜드: 주황-빨간색 삼각형 마커 */
                <div
                  className="w-12 h-12 bg-[#FF4500] shadow-md flex items-end justify-center pb-2 transition-transform group-hover/marker:scale-110"
                  style={{
                    clipPath:
                      "polygon(50% 0%, 0% 100%, 100% 100%)",
                  }}
                >
                  <span className="text-white text-[14px] font-bold font-serif leading-none">
                    {getBrandAbbreviation(store.brand)}
                  </span>
                </div>
              ) : (
                /* IIC 매장: 파이프라인 상태별 색상 원형 마커 */
                <div
                  className={`w-12 h-12 rounded-full ${getStatusColor(store.status)} shadow-lg flex items-center justify-center transition-transform group-hover/marker:scale-110 border border-white/20`}
                >
                  <span className="text-white text-base font-bold font-serif">
                    {getBrandAbbreviation(store.brand)}
                  </span>
                </div>
              )}

              {/* 마우스 오버 시 매장 정보 툴팁 */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/marker:block whitespace-nowrap z-50">
                <div className="bg-white px-3 py-2 rounded shadow-xl text-xs font-medium border border-gray-100 flex flex-col items-center">
                  <span className="font-bold text-gray-800">
                    {store.name}
                  </span>
                  <span className="text-gray-500 text-[10px]">
                    {store.brand}
                  </span>
                  <Badge
                    variant="outline"
                    className={`mt-1 h-4 text-[9px] px-1 py-0 border-0 text-white ${getStatusColor(store.status)}`}
                  >
                    {store.status}
                  </Badge>
                </div>
                {/* 툴팁 아래 삼각형 포인터 */}
                <div className="w-2 h-2 bg-white transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 shadow-sm"></div>
              </div>
            </div>
          </OverlayView>
        );
      })}
    </GoogleMap>
  );
};

// ============================================================
// PipelineLayer: 파이프라인 연결선을 지도에 렌더링하는 컴포넌트
// useGoogleMap 훅을 통해 지도 인스턴스에 접근합니다.
// ============================================================
const PipelineLayer: React.FC<{ lines?: SavedLine[] }> = ({
  lines,
}) => {
  // 지도 인스턴스 가져오기 (GoogleMap 컴포넌트 내부에서만 동작)
  const map = useGoogleMap();

  if (!lines) return null;

  return lines.map((line) => {
    // 선 클릭 시 해당 선이 화면 안에 들어오도록 지도 이동
    const handleClick = () => {
      if (map) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(line.point1);
        bounds.extend(line.point2);
        map.fitBounds(bounds);
      }
    };

    return (
      <Polyline
        key={line.id}
        path={[line.point1, line.point2]}
        onClick={handleClick}
        options={{
          strokeColor: line.color,
          strokeOpacity: 0.8,
          strokeWeight: line.thickness || 2,
          geodesic: true,
          clickable: true,
        }}
      />
    );
  });
};

// ============================================================
// MapEventTracker: 지도 idle 이벤트를 감지하여 뷰 변경 여부를 부모에게 전달
// ============================================================
const MapEventTracker: React.FC<{
  onViewChange: (changed: boolean) => void;
}> = ({ onViewChange }) => {
  // useGoogleMap 훅으로 지도 인스턴스 가져오기
  const mapInstance = useGoogleMap();

  useEffect(() => {
    if (!mapInstance) return;

    // 지도가 움직임을 멈추면 (idle 상태) 초기 위치에서 벗어났는지 확인
    const listener = mapInstance.addListener("idle", () => {
      const currentCenter = mapInstance.getCenter();
      const currentZoom = mapInstance.getZoom();

      if (!currentCenter) return;

      const isChanged =
        Math.abs(currentCenter.lat() - INITIAL_CENTER.lat) >
          0.001 ||
        Math.abs(currentCenter.lng() - INITIAL_CENTER.lng) >
          0.001 ||
        currentZoom !== INITIAL_ZOOM;

      onViewChange(isChanged);
    });

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [mapInstance, onViewChange]);

  return null;
};

// ============================================================
// MapCanvas: 최상위 지도 컴포넌트
// 검색창, 좌측 툴바, 우측 줌 컨트롤, 스트리트 뷰 버튼 등을 포함합니다.
// ============================================================
export const MapCanvas: React.FC<MapCanvasProps> = (props) => {
  const {
    stores,
    allStores,
    isSalesMode,
    onStoreClick: onExternalStoreClick,
    activeTool: activeToolProp,
    onToolChange,
    onMapClick,
    onMapMouseMove,
    onResetSearch,
    lines,
    entities,
    tempMarker,
    focusStore,
    focusLine,
    showLowSalesAlert,
    onToggleLowSalesAlert,
    showExpirationAlert,
    onToggleExpirationAlert,
    trafficCenter,
    trafficRadius,
    trafficColor,
    trafficOpacity,
    savedTrafficZones,
    focusTrafficZone,
    showHeatmap: showHeatmapProp,
    onTrafficZoneClick,
    isTrafficDrawingMode,
    filters,
    onFilterChange,
    onSearchLocationSelect,
    onSelectAll,
    customCompetitorBrands,
    customPreferredBrands,
  } = props;

  // 지도 뷰 모드 (Map/Satellite)
  const [viewMode, setViewMode] = useState<MapViewMode>("Map");
  // 지도 인스턴스 (google.maps.Map 객체)
  const [map, setMap] = useState<google.maps.Map | null>(null);
  // 지도가 초기 위치에서 벗어났는지 여부
  const [isViewChanged, setIsViewChanged] = useState(false);
  // 스트리트 뷰 활성화 여부
  const [isStreetViewActive, setIsStreetViewActive] =
    useState(false);
  // 스트리트 뷰 표시 위치
  const [streetViewPos, setStreetViewPos] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  // 검색으로 찾은 위치 좌표
  const [searchedLocation, setSearchedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  // 최초 매장 맞춤 뷰 완료 여부
  const [hasInitialFit, setHasInitialFit] = useState(false);
  // Google Maps API 키
  const [apiKey, setApiKey] = useState<string>("");
  // 검색창 입력값
  const [inputValue, setInputValue] = useState("");
  // API 키 저장 여부
  const [isKeySaved, setIsKeySaved] = useState(false);
  // 자동완성 제안 목록
  const [suggestions, setSuggestions] = useState<Suggestion[]>(
    [],
  );
  // 검색창 포커스 여부
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  // Google Maps가 이미 로드된 상태 여부
  const [alreadyLoaded, setAlreadyLoaded] = useState(false);
  // 내부 도구 선택 상태 (외부에서 제어하지 않을 때 사용)
  const [internalActiveTool, setInternalActiveTool] = useState<
    string | null
  >(null);
  // 드래그 중인 Pegman(스트리트 뷰 인형) 상태
  const [isDraggingPegman, setIsDraggingPegman] =
    useState(false);
  // Pegman 드래그 위치
  const [pegmanPos, setPegmanPos] = useState({ x: 0, y: 0 });
  // 드래그 시작 위치
  const [dragStartPos, setDragStartPos] = useState({
    x: 0,
    y: 0,
  });
  // 의미있는 드래그 이동 여부 (5px 이상)
  const [hasMovedSignificant, setHasMovedSignificant] =
    useState(false);

  // 지도 컨테이너 DOM 참조
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // 마지막 포커스된 매장 ID (중복 포커스 방지)
  const lastFocusedStoreId = useRef<string | null>(null);
  // 마지막 포커스된 연결선 ID
  const lastFocusedLineId = useRef<string | null>(null);
  // 마지막 포커스된 트래픽 구역 ID
  const lastFocusedTrafficZoneId = useRef<string | null>(null);
  // 초기 맞춤 뷰 완료 여부 ref (상태와 별개로 즉시 반영)
  const hasInitialFitRef = useRef(false);

  // 파이프라인 상태 필터 클릭 처리
  const handleStatusFilterClick = (status: string) => {
    if (!filters || !onFilterChange) return;

    const currentStatuses = filters.status || [];
    // 이미 선택된 상태면 제거, 아니면 추가 (토글)
    const updatedStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];

    onFilterChange({ ...filters, status: updatedStatuses });
  };

  // 현재 필터링된 매장 (App.tsx에서 이미 필터링되어 전달됨)
  const filteredStores = stores;

  // 범례 항목 활성화 여부에 따른 CSS 클래스 반환
  const getLegendItemClass = (status: string) => {
    const currentStatuses = filters?.status || [];
    const isActive =
      currentStatuses.length === 0 ||
      currentStatuses.includes(status);
    return `flex flex-col items-center space-y-1 cursor-pointer group transition-all ${isActive ? "opacity-100" : "opacity-40 grayscale"}`;
  };

  // focusStore 변경 시 지도가 해당 매장으로 이동
  useEffect(() => {
    if (
      focusStore &&
      map &&
      focusStore.id !== lastFocusedStoreId.current
    ) {
      map.panTo({
        lat: focusStore.location.lat,
        lng: focusStore.location.lng,
      });
      map.setZoom(16);
      lastFocusedStoreId.current = focusStore.id;
    } else if (!focusStore) {
      lastFocusedStoreId.current = null;
    }
  }, [focusStore, map]);

  // focusLine 변경 시 지도가 해당 연결선으로 이동
  useEffect(() => {
    if (
      focusLine &&
      map &&
      focusLine.id !== lastFocusedLineId.current
    ) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({
        lat: focusLine.point1.lat,
        lng: focusLine.point1.lng,
      });
      bounds.extend({
        lat: focusLine.point2.lat,
        lng: focusLine.point2.lng,
      });
      map.fitBounds(bounds);
      lastFocusedLineId.current = focusLine.id;
    } else if (!focusLine) {
      lastFocusedLineId.current = null;
    }
  }, [focusLine, map]);

  // focusTrafficZone 변경 시 지도가 해당 트래픽 구역으로 이동
  useEffect(() => {
    if (
      focusTrafficZone &&
      map &&
      focusTrafficZone.id !== lastFocusedTrafficZoneId.current
    ) {
      const bounds = new google.maps.LatLngBounds();
      const center = focusTrafficZone.center;
      const radius = focusTrafficZone.radius;

      // 중심 좌표 유효성 검사
      if (
        !center ||
        typeof center.lat !== "number" ||
        typeof center.lng !== "number"
      ) {
        console.warn("Invalid traffic zone center:", center);
        return;
      }

      // 반지름으로 경계 박스 계산 (1도 위도 ≈ 111km)
      const latOffset = radius / 111000;
      const lngOffset =
        radius /
        (111000 * Math.cos((center.lat * Math.PI) / 180));

      bounds.extend({
        lat: center.lat + latOffset,
        lng: center.lng + lngOffset,
      });
      bounds.extend({
        lat: center.lat - latOffset,
        lng: center.lng - lngOffset,
      });

      map.fitBounds(bounds);
      lastFocusedTrafficZoneId.current = focusTrafficZone.id;
    } else if (!focusTrafficZone) {
      lastFocusedTrafficZoneId.current = null;
    }
  }, [focusTrafficZone, map]);

  // 최초 로드 시 모든 매장이 화면 안에 들어오도록 뷰 맞춤
  useEffect(() => {
    if (
      map &&
      stores.length > 0 &&
      !focusStore &&
      !focusLine &&
      !focusTrafficZone &&
      !searchedLocation &&
      !hasInitialFitRef.current
    ) {
      const bounds = new google.maps.LatLngBounds();
      stores.forEach((store) => {
        bounds.extend({
          lat: store.location.lat,
          lng: store.location.lng,
        });
      });
      map.fitBounds(bounds);
      hasInitialFitRef.current = true;
      setHasInitialFit(true);
    }
  }, [
    stores,
    map,
    focusStore,
    focusLine,
    focusTrafficZone,
    searchedLocation,
  ]);

  // 활성 도구: 외부에서 제어되면 외부 값 사용, 아니면 내부 상태 사용
  const activeTool =
    activeToolProp !== undefined
      ? activeToolProp
      : internalActiveTool;

  // 히트맵 표시 여부 결정
  const showHeatmap =
    showHeatmapProp !== undefined
      ? showHeatmapProp
      : activeTool === "traffic";

  // 도구 선택 토글 처리
  const handleToolClick = (toolId: string) => {
    const newTool = activeTool === toolId ? null : toolId;
    if (onToolChange) {
      onToolChange(newTool);
    } else {
      setInternalActiveTool(newTool);
    }
  };

  // 검색창 입력 변경 처리 - Google Places API로 자동완성 목록 가져오기
  const handleInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setInputValue(value);

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      // @ts-ignore - 새로운 Places API 사용
      const { Place } =
        await google.maps.importLibrary("places");

      if (Place && Place.searchByText) {
        const { places } = await Place.searchByText({
          textQuery: value,
          fields: ["id", "displayName", "formattedAddress"],
          maxResultCount: 5,
        });

        if (places) {
          const mappedSuggestions = places.map(
            (place: any) => ({
              place_id: place.id,
              description: place.displayName,
              structured_formatting: {
                main_text: place.displayName,
                secondary_text: place.formattedAddress || "",
              },
            }),
          );
          setSuggestions(mappedSuggestions);
        } else {
          setSuggestions([]);
        }
      } else {
        // 구버전 API 폴백
        // @ts-ignore
        const { AutocompleteService } =
          await google.maps.importLibrary("places");
        // @ts-ignore
        const service = new AutocompleteService();
        service.getPlacePredictions(
          { input: value },
          (predictions: any, status: any) => {
            if (status === "OK" && predictions) {
              setSuggestions(predictions as Suggestion[]);
            } else {
              setSuggestions([]);
            }
          },
        );
      }
    } catch (error) {
      console.error("Search error:", error);
      setSuggestions([]);
    }
  };

  // 자동완성 항목 선택 처리 - 해당 장소로 지도 이동
  const handlePlaceSelect = async (
    placeId: string,
    description: string,
  ) => {
    setInputValue(description);
    setIsSearchFocused(false);

    try {
      // @ts-ignore
      const { Place, PlacesService } =
        await google.maps.importLibrary("places");

      // 새로운 Place API 시도
      if (Place) {
        const place = new Place({ id: placeId });
        await place.fetchFields({ fields: ["location"] });

        if (place.location && map) {
          map.panTo(place.location);
          map.setZoom(16);
          setSearchedLocation({
            lat: place.location.lat(),
            lng: place.location.lng(),
          });
          if (onSearchLocationSelect) {
            onSearchLocationSelect({
              lat: place.location.lat(),
              lng: place.location.lng(),
            });
          }
        }
      } else {
        // 구버전 PlacesService 폴백
        // @ts-ignore
        const service = new PlacesService(map);
        service.getDetails(
          { placeId },
          (place: any, status: any) => {
            if (
              status === "OK" &&
              place &&
              place.geometry &&
              place.geometry.location
            ) {
              map?.panTo(place.geometry.location);
              map?.setZoom(16);
              setSearchedLocation({
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              });
              if (onSearchLocationSelect) {
                onSearchLocationSelect({
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
                });
              }
            }
          },
        );
      }
    } catch (error) {
      console.error("Place details error:", error);
    }
  };

  // 컴포넌트 마운트 시 Google Maps 로드 상태 확인
  useEffect(() => {
    // 이미 window에 Google Maps 스크립트가 로드된 경우
    if (isGoogleMapsLoaded()) {
      setAlreadyLoaded(true);
      setIsKeySaved(true);
      return;
    }

    // 하드코딩된 API 키 사용
    if (GOOGLE_MAPS_API_KEY) {
      setApiKey(GOOGLE_MAPS_API_KEY);
      setIsKeySaved(true);
      return;
    }

    // 로컬스토리지에서 저장된 API 키 확인
    const savedKey = localStorage.getItem(
      "google_maps_api_key",
    );
    if (savedKey) {
      setApiKey(savedKey);
      setIsKeySaved(true);
    }
  }, []);

  // 사용자가 입력한 API 키 저장
  const handleSaveKey = () => {
    if (inputValue.trim()) {
      localStorage.setItem(
        "google_maps_api_key",
        inputValue.trim(),
      );
      setApiKey(inputValue.trim());
      setIsKeySaved(true);
    }
  };

  // 지도 뷰를 초기 상태로 리셋 (모든 매장이 보이도록)
  const handleResetView = () => {
    const storesToUse =
      allStores && allStores.length > 0 ? allStores : stores;

    if (map && storesToUse.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      storesToUse.forEach((store) => {
        bounds.extend({
          lat: store.location.lat,
          lng: store.location.lng,
        });
      });
      map.fitBounds(bounds);
    } else if (map) {
      map.panTo(INITIAL_CENTER);
      map.setZoom(INITIAL_ZOOM);
    }

    // 로컬 검색 상태 초기화
    setInputValue("");
    setSearchedLocation(null);
    setSuggestions([]);

    // 외부 검색 상태 초기화 (사이드바)
    if (onResetSearch) {
      onResetSearch();
    }
  };

  // 줌 인/아웃 처리
  const handleZoomIn = () => {
    if (map) map.setZoom((map.getZoom() || 10) + 1);
  };

  const handleZoomOut = () => {
    if (map) map.setZoom((map.getZoom() || 10) - 1);
  };

  // Pegman 드래그 시작 처리
  const handlePegmanMouseDown = (e: React.MouseEvent) => {
    setIsDraggingPegman(true);
    setPegmanPos({ x: e.clientX, y: e.clientY });
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setHasMovedSignificant(false);
    e.preventDefault();
  };

  // Pegman 드래그 이동 및 드롭 처리
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingPegman) {
        setPegmanPos({ x: e.clientX, y: e.clientY });

        // 5px 이상 이동한 경우 의미 있는 드래그로 간주
        const dist = Math.sqrt(
          Math.pow(e.clientX - dragStartPos.x, 2) +
            Math.pow(e.clientY - dragStartPos.y, 2),
        );
        if (dist > 5) {
          setHasMovedSignificant(true);
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDraggingPegman) {
        const significant = hasMovedSignificant;
        setIsDraggingPegman(false);
        setHasMovedSignificant(false);

        // 의미 있는 드래그인 경우 드롭 위치에서 스트리트 뷰 활성화
        if (significant && map && mapContainerRef.current) {
          const rect =
            mapContainerRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          // 지도 영역 내에 드롭한 경우에만 처리
          if (
            x >= 0 &&
            x <= rect.width &&
            y >= 0 &&
            y <= rect.height
          ) {
            const bounds = map.getBounds();
            if (bounds) {
              const ne = bounds.getNorthEast();
              const sw = bounds.getSouthWest();
              const latRange = ne.lat() - sw.lat();
              const lngRange = ne.lng() - sw.lng();
              // 픽셀 좌표를 지리 좌표로 변환
              const dropLat =
                ne.lat() - (y / rect.height) * latRange;
              const dropLng =
                sw.lng() + (x / rect.width) * lngRange;

              setStreetViewPos({ lat: dropLat, lng: dropLng });
              setIsStreetViewActive(true);
            }
          }
        }
      }
    };

    if (isDraggingPegman) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isDraggingPegman,
    map,
    hasMovedSignificant,
    dragStartPos,
  ]);

  // 스트리트 뷰 토글 처리
  const toggleStreetView = () => {
    if (isStreetViewActive) {
      setIsStreetViewActive(false);
      setStreetViewPos(null);
    } else {
      // 포커스된 매장이 있으면 해당 위치에서 스트리트 뷰 열기
      if (focusStore) {
        setStreetViewPos({
          lat: focusStore.location.lat,
          lng: focusStore.location.lng,
        });
        setIsStreetViewActive(true);
        return;
      }

      // 포커스된 매장 없으면 현재 지도 중심에서 열기
      if (map) {
        const center = map.getCenter();
        if (center) {
          setStreetViewPos({
            lat: center.lat(),
            lng: center.lng(),
          });
          setIsStreetViewActive(true);
        }
      }
    }
  };

  // 매장 마커 클릭 처리 - 지도 이동 후 외부 콜백 호출
  const handleStoreClick = (store: Store) => {
    if (map) {
      map.panTo({
        lat: store.location.lat,
        lng: store.location.lng,
      });
      map.setZoom(16); // 거리명, 지하철역이 잘 보이는 줌 레벨
    }
    if (onExternalStoreClick) {
      onExternalStoreClick(store);
    }
  };

  // 뷰 변경 감지 콜백 (메모이제이션)
  const handleViewChange = useCallback((changed: boolean) => {
    setIsViewChanged(changed);
  }, []);

  // 지도 배경 클릭 처리 - 검색 위치 마커 제거
  const handleMapBackgroundClick = useCallback(
    (coord: { lat: number; lng: number }) => {
      if (searchedLocation) {
        setSearchedLocation(null);
        setInputValue("");
      }
      if (onMapClick) {
        onMapClick(coord);
      }
    },
    [searchedLocation, onMapClick],
  );

  return (
    <div
      ref={mapContainerRef}
      className="relative flex-1 bg-[#EAEAEA] overflow-hidden group"
    >
      {/* API 키 미설정 시 입력 팝업 표시 */}
      {!isKeySaved && !alreadyLoaded ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-100/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle>Enter Google Maps API Key</CardTitle>
              <CardDescription>
                To view the map, please provide a valid Google
                Maps API Key. This will be stored locally in
                your browser.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <Input
                  placeholder="Paste your API key here..."
                  value={inputValue}
                  onChange={(e) =>
                    setInputValue(e.target.value)
                  }
                  type="password"
                />
                <Button
                  onClick={handleSaveKey}
                  disabled={!inputValue.trim()}
                >
                  Load Map
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Don't have a key?{" "}
                  <a
                    href="https://developers.google.com/maps/documentation/javascript/get-api-key"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Get one here
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : // API 키 존재 여부에 따라 DirectMapLayer 또는 MapWithLoader 렌더링
      alreadyLoaded ? (
        // Google Maps가 이미 로드된 경우: 직접 렌더링
        <DirectMapLayer
          stores={filteredStores}
          viewMode={viewMode}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          setMapInstance={setMap}
          onStoreClick={handleStoreClick}
          onViewChange={handleViewChange}
          onMapClick={handleMapBackgroundClick}
          onMapMouseMove={onMapMouseMove}
          lines={lines}
          entities={entities}
          tempMarker={searchedLocation || tempMarker}
          showHeatmap={showHeatmap}
          showLowSalesAlert={showLowSalesAlert}
          showExpirationAlert={showExpirationAlert}
          trafficCenter={trafficCenter}
          trafficRadius={trafficRadius}
          trafficColor={trafficColor}
          trafficOpacity={trafficOpacity}
          savedTrafficZones={savedTrafficZones}
          onTrafficZoneClick={onTrafficZoneClick}
          isTrafficDrawingMode={isTrafficDrawingMode}
          isStreetViewActive={isStreetViewActive}
          streetViewPos={streetViewPos}
          onStreetViewClose={() => {
            setIsStreetViewActive(false);
            setStreetViewPos(null);
          }}
          isSalesMode={isSalesMode}
          customCompetitorBrands={customCompetitorBrands}
          customPreferredBrands={customPreferredBrands}
        />
      ) : (
        // Google Maps가 아직 로드되지 않은 경우: 스크립트 로더 포함
        <MapWithLoader
          apiKey={apiKey}
          stores={filteredStores}
          viewMode={viewMode}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          setMapInstance={setMap}
          onStoreClick={handleStoreClick}
          onViewChange={handleViewChange}
          onMapClick={handleMapBackgroundClick}
          onMapMouseMove={onMapMouseMove}
          lines={lines}
          entities={entities}
          tempMarker={searchedLocation || tempMarker}
          showHeatmap={showHeatmap}
          showLowSalesAlert={showLowSalesAlert}
          showExpirationAlert={showExpirationAlert}
          trafficCenter={trafficCenter}
          trafficRadius={trafficRadius}
          trafficColor={trafficColor}
          trafficOpacity={trafficOpacity}
          savedTrafficZones={savedTrafficZones}
          onTrafficZoneClick={onTrafficZoneClick}
          isTrafficDrawingMode={isTrafficDrawingMode}
          isStreetViewActive={isStreetViewActive}
          streetViewPos={streetViewPos}
          onStreetViewClose={() => {
            setIsStreetViewActive(false);
            setStreetViewPos(null);
          }}
          isSalesMode={isSalesMode}
          customCompetitorBrands={customCompetitorBrands}
          customPreferredBrands={customPreferredBrands}
        />
      )}

      {/* 상단 중앙 검색창 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-[400px]">
        <div className="bg-white rounded-full shadow-lg border border-gray-200 flex items-center p-1 pr-1.5 pl-4 transition-all hover:shadow-xl relative">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="장소, 버스, 지하철, 도로명 검색"
            className="flex-1 text-sm bg-transparent border-none outline-none text-gray-700 placeholder:text-gray-400 h-9"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() =>
              setTimeout(() => setIsSearchFocused(false), 200)
            }
          />
          <Button
            size="icon"
            className="h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white shrink-0 ml-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Button>
        </div>

        {/* 검색 자동완성 드롭다운 */}
        <SearchAutocomplete
          isVisible={isSearchFocused}
          suggestions={suggestions}
          onSelect={handlePlaceSelect}
        />
      </div>

      {/* 좌측 도구 모음 */}
      <div className="absolute top-4 left-4 z-50">
        {isSalesMode ? (
          // 매출 분석 모드: 상태 필터 + 도구 버튼
          <div className="bg-white rounded-lg shadow-md border border-gray-200 flex flex-col items-center py-2 w-[58px]">
            {/* 파이프라인 상태 범례 (클릭 시 필터 토글) */}
            <div className="flex flex-col space-y-4 mb-3">
              {[
                {
                  key: "Planned",
                  label: "Planned",
                  color: "bg-[#64748B]",
                  ring: "ring-slate-50",
                },
                {
                  key: "Confirmed",
                  label: "Confirmed",
                  color: "bg-[#9694FF]",
                  ring: "ring-purple-50",
                },
                {
                  key: "Signed",
                  label: "Signed",
                  color: "bg-[#EE99C2]",
                  ring: "ring-pink-50",
                },
                {
                  key: "Construction",
                  label: "Construction",
                  color: "bg-sky-500",
                  ring: "ring-sky-100",
                },
                {
                  key: "Open",
                  label: "Open",
                  color: "bg-[#7FC7D9]",
                  ring: "ring-cyan-100",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className={getLegendItemClass(item.key)}
                  onClick={() =>
                    handleStatusFilterClick(item.key)
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-full ${item.color} ${item.ring}`}
                  ></div>
                  <span className="text-[10px] text-gray-500 font-medium group-hover:text-gray-800">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="w-8 h-[1px] bg-gray-100 my-1"></div>

            {/* 알림 및 뷰 리셋 버튼 */}
            <div className="flex flex-col space-y-1 mb-2 mt-1">
              {/* 전체 필터 선택 버튼 */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-gray-50 rounded-md transition-colors text-gray-400 hover:text-gray-600"
                title="Select All Filters"
                onClick={onSelectAll}
              >
                {selectAllIcon ? (
                  <img src={selectAllIcon} alt="Select All" className="w-5 h-5" />
                ) : (
                  <Layers className="w-5 h-5" />
                )}
              </Button>
              {/* 저매출 알림 토글 버튼 */}
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 hover:bg-gray-50 rounded-md transition-colors ${showLowSalesAlert ? "text-red-600 bg-red-50 ring-1 ring-red-200" : "text-gray-400 hover:text-gray-600"}`}
                title="Low Sales Alert"
                onClick={onToggleLowSalesAlert}
              >
                <Bell className="h-5 w-5" />
              </Button>
              {/* 계약 만료 알림 토글 버튼 */}
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 hover:bg-gray-50 rounded-md transition-colors ${showExpirationAlert ? "text-[#FE9A00] bg-orange-50 ring-1 ring-orange-200" : "text-gray-400 hover:text-gray-600"}`}
                title="Contract Expiration Alert"
                onClick={onToggleExpirationAlert}
              >
                <CalendarClock className="h-5 w-5" />
              </Button>
              {/* 뷰 리셋 버튼 (뷰가 변경된 경우에만 활성화) */}
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-md transition-colors ${isViewChanged ? "text-blue-600 hover:bg-blue-50" : "text-gray-300 cursor-not-allowed hover:bg-transparent"}`}
                disabled={!isViewChanged}
                onClick={handleResetView}
                title="Reset View"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            </div>

            <div className="w-8 h-[1px] bg-gray-100 my-1"></div>

            {/* 하단 도구 선택 버튼 (Store, Pipeline, Comp, Traffic) */}
            <div className="flex flex-col space-y-3 mt-2 pb-1">
              {[
                {
                  id: "store",
                  label: "Store",
                  icon: Building2,
                },
                {
                  id: "pipeline",
                  label: "Pipeline",
                  icon: TrendingUp,
                },
                { id: "comp", label: "Comp", icon: Users },
                {
                  id: "traffic",
                  label: "Traffic",
                  icon: Shapes,
                },
              ].map((tool) => {
                const isActive = activeTool === tool.id;
                return (
                  <div
                    key={tool.id}
                    className="flex flex-col items-center space-y-0.5 cursor-pointer group"
                    onClick={() => handleToolClick(tool.id)}
                  >
                    <div
                      className={`p-1.5 rounded-full transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-100"
                          : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      <tool.icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[10px] font-medium ${
                        isActive
                          ? "text-blue-600 font-bold"
                          : "text-gray-500"
                      }`}
                    >
                      {tool.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // 일반 모드: 상태 범례 + 알림/리셋 버튼만 표시
          <div className="bg-white rounded-lg shadow-md border border-gray-200 flex flex-col items-center py-3 w-14 overflow-y-auto max-h-[80vh] overflow-x-hidden">
            {/* 파이프라인 상태 범례 */}
            <div className="flex flex-col space-y-4 mb-3">
              {[
                {
                  key: "Planned",
                  label: "Planned",
                  color: "bg-[#64748B]",
                  ring: "ring-slate-50",
                },
                {
                  key: "Confirmed",
                  label: "Confirmed",
                  color: "bg-[#9694FF]",
                  ring: "ring-purple-50",
                },
                {
                  key: "Signed",
                  label: "Signed",
                  color: "bg-[#EE99C2]",
                  ring: "ring-pink-50",
                },
                {
                  key: "Construction",
                  label: "Construction",
                  color: "bg-sky-500",
                  ring: "ring-sky-100",
                },
                {
                  key: "Open",
                  label: "Open",
                  color: "bg-[#7FC7D9]",
                  ring: "ring-cyan-100",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className={getLegendItemClass(item.key)}
                  onClick={() =>
                    handleStatusFilterClick(item.key)
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-full ${item.color} ${item.ring}`}
                  ></div>
                  <span className="text-[10px] text-gray-500 font-medium group-hover:text-gray-800">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="w-8 h-[1px] bg-gray-100 my-1"></div>

            {/* 전체 선택 버튼 */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-gray-50 rounded-md transition-colors text-gray-400 hover:text-gray-600 mb-1"
              title="Select All Filters"
              onClick={onSelectAll}
            >
              {selectAllIcon ? (
                <img src={selectAllIcon} alt="Select All" className="w-5 h-5" />
              ) : (
                <Layers className="w-5 h-5" />
              )}
            </Button>
            {/* 저매출 알림 버튼 */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-md transition-colors ${showLowSalesAlert ? "text-red-600 bg-red-50 ring-1 ring-red-200" : "text-gray-400 hover:text-gray-600 mb-1"}`}
              title="Low Sales Alert"
              onClick={onToggleLowSalesAlert}
            >
              <Bell className="h-5 w-5" />
            </Button>
            {/* 뷰 리셋 버튼 */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-md transition-colors ${isViewChanged ? "text-blue-600 hover:bg-blue-50" : "text-gray-300 cursor-not-allowed hover:bg-transparent"}`}
              disabled={!isViewChanged}
              onClick={handleResetView}
              title="Reset View"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* 우측 줌 컨트롤 */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2 z-10 items-center">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-1 flex flex-col space-y-1 mt-2 w-14 items-center">
          {/* 줌 인 버튼 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="h-8 w-8 hover:bg-gray-100 rounded-md text-gray-600"
          >
            <Plus className="h-4 w-4" />
          </Button>
          {/* 줌 아웃 버튼 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="h-8 w-8 hover:bg-gray-100 rounded-md text-gray-600"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 좌하단 연도별 파이프라인 현황 차트 */}
      <div className="absolute bottom-6 left-4 z-10 pointer-events-none">
        <YearlyStatusCharts
          stores={stores}
          isVisible={isSalesMode}
        />
      </div>

      {/* 우하단 스트리트 뷰 토글 버튼 */}
      <div
        className={`absolute bottom-6 z-20 flex flex-col items-end space-y-2 transition-all duration-300 ${focusStore ? "right-[404px]" : "right-4"}`}
      >
        <Button
          variant="outline"
          className={`h-10 px-4 bg-white shadow-md border-gray-200 rounded-md flex items-center space-x-2 transition-all hover:bg-blue-50 hover:border-blue-200 ${isStreetViewActive ? "text-blue-600 border-blue-600 bg-blue-50 ring-2 ring-blue-100" : "text-gray-600"} cursor-grab active:cursor-grabbing select-none`}
          onClick={toggleStreetView}
          onMouseDown={handlePegmanMouseDown}
        >
          <Camera className="w-4 h-4" />
          <span className="text-[12px] font-black uppercase tracking-tight">
            스트리트 뷰
          </span>
        </Button>
      </div>

      {/* Pegman 드래그 중 고스트 이미지 표시 */}
      {isDraggingPegman && (
        <div
          className="fixed z-[9999] pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: pegmanPos.x, top: pegmanPos.y }}
        >
          <div className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-2xl border-2 border-blue-500 animate-pulse">
            <Camera className="w-4 h-4 text-blue-600" />
          </div>
        </div>
      )}
    </div>
  );
};
