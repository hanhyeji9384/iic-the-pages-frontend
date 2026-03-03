// ============================================================
// TrafficManagerPanel 컴포넌트
// 지도 위에 원형 트래픽 구역(Traffic Area)을 그리고 관리하는 패널입니다.
// 사용자가 원을 그리면 색상, 투명도를 설정하고 저장할 수 있습니다.
// ============================================================

import React, { useState } from 'react';
import { Shapes, Plus, RotateCcw, Check, Move, Trash2, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { toast } from 'sonner';

// 저장된 트래픽 구역의 데이터 구조
export interface TrafficZone {
  id: string;             // 구역 고유 ID
  name: string;           // 구역 이름
  center: { lat: number; lng: number }; // 원의 중심 좌표
  radius: number;         // 원의 반지름 (미터 단위)
  color: string;          // 구역 색상 (HEX)
  opacity: number;        // 투명도 (0~1)
  createdAt: string;      // 생성 시각
}

// 컴포넌트가 받는 속성(props) 정의
interface TrafficManagerPanelProps {
  currentCenter: { lat: number; lng: number } | null; // 현재 그리는 원의 중심
  currentRadius: number;                               // 현재 그리는 원의 반지름
  onCenterChange: (center: { lat: number; lng: number } | null) => void; // 중심 변경 콜백
  onRadiusChange: (radius: number) => void;            // 반지름 변경 콜백
  isDrawing: boolean;                                  // 원 그리기 모드 활성화 여부
  onDrawingModeChange: (isDrawing: boolean) => void;   // 그리기 모드 변경 콜백
  color: string;                                       // 현재 선택된 색상
  onColorChange: (color: string) => void;              // 색상 변경 콜백
  opacity: number;                                     // 현재 설정된 투명도
  onOpacityChange: (opacity: number) => void;          // 투명도 변경 콜백
  savedZones: TrafficZone[];                           // 저장된 구역 목록
  onSaveZone: (zone: TrafficZone) => void;             // 구역 저장 콜백
  onDeleteZone: (id: string) => void;                  // 구역 삭제 콜백
  onFocusZone: (zone: TrafficZone) => void;            // 해당 구역으로 지도 이동 콜백
}

/**
 * 지도 트래픽 구역 관리 패널
 * 단계별로 도구 선택 → 색상/투명도 설정 → 그리기/저장을 안내합니다.
 */
export function TrafficManagerPanel({
  currentCenter,
  currentRadius,
  onCenterChange,
  onRadiusChange,
  isDrawing,
  onDrawingModeChange,
  color,
  onColorChange,
  opacity,
  onOpacityChange,
  savedZones,
  onSaveZone,
  onDeleteZone,
  onFocusZone
}: TrafficManagerPanelProps) {
  // 구역 이름 입력 상태
  const [zoneName, setZoneName] = useState('');

  // 현재 그린 원을 이름과 함께 저장하는 함수
  const handleSave = () => {
    // 중심점 또는 반지름이 설정되지 않은 경우 저장 불가
    if (!currentCenter || currentRadius === 0) {
      toast.error("원을 완성하려면 중심점과 반지름이 필요합니다.");
      return;
    }
    const newZone: TrafficZone = {
      id: Math.random().toString(36).substr(2, 9),
      name: zoneName || `Traffic Area ${savedZones.length + 1}`,
      center: currentCenter,
      radius: currentRadius,
      color,
      opacity,
      createdAt: new Date().toISOString()
    };
    onSaveZone(newZone);
    onCenterChange(null);
    onRadiusChange(0);
    setZoneName('');
    toast.success("트래픽 구역이 저장되었습니다.");
  };

  // 현재 그린 원을 초기화하는 함수
  const handleClear = () => {
    onCenterChange(null);
    onRadiusChange(0);
    toast.info("그려진 원이 초기화되었습니다.");
  };

  return (
    <div className="w-[320px] bg-white border-r flex flex-col h-full shadow-lg relative z-10">
      {/* 패널 헤더 */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 bg-orange-100 rounded-lg">
            <Shapes className="w-5 h-5 text-orange-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Traffic Area Tool</h2>
        </div>
        <p className="text-xs text-gray-500">지도 위에 원을 그려 트래픽 구역을 설정하세요.</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">

          {/* Step 1: 도구 선택 */}
          <section className="space-y-3">
            <Label className="text-[13px] font-bold flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">1</span>
              도구 선택
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {/* 원 그리기 모드 토글 버튼 */}
              <Button
                variant={isDrawing ? "default" : "outline"}
                className={`flex flex-col h-20 gap-2 ${isDrawing ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                onClick={() => onDrawingModeChange(!isDrawing)}
              >
                <Shapes className="w-6 h-6" />
                <span className="text-xs">원 그리기</span>
              </Button>
              {/*
              <Button
                variant="outline"
                className="flex flex-col h-20 gap-2 opacity-50 cursor-not-allowed"
                disabled
              >
                <Move className="w-6 h-6" />
                <span className="text-xs">구역 이동 (Beta)</span>
              </Button>
              */}
            </div>
          </section>

          {/* Step 2: 색상 및 투명도 설정 */}
          <section className="space-y-4">
            <Label className="text-[13px] font-bold flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">2</span>
              색상 및 투명도
            </Label>

            <div className="space-y-3">
              {/* 프리셋 색상 선택 팔레트 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">구역 색상</span>
                  <span className="text-[10px] font-mono uppercase font-bold text-orange-600">{color}</span>
                </div>
                <div className="flex gap-2">
                  {['#F97316', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'].map(c => (
                    <button
                      key={c}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-gray-900 scale-110 shadow-md' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                      onClick={() => onColorChange(c)}
                    />
                  ))}
                </div>
              </div>

              {/* 투명도 슬라이더 */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">투명도 (Opacity)</span>
                  <span className="text-xs font-bold">{Math.round(opacity * 100)}%</span>
                </div>
                <Slider
                  value={[opacity]}
                  onValueChange={(v) => onOpacityChange(v[0])}
                  min={0.1}
                  max={0.9}
                  step={0.05}
                  className="py-2"
                />
              </div>
            </div>
          </section>

          {/* Step 3: 그리기 상태 확인 및 저장 */}
          <section className="space-y-3">
             <Label className="text-[13px] font-bold flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">3</span>
              그리기 및 저장
            </Label>
            <div className="bg-gray-50 border rounded-lg p-3 space-y-3">
              {/* 현재 원 상태 표시 */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">원 상태</span>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 font-bold">
                  {currentCenter ? `${Math.round(currentRadius)}m` : '미설정'}
                </Badge>
              </div>

              <div className="space-y-2">
                {/* 구역 이름 입력 */}
                <Input
                  placeholder="구역 이름을 입력하세요"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="text-xs h-8"
                  disabled={!currentCenter}
                />
                {/* 초기화 및 저장 버튼 */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-8"
                    onClick={handleClear}
                    disabled={!currentCenter}
                  >
                    <RotateCcw className="w-3 h-3 mr-2" />
                    초기화
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 text-xs h-8 bg-orange-600 hover:bg-orange-700"
                    onClick={handleSave}
                    disabled={!currentCenter || currentRadius === 0}
                  >
                    <Plus className="w-3 h-3 mr-2" />
                    저장하기
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* 저장된 트래픽 구역 목록 */}
          <section className="space-y-3 pb-8">
            <Label className="text-[13px] font-bold flex items-center gap-2">
              저장된 트래픽 구역 ({savedZones.length})
            </Label>

            <div className="space-y-2">
              {savedZones.length === 0 ? (
                // 저장된 구역이 없을 때 빈 상태 표시
                <div className="text-center py-8 border-2 border-dashed rounded-xl">
                  <p className="text-xs text-gray-400">저장된 구역이 없습니다.</p>
                </div>
              ) : (
                // 저장된 구역 카드 목록
                savedZones.map((zone) => (
                  <div
                    key={zone.id}
                    className="flex items-center justify-between p-3 bg-white border rounded-lg hover:border-orange-200 transition-colors group"
                  >
                    {/* 구역 정보 (클릭 시 지도에서 해당 위치로 이동) */}
                    <div
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => onFocusZone(zone)}
                    >
                      {/* 구역 색상 원형 표시 */}
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color, opacity: zone.opacity }} />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900">{zone.name}</span>
                        <span className="text-[10px] text-gray-500">반경 {Math.round(zone.radius)}m</span>
                      </div>
                    </div>
                    {/* 삭제 버튼 (hover 시 표시) */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteZone(zone.id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
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
