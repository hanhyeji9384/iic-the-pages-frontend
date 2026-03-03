// ============================================================
// ScheduleView 컴포넌트 — 연간 일정 캘린더
// 행은 지역(ISSUE / 국가별), 열은 월(1월~12월)로 구성된 스케줄 보드입니다.
// 이벤트 추가/수정/삭제 기능이 포함되어 있으며,
// 이벤트 데이터는 Supabase 서버에 저장됩니다.
// ============================================================

import React, { useState, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Check,
  ChevronsUpDown,
  Loader2,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { dataClient } from "../../utils/dataClient";
import type { Store } from "../../types";
import { cn } from "../ui/utils";

// 일정 캘린더 뷰 컴포넌트
export const ScheduleView = () => {
  // 현재 보기 모드: "Yearly"(연간) 또는 "Monthly"(월간)
  const [viewMode, setViewMode] = useState<"Yearly" | "Monthly">("Yearly");
  // 현재 표시 중인 연도
  const [currentYear, setCurrentYear] = useState(2026);
  // 이벤트 추가 다이얼로그 열림 여부
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // 선택된 이벤트 색상
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  // 클릭하여 상세를 보고 있는 이벤트
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  // 매장 선택 관련 상태
  const [stores, setStores] = useState<Store[]>([]);               // 서버에서 불러온 매장 목록
  const [isLoadingStores, setIsLoadingStores] = useState(false);   // 매장 목록 로딩 중 여부
  const [openStoreCombobox, setOpenStoreCombobox] = useState(false); // 매장 검색 드롭다운 열림 여부
  const [selectedStoreName, setSelectedStoreName] = useState("");  // 선택된 매장명
  const [constructionStartDate, setConstructionStartDate] = useState(""); // 공사 착공일
  const [openDate, setOpenDate] = useState("");                    // 오픈일

  // 이벤트 추가 폼 상태
  const [title, setTitle] = useState("");                          // 일정 제목
  const [selectedRowHeaders, setSelectedRowHeaders] = useState<string[]>([]); // 선택된 지역 행
  const [openRowHeaderCombobox, setOpenRowHeaderCombobox] = useState(false); // 지역 선택 드롭다운 열림 여부
  const [selectedMonth, setSelectedMonth] = useState("");          // 선택된 월
  const [content, setContent] = useState("");                      // 내용

  // 이벤트 수정 상태
  const [isEditing, setIsEditing] = useState(false);               // 수정 모드 여부
  const [editTitle, setEditTitle] = useState("");                  // 수정 중인 제목
  const [editColor, setEditColor] = useState<string | null>(null); // 수정 중인 색상
  const [editRowHeader, setEditRowHeader] = useState("");          // 수정 중인 지역
  const [editMonth, setEditMonth] = useState("");                  // 수정 중인 월
  const [editStoreName, setEditStoreName] = useState("");          // 수정 중인 매장명
  const [editContent, setEditContent] = useState("");              // 수정 중인 내용
  const [editConstructionStartDate, setEditConstructionStartDate] = useState(""); // 수정 중인 착공일
  const [editOpenDate, setEditOpenDate] = useState("");            // 수정 중인 오픈일
  const [openEditStoreCombobox, setOpenEditStoreCombobox] = useState(false); // 수정 다이얼로그 매장 드롭다운

  // 컴포넌트가 처음 화면에 나타날 때 이벤트 목록을 불러옵니다.
  useEffect(() => {
    fetchEvents();
  }, []);

  // 서버에서 일정 이벤트를 가져오는 함수
  const fetchEvents = async () => {
    try {
      const dbEvents = await dataClient.getScheduleEvents();
      if (dbEvents && dbEvents.length > 0) {
        setEvents(dbEvents);
      } else {
        // 서버에 이벤트가 없으면 기본 예시 데이터로 초기화합니다.
        setEvents(DEFAULT_EVENTS);
        await dataClient.saveScheduleEvents(DEFAULT_EVENTS);
      }
    } catch (e) {
      console.error("Failed to fetch events", e);
      setEvents(DEFAULT_EVENTS);
    }
  };

  // 추가/수정 다이얼로그가 열릴 때 매장 목록을 서버에서 불러옵니다.
  useEffect(() => {
    if (isAddModalOpen || isEditing) {
      fetchStores();
    }
  }, [isAddModalOpen, isEditing]);

  // 서버에서 IIC 매장 목록을 가져오는 함수
  const fetchStores = async () => {
    setIsLoadingStores(true);
    try {
      const iicStores = await dataClient.getIICStores();
      setStores(iicStores);
    } catch (e) {
      console.error("Failed to fetch stores", e);
    } finally {
      setIsLoadingStores(false);
    }
  };

  // 더미 브랜드 데이터 (시각적 표시용)
  const brands = [
    { name: "GM", status: "Busy", color: "bg-blue-600" },
    { name: "TAM", status: "Partially Available", color: "bg-red-500" },
    { name: "NUD", status: "Available", color: "bg-green-500" },
    { name: "NUF", status: "Busy", color: "bg-orange-500" },
    { name: "ATS", status: "Available", color: "bg-purple-500" },
  ];

  // 이벤트 색상 옵션 목록
  const colorOptions = [
    { name: "Red", value: "bg-red-500", label: "Red" },
    { name: "Orange", value: "bg-orange-500", label: "Orange" },
    { name: "Yellow", value: "bg-yellow-500", label: "Yellow" },
    { name: "Green", value: "bg-green-500", label: "Green" },
    { name: "Emerald", value: "bg-emerald-500", label: "Emerald" },
    { name: "Blue", value: "bg-blue-500", label: "Blue" },
    { name: "Blue (Deep)", value: "bg-blue-600", label: "Blue (Dark)" },
    { name: "Purple", value: "bg-purple-500", label: "Purple" },
    { name: "Light Gray", value: "bg-gray-400", label: "Light Gray" },
  ];

  // 이벤트 목록 상태 — 서버에서 불러오거나 기본값으로 초기화됩니다.
  const [events, setEvents] = useState<any[]>([]);

  // 기본 예시 이벤트 데이터
  const DEFAULT_EVENTS = [
    {
      title: "Store Opening Delay",
      subtitle: "Permit Issues",
      content: "Permit Issues",
      storeName: "",
      time: "High Priority",
      month: "Jan",
      startRow: 0,
      rowSpan: 1,
      colIndex: 0,
      color: "bg-red-500",
      year: 2026,
    },
    {
      title: "Seoul Flagship",
      subtitle: "Grand Opening",
      content: "Grand Opening",
      storeName: "",
      time: "On Track",
      month: "Feb",
      startRow: 1,
      rowSpan: 1,
      colIndex: 1,
      color: "bg-blue-500",
      year: 2026,
    },
    {
      title: "Tokyo Pop-up",
      subtitle: "Design Phase",
      content: "Design Phase",
      storeName: "",
      time: "Reviewing",
      month: "Mar",
      startRow: 2,
      rowSpan: 1,
      colIndex: 2,
      color: "bg-emerald-500",
      year: 2026,
    },
    {
      title: "Shanghai Store",
      subtitle: "Construction",
      content: "Construction",
      storeName: "",
      time: "Delayed",
      month: "Apr",
      startRow: 3,
      rowSpan: 1,
      colIndex: 3,
      color: "bg-orange-500",
      year: 2026,
    },
    {
      title: "Bangkok Mall",
      subtitle: "Contract",
      content: "Contract",
      storeName: "",
      time: "Signed",
      month: "May",
      startRow: 4,
      rowSpan: 1,
      colIndex: 4,
      color: "bg-purple-500",
      year: 2026,
    },
    {
      title: "NY Flagship",
      subtitle: "Planning",
      content: "Planning",
      storeName: "",
      time: "Searching",
      month: "Jun",
      startRow: 5,
      rowSpan: 1,
      colIndex: 5,
      color: "bg-blue-500",
      year: 2026,
    },
    {
      title: "London Boutique",
      subtitle: "Design",
      content: "Design",
      storeName: "",
      time: "Approved",
      month: "Sep",
      startRow: 6,
      rowSpan: 1,
      colIndex: 8,
      color: "bg-emerald-500",
      year: 2026,
    },
    {
      title: "Dubai Mall",
      subtitle: "Proposal",
      content: "Proposal",
      storeName: "",
      time: "Pending",
      month: "Dec",
      startRow: 7,
      rowSpan: 1,
      colIndex: 11,
      color: "bg-yellow-500",
      year: 2026,
    },
    {
      title: "Melbourne Store",
      subtitle: "Market Research",
      content: "Market Research",
      storeName: "",
      time: "Planning",
      month: "Oct",
      startRow: 8,
      rowSpan: 1,
      colIndex: 9,
      color: "bg-blue-600",
      year: 2026,
    },
  ];

  // 캘린더 행 헤더 목록 (ISSUE + 지역별)
  const rowHeaders = [
    "ISSUE",
    "KOREA",
    "JAPAN",
    "CHINA",
    "S.E. ASIA",
    "U.S",
    "EUROPE",
    "MIDDLE EAST",
    "AUSTRALIA",
    "OTHERS",
  ];

  // 월 목록 (숫자 문자열 "1"~"12")
  const months = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

  // 새 이벤트 등록 처리 함수
  const handleRegister = async () => {
    // 필수 항목 검증
    if (!title || !selectedColor || selectedRowHeaders.length === 0 || !selectedMonth) {
      alert("필수 항목을 입력해주세요.");
      return;
    }

    // 월 번호를 0 기반 인덱스로 변환 (1월 → colIndex 0)
    const colIndex = parseInt(selectedMonth) - 1;
    const newEventsList: any[] = [];

    // 선택된 모든 행(지역)에 대해 이벤트를 생성합니다.
    selectedRowHeaders.forEach((header) => {
      const startRow = rowHeaders.indexOf(header);
      const newEvent = {
        title,
        subtitle: selectedStoreName || content || "No details",
        storeName: selectedStoreName,
        content: content,
        constructionStartDate: selectedStoreName ? constructionStartDate : "",
        openDate: selectedStoreName ? openDate : "",
        time: "Scheduled",
        month: selectedMonth,
        startRow,
        rowSpan: 1,
        colIndex,
        color: selectedColor,
        year: currentYear,
      };
      newEventsList.push(newEvent);
    });

    // 기존 이벤트 목록에 새 이벤트들을 추가합니다.
    const newEvents = [...events, ...newEventsList];
    setEvents(newEvents);
    setIsAddModalOpen(false);

    // 서버에 저장합니다.
    try {
      await dataClient.saveScheduleEvents(newEvents);
    } catch (e) {
      console.error("Failed to save event", e);
    }

    // 폼 초기화
    setTitle("");
    setSelectedColor(null);
    setSelectedRowHeaders([]);
    setSelectedMonth("");
    setSelectedStoreName("");
    setConstructionStartDate("");
    setOpenDate("");
    setContent("");
  };

  // 이벤트 삭제 처리 함수
  const handleDelete = async () => {
    if (!selectedEvent) return;

    if (window.confirm("정말 이 스케줄을 삭제하시겠습니까?")) {
      // 선택된 이벤트를 제외한 나머지 목록으로 업데이트
      const newEvents = events.filter((e) => e !== selectedEvent);
      setEvents(newEvents);
      setSelectedEvent(null);
      setIsEditing(false);

      // 서버에 변경사항 저장
      try {
        await dataClient.saveScheduleEvents(newEvents);
      } catch (e) {
        console.error("Failed to delete event", e);
      }
    }
  };

  // 이벤트 수정 다이얼로그를 여는 함수
  const handleEditClick = async () => {
    if (!selectedEvent) return;

    // 현재 이벤트 데이터를 수정 상태로 복사합니다.
    setEditTitle(selectedEvent.title);
    setEditColor(selectedEvent.color);
    setEditRowHeader(rowHeaders[selectedEvent.startRow]);
    setEditMonth(selectedEvent.month);

    // 매장 목록이 비어있으면 새로 불러옵니다.
    let currentStores = stores;
    if (currentStores.length === 0) {
      setIsLoadingStores(true);
      try {
        currentStores = await dataClient.getIICStores();
        setStores(currentStores);
      } catch (e) {
        console.error("Failed to fetch stores", e);
      } finally {
        setIsLoadingStores(false);
      }
    }

    const subtitle = selectedEvent.subtitle;
    // subtitle이 매장 표시명 형식("매장명 (브랜드)")과 일치하는 매장을 찾습니다.
    const matchedStore = currentStores.find((store) => {
      const displayName = `${store.name} (${store.brand})`;
      return displayName === subtitle;
    });

    if (matchedStore) {
      // 매장이 연결된 이벤트면 매장명과 날짜 정보를 복원합니다.
      setEditStoreName(subtitle);
      setEditContent(selectedEvent.content || "");
      setEditConstructionStartDate(selectedEvent.constructionStartDate || "");
      setEditOpenDate(selectedEvent.openDate || "");
    } else {
      // 매장이 없는 일반 이벤트
      setEditStoreName(selectedEvent.storeName || "");
      setEditContent(selectedEvent.content || (subtitle === "No details" ? "" : subtitle));
      setEditConstructionStartDate(selectedEvent.constructionStartDate || "");
      setEditOpenDate(selectedEvent.openDate || "");
    }

    setIsEditing(true);
  };

  // 이벤트 수정 저장 함수
  const handleUpdate = async () => {
    // 필수 항목 검증
    if (!selectedEvent || !editTitle || !editColor || !editRowHeader || !editMonth) {
      alert("필수 항목을 입력해주세요.");
      return;
    }

    const startRow = rowHeaders.indexOf(editRowHeader);
    const colIndex = parseInt(editMonth) - 1;

    // 수정된 이벤트 객체를 생성합니다.
    const updatedEvent = {
      ...selectedEvent,
      title: editTitle,
      subtitle: editStoreName || editContent || "No details",
      storeName: editStoreName,
      content: editContent,
      constructionStartDate: editStoreName ? editConstructionStartDate : "",
      openDate: editStoreName ? editOpenDate : "",
      month: editMonth,
      startRow,
      colIndex,
      color: editColor,
      year: selectedEvent.year || currentYear,
    };

    // 기존 이벤트 목록에서 수정된 이벤트로 교체합니다.
    const newEvents = events.map((e) => e === selectedEvent ? updatedEvent : e);
    setEvents(newEvents);
    setSelectedEvent(updatedEvent); // 상세 다이얼로그를 수정된 데이터로 업데이트
    setIsEditing(false);

    // 서버에 저장합니다.
    try {
      await dataClient.saveScheduleEvents(newEvents);
    } catch (e) {
      console.error("Failed to update event", e);
    }
  };

  return (
    <div className="flex h-full w-full bg-white font-sans">
      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* 상단 헤더 바 */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
          <div className="flex items-center gap-4">
            {/* 연도 변경 버튼 */}
            <div className="flex items-center bg-gray-50 rounded-md p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-sm hover:bg-white hover:shadow-sm"
                onClick={() => setCurrentYear((prev) => prev - 1)}
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </Button>
              <span className="text-sm font-medium px-4 text-gray-700">{currentYear}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-sm hover:bg-white hover:shadow-sm"
                onClick={() => setCurrentYear((prev) => prev + 1)}
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 이벤트 등록 버튼 */}
            <Button
              className="bg-slate-900 hover:bg-slate-800 text-white gap-2 h-9 text-xs"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              등록
            </Button>
          </div>
        </div>

        {/* 캘린더 그리드 — 행: 지역, 열: 월 */}
        <div className="flex-1 overflow-auto bg-white relative">
          <div className="w-full min-w-[800px]">
            {/* 헤더 행: 월 표시 (sticky로 스크롤 시 고정) */}
            <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10">
              {/* 좌측 행 헤더 공간 */}
              <div className="w-24 shrink-0 border-r border-gray-100 p-4 bg-white flex items-center justify-center">
                <span className="text-sm font-medium text-gray-400 text-center">DATE</span>
              </div>
              {/* 월 헤더 목록 */}
              {months.map((month) => (
                <div
                  key={month}
                  className="flex-1 p-4 border-r border-gray-100 min-w-0 overflow-hidden text-center flex items-center justify-center"
                >
                  <span className="text-sm font-medium text-gray-500 truncate block">{month}</span>
                </div>
              ))}
            </div>

            {/* 지역별 행 렌더링 */}
            {rowHeaders.map((header, rowIdx) => (
              <div
                key={header}
                className="flex border-b border-gray-100 min-h-[5rem]"
              >
                {/* 행 헤더 (지역명) */}
                <div className="w-24 shrink-0 border-r border-gray-100 p-4 flex items-center justify-center bg-gray-50/30">
                  <span
                    className={`text-sm font-semibold text-center ${rowIdx === 0 ? "text-red-500" : "text-gray-600"}`}
                  >
                    {header}
                  </span>
                </div>
                {/* 각 월 셀 */}
                {months.map((month, colIdx) => (
                  <div
                    key={`${month}-${header}`}
                    className="flex-1 border-r border-gray-100 min-w-0 p-1 flex flex-col gap-1"
                  >
                    {/* 해당 행/열에 맞는 이벤트를 찾아 렌더링합니다. */}
                    {events
                      .filter(
                        (e) =>
                          e.colIndex === colIdx &&
                          e.startRow === rowIdx &&
                          // 연도 필터: year가 없으면 2026년으로 간주
                          (e.year ? e.year === currentYear : currentYear === 2026),
                      )
                      .map((event, i) => (
                        <div
                          key={i}
                          onClick={() => setSelectedEvent(event)}
                          className="relative p-2 rounded-md shadow-sm cursor-pointer transition-all overflow-hidden group"
                        >
                          {/* 이벤트 색상 배경 — 호버 시 더 진해집니다. */}
                          <div
                            className={`absolute inset-0 ${event.color} opacity-20 group-hover:opacity-80 transition-opacity`}
                          />
                          {/* 이벤트 텍스트 */}
                          <div className="relative z-10">
                            <div className="text-sm font-bold mb-0.5 truncate text-black">
                              {event.title}
                            </div>
                            <div className="text-xs font-bold text-black opacity-100 truncate">
                              {event.subtitle}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 이벤트 추가 다이얼로그 */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-6 gap-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="w-5 h-5" />
              스케줄 등록
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* 일정 제목 입력 */}
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-sm font-medium">일정 제목 *</Label>
              <Input
                id="title"
                placeholder="일정 제목을 입력하세요"
                className="bg-gray-50 border-gray-200"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* 색상 선택 */}
            <div className="grid gap-2">
              <Label htmlFor="brand" className="text-sm font-medium">색상 *</Label>
              <Select value={selectedColor || ""} onValueChange={setSelectedColor}>
                <SelectTrigger className="bg-gray-50 border-gray-200">
                  <SelectValue placeholder="색상 선택" />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${c.value}`} />
                        <span>{c.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ISSUE & 국가 다중 선택 */}
            <div className="grid gap-2">
              <Label htmlFor="issue-country" className="text-sm font-medium">ISSUE & 국가 선택 *</Label>
              <Popover open={openRowHeaderCombobox} onOpenChange={setOpenRowHeaderCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openRowHeaderCombobox}
                    className="w-full justify-between bg-gray-50 border-gray-200 font-normal"
                  >
                    <span className="truncate">
                      {selectedRowHeaders.length > 0
                        ? selectedRowHeaders.join(", ")
                        : "ISSUE 또는 국가 선택"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[450px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="검색..." />
                    <CommandList>
                      <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                      <CommandGroup>
                        {rowHeaders.map((header) => {
                          const isSelected = selectedRowHeaders.includes(header);
                          return (
                            <CommandItem
                              key={header}
                              value={header}
                              onSelect={() => {
                                // 이미 선택된 항목이면 제거, 아니면 추가
                                setSelectedRowHeaders((prev) =>
                                  prev.includes(header)
                                    ? prev.filter((h) => h !== header)
                                    : [...prev, header],
                                );
                              }}
                            >
                              <div
                                className={cn(
                                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "opacity-50 [&_svg]:invisible",
                                )}
                              >
                                <Check className={cn("h-4 w-4")} />
                              </div>
                              {header}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* 월 선택 */}
            <div className="grid gap-2">
              <Label htmlFor="month" className="text-sm font-medium">월 *</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="bg-gray-50 border-gray-200 w-full">
                  <SelectValue placeholder="월 선택" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m} value={m}>{m}월</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 매장명 선택 (선택사항) */}
            <div className="grid gap-2">
              <Label htmlFor="storeName" className="text-sm font-medium">매장명</Label>
              <Popover open={openStoreCombobox} onOpenChange={setOpenStoreCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openStoreCombobox}
                    className="w-full justify-between bg-gray-50 border-gray-200 font-normal"
                  >
                    {selectedStoreName ? selectedStoreName : "매장명을 선택하세요..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[450px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="매장 검색..." />
                    <CommandList>
                      <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                      <CommandGroup>
                        {stores.map((store) => {
                          const displayName = `${store.name} (${store.brand})`;
                          return (
                            <CommandItem
                              key={store.id}
                              value={displayName}
                              onSelect={() => {
                                const newValue = selectedStoreName === displayName ? "" : displayName;
                                setSelectedStoreName(newValue);
                                // 매장 선택이 취소되면 날짜 정보도 초기화
                                if (!newValue) {
                                  setConstructionStartDate("");
                                  setOpenDate("");
                                }
                                setOpenStoreCombobox(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedStoreName === displayName ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {displayName}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* 매장이 선택된 경우에만 공사 착공일/오픈일 입력 필드 표시 */}
            {selectedStoreName && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="constructionStartDate" className="text-sm font-medium">공사 착공일</Label>
                  <Input
                    id="constructionStartDate"
                    type="date"
                    className="bg-gray-50 border-gray-200"
                    value={constructionStartDate}
                    onChange={(e) => setConstructionStartDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="openDate" className="text-sm font-medium">오픈일</Label>
                  <Input
                    id="openDate"
                    type="date"
                    className="bg-gray-50 border-gray-200"
                    value={openDate}
                    onChange={(e) => setOpenDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* 내용 입력 (여러 줄 텍스트) */}
            <div className="grid gap-2">
              <Label htmlFor="content" className="text-sm font-medium">내용</Label>
              <Textarea
                id="content"
                placeholder="상세 내용을 입력하세요..."
                className="min-h-[100px] bg-gray-50 border-gray-200"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          </div>

          {/* 다이얼로그 하단 버튼 */}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="h-10">취소</Button>
            <Button className="bg-slate-900 hover:bg-slate-800 text-white h-10 px-6" onClick={handleRegister}>
              등록하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 이벤트 상세보기 / 수정 다이얼로그 */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEvent(null);
            setIsEditing(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px] p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              {/* 수정 모드가 아닐 때만 색상 표시 */}
              {!isEditing && (
                <div className={`w-4 h-4 rounded-full ${selectedEvent?.color}`} />
              )}
              {isEditing ? "스케줄 수정" : selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>

          {/* 수정 모드: 편집 폼 표시 */}
          {isEditing ? (
            <div className="grid gap-4 py-2">
              {/* 제목 수정 */}
              <div className="grid gap-2">
                <Label htmlFor="edit-title" className="text-sm font-medium">일정 제목 *</Label>
                <Input
                  id="edit-title"
                  placeholder="일정 제목을 입력하세요"
                  className="bg-gray-50 border-gray-200"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              {/* 색상 수정 */}
              <div className="grid gap-2">
                <Label htmlFor="edit-brand" className="text-sm font-medium">색상 *</Label>
                <Select value={editColor || ""} onValueChange={setEditColor}>
                  <SelectTrigger className="bg-gray-50 border-gray-200">
                    <SelectValue placeholder="색상 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full ${c.value}`} />
                          <span>{c.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 지역 수정 (단일 선택으로 변경) */}
              <div className="grid gap-2">
                <Label htmlFor="edit-issue" className="text-sm font-medium">ISSUE & 국가 선택 *</Label>
                <Select value={editRowHeader} onValueChange={setEditRowHeader}>
                  <SelectTrigger className="bg-gray-50 border-gray-200">
                    <SelectValue placeholder="ISSUE 또는 국가 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {rowHeaders.map((header) => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 월 수정 */}
              <div className="grid gap-2">
                <Label htmlFor="edit-month" className="text-sm font-medium">월 *</Label>
                <Select value={editMonth} onValueChange={setEditMonth}>
                  <SelectTrigger className="bg-gray-50 border-gray-200 w-full">
                    <SelectValue placeholder="월 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m} value={m}>{m}월</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 매장명 수정 */}
              <div className="grid gap-2">
                <Label htmlFor="edit-storeName" className="text-sm font-medium">매장명</Label>
                <Popover open={openEditStoreCombobox} onOpenChange={setOpenEditStoreCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openEditStoreCombobox}
                      className="w-full justify-between bg-gray-50 border-gray-200 font-normal"
                    >
                      {editStoreName ? editStoreName : "매장명을 선택하세요..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[450px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="매장 검색..." />
                      <CommandList>
                        <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                        <CommandGroup>
                          {stores.map((store) => {
                            const displayName = `${store.name} (${store.brand})`;
                            return (
                              <CommandItem
                                key={store.id}
                                value={displayName}
                                onSelect={() => {
                                  const newValue = editStoreName === displayName ? "" : displayName;
                                  setEditStoreName(newValue);
                                  if (!newValue) {
                                    setEditConstructionStartDate("");
                                    setEditOpenDate("");
                                  }
                                  setOpenEditStoreCombobox(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    editStoreName === displayName ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                {displayName}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* 매장이 선택된 경우 착공일/오픈일 수정 필드 */}
              {editStoreName && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="editConstructionStartDate" className="text-sm font-medium">공사 착공일</Label>
                    <Input
                      id="editConstructionStartDate"
                      type="date"
                      className="bg-gray-50 border-gray-200"
                      value={editConstructionStartDate}
                      onChange={(e) => setEditConstructionStartDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="editOpenDate" className="text-sm font-medium">오픈일</Label>
                    <Input
                      id="editOpenDate"
                      type="date"
                      className="bg-gray-50 border-gray-200"
                      value={editOpenDate}
                      onChange={(e) => setEditOpenDate(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* 내용 수정 */}
              <div className="grid gap-2">
                <Label htmlFor="edit-content" className="text-sm font-medium">내용</Label>
                <Textarea
                  id="edit-content"
                  placeholder="상세 내용을 입력하세요..."
                  className="min-h-[100px] bg-gray-50 border-gray-200"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
              </div>
            </div>
          ) : (
            /* 상세보기 모드: 이벤트 정보 표시 */
            <div className="grid gap-6 py-4">
              {/* 매장명 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-sm font-medium text-gray-500">매장명</Label>
                <div className="col-span-3 text-sm font-medium text-gray-900">
                  {selectedEvent?.storeName || selectedEvent?.subtitle}
                </div>
              </div>

              {/* 공사 착공일 — 매장이 연결되고 착공일이 있을 때만 표시 */}
              {selectedEvent?.storeName && selectedEvent.constructionStartDate && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-sm font-medium text-gray-500">공사 착공일</Label>
                  <div className="col-span-3 text-sm text-gray-900">
                    {selectedEvent.constructionStartDate}
                  </div>
                </div>
              )}

              {/* 오픈일 — 매장이 연결되고 오픈일이 있을 때만 표시 */}
              {selectedEvent?.storeName && selectedEvent.openDate && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-sm font-medium text-gray-500">오픈일</Label>
                  <div className="col-span-3 text-sm text-gray-900">
                    {selectedEvent.openDate}
                  </div>
                </div>
              )}

              {/* 지역/행 정보 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-sm font-medium text-gray-500">국가</Label>
                <div className="col-span-3 text-sm text-gray-900">
                  {selectedEvent && rowHeaders[selectedEvent.startRow]}
                </div>
              </div>

              {/* 내용 */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right text-sm font-medium text-gray-500 pt-1">내용</Label>
                <div className="col-span-3 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {selectedEvent?.content}
                </div>
              </div>
            </div>
          )}

          {/* 다이얼로그 하단 버튼 */}
          <DialogFooter className="flex sm:justify-between gap-2">
            {!isEditing ? (
              <>
                {/* 상세보기 모드: 삭제 / 수정 / 닫기 버튼 */}
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="destructive" onClick={handleDelete} className="w-full sm:w-auto">
                    삭제
                  </Button>
                </div>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <Button variant="outline" onClick={handleEditClick} className="w-full sm:w-auto">
                    수정
                  </Button>
                  <Button
                    className="bg-slate-900 hover:bg-slate-800 text-white w-full sm:w-auto"
                    onClick={() => setSelectedEvent(null)}
                  >
                    닫기
                  </Button>
                </div>
              </>
            ) : (
              /* 수정 모드: 취소 / 저장 버튼 */
              <div className="flex w-full justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)} className="h-10">취소</Button>
                <Button className="bg-slate-900 hover:bg-slate-800 text-white h-10 px-6" onClick={handleUpdate}>
                  저장
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
