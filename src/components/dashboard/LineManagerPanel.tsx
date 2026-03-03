// ============================================================
// LineManagerPanel 컴포넌트
// 지도 위에 두 점을 연결하는 선(파이프라인 연결선)을 관리하는 패널입니다.
// 선을 추가하고, 저장하고, 삭제하는 기능을 제공합니다.
// ============================================================

import { useState, useEffect } from "react";
import {
  MapPin,
  Plus,
  Trash2,
  Eye,
  RotateCcw,
  Loader2,
  Navigation
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { toast } from "sonner";
import { type SavedLine, type Coordinate } from "../../utils/mockLineServer";
import { dataClient } from "../../utils/dataClient";

// 선택 가능한 기본 색상 목록
const LINE_COLORS = [
  "#EF4444", // 빨간색
  "#3B82F6", // 파란색
  "#10B981", // 초록색
  "#F59E0B", // 황색
  "#8B5CF6", // 보라색
  "#6B7280", // 회색
];

// 컴포넌트가 받는 속성(props) 정의
interface LineManagerPanelProps {
  onLinesUpdate: (lines: SavedLine[]) => void;           // 선 목록이 변경될 때 호출
  onModeChange: (mode: boolean) => void;                 // 추가 모드 변경 시 호출
  onSelectionChange: (points: Coordinate[]) => void;    // 선택된 좌표 변경 시 호출
  onFocusLine: (line: SavedLine) => void;               // 특정 선에 포커스 시 호출
  selectedPoints: Coordinate[];                          // 지도에서 선택된 좌표 목록
  isAddMode: boolean;                                    // 현재 추가 모드 여부
}

/**
 * 지도 선(파이프라인 연결선) 관리 패널
 * 선 추가, 색상/두께 설정, 저장된 선 목록 표시 기능을 담당합니다.
 */
export function LineManagerPanel({
  onLinesUpdate,
  onModeChange,
  onSelectionChange,
  onFocusLine,
  selectedPoints,
  isAddMode
}: LineManagerPanelProps) {
  // 저장된 선 목록 상태
  const [lines, setLines] = useState<SavedLine[]>([]);
  // 로딩 중 여부 상태
  const [loading, setLoading] = useState(false);

  // 폼 입력값 상태들
  const [p1Lat, setP1Lat] = useState("");  // 시작점 위도
  const [p1Lng, setP1Lng] = useState("");  // 시작점 경도
  const [p2Lat, setP2Lat] = useState("");  // 끝점 위도
  const [p2Lng, setP2Lng] = useState("");  // 끝점 경도
  const [selectedColor, setSelectedColor] = useState(LINE_COLORS[0]);  // 선택된 색상
  const [customColor, setCustomColor] = useState("");                   // 직접 입력 색상
  const [lineTitle, setLineTitle] = useState("");                       // 선 제목
  const [lineThickness, setLineThickness] = useState("20");             // 선 두께

  // 상태 메시지 (하단에 표시되는 안내 문구)
  const [statusMessage, setStatusMessage] = useState("Ready");

  // 컴포넌트 마운트 시 저장된 선 불러오기
  useEffect(() => {
    fetchLines();
  }, []);

  // 지도에서 선택된 좌표가 변경되면 폼 입력값에 반영
  useEffect(() => {
    if (selectedPoints[0]) {
      setP1Lat(selectedPoints[0].lat.toFixed(6));
      setP1Lng(selectedPoints[0].lng.toFixed(6));
    } else {
      setP1Lat("");
      setP1Lng("");
    }

    if (selectedPoints[1]) {
      setP2Lat(selectedPoints[1].lat.toFixed(6));
      setP2Lng(selectedPoints[1].lng.toFixed(6));
    } else {
      setP2Lat("");
      setP2Lng("");
    }
  }, [selectedPoints]);

  // Supabase에서 저장된 선 목록을 가져오는 함수
  const fetchLines = async () => {
    try {
      setLoading(true);
      const data = await dataClient.getPipelines();
      setLines(data);
      onLinesUpdate(data);
    } catch (error) {
      setStatusMessage("Error fetching lines");
    } finally {
      setLoading(false);
    }
  };

  // 선택 상태 및 폼을 초기화하는 함수
  const handleResetSelection = () => {
    onSelectionChange([]);
    setP1Lat("");
    setP1Lng("");
    setP2Lat("");
    setP2Lng("");
    setLineTitle("");
    setLineThickness("20");
    setStatusMessage("Selection reset.");
  };

  // 새 선을 추가하는 함수
  const handleAddLine = async () => {
    // 1. 선택된 좌표 배열에서 먼저 확인
    let point1: Coordinate | null = selectedPoints[0] || null;
    let point2: Coordinate | null = selectedPoints[1] || null;

    // 2. 좌표 배열에 없으면 직접 입력한 값을 파싱
    if (!point1 && p1Lat && p1Lng) {
      point1 = { lat: parseFloat(p1Lat), lng: parseFloat(p1Lng) };
    }
    if (!point2 && p2Lat && p2Lng) {
      point2 = { lat: parseFloat(p2Lat), lng: parseFloat(p2Lng) };
    }

    // 입력값 유효성 검사
    if (!point1 || isNaN(point1.lat) || isNaN(point1.lng)) {
      toast.error("Invalid Point 1");
      return;
    }
    if (!point2 || isNaN(point2.lat) || isNaN(point2.lng)) {
      toast.error("Invalid Point 2");
      return;
    }

    try {
      setLoading(true);
      // 커스텀 색상이 있으면 우선 사용, 없으면 선택된 색상 사용
      const colorToUse = customColor || selectedColor;
      const thickness = parseInt(lineThickness) || 20;
      const newLine = await dataClient.addPipeline({
        point1,
        point2,
        color: colorToUse,
        title: lineTitle,
        thickness
      });
      const updatedLines = [newLine, ...lines];
      setLines(updatedLines);
      onLinesUpdate(updatedLines);
      setStatusMessage(`Line #${newLine.id.slice(-4)} created successfully`);
      toast.success("Line created!");
      handleResetSelection();
    } catch (error) {
      toast.error("Failed to add line");
    } finally {
      setLoading(false);
    }
  };

  // 선을 삭제하는 함수
  const handleDeleteLine = async (id: string) => {
    try {
      await dataClient.deletePipeline(id);
      const updatedLines = lines.filter(l => l.id !== id);
      setLines(updatedLines);
      onLinesUpdate(updatedLines);
      setStatusMessage(`Line deleted`);
      toast.success("Line deleted");
    } catch (error) {
      toast.error("Failed to delete line");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r w-80 sm:w-96 shrink-0 z-10 shadow-sm transition-all duration-300">
      {/* 패널 헤더 */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-lg text-gray-900">Map Line Manager</h2>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* 선 추가 섹션 */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Add Line</h3>
              {/* 지도 클릭 추가 모드 토글 버튼 */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Mode</span>
                <Button
                  variant={isAddMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => onModeChange(!isAddMode)}
                  className={`h-7 text-xs ${isAddMode ? "bg-blue-600" : ""}`}
                >
                  {isAddMode ? "ON" : "OFF"}
                </Button>
              </div>
            </div>

            <Card className="border-gray-200 shadow-sm">
              <CardContent className="p-4 space-y-4">
                {/* 선 제목 입력 */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Line Title</Label>
                  <Input
                    placeholder="Enter line title (optional)"
                    className="h-8 text-xs"
                    value={lineTitle}
                    onChange={(e) => setLineTitle(e.target.value)}
                  />
                </div>

                {/* 시작점(Point 1) 좌표 입력 */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Point 1 (Start)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Lat"
                      className="h-8 text-xs"
                      value={p1Lat}
                      onChange={(e) => setP1Lat(e.target.value)}
                      type="number"
                    />
                    <Input
                      placeholder="Lng"
                      className="h-8 text-xs"
                      value={p1Lng}
                      onChange={(e) => setP1Lng(e.target.value)}
                      type="number"
                    />
                  </div>
                </div>

                {/* 끝점(Point 2) 좌표 입력 */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Point 2 (End)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Lat"
                      className="h-8 text-xs"
                      value={p2Lat}
                      onChange={(e) => setP2Lat(e.target.value)}
                      type="number"
                    />
                    <Input
                      placeholder="Lng"
                      className="h-8 text-xs"
                      value={p2Lng}
                      onChange={(e) => setP2Lng(e.target.value)}
                      type="number"
                    />
                  </div>
                </div>

                {/* 색상 선택 및 두께 입력 */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs text-gray-500">Line Color</Label>
                    <Label className="text-xs text-gray-500">Thickness</Label>
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* 기본 색상 팔레트 */}
                    <div className="flex flex-wrap gap-2">
                      {LINE_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => { setSelectedColor(color); setCustomColor(""); }}
                          className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${selectedColor === color && !customColor ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* 커스텀 색상 직접 입력 */}
                      <div className="flex items-center gap-2 flex-1">
                        {/* 현재 선택된 색상 미리보기 */}
                        <div className="w-8 h-8 rounded border flex-shrink-0" style={{ backgroundColor: customColor || selectedColor }} />
                        <Input
                          placeholder="#000000"
                          className="h-8 text-xs w-full"
                          value={customColor}
                          onChange={(e) => setCustomColor(e.target.value)}
                        />
                      </div>

                      {/* 두께 입력 (픽셀 단위) */}
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        className="h-8 text-xs w-20"
                        placeholder="px"
                        value={lineThickness}
                        onChange={(e) => setLineThickness(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="pt-2 flex flex-col gap-2">
                  <Button onClick={handleAddLine} className="w-full bg-blue-600 hover:bg-blue-700 h-9">
                    <Plus className="w-4 h-4 mr-2" /> Add Line
                  </Button>
                  <Button variant="ghost" onClick={handleResetSelection} className="w-full text-xs h-8 text-gray-500">
                    <RotateCcw className="w-3 h-3 mr-2" /> Reset Selection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 저장된 선 목록 섹션 */}
          <section className="space-y-3 flex flex-col min-h-0">
            <div className="flex items-center justify-between shrink-0">
              <h3 className="font-semibold text-gray-900">Saved Lines</h3>
              <Badge variant="secondary" className="text-xs font-normal">
                {lines.length} items
              </Badge>
            </div>
            <p className="text-xs text-gray-500 shrink-0">Stored in Supabase KV.</p>

            <ScrollArea className="h-[450px] pr-3 -mr-3">
              <div className="space-y-2 pb-4">
                {/* 로딩 중이고 목록이 비어있을 때 로딩 스피너 표시 */}
                {loading && lines.length === 0 ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : lines.length === 0 ? (
                  // 저장된 선이 없을 때 안내 메시지
                  <div className="text-center py-8 text-gray-400 text-sm border rounded-lg bg-gray-50 border-dashed">
                    No lines saved yet.
                  </div>
                ) : (
                  // 저장된 선 목록 렌더링
                  lines.map(line => (
                    <div key={line.id} className="bg-white border rounded-lg p-3 shadow-sm flex items-start gap-3 group hover:border-blue-200 transition-colors">
                      {/* 선 색상 표시 원형 아이콘 */}
                      <div
                        className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: line.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          {/* 선 제목 또는 ID 표시 */}
                          <span className="font-medium text-sm text-gray-900 truncate pr-2">
                            {line.title || `Line #${line.id.split('-').pop()}`}
                          </span>
                          {/* 생성 시간 표시 */}
                          <span className="text-[10px] text-gray-400 flex-shrink-0">
                            {new Date(line.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono space-y-0.5">
                          <div className="flex items-center gap-2 mb-1">
                            {/* 두께 배지 */}
                            <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 font-normal text-gray-500">
                              {line.thickness || 20}px
                            </Badge>
                          </div>
                          {/* 시작점/끝점 좌표 표시 */}
                          <div className="truncate">P1: {line.point1.lat.toFixed(4)}, {line.point1.lng.toFixed(4)}</div>
                          <div className="truncate">P2: {line.point2.lat.toFixed(4)}, {line.point2.lng.toFixed(4)}</div>
                        </div>
                      </div>
                      {/* 호버 시 나타나는 액션 버튼들 */}
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* 해당 선 위치로 이동 버튼 */}
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onFocusLine(line)}>
                          <Eye className="w-3 h-3 text-gray-500" />
                        </Button>
                        {/* 삭제 버튼 */}
                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-red-50" onClick={() => handleDeleteLine(line.id)}>
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
