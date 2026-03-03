// ============================================================
// YearlyStatusCharts 컴포넌트
// 연도별 IIC 매장 수 추이를 오버레이 형태로 보여주는 컴포넌트입니다.
// 현재는 주석 처리된 상태(레퍼런스 기준)이므로 빈 렌더링을 반환합니다.
// ============================================================

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Store } from '../../types';

// 이 컴포넌트가 받는 데이터의 형태를 정의합니다.
interface YearlyStatusChartsProps {
  stores: Store[];         // 전체 매장 데이터 배열
  isVisible?: boolean;     // 차트 표시 여부 (기본값: true)
}

// 연도별 누적 매장 수 차트에 사용하는 색상
const YEAR_COLOR = '#7FC7D9'; // 청록색 (Open 상태 색상과 동일)

// 연도별 매장 수 추이 오버레이 컴포넌트
export function YearlyStatusCharts({ stores, isVisible = true }: YearlyStatusChartsProps) {
  // 현재 기준 연도와 분석 대상 연도 범위 설정
  const currentYear = 2025;
  const targetYears = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  // IIC 계열 브랜드 매장만 필터링합니다.
  // useMemo: stores 데이터가 바뀔 때만 다시 계산 (성능 최적화)
  const iicStores = useMemo(() => {
    const iicBrands = ['gentle monster', 'tamburins', 'nudake', 'atiissu', 'nuflaat'];
    return stores.filter(s => {
      const brand = (s.brand || '').toLowerCase();
      // 브랜드명에 IIC 브랜드가 포함되거나, brandCategory가 'iic'인 경우
      return iicBrands.some(b => brand.includes(b)) || s.brandCategory === 'iic';
    });
  }, [stores]);

  // 연도별 누적 매장 수 데이터를 계산합니다.
  const yearlyData = useMemo(() => {
    return targetYears.map(year => {
      let count = 0;

      iicStores.forEach(s => {
        // 매장이 언제 오픈했는지 연도를 구합니다.
        let openYear: number | null = null;
        if (s.openDate) {
          openYear = new Date(s.openDate).getFullYear();
        } else if (s.status === 'Open') {
          // openDate가 없으나 Open 상태인 경우 2024년으로 간주
          openYear = 2024;
        } else if (s.statusYear) {
          openYear = s.statusYear;
        }

        // 해당 연도 이전에 오픈한 매장이면 누적 카운트에 포함
        if (openYear && openYear <= year) {
          count++;
        }
      });

      // 차트 라이브러리(Recharts)가 요구하는 데이터 형태로 변환
      const chartData = [{ name: 'Total', value: count, color: YEAR_COLOR }];

      return {
        year,
        total: count,
        data: chartData
      };
    });
  }, [iicStores, targetYears]);

  // isVisible이 false이면 아무것도 렌더링하지 않습니다.
  if (!isVisible) return null;

  // 레퍼런스 기준으로 실제 차트 UI는 주석 처리되어 있습니다.
  // 향후 필요 시 아래 주석을 해제하여 사용할 수 있습니다.
  return (
    <>{/*
    <div className="flex items-center space-x-6 p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl pointer-events-auto transition-all hover:bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="h-24 w-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={yearlyData.filter(yg => yg.year !== currentYear - 1)}
            margin={{ top: 25, right: 20, left: 20, bottom: 5 }}
          >
            <XAxis
              dataKey="year"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 'black', fill: '#1e293b' }}
              dy={10}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg border border-slate-100 flex flex-col items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase leading-tight">{payload[0].payload.year}</span>
                      <span className="text-[13px] font-black text-[#7FC7D9] leading-tight">{payload[0].value}</span>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke={YEAR_COLOR}
              strokeWidth={4}
              dot={{ r: 4, fill: '#fff', stroke: YEAR_COLOR, strokeWidth: 2 }}
              activeDot={{ r: 6, fill: YEAR_COLOR, stroke: '#fff', strokeWidth: 2 }}
              animationDuration={1500}
              label={({ x, y, value }) => (
                <text
                  x={x}
                  y={y - 15}
                  fill="#7FC7D9"
                  fontSize={12}
                  fontWeight="900"
                  textAnchor="middle"
                >
                  {value}
                </text>
              )}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
    */}</>
  );
}
