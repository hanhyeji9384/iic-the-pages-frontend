// ============================================================
// ProgressBoard - 파이프라인 진행 현황 보드
// 각 파이프라인 단계별(Planned → Open) 매장 수와 현황을 카드 형태로 보여줍니다.
// ============================================================

import React, { useMemo, useState } from 'react';
import { Store, PIPELINE_STATUS_COLORS, isIICBrand } from '../../types';
import { ArrowUpRight, Building2, Globe, TrendingUp, ChevronRight } from 'lucide-react';

// 파이프라인 단계 정의 (순서대로)
const PIPELINE_STAGES = [
  { key: 'Planned', label: 'Planned', description: '검토 및 계획 단계' },
  { key: 'Confirmed', label: 'Confirmed', description: '내부 확정 단계' },
  { key: 'Signed', label: 'Signed', description: '계약 체결 단계' },
  { key: 'Construction', label: 'Construction', description: '공사 진행 단계' },
  { key: 'Open', label: 'Open', description: '정식 오픈' },
];

// 상태 정규화 함수: 구 상태명 → 새 상태명으로 변환
function normalizeStatus(status: string): string {
  const statusMap: Record<string, string> = {
    Plan: 'Planned',
    Confirm: 'Confirmed',
    Contract: 'Signed',
    Space: 'Construction',
    Planed: 'Planned',
  };
  return statusMap[status] || status;
}

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

// IIC 브랜드 색상 (기업별로 구분)
const BRAND_COLORS: Record<string, string> = {
  'Gentle Monster': '#1e293b',
  'Tamburins': '#9694FF',
  'Nudake': '#EE99C2',
  'Atiissu': '#0ea5e9',
  'Nuflaat': '#7FC7D9',
};

export const ProgressBoard: React.FC<ProgressBoardProps> = ({
  stores,
  onNavigateToPipelineList,
}) => {
  // 현재 선택된 연도 필터
  const [selectedYear, setSelectedYear] = useState(2025);

  // IIC 브랜드 매장만 필터링
  const iicStores = useMemo(() => {
    return stores.filter(
      (s) => isIICBrand(s.brand) || s.brandCategory === 'iic'
    );
  }, [stores]);

  // 단계별 매장 수 집계
  const stageData = useMemo(() => {
    return PIPELINE_STAGES.map((stage) => {
      const stageStores = iicStores.filter((s) => {
        const normalized = normalizeStatus(s.status);
        return normalized === stage.key;
      });

      // 브랜드별 카운트
      const brandCounts: Record<string, number> = {};
      stageStores.forEach((s) => {
        brandCounts[s.brand] = (brandCounts[s.brand] || 0) + 1;
      });

      return {
        ...stage,
        count: stageStores.length,
        stores: stageStores,
        brandCounts,
      };
    });
  }, [iicStores]);

  // 총계 및 KPI
  const totalOpen = iicStores.filter(
    (s) => normalizeStatus(s.status) === 'Open'
  ).length;

  const totalPipeline = iicStores.filter(
    (s) => normalizeStatus(s.status) !== 'Open' && s.status !== 'Close'
  ).length;

  // 연간 매출 합계 (선택된 연도 기준)
  const totalYearlySales = useMemo(() => {
    return iicStores.reduce((sum, s) => {
      const yearSales =
        s.financial?.yearlySales?.find((y) => y.year === selectedYear)
          ?.amount || 0;
      return sum + yearSales;
    }, 0);
  }, [iicStores, selectedYear]);

  // 숫자 포맷 함수 (억 단위)
  const formatSales = (amount: number): string => {
    const eok = Math.round(amount / 100000000);
    return `${eok.toLocaleString()}억`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f9fb] p-6">
      {/* ───── 페이지 헤더 ───── */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Progress Board</h1>
        <p className="text-sm text-gray-500 mt-1">
          IIC 브랜드 글로벌 매장 파이프라인 현황
        </p>
      </div>

      {/* ───── KPI 요약 카드 3종 ───── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* 전체 오픈 매장 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Building2 className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <span className="text-xs text-gray-400 font-medium">Total Open</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">{totalOpen}</div>
          <div className="text-xs text-gray-500 mt-1">정식 운영 중인 매장</div>
        </div>

        {/* 파이프라인 진행 중 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5 text-violet-600" />
            </div>
            <span className="text-xs text-gray-400 font-medium">Pipeline</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">{totalPipeline}</div>
          <div className="text-xs text-gray-500 mt-1">파이프라인 진행 중</div>
        </div>

        {/* 연간 매출 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <Globe className="w-4.5 h-4.5 text-blue-600" />
            </div>
            <div className="flex items-center space-x-1">
              {[2023, 2024, 2025].map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors ${
                    selectedYear === year
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {formatSales(totalYearlySales)}
          </div>
          <div className="text-xs text-gray-500 mt-1">{selectedYear}년 전체 매출 합계</div>
        </div>
      </div>

      {/* ───── 파이프라인 단계별 현황 ───── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">
            Pipeline Stages
          </h2>
          <span className="text-xs text-gray-400">
            IIC 브랜드 기준 · 전체 {iicStores.length}개
          </span>
        </div>

        {/* 각 파이프라인 단계 행 */}
        <div className="divide-y divide-gray-50">
          {stageData.map((stage) => {
            const color = PIPELINE_STATUS_COLORS[stage.key] || '#94a3b8';

            return (
              <div
                key={stage.key}
                className="px-6 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                onClick={() =>
                  onNavigateToPipelineList?.(stage.key)
                }
              >
                <div className="flex items-center justify-between">
                  {/* 왼쪽: 상태 배지 + 설명 */}
                  <div className="flex items-center space-x-4">
                    {/* 상태 색상 점 */}
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className="text-sm font-semibold"
                          style={{ color }}
                        >
                          {stage.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {stage.description}
                        </span>
                      </div>

                      {/* 브랜드별 카운트 태그 */}
                      {stage.count > 0 && (
                        <div className="flex items-center space-x-2 mt-1.5">
                          {Object.entries(stage.brandCounts).map(
                            ([brand, count]) => (
                              <span
                                key={brand}
                                className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white"
                                style={{
                                  backgroundColor:
                                    BRAND_COLORS[brand] || '#94a3b8',
                                  opacity: 0.85,
                                }}
                              >
                                {brand} {count}
                              </span>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 오른쪽: 매장 수 + 화살표 */}
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-800">
                        {stage.count}
                      </div>
                      <div className="text-[10px] text-gray-400">매장</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </div>

                {/* 진행률 바 */}
                {stage.count > 0 && (
                  <div className="mt-3 ml-7">
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            (stage.count / Math.max(iicStores.length, 1)) * 100 * 3,
                            100
                          )}%`,
                          backgroundColor: color,
                          opacity: 0.7,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ───── 브랜드별 요약 ───── */}
      <div className="mt-4 grid grid-cols-5 gap-3">
        {Object.entries(BRAND_COLORS).map(([brand, color]) => {
          const brandStores = iicStores.filter(
            (s) => s.brand === brand && normalizeStatus(s.status) === 'Open'
          );
          const brandPipeline = iicStores.filter(
            (s) =>
              s.brand === brand &&
              normalizeStatus(s.status) !== 'Open' &&
              s.status !== 'Close'
          );

          return (
            <div
              key={brand}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onNavigateToPipelineList?.('Open', brand)}
            >
              <div
                className="w-2 h-2 rounded-full mb-2"
                style={{ backgroundColor: color }}
              />
              <div className="text-xs font-semibold text-slate-700 mb-1 truncate">
                {brand}
              </div>
              <div className="flex items-end space-x-2">
                <span className="text-xl font-bold text-slate-900">
                  {brandStores.length}
                </span>
                <span className="text-xs text-gray-400 mb-0.5">open</span>
              </div>
              {brandPipeline.length > 0 && (
                <div className="flex items-center space-x-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-violet-500" />
                  <span className="text-[10px] text-violet-600 font-medium">
                    +{brandPipeline.length} 파이프라인
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
