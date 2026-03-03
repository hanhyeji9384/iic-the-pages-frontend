// ============================================================
// SettingsDialog 컴포넌트
// 앱 설정 다이얼로그입니다.
// 경쟁사 브랜드(Competitor Brands)와 선호 브랜드(Preferred Brands)를
// CRUD(추가/수정/삭제)할 수 있으며, 브랜드 로고 및 지도 마커 이미지를 업로드할 수 있습니다.
// ============================================================

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Upload, Image as ImageIcon, Plus, Trash2, Pencil, X, MapPin } from "lucide-react";
import { toast } from "sonner";
import { BrandDefinition } from "../../types";

// 이 컴포넌트가 받는 데이터의 형태를 정의합니다.
interface SettingsDialogProps {
  open: boolean;                                          // 다이얼로그 열림/닫힘 상태
  onOpenChange: (open: boolean) => void;                  // 상태 변경 함수
  competitorBrands: BrandDefinition[];                    // 경쟁사 브랜드 목록
  preferredBrands: BrandDefinition[];                     // 선호 브랜드 목록
  onUpdateCompetitorBrands: (brands: BrandDefinition[]) => void; // 경쟁사 브랜드 업데이트 함수
  onUpdatePreferredBrands: (brands: BrandDefinition[]) => void;  // 선호 브랜드 업데이트 함수
}

// 설정 다이얼로그 컴포넌트 — 브랜드 관리 탭을 포함합니다.
export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onOpenChange,
  competitorBrands,
  preferredBrands,
  onUpdateCompetitorBrands,
  onUpdatePreferredBrands,
}) => {
  // 현재 선택된 탭 상태 ("competitor" 또는 "preferred")
  const [activeTab, setActiveTab] = useState("competitor");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 다이얼로그 전체 레이아웃 — 높이를 80%로 제한하고 내부에 스크롤을 적용합니다. */}
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* 헤더 영역 */}
        <DialogHeader className="px-6 py-4 border-b border-gray-100 shrink-0">
          <DialogTitle className="text-xl font-bold">Settings</DialogTitle>
        </DialogHeader>

        {/* 탭 영역 — 경쟁사 브랜드 / 선호 브랜드 두 가지 탭 */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="competitor" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
            <div className="px-6 pt-4 shrink-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="competitor">Competitor Brands</TabsTrigger>
                <TabsTrigger value="preferred">Preferred Brands</TabsTrigger>
              </TabsList>
            </div>

            {/* 탭 내용 영역 — 스크롤 가능 */}
            <div className="flex-1 overflow-y-auto min-h-0 p-6">
              {/* 경쟁사 브랜드 탭 */}
              <TabsContent value="competitor" className="mt-0 h-full">
                <BrandManager
                  brands={competitorBrands}
                  onUpdate={onUpdateCompetitorBrands}
                  type="Competitor"
                />
              </TabsContent>
              {/* 선호 브랜드 탭 */}
              <TabsContent value="preferred" className="mt-0 h-full">
                <BrandManager
                  brands={preferredBrands}
                  onUpdate={onUpdatePreferredBrands}
                  type="Preferred"
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================
// BrandManager 서브 컴포넌트
// 특정 타입(경쟁사/선호)의 브랜드 목록을 관리하는 내부 컴포넌트입니다.
// 브랜드 추가, 수정, 삭제와 로고/마커 이미지 업로드를 처리합니다.
// ============================================================

interface BrandManagerProps {
  brands: BrandDefinition[];                    // 현재 브랜드 목록
  onUpdate: (brands: BrandDefinition[]) => void; // 브랜드 목록 변경 함수
  type: string;                                  // 브랜드 타입 (표시용 문자열)
}

const BrandManager: React.FC<BrandManagerProps> = ({ brands, onUpdate, type }) => {
  // 새 브랜드 이름 입력 상태
  const [newName, setNewName] = useState("");
  // 새 브랜드 로고 이미지 (base64 또는 URL)
  const [newLogo, setNewLogo] = useState<string | null>(null);
  // 새 브랜드 지도 마커 이미지
  const [newMarkerImage, setNewMarkerImage] = useState<string | null>(null);
  // 수정 중인 브랜드의 인덱스 (null이면 새 브랜드 추가 모드)
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // 파일 입력 요소들을 직접 참조하기 위한 ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const markerInputRef = useRef<HTMLInputElement>(null);

  // 브랜드 저장(추가 또는 수정) 처리 함수
  const handleSave = () => {
    // 브랜드 이름이 비어있으면 오류 메시지 표시
    if (!newName.trim()) {
      toast.error("Please enter a brand name");
      return;
    }

    const trimmedName = newName.trim();

    // 같은 이름의 브랜드가 이미 있는지 확인 (수정 중인 항목 제외)
    const isDuplicate = brands.some((b, idx) =>
      b.name.toLowerCase() === trimmedName.toLowerCase() && idx !== editingIndex
    );

    if (isDuplicate) {
      toast.error("Brand already exists");
      return;
    }

    // 저장할 브랜드 데이터 구성
    const brandData: BrandDefinition = {
      name: trimmedName,
      logo: newLogo || undefined,
      markerImage: newMarkerImage || undefined
    };

    if (editingIndex !== null) {
      // 수정 모드: 기존 배열에서 해당 인덱스 항목을 교체
      const updatedBrands = [...brands];
      updatedBrands[editingIndex] = brandData;
      onUpdate(updatedBrands);
      toast.success(`${type} brand updated`);
    } else {
      // 추가 모드: 기존 배열 끝에 새 브랜드 추가
      onUpdate([...brands, brandData]);
      toast.success(`${type} brand added`);
    }

    // 폼 초기화
    handleCancelEdit();
  };

  // 특정 브랜드를 수정 모드로 전환하는 함수
  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setNewName(brands[index].name);
    setNewLogo(brands[index].logo || null);
    setNewMarkerImage(brands[index].markerImage || null);
    // 이름 입력 필드에 포커스를 이동합니다.
    const input = document.getElementById(`name-${type}`);
    if (input) input.focus();
  };

  // 수정 모드 취소 및 폼 초기화 함수
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setNewName("");
    setNewLogo(null);
    setNewMarkerImage(null);
    // 파일 입력 초기화 (같은 파일을 다시 선택할 수 있도록)
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (markerInputRef.current) markerInputRef.current.value = "";
  };

  // 브랜드 삭제 처리 함수
  const handleDelete = (index: number) => {
    if (confirm("Are you sure you want to delete this brand?")) {
      const newBrands = [...brands];
      newBrands.splice(index, 1); // 해당 인덱스 항목 제거
      onUpdate(newBrands);

      // 삭제된 항목을 수정 중이었다면 수정 모드 취소
      if (editingIndex === index) {
        handleCancelEdit();
      } else if (editingIndex !== null && editingIndex > index) {
        // 삭제된 항목보다 뒤에 있는 항목을 수정 중이었다면 인덱스 조정
        setEditingIndex(editingIndex - 1);
      }
    }
  };

  // 파일 선택 시 base64로 변환하는 함수
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFunction: (val: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      // 파일 읽기 완료 후 base64 문자열로 상태 업데이트
      reader.onloadend = () => {
        setFunction(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 현재 수정 중인지 여부
  const isEditing = editingIndex !== null;

  return (
    <div className="space-y-6">
      {/* 브랜드 추가/수정 폼 영역 */}
      <div className={`p-4 rounded-lg border transition-colors ${isEditing ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'} space-y-4`}>
        {/* 폼 헤더 */}
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-semibold ${isEditing ? 'text-blue-700' : 'text-gray-900'}`}>
            {isEditing ? `Edit ${type} Brand` : `Add New ${type} Brand`}
          </h3>
          {/* 수정 모드일 때 취소 버튼 표시 */}
          {isEditing && (
            <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="h-6 w-6 p-0 rounded-full hover:bg-blue-100">
              <X className="w-4 h-4 text-blue-500" />
            </Button>
          )}
        </div>

        <div className="grid gap-4">
          {/* 브랜드 이름 입력 */}
          <div className="grid gap-2">
            <Label htmlFor={`name-${type}`} className="text-xs">Brand Name</Label>
            <Input
              id={`name-${type}`}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Nike"
              className="bg-white"
            />
          </div>

          {/* 로고 이미지 + 지도 마커 이미지 업로드 (2열 레이아웃) */}
          <div className="grid grid-cols-2 gap-4">
            {/* 브랜드 로고 업로드 */}
            <div className="grid gap-2">
              <Label className="text-xs">Brand Logo</Label>
              <div className="flex items-center gap-3">
                {/* 로고 미리보기 원형 영역 */}
                <div
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-blue-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {newLogo ? (
                    <img src={newLogo} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                {/* 숨겨진 파일 입력 요소 */}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setNewLogo)}
                />
                <div className="flex flex-col gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Upload
                  </Button>
                  {/* 로고가 있을 때만 제거 버튼 표시 */}
                  {newLogo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50 p-0"
                      onClick={() => {
                        setNewLogo(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* 지도 마커 이미지 업로드 */}
            <div className="grid gap-2">
              <Label className="text-xs">Map Marker Image</Label>
              <div className="flex items-center gap-3">
                {/* 마커 이미지 미리보기 원형 영역 */}
                <div
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-blue-400 transition-colors"
                  onClick={() => markerInputRef.current?.click()}
                >
                  {newMarkerImage ? (
                    <img src={newMarkerImage} alt="Marker" className="w-full h-full object-contain" />
                  ) : (
                    <MapPin className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                {/* 숨겨진 파일 입력 요소 */}
                <input
                  type="file"
                  ref={markerInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setNewMarkerImage)}
                />
                <div className="flex flex-col gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px]"
                    onClick={() => markerInputRef.current?.click()}
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Upload
                  </Button>
                  {/* 마커 이미지가 있을 때만 제거 버튼 표시 */}
                  {newMarkerImage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50 p-0"
                      onClick={() => {
                        setNewMarkerImage(null);
                        if (markerInputRef.current) markerInputRef.current.value = "";
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 저장/취소 버튼 */}
          <div className="flex gap-2">
            {/* 수정 모드일 때만 취소 버튼 표시 */}
            {isEditing && (
              <Button onClick={handleCancelEdit} variant="outline" className="flex-1 bg-white hover:bg-gray-100">
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSave}
              className={`flex-1 ${isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800'} text-white`}
            >
              {isEditing ? (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Update Brand
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Brand
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 현재 등록된 브랜드 목록 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Current Brands ({brands.length})</h3>
        <div className="grid gap-2">
          {brands.map((brand, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3 border rounded-md transition-all group ${
                editingIndex === idx
                  ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                  : 'bg-white border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* 브랜드 로고 원형 아이콘 */}
                <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                  {brand.logo ? (
                    <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                  ) : (
                    // 로고가 없으면 브랜드 이름의 첫 글자로 대체
                    <span className="text-xs font-bold text-gray-400">{brand.name[0]}</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className={`text-sm font-medium ${editingIndex === idx ? 'text-blue-700' : 'text-gray-700'}`}>
                    {brand.name}
                    {/* 수정 중인 항목에 표시 */}
                    {editingIndex === idx && <span className="ml-2 text-[10px] text-blue-500 font-normal">(Editing)</span>}
                  </span>
                  {/* 커스텀 지도 마커가 있을 때 표시 */}
                  {brand.markerImage && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden">
                        <img src={brand.markerImage} className="w-full h-full object-contain p-0.5" alt="Marker" />
                      </div>
                      <span className="text-[10px] text-green-600 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" /> Custom Marker
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 수정/삭제 버튼 — 항목에 호버할 때만 표시 */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() => handleEdit(idx)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
                  onClick={() => handleDelete(idx)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {/* 브랜드가 없을 때 안내 메시지 */}
          {brands.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-xs">
              No brands added yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
