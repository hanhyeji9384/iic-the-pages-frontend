import React, { useState, useMemo, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Store } from "../../types";
import { dataClient } from "../../utils/supabaseDataClient";
import { toast } from "sonner";
import { X, Target, Save, Plus, Trash2, Globe, Building2, Calendar } from "lucide-react";

interface ProgressViewProps {
  stores: Store[];
}

interface GoalEntry {
  id: string;
  year: number;
  country: string;
  brand: string;
  target: number;
}

const BRANDS = ["Gentle Monster", "Tamburins", "Nudake", "Atiissu", "Nuflaat"];
const COUNTRIES = ["한국", "중국", "일본", "미주", "유럽", "중동", "동남아", "기타"];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => currentYear + i);

const TRAJECTORY_DATA = [
  { name: "Jan", actual: 120, forecast: 120 },
  { name: "Feb", actual: 125, forecast: 125 },
  { name: "Mar", actual: 132, forecast: 132 },
  { name: "Apr", actual: 138, forecast: 138 },
  { name: "May", actual: 143, forecast: 143 },
  { name: "Jun", actual: 146, forecast: 146 },
  { name: "Jul", actual: 148, forecast: 148 },
  { name: "Aug", actual: 150, forecast: 150 },
  { name: "Sep", actual: 152, forecast: 152 },
  { name: "Oct", actual: 154, forecast: 154 },
  { name: "Nov", actual: null, forecast: 165 },
  { name: "Dec", actual: null, forecast: 180 },
];

const GoalModal = ({ isOpen, onClose, onSave, currentGoals }: any) => {
  const [goals, setGoals] = useState<GoalEntry[]>([]);
  const nowYear = new Date().getFullYear();
  const [newGoal, setNewGoal] = useState<Partial<GoalEntry>>({
    year: nowYear,
    country: "한국",
    brand: "Gentle Monster",
    target: 10
  });

  useEffect(() => {
    if (Array.isArray(currentGoals)) {
      setGoals(currentGoals);
    } else if (currentGoals && typeof currentGoals === 'object' && !Array.isArray(currentGoals)) {
        setGoals([]);
    }
  }, [currentGoals, isOpen]);

  if (!isOpen) return null;

  const handleAddGoal = () => {
    const entry: GoalEntry = {
      id: `goal-${Date.now()}`,
      year: newGoal.year || nowYear,
      country: newGoal.country || "한국",
      brand: newGoal.brand || "Gentle Monster",
      target: newGoal.target || 0
    };
    setGoals([...goals, entry]);
    toast.success("목표가 리스트에 추가되었습니다.");
  };

  const handleRemoveGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const handleSave = () => {
    onSave(goals);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-10 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
              <Target className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Set Expansion Goals</h2>
              <p className="text-sm text-slate-400 font-bold mt-1">매장 확장 목표를 설정하고 진척도를 관리하세요</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-8 h-8 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-12">
          {/* Input Form */}
          <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 space-y-8">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>새로운 목표 추가</span>
            </h3>
            <div className="grid grid-cols-4 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">연도</label>
                <div className="relative">
                   <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <select 
                     value={newGoal.year}
                     onChange={(e) => setNewGoal({...newGoal, year: parseInt(e.target.value)})}
                     className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none appearance-none"
                   >
                     {YEARS.map(y => <option key={y} value={y}>{y}년</option>)}
                   </select>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">나라</label>
                <div className="relative">
                   <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <select 
                     value={newGoal.country}
                     onChange={(e) => setNewGoal({...newGoal, country: e.target.value})}
                     className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none appearance-none"
                   >
                     {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">브랜드</label>
                <div className="relative">
                   <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <select 
                     value={newGoal.brand}
                     onChange={(e) => setNewGoal({...newGoal, brand: e.target.value})}
                     className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none appearance-none"
                   >
                     {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                   </select>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">목표 매장 수</label>
                <input 
                  type="number" 
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({...newGoal, target: parseInt(e.target.value)})}
                  className="w-full bg-white border border-slate-200 rounded-xl px-6 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
                  placeholder="0"
                />
              </div>
            </div>
            <button 
              onClick={handleAddGoal}
              className="w-full py-4 bg-slate-900 text-white text-xs font-black rounded-2xl shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>목표 리스트에 추가</span>
            </button>
          </div>

          {/* Goals List */}
          <div className="space-y-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center justify-between">
              <span>설정된 목표 목록 ({goals.length})</span>
            </h3>
            <div className="space-y-3">
              {goals.length === 0 ? (
                <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-400 font-bold">등록된 목표가 없습니다. 위 양식에서 추가해주세요.</p>
                </div>
              ) : (
                goals.map((goal) => (
                  <div key={goal.id} className="flex items-center justify-between bg-white border border-gray-100 p-6 rounded-2xl hover:shadow-md transition-all group">
                    <div className="flex items-center space-x-12">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Year</span>
                        <span className="text-base font-black text-slate-900">{goal.year}년</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Country</span>
                        <span className="text-base font-black text-slate-900">{goal.country}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Brand</span>
                        <span className="text-base font-black text-slate-900">{goal.brand}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target</span>
                        <span className="text-base font-black text-slate-900">{goal.target} Stores</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveGoal(goal.id)}
                      className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-10 border-t border-gray-100 bg-gray-50 flex space-x-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 text-sm font-bold text-slate-500 hover:text-slate-900 bg-white border border-gray-200 rounded-2xl transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="flex-2 py-4 bg-slate-900 text-white text-sm font-black rounded-2xl shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>최종 설정 저장</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const CircularProgress = ({
  size = 200,
  strokeWidth = 2,
  percentage = 0,
  label = "",
  count = "",
  total = "",
}: any) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset =
    circumference - (percentage / 100) * circumference;

  return (
    <div
      className="flex flex-col items-center justify-center relative"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F3F4F6"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#0F172A"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] uppercase text-slate-400 font-bold tracking-[0.2em] mb-4">
          {label}
        </span>
        <div className="flex flex-col items-center justify-center">
          <span className="text-7xl font-black text-slate-900 leading-none tracking-tighter">
            {count}
          </span>
          <div className="h-[2px] w-8 bg-slate-200 my-3"></div>
          <span className="text-lg text-slate-400 font-bold tracking-tight">
            / {total}
          </span>
        </div>
        <div className="mt-6 px-4 py-1.5 bg-slate-900 rounded-full shadow-lg">
          <span className="text-[10px] font-black text-white tracking-wider">
            {percentage}%
          </span>
        </div>
      </div>
    </div>
  );
};

export const ProgressView: React.FC<ProgressViewProps> = ({
  stores,
}) => {
  const [goals, setGoals] = useState<GoalEntry[]>([]);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("All");

  useEffect(() => {
    const loadGoals = async () => {
      const saved = await dataClient.getGoals();
      if (Array.isArray(saved)) {
        setGoals(saved);
      }
    };
    loadGoals();
  }, []);

  const handleSaveGoals = async (newGoals: GoalEntry[]) => {
    try {
      await dataClient.saveGoals(newGoals);
      setGoals(newGoals);
      toast.success("설정된 모든 목표가 저장되었습니다.");
    } catch (e) {
      toast.error("저장에 실패했습니다.");
    }
  };

  const iicBrands = ["gentle monster", "tamburins", "nudake", "atiissu", "nuflaat"];
  
  const isIICBrand = (brand: string | undefined) => {
    if (!brand) return false;
    const normalized = brand.toLowerCase().trim();
    return iicBrands.some(b => normalized.includes(b));
  };

  const iicStores = useMemo(() => {
    return stores.filter(s => s.brandCategory === 'iic' || isIICBrand(s.brand));
  }, [stores]);

  const brandMapping: Record<string, string> = {
    'GM': 'gentle monster',
    'TB': 'tamburins',
    'ND': 'nudake',
    'NF': 'nuflaat',
    'AT': 'atiissu'
  };

  // Logic to calculate progress against specific goals
  const activeStats = useMemo(() => {
    // Status counts
    const openStores = iicStores.filter(s => s.status === 'Open').length;
    const closeStores = iicStores.filter(s => s.status === 'Close').length;
    
    // Yearly activity (using new tracking fields)
    const currentYearStr = new Date().getFullYear().toString();
    const openedThisYear = iicStores.filter(s => s.ChangOpenDate?.startsWith(currentYearStr)).length;
    const closedThisYear = iicStores.filter(s => s.ChangCloseDate?.startsWith(currentYearStr)).length;

    // 2026 Goals sum
    const target2026 = goals
      .filter(g => g.year === 2026)
      .reduce((acc, g) => acc + g.target, 0);

    // Requested Logic: Open + 2026 Target - Close
    const totalTarget = openStores + target2026 - closeStores;
    const totalCount = iicStores.length;
    
    // Brand Stats
    const currentBrandName = selectedBrand === 'All' ? null : brandMapping[selectedBrand as keyof typeof brandMapping];
    
    const brandCount = currentBrandName 
      ? iicStores.filter(s => s.brand?.toLowerCase().includes(currentBrandName)).length
      : iicStores.length;
      
    const brandTarget = currentBrandName
      ? (goals.filter(g => g.brand.toLowerCase().includes(currentBrandName)).reduce((acc, g) => acc + g.target, 0) || 40)
      : (totalTarget || 200);

    // Region Stats
    const regions = ["한국", "중국", "일본", "미주", "유럽", "중동", "동남아", "기타"];
    const regionData = regions.map(r => {
      const count = iicStores.filter(s => {
        const country = s.location?.country || '';
        return country.includes(r) || (r === '미주' && (country.includes('USA') || country.includes('United States')));
      }).length;
      const target = goals.filter(g => g.country === r).reduce((acc, g) => acc + g.target, 0) || 15;
      return { name: r, count, target, percentage: target > 0 ? Math.round((count / target) * 100) : 0 };
    }).sort((a, b) => b.count - a.count);

    return {
      total: { 
        count: totalCount, 
        target: totalTarget, 
        percentage: totalTarget > 0 ? Math.round((totalCount / totalTarget) * 100) : 0,
        openedThisYear,
        closedThisYear
      },
      brand: { 
        name: selectedBrand, 
        count: brandCount, 
        target: brandTarget, 
        percentage: brandTarget > 0 ? Math.round((brandCount / brandTarget) * 100) : 0 
      },
      regions: regionData
    };
  }, [iicStores, goals, selectedBrand]);

  const brandStatsSummary = useMemo(() => {
    return BRANDS.map(bName => {
      const count = iicStores.filter(s => s.brand?.toLowerCase().includes(bName.toLowerCase())).length;
      const brandKey = Object.keys(brandMapping).find(k => brandMapping[k] === bName.toLowerCase()) || '';
      const target = goals.filter(g => g.brand.toLowerCase() === bName.toLowerCase()).reduce((acc, g) => acc + g.target, 0) || 20;
      return { name: bName, count, percentage: Math.round((count / target) * 100) };
    });
  }, [iicStores, goals]);

  const brandTabs = ["All", "GM", "TB", "ND", "NF", "AT"];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const actual = payload.find((p: any) => p.dataKey === 'actual')?.value;
      const forecast = payload.find((p: any) => p.dataKey === 'forecast')?.value;
      const target = activeStats.total.target;

      return (
        <div className="bg-black px-5 py-4 rounded-xl shadow-2xl border border-white/10 min-w-[140px]">
          <p className="text-white text-sm font-black mb-3">{label}</p>
          <div className="space-y-1.5">
            {actual !== undefined && (
              <p className="text-white/70 text-[11px] font-bold flex justify-between items-center">
                <span>Actual:</span>
                <span className="text-white text-xs">{actual.toLocaleString()}</span>
              </p>
            )}
            {forecast !== undefined && actual === undefined && (
              <p className="text-white/70 text-[11px] font-bold flex justify-between items-center">
                <span>Forecast:</span>
                <span className="text-white text-xs">{forecast.toLocaleString()}</span>
              </p>
            )}
            <p className="text-white/70 text-[11px] font-bold flex justify-between items-center">
              <span>Target:</span>
              <span className="text-white text-xs">{target.toLocaleString()}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 bg-white overflow-y-auto no-scrollbar">
      <div className="p-16 max-w-[2400px] mx-auto space-y-16">
        
        <GoalModal 
          isOpen={isGoalModalOpen} 
          onClose={() => setIsGoalModalOpen(false)} 
          onSave={handleSaveGoals}
          currentGoals={goals}
        />

        {/* Trajectory Section */}
        <section className="bg-white rounded-[2rem] border border-gray-100 p-12 shadow-sm space-y-8">
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center space-x-6">
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                12-Month Trajectory
              </h2>
              <button 
                onClick={() => setIsGoalModalOpen(true)}
                className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-lg text-[10px] font-black text-slate-900 transition-all border border-slate-100 shadow-sm"
              >
                <Target className="w-3.5 h-3.5" />
                <span>SET GOAL</span>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              {brandTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedBrand(tab)}
                  className={`w-14 h-9 flex items-center justify-center text-[10px] font-bold tracking-wider rounded border transition-all ${
                    selectedBrand === tab
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-400 border-gray-100 hover:border-gray-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[450px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={TRAJECTORY_DATA.map(d => ({ ...d, target: activeStats.total.target }))}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F8FAFC" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="#F1F5F9"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }}
                  dy={20}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  domain={[100, (activeStats.total.target || 200) + 50]}
                  tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }} />
                
                <Area
                  type="monotone"
                  dataKey="forecast"
                  stroke="#000000"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fill="transparent"
                  dot={false}
                  activeDot={false}
                />

                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#000000"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#colorActual)"
                  dot={(props: any) => {
                    if (props.payload.name === 'Feb') {
                      return <circle cx={props.cx} cy={props.cy} r={3} fill="white" stroke="black" strokeWidth={1} />;
                    }
                    return <></>;
                  }}
                  activeDot={{ r: 4, fill: '#000', strokeWidth: 0 }}
                />

                <Area
                  type="monotone"
                  dataKey="target"
                  stroke="transparent"
                  fill="transparent"
                  dot={(props: any) => {
                    if (props.payload.name === 'Feb') {
                      return <circle cx={props.cx} cy={props.cy} r={4} fill="white" stroke="#E2E8F0" strokeWidth={2} />;
                    }
                    return <></>;
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Main Dashboard Section */}
        <section className="grid grid-cols-3 gap-12 items-start pb-32">
          {/* Left Column */}
          <div className="bg-white rounded-[2rem] border border-gray-100 p-12 shadow-sm space-y-12 hover:shadow-md transition-shadow">
            <div className="flex justify-center">
              <CircularProgress
                label={selectedBrand === 'All' ? "Total Brands" : `${selectedBrand} Brand`}
                count={activeStats.brand.count.toString()}
                total={activeStats.brand.target.toString()}
                percentage={activeStats.brand.percentage}
                size={340}
                strokeWidth={5}
              />
            </div>
            <div className="space-y-1">
              {brandStatsSummary.map((brand) => (
                <div
                  key={brand.name}
                  className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0 group hover:bg-gray-50/50 px-4 rounded-xl transition-all"
                >
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                      {brand.name}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{brand.count} STORES</span>
                  </div>
                  <span className="text-[11px] font-black text-slate-900 bg-gray-50 px-3 py-1 rounded-lg group-hover:bg-slate-900 group-hover:text-white transition-all">
                    {brand.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Center Column */}
          <div className="bg-white rounded-[2rem] border border-gray-100 p-12 shadow-sm flex flex-col items-center justify-center min-h-[700px] hover:shadow-md transition-shadow">
            <CircularProgress
              label="IIC Global Growth"
              count={activeStats.total.count.toString()}
              total={activeStats.total.target.toString()}
              percentage={activeStats.total.percentage}
              size={440}
              strokeWidth={8}
            />
            <div className="mt-14 text-center space-y-4">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Live Global Expansion Status</p>
               <p className="text-lg font-bold text-slate-800">{iicStores.length} Total Points of Sale</p>
               
               <div className="flex items-center justify-center space-x-8 pt-4 border-t border-slate-100">
                 <div className="flex flex-col items-center">
                   <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Opened YTD</span>
                   <span className="text-xl font-black text-slate-900">+{activeStats.total.openedThisYear}</span>
                 </div>
                 <div className="w-[1px] h-8 bg-slate-100"></div>
                 <div className="flex flex-col items-center">
                   <span className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Closed YTD</span>
                   <span className="text-xl font-black text-slate-900">-{activeStats.total.closedThisYear}</span>
                 </div>
               </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="bg-white rounded-[2rem] border border-gray-100 p-12 shadow-sm space-y-12 hover:shadow-md transition-shadow">
            <div className="flex justify-center">
              <CircularProgress
                label="Regional Distribution"
                count={activeStats.regions.length.toString()}
                total="15"
                percentage={Math.round((activeStats.regions.length / 15) * 100)}
                size={340}
                strokeWidth={5}
              />
            </div>
            <div className="space-y-1 h-[450px] overflow-y-auto no-scrollbar pr-2">
              {activeStats.regions.map((region) => (
                <div
                  key={region.name}
                  className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0 group hover:bg-gray-50/50 px-4 rounded-xl transition-all"
                >
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                      {region.name}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{region.count} STORES</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] text-slate-400 font-bold">Goal: {region.target}</span>
                    <span className="text-[11px] font-black text-slate-900 bg-gray-50 px-3 py-1 rounded-lg group-hover:bg-slate-900 group-hover:text-white transition-all">
                      {region.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
