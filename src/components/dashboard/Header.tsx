// ============================================================
// Header - 앱 상단 네비게이션 바
// 3단계 계층 구조의 메뉴를 제공합니다:
//   Level 1: Expansion / Prism (최상위 섹션)
//   Level 2: Stores / Wholesale / Lens (Expansion 하위 카테고리)
//   Level 3: ProgressBoard, PipelineList, P&L, Schedule, Map (탭)
// ============================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, Settings, ChevronDown } from 'lucide-react';
// THE PAGES 이미지 로고 임포트
import titleLogo from '../../assets/logo.avif';

// 헤더가 받는 속성(props) 타입 정의
interface HeaderProps {
  /** 현재 선택된 최상위 메뉴 (Expansion 또는 Prism) */
  activeLevel1: string;

  /** 현재 선택된 2단계 메뉴 (Stores, Wholesale, Lens) */
  activeLevel2: string;

  /** 현재 선택된 탭 (ProgressBoard, PipelineList 등) */
  activeTab: string;

  /** Level 1 메뉴를 클릭했을 때 호출되는 함수 */
  onLevel1Change: (level1: string) => void;

  /** Level 2 메뉴를 클릭했을 때 호출되는 함수 */
  onLevel2Change: (level2: string) => void;

  /** 탭을 클릭했을 때 호출되는 함수 */
  onTabChange: (tab: string) => void;

  /** 헤더에 표시할 전체 매장 수 */
  totalStores?: number;

  /** 설정 버튼 클릭 시 호출되는 함수 */
  onSettingsClick?: () => void;

  /** 로고 클릭 시 랜딩 페이지로 돌아가는 함수 */
  onLogoClick?: () => void;
}

// ============================================================
// 메뉴 구조 정의 (계층형 네비게이션)
// 레퍼런스 프로젝트와 동일한 구조 유지
// ============================================================
const MENU_STRUCTURE = {
  // 최상위 메뉴 (Level 1)
  level1: [
    { key: 'Expansion', label: 'Expansion' },
    { key: 'Prism', label: 'Prism' },
  ],

  // Level 1 → Level 2 매핑
  level2: {
    Expansion: [
      { key: 'Stores', label: 'Stores' },
      { key: 'Wholesale', label: 'Wholesale' },
      { key: 'Lens', label: 'Lens' },
    ],
    Prism: [] as { key: string; label: string }[],
  } as Record<string, { key: string; label: string }[]>,

  // Level 2 → Level 3 (탭) 매핑
  level3: {
    Stores: [
      { key: 'ProgressBoard', label: 'Progress Board' },
      { key: 'PipelineList', label: 'Pipeline List' },
      { key: 'PnL', label: 'P&L' },
      { key: 'Schedule', label: 'Schedule' },
      { key: 'Map', label: 'Map' },
    ],
    Wholesale: [
      { key: 'WholesaleOverview', label: 'Coming Soon' },
    ],
    Lens: [
      { key: 'LensOverview', label: 'Coming Soon' },
    ],
  } as Record<string, { key: string; label: string }[]>,
} as const;

export const Header: React.FC<HeaderProps> = ({
  activeLevel1,
  activeLevel2,
  activeTab,
  onLevel1Change,
  onLevel2Change,
  onTabChange,
  totalStores = 110,
  onSettingsClick,
  onLogoClick,
}) => {
  // hoveredLevel2: 현재 마우스가 올라간 Level 2 메뉴 키
  // (드롭다운 메뉴를 보여주기 위해 사용)
  const [hoveredLevel2, setHoveredLevel2] = useState<string | null>(null);

  // 드롭다운 닫힘 딜레이를 위한 타이머 참조
  // (마우스가 잠깐 벗어나도 드롭다운이 바로 닫히지 않도록)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 현재 Level 1에 해당하는 Level 2 메뉴 목록
  const level2Items = (
    MENU_STRUCTURE.level2 as Record<string, { key: string; label: string }[]>
  )[activeLevel1] || [];

  // Level 2 키에 해당하는 Level 3 탭 목록을 가져오는 함수
  const getLevel3Items = (level2Key: string) =>
    (MENU_STRUCTURE.level3 as Record<string, { key: string; label: string }[]>)[level2Key] || [];

  // Level 2 메뉴에 마우스가 들어올 때: 드롭다운 표시
  const handleLevel2Enter = useCallback((key: string) => {
    // 혹시 닫히려던 타이머가 있으면 취소
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setHoveredLevel2(key);
  }, []);

  // Level 2 메뉴에서 마우스가 떠날 때: 약간의 딜레이 후 드롭다운 닫기
  const handleLevel2Leave = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setHoveredLevel2(null);
    }, 150);
  }, []);

  // 드롭다운 내부로 마우스가 들어올 때: 닫힘 취소
  const handleDropdownEnter = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  // 드롭다운에서 마우스가 떠날 때: 딜레이 후 닫기
  const handleDropdownLeave = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setHoveredLevel2(null);
    }, 150);
  }, []);

  // Level 3 탭 클릭 처리: Level 2 선택 + 탭 선택 + 드롭다운 닫기
  const handleLevel3Click = useCallback(
    (level2Key: string, tabKey: string) => {
      onLevel2Change(level2Key);
      onTabChange(tabKey);
      setHoveredLevel2(null);
    },
    [onLevel2Change, onTabChange]
  );

  // 컴포넌트 언마운트 시 타이머 정리 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 z-30 relative shrink-0">
      <div className="flex flex-col">

        {/* ───── 상단 바 ───── */}
        <div className="py-2.5 px-4 flex items-center justify-between">

          {/* 왼쪽: 로고 + Level 1 네비게이션 */}
          <div className="flex items-center space-x-6">
            {/* THE PAGES 이미지 로고: 클릭하면 랜딩 페이지로 돌아감 */}
            <img
              src={titleLogo}
              alt="THE PAGES"
              className="h-[32px] w-auto mr-2 cursor-pointer"
              onClick={onLogoClick}
            />

            {/* 구분선 */}
            <div className="h-5 w-px bg-gray-200" />

            {/* Level 1 메뉴 버튼들 (Expansion / Prism) */}
            <nav className="flex items-center space-x-1">
              {MENU_STRUCTURE.level1.map((item) => (
                <button
                  key={item.key}
                  onClick={() => onLevel1Change(item.key)}
                  className={`
                    px-3.5 py-1.5 text-sm font-semibold rounded-md transition-all duration-150
                    ${
                      activeLevel1 === item.key
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                    }
                  `}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* 오른쪽: 통계 + 액션 버튼들 */}
          <div className="flex items-center space-x-5">

            {/* 전체 매장 수 표시 */}
            <div className="flex flex-col items-end mr-1">
              <span className="text-[9px] text-gray-400 uppercase font-semibold tracking-wider">
                Total Stores
              </span>
              <span className="text-base font-bold text-slate-800 leading-none">
                {totalStores.toLocaleString()}
              </span>
            </div>

            {/* 구분선 */}
            <div className="h-7 w-px bg-gray-200" />

            {/* 알림 + 설정 + 아바타 버튼 그룹 */}
            <div className="flex items-center space-x-1.5">

              {/* 알림 버튼 */}
              <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <Bell className="w-4 h-4" />
              </button>

              {/* 설정 버튼 */}
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={onSettingsClick}
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* 사용자 아바타 (이니셜 폴백) */}
              <div className="h-8 w-8 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center cursor-pointer ml-1">
                <span className="text-xs font-semibold text-slate-600">IIC</span>
              </div>
            </div>
          </div>
        </div>

        {/* ───── Level 2 네비게이션 행 ───── */}
        {level2Items.length > 0 && (
          <div className="px-4 flex items-center border-t border-gray-100 bg-gray-50/60">
            <div className="flex items-center">
              {level2Items.map((item) => {
                // 이 Level 2 메뉴에 하위 탭(Level 3)이 있는지 확인
                const subItems = getLevel3Items(item.key);
                const hasChildren = subItems.length > 0;
                const isActive = activeLevel2 === item.key;
                const isHovered = hoveredLevel2 === item.key;

                return (
                  <div
                    key={item.key}
                    className="relative"
                    onMouseEnter={() =>
                      hasChildren ? handleLevel2Enter(item.key) : undefined
                    }
                    onMouseLeave={hasChildren ? handleLevel2Leave : undefined}
                  >
                    {/* Level 2 버튼: 활성화 시 파란색 하단 밑줄 표시 */}
                    <button
                      onClick={() => {
                        onLevel2Change(item.key);
                        // 하위 탭이 있으면 첫 번째 탭도 자동 선택
                        if (hasChildren) {
                          onTabChange(subItems[0].key);
                        }
                      }}
                      className={`
                        flex items-center space-x-1 px-3.5 py-2.5 text-xs font-semibold
                        transition-all duration-150 border-b-2
                        ${
                          isActive
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                        }
                      `}
                    >
                      <span>{item.label}</span>
                      {/* 하위 메뉴가 있으면 화살표 아이콘 표시 (hover 시 뒤집힘) */}
                      {hasChildren && (
                        <ChevronDown
                          className={`w-3 h-3 transition-transform duration-200 ${
                            isHovered ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </button>

                    {/* ───── Level 3 드롭다운 메뉴 ───── */}
                    {hasChildren && isHovered && (
                      <div
                        className="absolute top-full left-0 mt-0 z-50 min-w-[180px]"
                        onMouseEnter={handleDropdownEnter}
                        onMouseLeave={handleDropdownLeave}
                      >
                        {/* 드롭다운과 버튼 사이의 보이지 않는 다리 (마우스 이탈 방지) */}
                        <div className="h-1" />

                        {/* 드롭다운 카드 */}
                        <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 overflow-hidden">
                          {subItems.map((tab) => {
                            // 이 탭이 현재 선택된 탭인지 확인
                            const isTabActive = isActive && activeTab === tab.key;
                            return (
                              <button
                                key={tab.key}
                                onClick={() =>
                                  handleLevel3Click(item.key, tab.key)
                                }
                                className={`
                                  w-full text-left px-4 py-2 text-xs font-medium
                                  transition-all duration-100
                                  ${
                                    isTabActive
                                      ? 'bg-blue-50 text-blue-600 font-semibold'
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                  }
                                `}
                              >
                                <div className="flex items-center space-x-2.5">
                                  {/* 현재 탭 표시 점: 활성 탭은 파란색 */}
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
                                      isTabActive ? 'bg-blue-600' : 'bg-gray-300'
                                    }`}
                                  />
                                  <span>{tab.label}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Prism 메뉴: 아직 준비 중 표시 */}
        {activeLevel1 === 'Prism' && level2Items.length === 0 && (
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/60">
            <span className="text-xs text-gray-400 italic">
              Prism – Coming Soon
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
