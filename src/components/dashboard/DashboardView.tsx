// ============================================================
// DashboardView 컴포넌트 — 종합 대시보드
// IIC 브랜드의 글로벌 성과를 한눈에 파악할 수 있는 종합 분석 화면입니다.
// KPI 카드 4개, 매출/파이프라인 차트, 브랜드별/지역별 분석,
// Top Stores 목록, 성과 알림(저성과/계약 만료) 모달 등을 포함합니다.
// ============================================================

import React, { useMemo } from 'react';
import { Store } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';
import {
  TrendingUp, Users, Store as StoreIcon,
  AlertCircle, DollarSign,
  Globe, Clock, ChevronLeft, ChevronRight,
  Handshake, FileText, MapPin, CheckCircle2
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Button as UIButton } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";

// 이 컴포넌트가 받는 데이터의 형태를 정의합니다.
interface DashboardViewProps {
  stores: Store[];                         // 전체 매장 데이터 배열
  selectedYear: number;                    // 현재 선택된 기준 연도
  onYearChange: (year: number) => void;    // 연도 변경 함수
}

// 대시보드 종합 뷰 컴포넌트
export function DashboardView({ stores, selectedYear, onYearChange }: DashboardViewProps) {
  // 저성과 매장 목록 모달 열림 상태
  const [isLowPerfModalOpen, setIsLowPerfModalOpen] = React.useState(false);
  // 계약 만료 예정 매장 모달 열림 상태
  const [isExpiryModalOpen, setIsExpiryModalOpen] = React.useState(false);
  // Top Stores 전체 목록 모달 열림 상태
  const [isTopStoresModalOpen, setIsTopStoresModalOpen] = React.useState(false);
  // 각 모달의 현재 페이지 번호
  const [topStoresPage, setTopStoresPage] = React.useState(1);
  const [lowPerfPage, setLowPerfPage] = React.useState(1);
  const [expiryPage, setExpiryPage] = React.useState(1);
  // 페이지당 표시 항목 수
  const ITEMS_PER_PAGE = 15;
  const LOW_PERF_ITEMS_PER_PAGE = 8;
  const EXPIRY_ITEMS_PER_PAGE = 8;

  // IIC 브랜드 목록 (소문자, 필터링에 사용)
  const iicBrands = ['gentle monster', 'tamburins', 'nudake', 'atiissu', 'nuflaat'];

  // 파이프라인 단계별 매장 수를 계산합니다.
  const PIPELINE_STAGES = useMemo(() => {
    // IIC 계열 매장만 필터링
    const iicStores = stores.filter(s => {
      const brand = (s.brand || '').toLowerCase();
      return iicBrands.some(b => brand.includes(b));
    });

    return [
      { name: 'Plan', count: iicStores.filter(s => s.status === 'Plan').length, color: 'bg-[#C5DFF8]' },
      { name: 'Confirm', count: iicStores.filter(s => s.status === 'Confirm').length, color: 'bg-[#9694FF]' },
      { name: 'Contract', count: iicStores.filter(s => s.status === 'Contract').length, color: 'bg-[#EE99C2]' },
      { name: 'Space', count: iicStores.filter(s => s.status === 'Space').length, color: 'bg-[#0ea5e9]' },
      { name: 'Open', count: iicStores.filter(s => s.status === 'Open').length, color: 'bg-[#7FC7D9]' },
    ];
  }, [stores]);

  // 각 파이프라인 단계의 전환율(Conversion Rate)을 계산합니다.
  const conversionRates = useMemo(() => {
    const open = PIPELINE_STAGES.find(s => s.name === 'Open')?.count || 0;
    const space = PIPELINE_STAGES.find(s => s.name === 'Space')?.count || 0;
    const contract = PIPELINE_STAGES.find(s => s.name === 'Contract')?.count || 0;
    const confirm = PIPELINE_STAGES.find(s => s.name === 'Confirm')?.count || 0;
    const plan = PIPELINE_STAGES.find(s => s.name === 'Plan')?.count || 0;

    // 누적 합산: 각 단계 이후의 전체 수를 계산합니다.
    const spacePlus = space + open;
    const contractPlus = contract + spacePlus;
    const confirmPlus = confirm + contractPlus;
    const planPlus = plan + confirmPlus;

    return {
      'Confirm': (confirmPlus / planPlus) * 100,
      'Contract': (contractPlus / confirmPlus) * 100,
      'Space': (spacePlus / contractPlus) * 100,
      'Open': (open / spacePlus) * 100,
    };
  }, [PIPELINE_STAGES]);

  // 각 파이프라인 단계에 대한 설명
  const stageDescriptions: Record<string, string> = {
    'Plan': '사업성 검토 및 매장 개설 계획 수립 단계입니다.',
    'Confirm': '입지 선정 완료 및 본사 승인이 확정된 단계입니다.',
    'Contract': '임대차 계약 체결 및 법적 절차가 완료된 단계입니다.',
    'Space': '인테리어 설계 및 시공이 진행되는 공간 확보 단계입니다.',
    'Open': '최종 오픈 완료 및 정상 영업 중인 매장입니다.'
  };

  // 핵심 통계 데이터를 계산합니다. (selectedYear 변경 시 재계산)
  const stats = useMemo(() => {
    // 기준 날짜 (선택 연도 말일로 설정)
    const today = new Date(`${selectedYear}-12-28`);
    const displayYears = [selectedYear - 2, selectedYear - 1, selectedYear, selectedYear + 1, selectedYear + 2];

    // IIC 계열 매장과 비 IIC 매장을 분리합니다.
    const iicStores = stores.filter(s => {
      const brand = (s.brand || '').toLowerCase();
      return iicBrands.some(b => brand.includes(b));
    });

    const otherStores = stores.filter(s => {
      const brand = (s.brand || '').toLowerCase();
      return !iicBrands.some(b => brand.includes(b));
    });

    // 계약 만료 임박 매장 목록을 계산하는 내부 함수
    const getExpiryStores = () => {
      const expiryList: { store: Store; remainingMonths: number; isCritical: boolean }[] = [];

      // 특정 기준(개월 수 임박)으로 만료 매장을 체크합니다.
      const checkExpiry = (storeList: Store[], thresholdMonths: number) => {
        storeList.forEach(s => {
          if (s.contract?.endDate) {
            const endDate = new Date(s.contract.endDate);
            const diffTime = endDate.getTime() - today.getTime();
            // 밀리초를 월 단위로 변환 (1달 = 30.44일)
            const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44);

            // 남은 기간이 양수이고 임박 기준 이내인 경우만 포함
            if (diffMonths > 0 && diffMonths <= thresholdMonths) {
              expiryList.push({
                store: s,
                remainingMonths: Math.floor(diffMonths),
                isCritical: diffMonths <= 6 // 6개월 이내면 위급으로 분류
              });
            }
          }
        });
      };

      checkExpiry(iicStores, 6);      // IIC 매장: 6개월 이내
      checkExpiry(otherStores, 24);   // 기타 매장: 24개월(2년) 이내

      // 남은 기간 오름차순 정렬
      return expiryList.sort((a, b) => a.remainingMonths - b.remainingMonths);
    };

    const expiringStoresList = getExpiryStores();

    // 선택 연도 기준으로 오픈된 IIC 매장 수를 계산합니다.
    const iicStoresOpenAsOfSelectedYear = iicStores.filter(s => {
      if (s.openDate) {
        // 오픈일이 있으면 선택 연도 이하인 경우 포함
        return new Date(s.openDate).getFullYear() <= selectedYear;
      }
      // 오픈 상태이지만 날짜가 없는 경우 2024년 이후로 간주
      if (s.status === 'Open') {
        return selectedYear >= 2024;
      }
      return false;
    });

    // 선택 연도의 IIC 전체 매출 합계
    const totalSalesSelectedYear = iicStores.reduce((acc, s) => {
      return acc + (s.financial?.yearlySales?.find(sy => sy.year === selectedYear)?.amount || 0);
    }, 0);

    // 저성과 매장: GM 브랜드 중 일평균 매출 1,100만원 이하
    const lowSalesStores = iicStores.filter(s => {
      const brand = (s.brand || '').toLowerCase();
      if (!brand.includes('gentle monster')) return false;

      const salesYear = s.financial?.yearlySales?.find(sy => sy.year === selectedYear)?.amount || 0;
      if (salesYear <= 0) return false;
      const dailySalesMan = Math.ceil((salesYear / 365) / 10000);
      return dailySalesMan <= 1100;
    }).sort((a, b) => {
      // 매출 내림차순 정렬
      const salesA = a.financial?.yearlySales?.find(sy => sy.year === selectedYear)?.amount || 0;
      const salesB = b.financial?.yearlySales?.find(sy => sy.year === selectedYear)?.amount || 0;
      return salesB - salesA;
    });

    // 브랜드별 매출 데이터 (차트용)
    const brandData = iicBrands.map(brand => {
      const brandStores = iicStores.filter(s => (s.brand || '').toLowerCase().includes(brand));
      const sales = brandStores.reduce((acc, s) => acc + (s.financial?.yearlySales?.find(sy => sy.year === selectedYear)?.amount || 0), 0);
      return {
        name: brand.charAt(0).toUpperCase() + brand.slice(1),
        sales: Math.ceil(sales / 10000), // 만원 단위
        count: brandStores.length
      };
    }).sort((a, b) => b.sales - a.sales);

    // 지역별 매장 수 데이터 (도넛 차트용)
    const regionsList = [
      { label: '한국', keywords: ['South Korea', 'Korea', 'Seoul'] },
      { label: '일본', keywords: ['Japan', 'Tokyo', 'Osaka'] },
      { label: '중국', keywords: ['China', 'Hong Kong', 'Taiwan', 'Shanghai'] },
      { label: '동남아', keywords: ['Singapore', 'Thailand', 'Vietnam', 'Malaysia'] },
      { label: '미주', keywords: ['USA', 'Canada', 'Mexico', 'United States'] },
      { label: '유럽', keywords: ['UK', 'France', 'Germany', 'Italy', 'Spain', 'Europe'] },
      { label: '중동', keywords: ['UAE', 'Saudi Arabia', 'Dubai'] },
      { label: '호주', keywords: ['Australia', 'New Zealand'] },
      { label: '기타', keywords: [] }
    ];

    const regionData = regionsList.map(r => {
      const regionStores = iicStoresOpenAsOfSelectedYear.filter(s => {
        const country = (s.location.country || '').toLowerCase();
        // '기타'는 다른 모든 지역에 해당하지 않는 매장
        if (r.label === '기타') return !regionsList.some(other => other.label !== '기타' && other.keywords.some(k => country.includes(k.toLowerCase())));
        return r.keywords.some(k => country.includes(k.toLowerCase()));
      });
      return {
        name: r.label,
        value: regionStores.length
      };
    }).filter(r => r.value > 0); // 값이 있는 지역만 포함

    // 전체 매장을 매출 내림차순으로 정렬
    const allSortedStores = [...iicStores].sort((a, b) => {
      const salesA = a.financial?.yearlySales?.find(s => s.year === selectedYear)?.amount || 0;
      const salesB = b.financial?.yearlySales?.find(s => s.year === selectedYear)?.amount || 0;
      return salesB - salesA;
    });

    // 상위 6개 매장
    const topStores = allSortedStores.slice(0, 6);

    // 연도별 브랜드별 신규 오픈 수 (연간 바 차트용)
    const openingTrendData = displayYears.map(year => {
      const dataPoint: any = { year: year.toString() };
      iicBrands.forEach(brand => {
        const brandKey = brand.charAt(0).toUpperCase() + brand.slice(1);
        const count = iicStores.filter(s => {
          const b = (s.brand || '').toLowerCase();
          if (!b.includes(brand)) return false;
          if (s.openDate) {
            return new Date(s.openDate).getFullYear() === year;
          }
          // openDate 없이 Open 상태이고 2024년인 경우 fallback
          if (year === 2024 && s.status === 'Open' && !s.openDate) return true;
          return false;
        }).length;
        dataPoint[brandKey] = count;
      });
      return dataPoint;
    });

    // 예측: 현재 오픈 + 파이프라인 합계
    const currentOpen = iicStoresOpenAsOfSelectedYear.length;
    const totalPotential = iicStores.length;
    const pipelineCount = totalPotential - currentOpen;
    const totalPredictedStores = totalPotential;

    // 연도별 매출 트렌드 (미래 연도는 15% 성장 적용)
    const yearlyTrend = displayYears.map(year => {
      const total = iicStores.reduce((acc, s) => {
        const yearData = s.financial?.yearlySales?.find(sy => sy.year === year);
        if (yearData) return acc + yearData.amount;
        // 2025년 이후 미래 데이터: 연 15% 성장률 적용
        if (year > 2025) {
          const sales2025 = s.financial?.yearlySales?.find(sy => sy.year === 2025)?.amount || 0;
          const power = year - 2025;
          return acc + (sales2025 * Math.pow(1.15, power));
        }
        return acc;
      }, 0);
      return {
        year: `${year}Y`,
        sales: Math.ceil(total / 10000),
        growth: year === displayYears[0] ? 0 : 15 // 목 성장률
      };
    });

    // 연도별/상태별 파이프라인 현황 (스택드 바 차트용)
    const statusTrendData = displayYears.map(year => {
      const counts: any = { year: year.toString(), 'Open': 0, 'Space': 0, 'Contract': 0, 'Confirm': 0, 'Plan': 0 };

      iicStores.forEach(s => {
        // 계약 시작 연도를 기준으로 포함 여부 결정
        let contractYear = 9999;
        if (s.contract?.startDate) {
          contractYear = new Date(s.contract.startDate).getFullYear();
        } else if (s.status === 'Open') {
          // Open 매장은 오픈 1년 전에 계약한 것으로 간주
          const openDateYear = s.openDate ? new Date(s.openDate).getFullYear() : 2024;
          contractYear = openDateYear - 1;
        } else {
          // 기타: 2025년을 기본 계약 시작 연도로 사용
          contractYear = 2025;
        }

        // 해당 연도까지 계약이 시작된 매장만 포함
        if (contractYear <= year) {
          let openYear = 9999;
          if (s.openDate) {
            openYear = new Date(s.openDate).getFullYear();
          } else if (s.status === 'Open') {
            openYear = 2024;
          }

          if (openYear <= year) {
            // 이미 오픈한 매장
            counts['Open']++;
          } else {
            // 아직 오픈 전인 경우 현재 상태로 분류
            if (['Confirm', 'Plan', 'Contract', 'Space'].includes(s.status)) {
              counts[s.status]++;
            }
          }
        }
      });
      return counts;
    });

    return {
      expiringCount: expiringStoresList.length,
      expiringStores: expiringStoresList,
      totalSales: Math.ceil(totalSalesSelectedYear / 10000),
      storeCount: iicStoresOpenAsOfSelectedYear.length,
      lowSalesCount: lowSalesStores.length,
      lowSalesStores,
      brandData,
      regionData,
      topStores,
      allSortedStores,
      openingTrendData,
      prediction: {
        currentOpen,
        pipelineCount,
        totalPredictedStores,
        yearlyTrend
      },
      statusTrendData
    };
  }, [stores, selectedYear]);

  // 차트에 사용할 색상 팔레트
  const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#ca8a04', '#4b5563', '#06b6d4', '#10b981', '#f59e0b'];

  // 상태별 차트 색상
  const STATUS_COLORS: Record<string, string> = {
    'Open': '#2563eb',
    'Space': '#0ea5e9',
    'Contract': '#06b6d4',
    'Confirm': '#8b5cf6',
    'Plan': '#cbd5e1'
  };

  // Top Stores 모달 페이지네이션 데이터
  const paginatedTopStores = useMemo(() => {
    const startIndex = (topStoresPage - 1) * ITEMS_PER_PAGE;
    return stats.allSortedStores.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [stats.allSortedStores, topStoresPage]);

  const totalPages = Math.ceil(stats.allSortedStores.length / ITEMS_PER_PAGE);

  // 저성과 매장 모달 페이지네이션 데이터
  const paginatedLowPerfStores = useMemo(() => {
    const startIndex = (lowPerfPage - 1) * LOW_PERF_ITEMS_PER_PAGE;
    return stats.lowSalesStores.slice(startIndex, startIndex + LOW_PERF_ITEMS_PER_PAGE);
  }, [stats.lowSalesStores, lowPerfPage]);

  const lowPerfTotalPages = Math.ceil(stats.lowSalesStores.length / LOW_PERF_ITEMS_PER_PAGE);

  // 계약 만료 모달 페이지네이션 데이터
  const paginatedExpiryStores = useMemo(() => {
    const startIndex = (expiryPage - 1) * EXPIRY_ITEMS_PER_PAGE;
    return stats.expiringStores.slice(startIndex, startIndex + EXPIRY_ITEMS_PER_PAGE);
  }, [stats.expiringStores, expiryPage]);

  const expiryTotalPages = Math.ceil(stats.expiringStores.length / EXPIRY_ITEMS_PER_PAGE);

  return (
    <div className="flex-1 bg-gray-50/50 p-6 overflow-y-auto min-h-0">
      <div className="max-w-[2200px] mx-auto space-y-6">

        {/* 상단 헤더: 제목 + 연도 선택기 */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Global Performance Overview</h2>
            <p className="text-[12px] text-gray-500 font-bold uppercase tracking-widest mt-1.5">Financial data in (만 KRW)</p>
          </div>
          {/* 연도 스핀 버튼 */}
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            <UIButton
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              onClick={() => onYearChange(selectedYear - 1)}
            >
              <ChevronLeft className="w-5 h-5" />
            </UIButton>
            <div className="px-5 py-1.5 flex flex-col items-center min-w-[90px]">
              <span className="text-[11px] font-black text-blue-500 uppercase leading-none mb-1">Year</span>
              <span className="text-base font-black text-slate-900 leading-none">{selectedYear}</span>
            </div>
            <UIButton
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              onClick={() => onYearChange(selectedYear + 1)}
            >
              <ChevronRight className="w-5 h-5" />
            </UIButton>
          </div>
        </div>

        {/* KPI 카드 4개 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* KPI 1: 총 매출 */}
          <Card className="border-none shadow-sm bg-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
            <CardHeader className="pb-2 p-5">
              <CardDescription className="text-[12px] uppercase font-bold tracking-wider text-gray-400 flex items-center">
                <DollarSign className="w-3.5 h-3.5 mr-1.5" /> Total Revenue ({selectedYear})
              </CardDescription>
              <CardTitle className="text-3xl font-black text-slate-900">
                ₩{stats.totalSales.toLocaleString()}만
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="flex items-center text-[12px] text-green-600 font-bold bg-green-50 w-fit px-2.5 py-1 rounded-full mb-3">
                <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> +12.5%
              </div>
              <p className="text-[10px] text-gray-400 leading-tight font-medium border-t border-gray-50 pt-2">
                선택된 회계 연도 기준 IIC 브랜드의 글로벌 전체 매출 합계입니다.
              </p>
            </CardContent>
          </Card>

          {/* KPI 2: 계약 만료 예정 — 클릭 시 모달 열림 */}
          <Card
            className="border-none shadow-sm bg-white overflow-hidden relative cursor-pointer hover:ring-2 hover:ring-amber-100 transition-all"
            onClick={() => {
              setExpiryPage(1);
              setIsExpiryModalOpen(true);
            }}
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
            <CardHeader className="pb-2 p-5">
              <CardDescription className="text-[11px] uppercase font-bold tracking-wider text-gray-400 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1.5" /> Contract Expiry
              </CardDescription>
              <CardTitle className="text-2xl font-black text-amber-600">
                {stats.expiringCount} <span className="text-sm font-medium text-amber-400 ml-1.5">Pending</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-[11px] text-amber-600 font-bold bg-amber-50 w-fit px-2.5 py-1 rounded-full mb-3">
                IIC: 6m | Others: 2y
              </div>
              <p className="text-[10px] text-gray-400 leading-tight font-medium border-t border-gray-50 pt-2">
                임대차 계약 만료 예정 매장으로 조속한 갱신 검토가 필요합니다.
              </p>
            </CardContent>
          </Card>

          {/* KPI 3: 저성과 매장 — 클릭 시 모달 열림 */}
          <Card
            className="border-none shadow-sm bg-white overflow-hidden relative cursor-pointer hover:ring-2 hover:ring-red-100 transition-all"
            onClick={() => {
              setLowPerfPage(1);
              setIsLowPerfModalOpen(true);
            }}
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600"></div>
            <CardHeader className="pb-2 p-5">
              <CardDescription className="text-[11px] uppercase font-bold tracking-wider text-gray-400 flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Low Performance
              </CardDescription>
              <CardTitle className="text-2xl font-black text-red-600">
                {stats.lowSalesCount} <span className="text-sm font-medium text-red-400 ml-1.5">Critical</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-[11px] text-red-500 font-bold bg-red-50 w-fit px-2.5 py-1 rounded-full mb-3">
                Under ₩1,100만 daily
              </div>
              <p className="text-[10px] text-gray-400 leading-tight font-medium border-t border-gray-50 pt-2">
                일평균 매출 기준치 미달 매장으로 성과 개선 및 집중 관리가 필요합니다.
              </p>
            </CardContent>
          </Card>

          {/* KPI 4: 평균 성과 */}
          <Card className="border-none shadow-sm bg-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500"></div>
            <CardHeader className="pb-2 p-5">
              <CardDescription className="text-[11px] uppercase font-bold tracking-wider text-gray-400 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> Avg. Performance ({selectedYear})
              </CardDescription>
              <CardTitle className="text-2xl font-black text-slate-900">
                ₩{Math.ceil(stats.totalSales / (stats.storeCount || 1)).toLocaleString()}만
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-[11px] text-gray-500 font-bold bg-gray-50 w-fit px-2.5 py-1 rounded-full mb-3">
                Yearly Average
              </div>
              <p className="text-[10px] text-gray-400 leading-tight font-medium border-t border-gray-50 pt-2">
                운영 중인 전 세계 매장의 연간 평균 매출 성과 지표입니다.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 차트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 예측 요약 카드 4개 (전체 너비 사용) */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* 예측 카드 1: 매장 수 확장 예측 */}
            <Card className="border-none shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white">
              <CardHeader className="p-5 pb-2">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Store Count Expansion Forecast</CardTitle>
                    <CardDescription className="text-slate-400 text-[12px]">Predicted total network after pipeline completion</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="flex items-end justify-between mb-4">
                  <div className="space-y-1.5">
                    <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest">Expected Total</p>
                    <div className="flex items-baseline space-x-2.5">
                      <span className="text-5xl font-black text-blue-400">{stats.prediction.totalPredictedStores}</span>
                      <span className="text-base font-medium text-slate-400">Stores Globally</span>
                    </div>
                  </div>
                  <div className="text-right space-y-2.5">
                    <div className="flex items-center justify-end space-x-5">
                      <div className="text-right">
                        <p className="text-[11px] text-slate-500 font-bold uppercase">Current Open</p>
                        <p className="text-base font-black">{stats.prediction.currentOpen}</p>
                      </div>
                      <div className="w-px h-7 bg-slate-700"></div>
                      <div className="text-right">
                        <p className="text-[11px] text-blue-400 font-bold uppercase">In Pipeline</p>
                        <p className="text-base font-black">+{stats.prediction.pipelineCount}</p>
                      </div>
                    </div>
                    {/* 현재 오픈 비율 프로그레스 바 */}
                    <div className="w-56 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${(stats.prediction.currentOpen / stats.prediction.totalPredictedStores) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight font-medium border-t border-slate-700 pt-3">
                  운영 중인 매장과 현재 진행 중인 파이프라인을 합산한 최종 네트워크 규모 예측입니다.
                </p>
              </CardContent>
            </Card>

            {/* 예측 카드 2: 미래 매출 전망 (에리어 차트) */}
            <Card className="border-none shadow-sm bg-white overflow-visible">
              <CardHeader className="p-5 pb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">Future Revenue Projection</CardTitle>
                    <CardDescription className="text-[12px]">{selectedYear - 1} - {selectedYear + 2} Sales Forecast (KRW)</CardDescription>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-none font-bold text-[11px] px-2.5 py-1">+15% CAGR</Badge>
                </div>
              </CardHeader>
              <CardContent className="h-[210px] p-0 px-5 pt-4 overflow-visible flex flex-col">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.prediction.yearlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        {/* 그라디언트 배경 정의 */}
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', zIndex: 50 }}
                        formatter={(value: any) => [`₩${value.toLocaleString()}만`, 'Revenue']}
                        allowEscapeViewBox={{ x: true, y: true }}
                      />
                      <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-gray-400 leading-tight font-medium border-t border-gray-50 pt-3 pb-4">
                  연평균 성장률을 반영하여 산출한 브랜드 전체의 향후 매출 전망 시나리오입니다.
                </p>
              </CardContent>
            </Card>

            {/* 예측 카드 3: 상태별 파이프라인 (스택드 바 차트) */}
            <Card className="border-none shadow-sm bg-white overflow-visible">
              <CardHeader className="p-5 pb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">Pipeline by Status</CardTitle>
                    <CardDescription className="text-[12px]">Store counts by year and status</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[11px] font-bold uppercase tracking-tight px-2.5 py-1">Status Mix</Badge>
                </div>
              </CardHeader>
              <CardContent className="h-[210px] p-0 px-5 pt-4 overflow-visible flex flex-col">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.statusTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', zIndex: 50 }}
                        allowEscapeViewBox={{ x: true, y: true }}
                      />
                      {/* 상태별 스택드 바 */}
                      {['Plan', 'Confirm', 'Contract', 'Space', 'Open'].map((status, idx) => (
                        <Bar
                          key={status}
                          dataKey={status}
                          stackId="a"
                          fill={STATUS_COLORS[status]}
                          radius={idx === 4 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-gray-400 leading-tight font-medium border-t border-gray-50 pt-3 pb-4">
                  매년 신규 계약 체결 시점을 기준으로 분류한 연도별 파이프라인 확보 현황입니다.
                </p>
              </CardContent>
            </Card>

            {/* 예측 카드 4: 연간 신규 오픈 추이 (브랜드별 스택드 바) */}
            <Card className="border-none shadow-sm bg-white overflow-visible">
              <CardHeader className="p-5 pb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">Annual Store Openings</CardTitle>
                    <CardDescription className="text-[12px]">Historical trend by brand (Yearly)</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[11px] font-bold uppercase tracking-tight px-2.5 py-1">Open Date Trend</Badge>
                </div>
              </CardHeader>
              <CardContent className="h-[210px] p-0 px-5 pt-4 overflow-visible flex flex-col">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.openingTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', zIndex: 50 }}
                        allowEscapeViewBox={{ x: true, y: true }}
                      />
                      {iicBrands.map((brand, idx) => (
                        <Bar
                          key={brand}
                          dataKey={brand.charAt(0).toUpperCase() + brand.slice(1)}
                          stackId="a"
                          fill={COLORS[idx % COLORS.length]}
                          radius={idx === iicBrands.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-gray-400 leading-tight font-medium border-t border-gray-50 pt-3 pb-4">
                  브랜드별 연도별 실제 신규 매장 오픈 실적 및 추이를 분석한 트렌드입니다.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 브랜드별 매출 분석 (2열 차지) */}
          <Card className="lg:col-span-2 border-none shadow-sm bg-white">
            <CardHeader className="p-6 pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-800">Brand Revenue Analysis</CardTitle>
                  <CardDescription className="text-sm">{selectedYear} Projected Sales in (만 KRW)</CardDescription>
                </div>
                <Badge variant="outline" className="bg-gray-50 border-gray-100 text-[11px] font-bold px-3 py-1">BY BRAND</Badge>
              </div>
            </CardHeader>
            <CardContent className="h-[400px] p-6 pt-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.brandData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} tickFormatter={(value) => `₩${value.toLocaleString()}만`} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    itemStyle={{ fontSize: '13px', fontWeight: 'bold' }}
                    formatter={(value: any) => [`₩${value.toLocaleString()}만`, 'Total Revenue']}
                  />
                  <Bar dataKey="sales" radius={[6, 6, 0, 0]} barSize={40}>
                    {/* 각 막대에 다른 색상 적용 */}
                    {stats.brandData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 지역별 매장 분포 (도넛 차트) */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="p-6 pb-0">
              <CardTitle className="text-xl font-bold text-slate-800">Regional Footprint</CardTitle>
              <CardDescription className="text-sm">Store distribution by continent</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex flex-col items-center justify-start p-6">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.regionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.regionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              {/* 범례 */}
              <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 w-full px-4">
                {stats.regionData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center text-[12px] font-bold text-gray-600">
                    <div className="w-2.5 h-2.5 rounded-full mr-2.5" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="flex-1">{entry.name}</span>
                    <span className="font-black text-slate-800 ml-2.5">{entry.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 하단: Top Performing Stores + Performance Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
          {/* Top Performing Stores */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xl font-bold text-slate-800">Top Performing Stores</CardTitle>
                <CardDescription className="text-sm">Highest revenue generators in {selectedYear}</CardDescription>
              </div>
              {/* 전체 목록 보기 버튼 */}
              <UIButton
                variant="ghost"
                size="sm"
                className="text-blue-600 text-[13px] font-bold hover:bg-blue-50"
                onClick={() => {
                  setTopStoresPage(1);
                  setIsTopStoresModalOpen(true);
                }}
              >
                View All
              </UIButton>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <ScrollArea className="h-[320px] pr-4">
                <div className="space-y-5">
                  {stats.topStores.map((store, idx) => {
                    const sales = store.financial?.yearlySales?.find(s => s.year === selectedYear)?.amount || 0;
                    const salesMan = Math.ceil(sales / 10000);
                    return (
                      <div key={store.id} className="flex items-center justify-between group">
                        <div className="flex items-center space-x-4">
                          {/* 순위 표시 */}
                          <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-[11px] font-black text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {(idx + 1).toString().padStart(2, '0')}
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-slate-800 leading-tight">{store.name}</p>
                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight">{store.brand} • {store.location.city}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[14px] font-black text-slate-900 leading-tight">₩{salesMan.toLocaleString()}만</p>
                          <Badge variant="outline" className="text-[10px] h-4.5 py-0 px-1.5 border-gray-100 text-green-600 font-bold bg-green-50/50">TOP TIER</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Performance Heatmap Summary */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="p-6">
              <CardTitle className="text-xl font-bold text-slate-800">Performance Heatmap Summary</CardTitle>
              <CardDescription className="text-sm">Network strength by status and channel</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-8">
                {/* 상태별 혼합 비율 바 */}
                <div>
                  <div className="flex justify-between text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                    <span>Store Status Mix</span>
                    <span>Total: {stats.storeCount}</span>
                  </div>
                  <div className="flex h-3 w-full rounded-full overflow-hidden bg-gray-100">
                    <div className="bg-[#7FC7D9]" style={{ width: '40%' }}></div>
                    <div className="bg-[#EE99C2]" style={{ width: '25%' }}></div>
                    <div className="bg-[#9694FF]" style={{ width: '20%' }}></div>
                    <div className="bg-[#C5DFF8]" style={{ width: '15%' }}></div>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                    <div className="flex items-center text-[11.5px] font-bold text-gray-500">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#7FC7D9] mr-2"></div> Open (40%)
                    </div>
                    <div className="flex items-center text-[11.5px] font-bold text-gray-500">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#EE99C2] mr-2"></div> Signed (25%)
                    </div>
                    <div className="flex items-center text-[11.5px] font-bold text-gray-500">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#9694FF] mr-2"></div> Negotiation (20%)
                    </div>
                    <div className="flex items-center text-[11.5px] font-bold text-gray-500">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#C5DFF8] mr-2"></div> Planned (15%)
                    </div>
                  </div>
                </div>

                {/* 주요 채널 및 성장 지역 요약 카드 */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-5 rounded-xl bg-blue-50/50 border border-blue-100">
                    <p className="text-[12px] font-bold text-blue-400 uppercase mb-1.5">Top Channel</p>
                    <p className="text-xl font-black text-blue-900 leading-tight">Flagship Stores</p>
                    <p className="text-[11px] text-blue-600/60 font-bold">32% of total volume</p>
                  </div>
                  <div className="p-5 rounded-xl bg-purple-50/50 border border-purple-100">
                    <p className="text-[12px] font-bold text-purple-400 uppercase mb-1.5">Growth Region</p>
                    <p className="text-xl font-black text-purple-900 leading-tight">South Korea</p>
                    <p className="text-[11px] text-purple-600/60 font-bold">Fastest expanding market</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============================================================
          모달 다이얼로그들
          ============================================================ */}

      {/* 저성과 매장 목록 모달 */}
      <Dialog open={isLowPerfModalOpen} onOpenChange={setIsLowPerfModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 pb-4 bg-red-50 border-b border-red-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-red-900 leading-tight">Low Performance Store List</DialogTitle>
                <DialogDescription className="text-red-700 font-medium">
                  Stores with {selectedYear} projected daily revenue under ₩1,100만
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full px-6 py-4">
              <div className="space-y-3">
                {paginatedLowPerfStores.length > 0 ? (
                  paginatedLowPerfStores.map((store, idx) => {
                    const globalIdx = (lowPerfPage - 1) * LOW_PERF_ITEMS_PER_PAGE + idx + 1;
                    const salesYear = store.financial?.yearlySales?.find(sy => sy.year === selectedYear)?.amount || 0;
                    const salesMan = Math.ceil(salesYear / 10000);
                    const dailySalesMan = Math.ceil((salesYear / 365) / 10000);

                    return (
                      <div key={store.id} className="group p-4 rounded-xl border border-slate-100 bg-white hover:border-red-200 hover:bg-red-50/30 transition-all flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-xs font-black text-slate-400 group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                            {globalIdx}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 group-hover:text-red-900 transition-colors">{store.name}</h4>
                            <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              <span>{store.brand}</span>
                              <span>•</span>
                              <span>{store.location.city}, {store.location.country}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-slate-900">₩{salesMan.toLocaleString()}만</div>
                          <div className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100 inline-block mt-1">
                            Daily: ₩{dailySalesMan.toLocaleString()}만
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-slate-400 font-medium italic">
                    No critical performance issues detected.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* 페이지네이션 */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Page {lowPerfPage} of {lowPerfTotalPages}
            </div>
            <div className="flex items-center space-x-2">
              <UIButton variant="outline" size="sm" className="h-8 text-[11px] font-black uppercase tracking-wider border-slate-200" onClick={() => setLowPerfPage(p => Math.max(1, p - 1))} disabled={lowPerfPage === 1}>
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
              </UIButton>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, lowPerfTotalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (lowPerfTotalPages > 5 && lowPerfPage > 3) {
                    pageNum = Math.min(lowPerfPage - 2 + i, lowPerfTotalPages - 4 + i);
                  }
                  return (
                    <UIButton key={pageNum} variant={lowPerfPage === pageNum ? "default" : "ghost"} size="sm" className={`h-8 w-8 text-[11px] font-black ${lowPerfPage === pageNum ? 'bg-red-600 hover:bg-red-700' : 'text-slate-400'}`} onClick={() => setLowPerfPage(pageNum)}>
                      {pageNum}
                    </UIButton>
                  );
                })}
              </div>
              <UIButton variant="outline" size="sm" className="h-8 text-[11px] font-black uppercase tracking-wider border-slate-200" onClick={() => setLowPerfPage(p => Math.min(lowPerfTotalPages, p + 1))} disabled={lowPerfPage === lowPerfTotalPages || lowPerfTotalPages === 0}>
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </UIButton>
            </div>
            <UIButton variant="outline" className="text-slate-600 font-black text-[11px] uppercase tracking-widest border-slate-200" onClick={() => setIsLowPerfModalOpen(false)}>
              Close
            </UIButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* 계약 만료 예정 매장 모달 */}
      <Dialog open={isExpiryModalOpen} onOpenChange={setIsExpiryModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 pb-4 bg-amber-50 border-b border-amber-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-amber-900 leading-tight">Contract Expiry Schedule</DialogTitle>
                <DialogDescription className="text-amber-700 font-medium">
                  IIC Stores (within 6 months) & Other Brands (within 2 years)
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full px-6 py-4">
              <div className="space-y-3">
                {paginatedExpiryStores.length > 0 ? (
                  paginatedExpiryStores.map(({ store, remainingMonths, isCritical }) => (
                    <div key={store.id} className="group p-4 rounded-xl border border-slate-100 bg-white hover:border-amber-200 hover:bg-amber-50/30 transition-all flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* 남은 기간 표시 — 위급이면 빨간색, 아니면 황색 */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-colors ${isCritical ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                          {remainingMonths}m
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 group-hover:text-amber-900 transition-colors">{store.name}</h4>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <Badge variant="outline" className={`text-[9px] h-4 py-0 px-1 border-none font-bold ${iicBrands.some(b => store.brand?.toLowerCase().includes(b)) ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                              {store.brand}
                            </Badge>
                            <span>•</span>
                            <span>Ends: {store.contract?.endDate}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-black ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
                          {remainingMonths === 0 ? 'Expiring Soon' : `${remainingMonths} Months Left`}
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Action Required</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-400 font-medium italic">
                    No immediate contract expirations detected.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* 페이지네이션 */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Page {expiryPage} of {expiryTotalPages}
            </div>
            <div className="flex items-center space-x-2">
              <UIButton variant="outline" size="sm" className="h-8 text-[11px] font-black uppercase tracking-wider border-slate-200" onClick={() => setExpiryPage(p => Math.max(1, p - 1))} disabled={expiryPage === 1}>
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
              </UIButton>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, expiryTotalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (expiryTotalPages > 5 && expiryPage > 3) {
                    pageNum = Math.min(expiryPage - 2 + i, expiryTotalPages - 4 + i);
                  }
                  return (
                    <UIButton key={pageNum} variant={expiryPage === pageNum ? "default" : "ghost"} size="sm" className={`h-8 w-8 text-[11px] font-black ${expiryPage === pageNum ? 'bg-amber-600 hover:bg-amber-700' : 'text-slate-400'}`} onClick={() => setExpiryPage(pageNum)}>
                      {pageNum}
                    </UIButton>
                  );
                })}
              </div>
              <UIButton variant="outline" size="sm" className="h-8 text-[11px] font-black uppercase tracking-wider border-slate-200" onClick={() => setExpiryPage(p => Math.min(expiryTotalPages, p + 1))} disabled={expiryPage === expiryTotalPages || expiryTotalPages === 0}>
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </UIButton>
            </div>
            <UIButton variant="outline" className="text-slate-600 font-black text-[11px] uppercase tracking-widest border-slate-200" onClick={() => setIsExpiryModalOpen(false)}>
              Close
            </UIButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Top Performing Stores 전체 목록 모달 */}
      <Dialog open={isTopStoresModalOpen} onOpenChange={setIsTopStoresModalOpen}>
        <DialogContent className="max-w-[95vw] lg:max-w-7xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 pb-4 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black text-blue-900 leading-tight">Top Performing Stores Ranking</DialogTitle>
                  <DialogDescription className="text-blue-700 font-medium">
                    Complete revenue leaderboard for {selectedYear}
                  </DialogDescription>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-blue-400 uppercase block">Total Managed Stores</span>
                <span className="text-lg font-black text-blue-900">{stats.allSortedStores.length}</span>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden bg-white">
            <div className="h-full flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-50 z-10">
                    <tr>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Rank</th>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Store Name</th>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Brand</th>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Location</th>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Yearly Sales</th>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Daily Avg.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginatedTopStores.map((store, idx) => {
                      const globalIdx = (topStoresPage - 1) * ITEMS_PER_PAGE + idx + 1;
                      const sales = store.financial?.yearlySales?.find(s => s.year === selectedYear)?.amount || 0;
                      const salesMan = Math.ceil(sales / 10000);
                      const dailySalesMan = Math.ceil((sales / 365) / 10000);

                      return (
                        <tr key={store.id} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-6 py-4">
                            {/* 1~3등은 메달 이모지, 나머지는 숫자 */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${globalIdx <= 3 ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-50' : 'bg-slate-50 text-slate-400'}`}>
                              {globalIdx === 1 ? '🥇' : globalIdx === 2 ? '🥈' : globalIdx === 3 ? '🥉' : globalIdx}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[13px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{store.name}</span>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="text-[10px] font-bold bg-slate-100 border-none text-slate-600">{store.brand}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[12px] text-slate-500 font-medium">{store.location.city}, {store.location.country}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-[13px] font-black text-slate-900">₩{salesMan.toLocaleString()}만</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-[12px] font-bold text-slate-400 group-hover:text-blue-500 transition-colors">₩{dailySalesMan.toLocaleString()}만</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 페이지네이션 */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Showing {Math.min(stats.allSortedStores.length, (topStoresPage - 1) * ITEMS_PER_PAGE + 1)} - {Math.min(stats.allSortedStores.length, topStoresPage * ITEMS_PER_PAGE)} of {stats.allSortedStores.length}
            </div>
            <div className="flex items-center space-x-2">
              <UIButton variant="outline" size="sm" className="h-8 text-[11px] font-black uppercase tracking-wider border-slate-200" onClick={() => setTopStoresPage(p => Math.max(1, p - 1))} disabled={topStoresPage === 1}>
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
              </UIButton>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && topStoresPage > 3) {
                    pageNum = Math.min(topStoresPage - 2 + i, totalPages - 4 + i);
                  }
                  return (
                    <UIButton key={pageNum} variant={topStoresPage === pageNum ? "default" : "ghost"} size="sm" className={`h-8 w-8 text-[11px] font-black ${topStoresPage === pageNum ? 'bg-blue-600' : 'text-slate-400'}`} onClick={() => setTopStoresPage(pageNum)}>
                      {pageNum}
                    </UIButton>
                  );
                })}
              </div>
              <UIButton variant="outline" size="sm" className="h-8 text-[11px] font-black uppercase tracking-wider border-slate-200" onClick={() => setTopStoresPage(p => Math.min(totalPages, p + 1))} disabled={topStoresPage === totalPages}>
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </UIButton>
            </div>
            <UIButton variant="outline" className="text-slate-600 font-black text-[11px] uppercase tracking-widest border-slate-200" onClick={() => setIsTopStoresModalOpen(false)}>
              Close
            </UIButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
