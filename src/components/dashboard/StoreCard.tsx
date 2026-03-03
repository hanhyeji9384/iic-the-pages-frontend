// ============================================================
// StoreCard 컴포넌트
// 사이드바에서 하나의 매장 정보를 카드 형태로 보여주는 컴포넌트입니다.
// 매장 이름, 브랜드, 위치, 면적, 임대료 정보를 표시합니다.
// ============================================================

import React from 'react';
import { Store } from '../../types';
import { Badge } from '../ui/badge';
import { MapPin, Ruler, Banknote } from 'lucide-react';

// 이 컴포넌트가 받는 데이터의 형태를 정의합니다.
interface StoreCardProps {
  store: Store;       // 표시할 매장 데이터
  onClick?: () => void; // 카드 클릭 시 실행할 함수
}

// 매장 카드 컴포넌트 — 사이드바 목록에서 매장 하나를 보여줍니다.
export const StoreCard: React.FC<StoreCardProps> = ({ store, onClick }) => {
  // 파이프라인 상태(status)에 따라 배지 색상을 결정하는 함수
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Plan':
      case 'Planed': return 'bg-[#64748B] hover:bg-[#475569]';
      case 'Confirm':
      case 'Confirmed': return 'bg-[#9694FF] hover:bg-[#8684EF]';
      case 'Contract':
      case 'Signed': return 'bg-[#EE99C2] hover:bg-[#DE89B2]';
      case 'Space':
      case 'Construction': return 'bg-sky-500 hover:bg-sky-600';
      case 'Open': return 'bg-[#7FC7D9] hover:bg-[#6FB7C9]';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // 금액을 한국식 '만원' 단위로 변환하는 함수 (예: 5000000 → ₩500만)
  const formatKRW = (amount: number) => {
    return `₩${Math.round(amount / 10000).toLocaleString()}만`;
  };

  return (
    // 카드 전체 영역 — 클릭 가능하고, 호버 시 배경이 변합니다.
    <div
      className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      {/* 상단 영역: 매장명, 브랜드명, 상태 배지 */}
      <div className="flex justify-between items-start mb-1">
        <div>
          {/* 매장명 — 호버 시 파란색으로 변함 */}
          <h3 className="font-bold text-[12.5px] text-gray-900 group-hover:text-blue-600 transition-colors">
            {store.name}
          </h3>
          {/* 브랜드명 */}
          <p className="text-[10.5px] text-gray-500 font-medium">{store.brand}</p>
        </div>
        {/* 파이프라인 상태 배지 */}
        <Badge className={`${getStatusColor(store.status)} text-white border-0 text-[8.5px] px-2 py-0.5 h-5`}>
          {store.status}
        </Badge>
      </div>

      {/* 하단 영역: 위치, 면적, 임대료 정보 */}
      <div className="space-y-1 mt-2">
        {/* 위치 정보 */}
        <div className="flex items-center text-[10.5px] text-gray-500">
          <MapPin className="w-2.5 h-2.5 mr-1.5 opacity-70" />
          <span>{store.location.city}, {store.location.country}</span>
        </div>
        {/* 면적 정보 — area(숫자)가 있으면 ㎡로 표시, 없으면 size(문자열) 사용 */}
        <div className="flex items-center text-[10.5px] text-gray-500">
          <Ruler className="w-2.5 h-2.5 mr-1.5 opacity-70" />
          <span>{store.area ? `${store.area.toLocaleString()}㎡` : store.size}</span>
        </div>
        {/* 임대료 — 데이터가 있을 때만 표시 */}
        {(store.financial?.monthlyRent || store.rent) && (
          <div className="flex items-center text-[10.5px] text-emerald-600 font-medium">
            <Banknote className="w-2.5 h-2.5 mr-1.5 opacity-70" />
            <span>
              {/* KRW 통화일 경우 한국식 표기, 그 외에는 기본 표기 */}
              {store.financial?.monthlyRent && store.financial.currency === 'KRW'
                ? formatKRW(store.financial.monthlyRent)
                : store.rent || `${store.financial?.currency} ${store.financial?.monthlyRent?.toLocaleString()}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
