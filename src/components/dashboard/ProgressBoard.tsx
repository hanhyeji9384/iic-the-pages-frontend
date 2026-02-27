// ============================================================
// ProgressBoard - 파이프라인 진행 현황 보드
// 브랜드별/국가별 매장 확장 목표 대비 실적을 시각화합니다.
// 레퍼런스 프로젝트(PB_1080)의 디자인과 완전히 동일하게 구현되었습니다.
// ============================================================

import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Cell,
  LabelList,
} from 'recharts';
import { Store, getStoreClass } from '../../types';
import {
  ChevronDown,
  Calendar,
  Database,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Target,
  Save,
  Plus,
  Trash2,
  Globe,
  Building2,
  Check,
} from 'lucide-react';
import { motion } from 'motion/react';

// ============================================================
// 타입 정의
// ============================================================

interface ProgressBoardProps {
  stores: Store[];
  onNavigateToStoreInfo?: (status?: string, brand?: string) => void;
  onNavigateToStoreDetail?: (store: Store) => void;
  onNavigateToPipelineList?: (
    status: string,
    brand?: string,
    context?: { years?: number[]; country?: string; storeClass?: string }
  ) => void;
  onNavigateToExpansion?: (status?: string, brand?: string) => void;
}

interface GoalEntry {
  id: string;
  year: number;
  country: string;
  brand: string;
  target: number;
}

// ============================================================
// 상수 정의
// ============================================================

// IIC 브랜드 목록 (전체 이름)
const BRAND_LIST = [
  'Gentle Monster',
  'Tamburins',
  'Nudake',
  'Atiissu',
  'Nuflaat',
];

// 브랜드별 색상 (차트/배지에 사용)
const BRAND_COLORS = [
  '#C5DFF8', // Gentle Monster - 연파랑
  '#9694FF', // Tamburins - 보라
  '#EE99C2', // Nudake - 핑크
  '#0EA5E9', // Atiissu - 하늘색
  '#7FC7D9', // Nuflaat - 청록
];

// 파이프라인 상태별 색상
const PIPELINE_COLORS = {
  Planned: '#64748B',
  Confirmed: '#6347D1',
  Signed: '#EE99C2',
  Construction: '#7FC7D9',
  Open: '#10B981',
};

// 브랜드 약칭 목록
const BRANDS = ['All Brands', 'GM', 'TAM', 'NUD', 'ATS', 'NUF'];

// 국가/지역 목록 (한국어)
const COUNTRIES = [
  'All Countries',
  '한국',
  '일본',
  '중국',
  '동남아',
  '미주',
  '유럽',
  '중동',
  '호주',
  '기타',
];

// 매장 분류 목록
const CLASSES = ['All Classes', 'Type-based', 'Standalone'];

// 목표 설정에 사용할 브랜드 약칭 선택지
const BRANDS_SELECT = ['Gentle Monster', 'Tamburins', 'Nudake', 'Atiissu', 'Nuflaat'];

// 목표 설정에 사용할 국가 선택지
const COUNTRIES_SELECT = ['한국', '일본', '중국', '동남아', '미주', '유럽', '중동', '호주', '기타'];

// ============================================================
// 목표 설정 모달 컴포넌트
// ============================================================

const GoalModal = ({ isOpen, onClose, onSave, currentGoals }: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goals: GoalEntry[]) => void;
  currentGoals: GoalEntry[];
}) => {
  const [goals, setGoals] = useState<GoalEntry[]>([]);
  const nowYear = new Date().getFullYear();

  // 일괄 입력 상태
  const [batchYear, setBatchYear] = useState(nowYear);
  const [batchCountry, setBatchCountry] = useState('한국');
  const [brandTargets, setBrandTargets] = useState<Record<string, number>>({
    GM: 0, TAM: 0, NUD: 0, NUF: 0, ATS: 0,
  });

  // 브랜드 약칭 → 전체 이름 매핑
  const BRAND_MAP_REVERSE: Record<string, string> = {
    GM: 'Gentle Monster',
    TAM: 'Tamburins',
    NUD: 'Nudake',
    NUF: 'Nuflaat',
    ATS: 'Atiissu',
  };

  // 외부에서 받은 목표 데이터로 초기화
  React.useEffect(() => {
    if (Array.isArray(currentGoals)) {
      setGoals(currentGoals);
    } else {
      setGoals([]);
    }
  }, [currentGoals, isOpen]);

  if (!isOpen) return null;

  // 그리드에 입력된 데이터를 목표 리스트에 추가
  const handleAddBatch = () => {
    const newEntries: GoalEntry[] = Object.entries(brandTargets)
      .filter(([_, target]) => target > 0)
      .map(([shortBrand, target]) => ({
        id: `goal-${Date.now()}-${shortBrand}`,
        year: batchYear,
        country: batchCountry,
        brand: BRAND_MAP_REVERSE[shortBrand],
        target: target,
      }));

    if (newEntries.length === 0) return;

    // 기존 목표가 있으면 업데이트, 없으면 추가
    const updatedGoals = [...goals];
    newEntries.forEach((newG) => {
      const idx = updatedGoals.findIndex(
        (g) => g.year === newG.year && g.country === newG.country && g.brand === newG.brand
      );
      if (idx > -1) {
        updatedGoals[idx] = newG;
      } else {
        updatedGoals.push(newG);
      }
    });

    setGoals(updatedGoals);
    setBrandTargets({ GM: 0, TAM: 0, NUD: 0, NUF: 0, ATS: 0 });
  };

  const handleSave = () => {
    onSave(goals);
    onClose();
  };

  const YEARS_LIST = Array.from({ length: 16 }, (_, i) => nowYear - 5 + i);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-xl border border-slate-200">
        {/* 모달 헤더 */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
              <Target className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Set Expansion Goals</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                연도별/브랜드별 목표 매장 수를 일괄 입력하고 관리하세요
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-full transition-colors group"
          >
            <X className="w-6 h-6 text-slate-300 group-hover:text-slate-600 transition-colors" />
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          {/* 일괄 입력 그리드 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center">
                <Plus className="w-3 h-3 mr-2" />
                Batch Entry Grid
              </h3>
            </div>

            <div className="border border-slate-200 overflow-hidden rounded-xl shadow-sm">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  {/* 연도 & 국가 입력 행 */}
                  <tr className="border-b border-slate-200">
                    <td className="w-32 bg-slate-50/80 border-r border-slate-200 p-4 text-center font-bold text-slate-600">
                      연도
                    </td>
                    <td className="border-r border-slate-200 p-0">
                      <select
                        value={batchYear}
                        onChange={(e) => setBatchYear(parseInt(e.target.value))}
                        className="w-full h-full p-4 font-bold text-slate-900 outline-none appearance-none cursor-pointer hover:bg-slate-50/50 transition-colors"
                      >
                        {YEARS_LIST.map((y) => (
                          <option key={y} value={y}>{y}년</option>
                        ))}
                      </select>
                    </td>
                    <td className="w-32 bg-slate-50/80 border-r border-slate-200 p-4 text-center font-bold text-slate-600">
                      나라
                    </td>
                    <td className="p-0" colSpan={4}>
                      <select
                        value={batchCountry}
                        onChange={(e) => setBatchCountry(e.target.value)}
                        className="w-full h-full p-4 font-bold text-slate-900 outline-none appearance-none cursor-pointer hover:bg-slate-50/50 transition-colors"
                      >
                        {COUNTRIES_SELECT.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {/* 브랜드 헤더 행 */}
                  <tr className="border-b border-slate-200">
                    <td className="bg-slate-50/80 border-r border-slate-200 p-4 text-center font-bold text-slate-600">
                      브랜드
                    </td>
                    {['GM', 'TAM', 'NUD', 'NUF', 'ATS'].map((b, i) => (
                      <td
                        key={b}
                        className={`border-r border-slate-200 p-4 text-center font-bold text-slate-700 bg-white ${i === 4 ? 'border-r-0' : ''}`}
                      >
                        {b}
                      </td>
                    ))}
                  </tr>
                  {/* 목표 매장수 입력 행 */}
                  <tr>
                    <td className="bg-slate-50/80 border-r border-slate-200 p-4 text-center font-bold text-slate-600 whitespace-nowrap">
                      목표 매장수
                    </td>
                    {['GM', 'TAM', 'NUD', 'NUF', 'ATS'].map((b, i) => (
                      <td key={b} className={`p-0 ${i === 4 ? '' : 'border-r border-slate-200'}`}>
                        <input
                          type="number"
                          value={brandTargets[b] || ''}
                          onChange={(e) =>
                            setBrandTargets({ ...brandTargets, [b]: parseInt(e.target.value) || 0 })
                          }
                          placeholder="0"
                          className="w-full h-full p-4 font-bold text-slate-900 text-center outline-none focus:bg-blue-50/30 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-slate-200"
                        />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 리스트에 추가 버튼 */}
            <button
              onClick={handleAddBatch}
              className="w-full py-4 bg-slate-900 text-white text-[13px] font-bold rounded-xl shadow-md hover:bg-slate-800 transition-all flex items-center justify-center space-x-2 active:scale-[0.99] border border-slate-900"
            >
              <Plus className="w-4 h-4" />
              <span>그리드 데이터 리스트에 추가</span>
            </button>
          </div>

          {/* 등록된 목표 목록 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center">
                <Target className="w-3 h-3 mr-2" />
                Registered Goals Grid ({goals.length})
              </h3>
            </div>

            <div className="border border-slate-200 overflow-hidden rounded-xl shadow-sm bg-white">
              {goals.length === 0 ? (
                <div className="py-12 text-center bg-slate-50/50">
                  <div className="bg-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <Database className="w-5 h-5 text-slate-300" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">
                    등록된 목표가 없습니다. 상단 그리드에서 입력 후 추가 버튼을 눌러주세요.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[13px]">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200">
                        <th className="p-4 text-center font-bold text-slate-600 border-r border-slate-200">
                          연도 - 국가
                        </th>
                        {['GM', 'TAM', 'NUD', 'NUF', 'ATS'].map((b) => (
                          <th key={b} className="p-4 text-center font-bold text-slate-600 border-r border-slate-200 last:border-r-0">
                            {b}
                          </th>
                        ))}
                        <th className="p-4 text-center font-bold text-slate-600 w-16">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // 연도+국가로 그룹화
                        const grouped: Record<string, {
                          year: number;
                          country: string;
                          targets: Record<string, number>;
                          ids: string[];
                        }> = {};
                        const brandMapFullToShort: Record<string, string> = {
                          'Gentle Monster': 'GM',
                          'Tamburins': 'TAM',
                          'Nudake': 'NUD',
                          'Nuflaat': 'NUF',
                          'Atiissu': 'ATS',
                        };

                        goals.forEach((g) => {
                          const key = `${g.year}-${g.country}`;
                          if (!grouped[key]) {
                            grouped[key] = { year: g.year, country: g.country, targets: {}, ids: [] };
                          }
                          const shortBrand = brandMapFullToShort[g.brand] || g.brand;
                          grouped[key].targets[shortBrand] = g.target;
                          grouped[key].ids.push(g.id);
                        });

                        return Object.values(grouped)
                          .sort((a, b) => b.year - a.year || a.country.localeCompare(b.country))
                          .map((group) => (
                            <tr
                              key={`${group.year}-${group.country}`}
                              className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/30 transition-colors"
                            >
                              <td className="p-4 text-center font-bold text-slate-900 border-r border-slate-100 bg-slate-50/20">
                                {group.year}년 - {group.country}
                              </td>
                              {['GM', 'TAM', 'NUD', 'NUF', 'ATS'].map((b) => (
                                <td key={b} className="p-4 text-center font-bold text-blue-600 border-r border-slate-100 last:border-r-0">
                                  {group.targets[b] || '-'}
                                </td>
                              ))}
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => {
                                    const idsToRemove = new Set(group.ids);
                                    setGoals(goals.filter((g) => !idsToRemove.has(g.id)));
                                  }}
                                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ));
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 모달 하단 버튼 */}
        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-[13px] font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl transition-all shadow-sm active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-[2] py-4 bg-blue-600 text-white text-[13px] font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>최종 설정 저장</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 요약 카드 컴포넌트 (파이프라인 상태 카드)
// ============================================================

interface SummaryCardProps {
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
  bgColor?: string;
  textColor?: string;
  barColor?: string;
  onClick?: () => void;
}

function SummaryCard({
  title,
  value,
  trend,
  isPositive,
  bgColor = 'bg-white',
  textColor = 'text-slate-800',
  barColor,
  onClick,
}: SummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`p-7 rounded-[1.5rem] border border-slate-100 ${bgColor} flex flex-col h-40 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''}`}
    >
      {/* 왼쪽 색상 바 */}
      {barColor && (
        <div className={`absolute top-0 left-0 w-1.5 h-full ${barColor}`} />
      )}
      {/* 제목 */}
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
        {title}
      </p>
      {/* 값 */}
      <p className="text-5xl font-black tracking-tighter text-slate-900 leading-none">
        {value}
      </p>
    </motion.div>
  );
}

// ============================================================
// 국가 이름 → 한국어 지역명 변환 매핑
// ============================================================
const COUNTRY_MAP_REVERSE: Record<string, string> = {
  'South Korea': '한국', 'Korea': '한국', 'Republic of Korea': '한국',
  'USA': '미주', 'United States': '미주', 'Canada': '미주', 'Mexico': '미주', 'America': '미주',
  'UK': '유럽', 'United Kingdom': '유럽', 'France': '유럽', 'Germany': '유럽',
  'Italy': '유럽', 'Spain': '유럽', 'Europe': '유럽',
  'UAE': '중동', 'Saudi Arabia': '중동', 'Qatar': '중동', 'Middle East': '중동',
  'Singapore': '동남아', 'Thailand': '동남아', 'Vietnam': '동남아',
  'Malaysia': '동남아', 'Indonesia': '동남아', 'Philippines': '동남아',
  'China': '중국', 'Hong Kong': '중국', 'Taiwan': '중국', 'Macau': '중국',
  'Japan': '일본',
  'Australia': '호주', 'New Zealand': '호주',
};

// ============================================================
// 메인 ProgressBoard 컴포넌트
// ============================================================

export function ProgressBoard({
  stores,
  onNavigateToStoreInfo,
  onNavigateToStoreDetail,
  onNavigateToPipelineList,
  onNavigateToExpansion,
}: ProgressBoardProps) {
  // 필터 상태
  const [selectedBrand, setSelectedBrand] = useState('All Brands');
  const [selectedYears, setSelectedYears] = useState<number[]>([new Date().getFullYear()]);
  const [selectedCountry, setSelectedCountry] = useState('All Countries');
  const [selectedClass, setSelectedClass] = useState('All Classes');

  // 목표 설정 상태
  const [goals, setGoals] = useState<GoalEntry[]>([]);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // 드롭다운 열림 상태
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  // 연도 목록 생성 (현재 기준 -5 ~ +10)
  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 16 }, (_, i) => currentYear - 5 + i);

  // 정렬된 연도 목록
  const allExpansionYears = useMemo(() => {
    return [...selectedYears].sort((a, b) => a - b);
  }, [selectedYears]);

  // ──────────────────────────────────────────────────────────
  // 커스텀 드롭다운 셀렉트 컴포넌트
  // ──────────────────────────────────────────────────────────
  const CustomSelect = ({
    label,
    value,
    options,
    onChange,
    icon: Icon,
    id,
    minWidth = '200px',
    multiple = false,
  }: {
    label: string;
    value: string | number[];
    options: (string | number)[];
    onChange: (val: any) => void;
    icon: React.ElementType;
    id: string;
    minWidth?: string;
    multiple?: boolean;
  }) => {
    const isOpen = openFilter === id;
    const toggle = () => setOpenFilter(isOpen ? null : id);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    // 연도 셀렉트 열릴 때 선택된 항목으로 스크롤
    React.useEffect(() => {
      if (isOpen && scrollRef.current && id === 'year') {
        const selectedElement = scrollRef.current.querySelector('[data-selected="true"]');
        if (selectedElement) {
          (selectedElement as HTMLElement).scrollIntoView({ block: 'center' });
        }
      }
    }, [isOpen, id]);

    return (
      <div className="flex flex-col space-y-2 relative">
        {/* 레이블 */}
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">
          {label}
        </label>
        {/* 셀렉트 박스 */}
        <div
          onClick={toggle}
          className={`relative flex items-center bg-white rounded-full px-8 py-3.5 shadow-sm border ${
            isOpen ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-100'
          } hover:border-slate-200 transition-all cursor-pointer`}
          style={{ minWidth }}
        >
          <span className="font-bold text-sm text-slate-900 flex-1">
            {multiple && Array.isArray(value)
              ? value.length > 1
                ? `${value.length} Years`
                : value[0]
              : value}
          </span>
          <Icon
            className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
              isOpen && Icon === ChevronDown ? 'rotate-180' : ''
            }`}
          />
        </div>

        {/* 드롭다운 목록 */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setOpenFilter(null)} />
            <motion.div
              ref={scrollRef}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-[1.5rem] shadow-2xl border border-slate-100 py-3 z-[70] overflow-y-auto max-h-60"
              style={{ minWidth }}
            >
              {options.map((opt) => {
                const isSelected =
                  multiple && Array.isArray(value)
                    ? value.includes(opt as number)
                    : value.toString() === opt.toString();

                return (
                  <div
                    key={opt}
                    data-selected={isSelected}
                    onClick={() => {
                      if (multiple) {
                        const current = Array.isArray(value) ? value : [];
                        const newValue = current.includes(opt as number)
                          ? current.filter((v) => v !== opt)
                          : [...current, opt as number].sort((a, b) => (a as number) - (b as number));
                        if ((newValue as number[]).length > 0) onChange(newValue);
                      } else {
                        onChange(opt);
                        setOpenFilter(null);
                      }
                    }}
                    className={`px-8 py-3 text-sm font-bold transition-all cursor-pointer flex items-center justify-between ${
                      isSelected ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && <Check className="w-4 h-4" />}
                  </div>
                );
              })}
            </motion.div>
          </>
        )}
      </div>
    );
  };

  // ──────────────────────────────────────────────────────────
  // 데이터 필터링: 브랜드/국가/분류 기준 IIC 매장 목록
  // ──────────────────────────────────────────────────────────
  const baseIicStores = useMemo(() => {
    const brandMap: Record<string, string> = {
      GM: 'Gentle Monster', TAM: 'Tamburins', NUD: 'Nudake', ATS: 'Atiissu', NUF: 'Nuflaat',
    };

    return stores.filter((s) => {
      // IIC 브랜드인지 확인
      const isIIC =
        s.brandCategory === 'iic' ||
        BRAND_LIST.some((b) => (s.brand || '').toLowerCase().includes(b.toLowerCase()));
      if (!isIIC) return false;

      // Reject/Pending 상태 제외
      if (s.status === 'Reject' || s.status === 'Pending') return false;

      // 브랜드 필터 적용
      if (selectedBrand !== 'All Brands') {
        const targetBrand = brandMap[selectedBrand] || selectedBrand;
        const sBrand = (s.brand || '').toLowerCase();
        const matches =
          sBrand.includes(targetBrand.toLowerCase()) ||
          sBrand.includes(selectedBrand.toLowerCase());
        if (!matches) return false;
      }

      // 국가 필터 적용
      if (selectedCountry !== 'All Countries') {
        const region = COUNTRY_MAP_REVERSE[s.location?.country || ''] || '기타';
        if (region !== selectedCountry) return false;
      }

      // 매장 분류 필터 적용
      if (selectedClass !== 'All Classes') {
        const storeClass = getStoreClass(s.type);
        if (storeClass !== selectedClass) return false;
      }

      return true;
    });
  }, [stores, selectedBrand, selectedCountry, selectedClass]);

  // 선택된 연도에 오픈된 매장 (차트 1용)
  const iicStores = useMemo(() => {
    return baseIicStores.filter((s) => {
      const isOpen = s.status === 'Open';
      const dateStr = s.ChangOpenDate || s.openDate;
      const openYear = dateStr ? new Date(dateStr).getFullYear() : null;
      return isOpen && openYear && selectedYears.includes(openYear);
    });
  }, [baseIicStores, selectedYears]);

  // ──────────────────────────────────────────────────────────
  // 통계 집계 (요약 카드 데이터)
  // ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const checkYear = (s: Store) => {
      const dateStr = s.openDate || s.contract?.startDate;
      if (!dateStr) return false;
      const year = new Date(dateStr).getFullYear();
      return selectedYears.includes(year);
    };

    const counts = {
      Planned: baseIicStores.filter(
        (s) => (s.status === 'Plan' || s.status === 'Planned') && checkYear(s)
      ).length,
      Confirmed: baseIicStores.filter(
        (s) => (s.status === 'Confirm' || s.status === 'Confirmed') && checkYear(s)
      ).length,
      Signed: baseIicStores.filter(
        (s) => (s.status === 'Contract' || s.status === 'Signed') && checkYear(s)
      ).length,
      Construction: baseIicStores.filter(
        (s) => (s.status === 'Space' || s.status === 'Construction') && checkYear(s)
      ).length,
      Open: iicStores.length,
    };

    const totalSales = iicStores.reduce(
      (acc, s) => acc + (s.financial?.monthlySales || 0), 0
    );
    const totalRent = iicStores.reduce(
      (acc, s) => acc + (s.financial?.monthlyRent || 0), 0
    );
    const totalArea = iicStores.reduce((acc, s) => acc + (s.area || 0), 0);
    const storeCount = iicStores.length;

    return {
      totalSales: Math.round(totalSales / 10000),
      totalRent: Math.round(totalRent / 10000),
      totalArea: Math.round(totalArea),
      storeCount,
      counts,
    };
  }, [iicStores, baseIicStores, selectedYears]);

  // ──────────────────────────────────────────────────────────
  // 차트 1: 연도별 목표 vs 실제 (적층 바 차트)
  // ──────────────────────────────────────────────────────────
  const targetVsOpenTrend = useMemo(() => {
    const years = allExpansionYears;
    const brandMapShortToFull: Record<string, string> = {
      GM: 'Gentle Monster', TAM: 'Tamburins', NUD: 'Nudake', ATS: 'Atiissu', NUF: 'Nuflaat',
    };

    const getYearFromStr = (dateStr: string | undefined) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d.getFullYear();
    };

    return years.map((year) => {
      const contextStores = baseIicStores;

      // 이전에 오픈된 매장 (현재 연도 제외)
      const openPrevList = contextStores.filter((s) => {
        if (s.status !== 'Open') return false;
        const openYear =
          getYearFromStr(s.ChangOpenDate || s.openDate) || (s as any).statusYear;
        return openYear !== null && openYear !== year;
      });

      // 해당 연도에 오픈된 매장
      const openCurrList = contextStores.filter((s) => {
        if (s.status !== 'Open') return false;
        const openYear =
          getYearFromStr(s.ChangOpenDate || s.openDate) || (s as any).statusYear;
        return openYear === year;
      });

      // 해당 연도 공사 중 매장
      const constructionList = contextStores.filter((s) => {
        if (s.status !== 'Space' && s.status !== 'Construction') return false;
        const targetYear = getYearFromStr(s.openDate) || (s as any).statusYear;
        return targetYear === year;
      });

      // 해당 연도 계약 완료 매장
      const signedList = contextStores.filter((s) => {
        if (s.status !== 'Contract' && s.status !== 'Signed') return false;
        const targetYear = getYearFromStr(s.openDate) || (s as any).statusYear;
        return targetYear === year;
      });

      // 해당 연도 목표값
      const yearGoal = goals
        .filter((g) => {
          const isYearMatch = g.year === year;
          const isCountryMatch =
            selectedCountry === 'All Countries' || g.country === selectedCountry;
          let isBrandMatch = true;
          if (selectedBrand !== 'All Brands') {
            const targetBrand = brandMapShortToFull[selectedBrand];
            isBrandMatch = g.brand === targetBrand;
          }
          return isYearMatch && isCountryMatch && isBrandMatch;
        })
        .reduce((acc, g) => acc + g.target, 0);

      const targetSum = (yearGoal || 5) + openPrevList.length;

      return {
        name: `${year}`,
        Target: yearGoal || 5,
        TargetTotal: targetSum,
        OpenPrev: openPrevList.length,
        OpenPrevStores: openPrevList,
        OpenCurr: openCurrList.length,
        OpenCurrStores: openCurrList,
        Construction: constructionList.length,
        ConstructionStores: constructionList,
        Signed: signedList.length,
        SignedStores: signedList,
        TotalActual:
          openPrevList.length + openCurrList.length + constructionList.length + signedList.length,
      };
    });
  }, [baseIicStores, goals, selectedBrand, selectedCountry, selectedYears, allExpansionYears]);

  // 연도 수에 따른 바 크기 동적 계산
  const dynamicBarSize = useMemo(() => {
    const count = allExpansionYears.length;
    if (count <= 1) return 320;
    if (count <= 2) return 240;
    if (count <= 3) return 180;
    if (count <= 5) return 120;
    if (count <= 8) return 80;
    return 60;
  }, [allExpansionYears]);

  // 바 크기에 따른 내부 레이블 폰트 크기
  const innerLabelSizeClass = useMemo(() => {
    if (dynamicBarSize < 100) return 'text-[10px]';
    if (dynamicBarSize < 140) return 'text-[13px]';
    return 'text-[18px]';
  }, [dynamicBarSize]);

  // ──────────────────────────────────────────────────────────
  // 차트 2: 국가별 확장 현황 (복합 차트)
  // ──────────────────────────────────────────────────────────
  const expansionByCountry = useMemo(() => {
    const displayCountries = COUNTRIES.filter((c) => c !== 'All Countries');
    const brandMapShortToFull: Record<string, string> = {
      GM: 'Gentle Monster', TAM: 'Tamburins', NUD: 'Nudake', ATS: 'Atiissu', NUF: 'Nuflaat',
    };

    return displayCountries.map((country) => {
      // 해당 국가의 오픈 매장
      const openStoresList = iicStores.filter((s) => {
        const region = COUNTRY_MAP_REVERSE[s.location?.country || ''] || '기타';
        if (region !== country) return false;
        const dateStr = s.ChangOpenDate || s.openDate;
        const openYear = dateStr ? new Date(dateStr).getFullYear() : null;
        return s.status === 'Open' && openYear && selectedYears.includes(openYear);
      });

      // 해당 국가의 목표값
      const countryGoals = goals
        .filter((g) => {
          const isCountryMatch = g.country === country;
          const isYearMatch = selectedYears.includes(g.year);
          let isBrandMatch = true;
          if (selectedBrand !== 'All Brands') {
            const targetBrand = brandMapShortToFull[selectedBrand];
            isBrandMatch = g.brand === targetBrand;
          }
          return isCountryMatch && isYearMatch && isBrandMatch;
        })
        .reduce((acc, g) => acc + g.target, 0);

      const openCount = openStoresList.length;
      const targetCount = countryGoals > 0 ? countryGoals : 0;
      const remaining = Math.max(0, targetCount - openCount);
      const progress = targetCount > 0 ? Math.round((openCount / targetCount) * 100) : 0;

      return {
        name: country,
        Open: openCount,
        OpenStores: openStoresList,
        Remaining: remaining,
        Total: targetCount,
        progress,
        progressLabel: `${progress}%`,
        order: displayCountries.indexOf(country),
      };
    }).sort((a, b) => a.order - b.order);
  }, [iicStores, goals, selectedBrand, selectedYears]);

  // ──────────────────────────────────────────────────────────
  // 국가별 상태 매트릭스 데이터
  // ──────────────────────────────────────────────────────────
  const statusGridData = useMemo(() => {
    const displayCountries = COUNTRIES.filter((c) => c !== 'All Countries');

    const normalizeStatusLocal = (status: string) => {
      const s = (status || '').toLowerCase();
      if (s === 'open') return 'Open';
      if (s === 'space' || s === 'construction') return 'Construction';
      if (s === 'contract' || s === 'signed') return 'Signed';
      if (s === 'confirm' || s === 'confirmed' || s === 'negotiation') return 'Confirmed';
      if (s === 'plan' || s === 'planed' || s === 'planned') return 'Planned';
      return 'ETC';
    };

    return displayCountries.map((country) => {
      const yearStores = baseIicStores.filter((s) => {
        const region = COUNTRY_MAP_REVERSE[s.location?.country || ''] || '기타';
        if (region !== country) return false;
        const dateStr = s.status === 'Open' ? (s.ChangOpenDate || s.openDate) : s.openDate;
        const year = dateStr ? new Date(dateStr).getFullYear() : null;
        return year && selectedYears.includes(year);
      });

      const openStores = yearStores.filter((s) => normalizeStatusLocal(s.status) === 'Open');
      const constructionStores = yearStores.filter((s) => normalizeStatusLocal(s.status) === 'Construction');
      const signedStores = yearStores.filter((s) => normalizeStatusLocal(s.status) === 'Signed');
      const confirmedStores = yearStores.filter((s) => normalizeStatusLocal(s.status) === 'Confirmed');
      const planedStores = yearStores.filter((s) => normalizeStatusLocal(s.status) === 'Planned');

      return {
        country,
        Open: openStores.length,
        OpenStores: openStores,
        Construction: constructionStores.length,
        ConstructionStores: constructionStores,
        Signed: signedStores.length,
        SignedStores: signedStores,
        Confirmed: confirmedStores.length,
        ConfirmedStores: confirmedStores,
        Planned: planedStores.length,
        PlannedStores: planedStores,
        Total: yearStores.length,
        order: displayCountries.indexOf(country),
      };
    }).sort((a, b) => a.order - b.order);
  }, [baseIicStores, selectedYears]);

  // ──────────────────────────────────────────────────────────
  // 브랜드별 오픈 현황 (상단 카드 행)
  // ──────────────────────────────────────────────────────────
  const brandOpenStats = useMemo(() => {
    const brands = ['GM', 'TAM', 'NUD', 'ATS', 'NUF'];
    const brandMap: Record<string, string> = {
      GM: 'Gentle Monster', TAM: 'Tamburins', NUD: 'Nudake', ATS: 'Atiissu', NUF: 'Nuflaat',
    };

    const countryOnlyStores = stores.filter((s) => {
      const isIIC =
        s.brandCategory === 'iic' ||
        BRAND_LIST.some((b) => (s.brand || '').toLowerCase().includes(b.toLowerCase()));
      if (!isIIC) return false;

      if (selectedCountry !== 'All Countries') {
        const region = COUNTRY_MAP_REVERSE[s.location?.country || ''] || '기타';
        if (region !== selectedCountry) return false;
      }

      if (selectedClass !== 'All Classes') {
        const storeClass = getStoreClass(s.type);
        if (storeClass !== selectedClass) return false;
      }

      return true;
    });

    return brands.map((b) => {
      const fullName = brandMap[b];
      const openStores = countryOnlyStores.filter((s) => {
        const sBrand = (s.brand || '').toLowerCase();
        const matches =
          sBrand.includes(fullName.toLowerCase()) || sBrand.includes(b.toLowerCase());
        return s.status === 'Open' && matches;
      });

      const count = openStores.length;
      const thisYear = new Date().getFullYear();
      const newThisYear = openStores.filter((s) => {
        const dateStr = s.ChangOpenDate || s.openDate;
        const openYear = dateStr ? new Date(dateStr).getFullYear() : null;
        return openYear === thisYear;
      }).length;

      return { brand: b, fullName, count, trend: `+${newThisYear}`, isPositive: true };
    });
  }, [stores, selectedCountry, selectedClass]);

  // 필터와 함께 PipelineList로 이동하는 헬퍼 함수
  const handleNavigateWithContext = (status: string) => {
    const brandMap: Record<string, string> = {
      GM: 'Gentle Monster', TAM: 'Tamburins', NUD: 'Nudake', ATS: 'Atiissu', NUF: 'Nuflaat',
    };
    const fullBrand =
      selectedBrand === 'All Brands' ? undefined : brandMap[selectedBrand] || selectedBrand;
    onNavigateToPipelineList?.(status, fullBrand, {
      years: selectedYears.length > 0 ? selectedYears : undefined,
      country: selectedCountry !== 'All Countries' ? selectedCountry : undefined,
      storeClass: selectedClass !== 'All Classes' ? selectedClass : undefined,
    });
  };

  // ──────────────────────────────────────────────────────────
  // 렌더링
  // ──────────────────────────────────────────────────────────

  return (
    <div className="flex-1 bg-[#F5F5F5] min-h-full overflow-auto">
      <div className="min-w-[1200px] max-w-[2200px] mx-auto pt-14 px-12 pb-24 space-y-8">

        {/* ───── 필터 행 ───── */}
        <div className="flex items-end space-x-6">
          <CustomSelect
            label="Brand"
            value={selectedBrand}
            options={BRANDS}
            onChange={setSelectedBrand}
            icon={ChevronDown}
            id="brand"
            minWidth="180px"
          />

          <CustomSelect
            label="Analysis Year"
            value={selectedYears}
            options={YEARS}
            onChange={(val: any) => {
              if (Array.isArray(val)) {
                setSelectedYears(val.map(Number));
              } else {
                setSelectedYears([Number(val)]);
              }
            }}
            icon={Calendar}
            id="year"
            minWidth="160px"
            multiple={true}
          />

          <CustomSelect
            label="Country"
            value={selectedCountry}
            options={COUNTRIES}
            onChange={setSelectedCountry}
            icon={ChevronDown}
            id="country"
            minWidth="200px"
          />

          <CustomSelect
            label="Class"
            value={selectedClass}
            options={CLASSES}
            onChange={setSelectedClass}
            icon={ChevronDown}
            id="class"
            minWidth="180px"
          />

          <div className="flex-1" />

          {/* 목표 설정 버튼 */}
          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="flex items-center justify-center bg-white hover:bg-slate-50 w-12 h-12 rounded-full text-slate-900 transition-all border border-slate-100 shadow-sm"
            title="Set Goals"
          >
            <Database className="w-5 h-5" />
          </button>
        </div>

        {/* 목표 설정 모달 */}
        <GoalModal
          isOpen={isGoalModalOpen}
          onClose={() => setIsGoalModalOpen(false)}
          onSave={(newGoals) => {
            setGoals(newGoals);
          }}
          currentGoals={goals}
        />

        {/* ───── 브랜드별 오픈 현황 카드 행 ───── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {brandOpenStats.map((stat) => {
            const isActive =
              selectedBrand === 'All Brands' || stat.brand === selectedBrand;
            return (
              <div
                key={stat.brand}
                className={`transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-20'}`}
              >
                <SummaryCard
                  title={stat.brand}
                  value={`${stat.count}`}
                  trend={stat.trend}
                  isPositive={stat.isPositive}
                  bgColor="bg-white"
                  textColor="text-slate-900"
                  onClick={() => onNavigateToExpansion?.('Open', stat.fullName)}
                />
              </div>
            );
          })}
        </div>

        {/* ───── 파이프라인 상태별 요약 카드 행 ───── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <SummaryCard
            title="Open"
            value={`${stats.counts.Open}`}
            trend="+5"
            isPositive={true}
            bgColor="bg-white"
            textColor="text-slate-900"
            barColor="bg-[#7FC7D9]"
          />
          <SummaryCard
            title="Construction"
            value={`${stats.counts.Construction}`}
            trend="+3"
            isPositive={true}
            bgColor="bg-white"
            textColor="text-slate-900"
            barColor="bg-sky-500"
            onClick={() => handleNavigateWithContext('Construction')}
          />
          <SummaryCard
            title="Signed"
            value={`${stats.counts.Signed}`}
            trend="-1"
            isPositive={false}
            bgColor="bg-white"
            textColor="text-slate-900"
            barColor="bg-cyan-500"
            onClick={() => handleNavigateWithContext('Signed')}
          />
          <SummaryCard
            title="Confirmed"
            value={`${stats.counts.Confirmed}`}
            trend="+1"
            isPositive={true}
            bgColor="bg-white"
            textColor="text-slate-900"
            barColor="bg-[#c084fc]"
            onClick={() => handleNavigateWithContext('Confirmed')}
          />
          <SummaryCard
            title="Planned"
            value={`${stats.counts.Planned}`}
            trend="+2"
            isPositive={true}
            bgColor="bg-white"
            textColor="text-slate-900"
            barColor="bg-slate-400"
            onClick={() => handleNavigateWithContext('Planned')}
          />
        </div>

        {/* ───── 차트 섹션 ───── */}
        <div className="space-y-6">

          {/* 차트 1: Store Expansion Goals (연도별 목표 vs 실적) */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
            <div className="flex flex-col space-y-2 mb-2 px-2">
              <div className="flex items-center justify-between">
                <h3 className="text-4xl font-black text-slate-900 tracking-tight">
                  Store Expansion Goals
                </h3>
                {/* 범례 */}
                <div className="flex items-center space-x-8">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-[#38BDF8]" />
                    <span className="text-slate-400 font-black text-xs uppercase tracking-wider">Open</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-[#BAE6FD]" />
                    <span className="text-slate-400 font-black text-xs uppercase tracking-wider">Construction</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-[#F1F5F9] border border-slate-200" />
                    <span className="text-slate-400 font-black text-xs uppercase tracking-wider">Signed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-[#E2E8F0]" />
                    <span className="text-slate-400 font-black text-xs uppercase tracking-wider">Growth Target</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-[550px] w-full mt-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  key={allExpansionYears.join(',')}
                  data={targetVsOpenTrend}
                  margin={{ top: 100, right: 30, left: 30, bottom: 60 }}
                  barGap={12}
                >
                  <CartesianGrid vertical={false} stroke="#F1F5F9" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: '#94a3b8',
                      fontSize: allExpansionYears.length > 5 ? 14 : 16,
                      fontWeight: 700,
                    }}
                    dy={20}
                  />
                  <YAxis hide domain={[0, 'auto']} />

                  {/* 툴팁: 연도 클릭 시 상세 정보 표시 */}
                  <RechartsTooltip
                    cursor={{ fill: '#F8FAFC' }}
                    allowEscapeViewBox={{ x: true, y: true }}
                    position={{ y: 0 }}
                    wrapperStyle={{ outline: 'none', zIndex: 1000, pointerEvents: 'auto' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const renderStoreList = (stores: any[]) => {
                          if (!stores || stores.length === 0) return null;
                          return (
                            <div className="bg-slate-50 rounded-lg p-3 mt-2 max-h-40 overflow-y-auto border border-slate-100">
                              {stores.map((s: any) => (
                                <div
                                  key={s.id}
                                  className="text-xs font-medium text-slate-600 mb-1 last:mb-0 cursor-pointer hover:text-blue-600 hover:bg-blue-50 px-1 py-0.5 rounded transition-colors"
                                  onClick={() => onNavigateToStoreDetail?.(s)}
                                >
                                  {COUNTRY_MAP_REVERSE[s.location?.country] || s.location?.country || '기타'} / {s.name}
                                </div>
                              ))}
                            </div>
                          );
                        };

                        return (
                          <div
                            className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-50 min-w-[320px] max-w-[400px] relative z-50"
                            style={{ transform: 'translate(-50%, 0)' }}
                          >
                            <div className="space-y-6">
                              <div className="flex flex-col space-y-2">
                                <div className="flex justify-between items-center text-slate-600">
                                  <span className="font-medium text-lg">{data.name} OPEN</span>
                                  <span className="font-bold text-xl">{data.OpenCurr}</span>
                                </div>
                                {renderStoreList(data.OpenCurrStores)}
                              </div>
                              <div className="flex flex-col space-y-2">
                                <div className="flex justify-between items-center text-slate-600">
                                  <span className="font-medium text-lg">CONSTRUCTION</span>
                                  <span className="font-bold text-xl">{data.Construction}</span>
                                </div>
                                {renderStoreList(data.ConstructionStores)}
                              </div>
                              <div className="flex flex-col space-y-2">
                                <div className="flex justify-between items-center text-slate-600">
                                  <span className="font-medium text-lg">SIGNED</span>
                                  <span className="font-bold text-xl">{data.Signed}</span>
                                </div>
                                {renderStoreList(data.SignedStores)}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {/* 목표 바 (회색) */}
                  <Bar
                    dataKey="TargetTotal"
                    stackId="target"
                    fill="#E2E8F0"
                    barSize={dynamicBarSize}
                    radius={[8, 8, 0, 0]}
                  >
                    <LabelList
                      dataKey="Target"
                      content={(props: any) => {
                        const { x, y, width, height, value } = props;
                        return (
                          <g>
                            <text
                              x={x + width / 2}
                              y={y + height / 2 - 20}
                              fill="#64748B"
                              textAnchor="middle"
                              className={`font-black uppercase tracking-widest ${
                                dynamicBarSize < 120 ? 'text-[10px]' : 'text-[20px]'
                              }`}
                            >
                              TARGET
                            </text>
                            <text
                              x={x + width / 2}
                              y={y + height / 2 + 35}
                              fill="#1E293B"
                              textAnchor="middle"
                              className={`font-black ${
                                dynamicBarSize < 100
                                  ? 'text-3xl'
                                  : dynamicBarSize < 150
                                  ? 'text-4xl'
                                  : 'text-6xl'
                              }`}
                            >
                              {value}
                            </text>
                          </g>
                        );
                      }}
                    />
                  </Bar>

                  {/* 실제 오픈 바 (파란색) */}
                  <Bar
                    dataKey="OpenCurr"
                    stackId="actual"
                    fill="#38BDF8"
                    barSize={dynamicBarSize}
                    radius={[0, 0, 0, 0]}
                  >
                    <LabelList
                      dataKey="OpenCurr"
                      content={(props: any) => {
                        const { x, y, width, height, value, index } = props;
                        if (!value || height < 30) return null;
                        const year = targetVsOpenTrend[index]?.name || '';
                        return (
                          <text
                            x={x + width / 2}
                            y={y + height / 2}
                            fill="#FFFFFF"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className={`${innerLabelSizeClass} font-black`}
                          >
                            {year} OPEN ({value})
                          </text>
                        );
                      }}
                    />
                  </Bar>

                  {/* 공사 중 바 (연파란색) */}
                  <Bar
                    dataKey="Construction"
                    stackId="actual"
                    fill="#BAE6FD"
                    barSize={dynamicBarSize}
                    radius={[0, 0, 0, 0]}
                  >
                    <LabelList
                      dataKey="Construction"
                      content={(props: any) => {
                        const { x, y, width, height, value } = props;
                        if (!value || height < 30) return null;
                        return (
                          <text
                            x={x + width / 2}
                            y={y + height / 2}
                            fill="#0369A1"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className={`${innerLabelSizeClass} font-black`}
                          >
                            CONSTRUCTION ({value})
                          </text>
                        );
                      }}
                    />
                  </Bar>

                  {/* 계약 완료 바 (연회색) */}
                  <Bar
                    dataKey="Signed"
                    stackId="actual"
                    fill="#F1F5F9"
                    barSize={dynamicBarSize}
                    radius={[8, 8, 0, 0]}
                  >
                    <LabelList
                      dataKey="Signed"
                      content={(props: any) => {
                        const { x, y, width, height, value } = props;
                        if (!value || height < 30) return null;
                        return (
                          <text
                            x={x + width / 2}
                            y={y + height / 2}
                            fill="#64748B"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className={`${innerLabelSizeClass} font-black`}
                          >
                            SIGNED ({value})
                          </text>
                        );
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 차트 2: Expansion by Country (국가별 확장 현황) */}
          <div className="bg-white border border-slate-100 rounded-[3rem] p-12 shadow-sm">
            <div className="flex items-baseline justify-between mb-12 px-4">
              <h3 className="text-4xl font-black text-slate-900 tracking-tight">
                Expansion by Country
              </h3>
              {/* 범례 */}
              <div className="flex items-center space-x-12">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded-full bg-[#7FC7D9]" />
                  <span className="text-slate-400 font-black text-xs uppercase tracking-[0.2em]">Open</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded-full bg-slate-300" />
                  <span className="text-slate-400 font-black text-xs uppercase tracking-[0.2em]">Target Gap</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-1 bg-blue-600 rounded-full" />
                  <span className="text-slate-400 font-black text-xs uppercase tracking-[0.2em]">Progress (%)</span>
                </div>
              </div>
            </div>

            <div className="h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={expansionByCountry}
                  margin={{ top: 100, right: 60, left: 20, bottom: 60 }}
                >
                  <CartesianGrid vertical={false} stroke="#F1F5F9" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 18, fontWeight: 700 }}
                    dy={25}
                  />
                  <YAxis yAxisId="left" hide />
                  <YAxis yAxisId="right" orientation="right" hide domain={[0, 100]} />

                  <RechartsTooltip
                    cursor={{ fill: '#F8FAFC' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-6 rounded-xl shadow-xl border border-slate-50 min-w-[280px]">
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-4">
                              {data.name}
                            </p>
                            <div className="space-y-4">
                              <div className="flex flex-col space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-slate-500 text-base">Open</span>
                                  <span className="font-black text-2xl text-slate-900">{data.Open}</span>
                                </div>
                                {data.OpenStores && data.OpenStores.length > 0 && (
                                  <div className="bg-slate-50 rounded-lg p-3 max-h-40 overflow-y-auto border border-slate-100">
                                    {data.OpenStores.map((s: any) => (
                                      <div
                                        key={s.id}
                                        className="text-xs font-medium text-slate-600 mb-1 last:mb-0 cursor-pointer hover:text-blue-600 hover:bg-blue-50 px-1 py-0.5 rounded transition-colors"
                                        onClick={() => onNavigateToStoreDetail?.(s)}
                                      >
                                        {data.name} / {s.name}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-500 text-base">Target</span>
                                <span className="font-black text-2xl text-slate-400">{data.Total}</span>
                              </div>
                              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                                <span className="font-bold text-slate-900 text-sm uppercase tracking-wider">Progress</span>
                                <span className="font-black text-2xl text-blue-600">{data.progressLabel}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {/* 오픈 매장 바 */}
                  <Bar yAxisId="left" dataKey="Open" stackId="country" fill="#7FC7D9" barSize={50} radius={[0, 0, 0, 0]}>
                    <LabelList
                      dataKey="Open"
                      position="center"
                      content={(props: any) => {
                        const { x, y, width, height, value } = props;
                        if (!value || value === 0) return null;
                        return (
                          <text x={x + width / 2} y={y + height / 2} fill="#FFFFFF" textAnchor="middle" dominantBaseline="middle" className="text-3xl font-black">
                            {value}
                          </text>
                        );
                      }}
                    />
                  </Bar>

                  {/* 목표 미달성 바 (회색) */}
                  <Bar yAxisId="left" dataKey="Remaining" stackId="country" fill="#CBD5E1" barSize={50} radius={[4, 4, 0, 0]}>
                    <LabelList
                      dataKey="Total"
                      position="top"
                      content={(props: any) => {
                        const { x, y, width, value } = props;
                        if (!value || value === 0) return null;
                        return (
                          <text x={x + width / 2} y={y - 45} fill="#000000" textAnchor="middle" className="text-4xl font-black">
                            {value}
                          </text>
                        );
                      }}
                    />
                  </Bar>

                  {/* 진행률 라인 차트 */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="progress"
                    stroke="#2563EB"
                    strokeWidth={2}
                    dot={{ fill: '#2563EB', r: 4, strokeWidth: 2, stroke: '#FFFFFF' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  >
                    <LabelList
                      dataKey="progressLabel"
                      position="top"
                      content={(props: any) => {
                        const { x, y, value } = props;
                        if (!value || value === '0%') return null;
                        return (
                          <g>
                            <text x={x} y={y - 20} stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="#FFFFFF" textAnchor="middle" className="text-3xl font-black">
                              {value}
                            </text>
                            <text x={x} y={y - 20} fill="#2563EB" textAnchor="middle" className="text-3xl font-black">
                              {value}
                            </text>
                          </g>
                        );
                      }}
                    />
                  </Line>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ───── 국가별 상태 매트릭스 테이블 ───── */}
          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-baseline justify-between mb-4 px-2">
              <div>
                <h3 className="text-[21px] font-bold text-slate-900">
                  {selectedYears.join(', ')} Expansion Status Matrix
                </h3>
              </div>
              <div className="text-right">
                <span className="text-slate-400 font-semibold text-[15px]">Unit: Stores</span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="py-3 px-2 text-center text-slate-500 font-bold text-[19px] border border-slate-200 w-[14.28%]">Country</th>
                    <th className="py-3 px-2 text-center text-slate-500 font-bold text-[19px] border border-slate-200 w-[14.28%]">Target</th>
                    <th className="py-3 px-2 text-center text-emerald-600 font-bold text-[19px] bg-emerald-50/30 border border-slate-200 w-[14.28%]">Open</th>
                    <th className="py-3 px-2 text-center text-blue-600 font-bold text-[19px] border border-slate-200 w-[14.28%]">Construction</th>
                    <th className="py-3 px-2 text-center text-pink-600 font-bold text-[19px] border border-slate-200 w-[14.28%]">Signed</th>
                    <th className="py-3 px-2 text-center text-indigo-600 font-bold text-[19px] border border-slate-200 w-[14.28%]">Confirmed</th>
                    <th className="py-3 px-2 text-center text-slate-500 font-bold text-[19px] border border-slate-200 w-[14.28%]">Planned</th>
                  </tr>
                </thead>
                <tbody>
                  {statusGridData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400 font-medium text-xl border border-slate-200">
                        No expansion data for {selectedYears.join(', ')}
                      </td>
                    </tr>
                  ) : (
                    statusGridData.map((row) => {
                      // 해당 국가의 목표값 계산
                      const countryGoal = goals
                        .filter((g) => {
                          const isCountryMatch = g.country === row.country;
                          const isYearMatch = selectedYears.includes(g.year);
                          let isBrandMatch = true;
                          if (selectedBrand !== 'All Brands') {
                            const brandMap: Record<string, string> = {
                              GM: 'Gentle Monster', TAM: 'Tamburins', NUD: 'Nudake',
                              ATS: 'Atiissu', NUF: 'Nuflaat',
                            };
                            isBrandMatch = g.brand === (brandMap[selectedBrand] || selectedBrand);
                          }
                          return isCountryMatch && isYearMatch && isBrandMatch;
                        })
                        .reduce((acc, g) => acc + g.target, 0);

                      // 달성률 계산 헬퍼
                      const getPct = (val: number) =>
                        countryGoal > 0 ? Math.round((val / countryGoal) * 100) : 0;

                      return (
                        <tr
                          key={row.country}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          {/* 국가명 */}
                          <td className="py-3 px-2 text-center border border-slate-200">
                            <span className="text-[21px] font-bold text-slate-800">{row.country}</span>
                          </td>
                          {/* 목표 */}
                          <td className="py-3 px-2 text-center border border-slate-200">
                            <span className="text-[23px] font-bold text-slate-400">{countryGoal}</span>
                          </td>
                          {/* Open */}
                          <td className="py-3 px-2 text-center bg-emerald-50/10 border border-slate-200">
                            <div
                              className="flex flex-col items-center justify-center cursor-pointer"
                              title={row.OpenStores.map((s) => s.name).join(', ')}
                              onClick={() => {
                                if (row.OpenStores.length > 0) {
                                  onNavigateToStoreDetail?.(row.OpenStores[0]);
                                }
                              }}
                            >
                              <span className={`text-[23px] font-bold ${row.Open > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                                {row.Open}
                              </span>
                              <span className={`text-[13px] font-semibold mt-0.5 ${row.Open > 0 ? 'text-emerald-600/70' : 'text-slate-300/50'}`}>
                                ({getPct(row.Open)}%)
                              </span>
                            </div>
                          </td>
                          {/* Construction */}
                          <td className="py-3 px-2 text-center border border-slate-200">
                            <div className="flex flex-col items-center">
                              <span className={`text-[23px] font-bold ${row.Construction > 0 ? 'text-blue-600' : 'text-slate-300'}`}>
                                {row.Construction}
                              </span>
                            </div>
                          </td>
                          {/* Signed */}
                          <td className="py-3 px-2 text-center border border-slate-200">
                            <div className="flex flex-col items-center">
                              <span className={`text-[23px] font-bold ${row.Signed > 0 ? 'text-pink-600' : 'text-slate-300'}`}>
                                {row.Signed}
                              </span>
                            </div>
                          </td>
                          {/* Confirmed */}
                          <td className="py-3 px-2 text-center border border-slate-200">
                            <div className="flex flex-col items-center">
                              <span className={`text-[23px] font-bold ${row.Confirmed > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>
                                {row.Confirmed}
                              </span>
                            </div>
                          </td>
                          {/* Planned */}
                          <td className="py-3 px-2 text-center border border-slate-200">
                            <div className="flex flex-col items-center">
                              <span className={`text-[23px] font-bold ${row.Planned > 0 ? 'text-slate-500' : 'text-slate-300'}`}>
                                {row.Planned}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {/* 합계 행 */}
                {statusGridData.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50/50 border-t border-slate-100 font-bold">
                      <td className="py-3 px-2 text-center rounded-bl-xl border border-slate-200">
                        <span className="text-slate-700 text-[21px] uppercase tracking-wide">Total</span>
                      </td>
                      <td className="py-3 px-2 text-center border border-slate-200">
                        {(() => {
                          const totalGoal = goals
                            .filter((g) => {
                              const isYearMatch = selectedYears.includes(g.year);
                              let isBrandMatch = true;
                              if (selectedBrand !== 'All Brands') {
                                const brandMap: Record<string, string> = {
                                  GM: 'Gentle Monster', TAM: 'Tamburins', NUD: 'Nudake',
                                  ATS: 'Atiissu', NUF: 'Nuflaat',
                                };
                                isBrandMatch = g.brand === (brandMap[selectedBrand] || selectedBrand);
                              }
                              return isYearMatch && isBrandMatch;
                            })
                            .reduce((acc, g) => acc + g.target, 0);
                          return (
                            <span className="text-blue-600 text-[23px] font-bold">{totalGoal}</span>
                          );
                        })()}
                      </td>
                      {/* 열별 합계 */}
                      {['Open', 'Construction', 'Signed', 'Confirmed', 'Planned'].map((key, idx) => {
                        const total = statusGridData.reduce((acc, row) => acc + (row as any)[key], 0);
                        const colorMap: Record<string, string> = {
                          Open: 'text-emerald-600',
                          Construction: 'text-blue-600',
                          Signed: 'text-pink-600',
                          Confirmed: 'text-indigo-600',
                          Planned: 'text-slate-500',
                        };
                        return (
                          <td
                            key={key}
                            className={`py-3 px-2 text-center border border-slate-200 ${idx === 0 ? 'bg-emerald-50/10' : ''} ${idx === 4 ? 'rounded-br-xl' : ''}`}
                          >
                            <div className="flex flex-col items-center">
                              <span className={`text-[23px] font-bold ${total > 0 ? colorMap[key] : 'text-slate-300'}`}>
                                {total}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* 하단 여백 */}
        <div className="pt-12 flex justify-between items-center opacity-30" />
      </div>
    </div>
  );
}
