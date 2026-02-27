// ============================================================
// LandingPage - 앱 시작 화면
// Expansion(매장 확장 관리)과 Prism(사업 분석) 중 하나를 선택하는 화면입니다.
// 왼쪽/오른쪽 패널에 마우스를 올리면 해당 쪽이 살짝 넓어지는 애니메이션이 있습니다.
// ============================================================

import React, { useState } from 'react';
// avif 로고 파일 임포트
import titleLogo from '../../assets/logo.avif';

// 이 컴포넌트가 받는 속성(props) 타입 정의
interface LandingPageProps {
  /** 사용자가 Expansion 또는 Prism을 선택했을 때 호출되는 함수 */
  onEnter: (level1: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  // hoveredSide: 현재 마우스가 올라가 있는 쪽 ('left', 'right', 또는 null)
  const [hoveredSide, setHoveredSide] = useState<'left' | 'right' | null>(null);

  return (
    // 전체 화면을 꽉 채우는 흰색 배경의 컨테이너
    <div className="flex flex-col h-screen w-screen bg-white overflow-hidden select-none">

      {/* 상단 로고 영역: THE PAGES 이미지 로고 */}
      <div className="flex items-center justify-center pt-8 pb-4 min-[2560px]:pt-12 min-[2560px]:pb-6">
        <img
          src={titleLogo}
          alt="THE PAGES"
          className="h-[36px] min-[2560px]:h-[48px] w-auto"
        />
      </div>

      {/* 좌우 분할 선택 영역 */}
      <div className="flex flex-1 min-h-0">

        {/* ───── EXPANSION 왼쪽 패널 ───── */}
        <button
          className="flex-1 flex items-center justify-center relative group transition-all duration-500 cursor-pointer border-none outline-none bg-white"
          // 마우스가 올라오면 왼쪽 hover 상태로 전환
          onMouseEnter={() => setHoveredSide('left')}
          onMouseLeave={() => setHoveredSide(null)}
          onClick={() => onEnter('Expansion')}
          style={{
            // hover된 쪽은 조금 더 넓어지고, 반대쪽은 좁아지는 효과
            flex: hoveredSide === 'left' ? 1.08 : hoveredSide === 'right' ? 0.92 : 1,
          }}
        >
          {/* 마우스 올릴 때 나타나는 은은한 빛 효과 */}
          <div
            className="absolute inset-0 transition-opacity duration-500"
            style={{
              opacity: hoveredSide === 'left' ? 1 : 0,
              background:
                'radial-gradient(ellipse at center, rgba(15,23,42,0.03) 0%, transparent 70%)',
            }}
          />

          {/* EXPANSION 텍스트 */}
          <span
            className={`
              text-[18px] min-[2560px]:text-[22px] tracking-[0.25em] font-medium transition-all duration-400
              ${
                hoveredSide === 'left'
                  ? 'text-slate-900 tracking-[0.35em] scale-105'
                  : 'text-gray-400'
              }
            `}
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              transform: hoveredSide === 'left' ? 'scale(1.04)' : 'scale(1)',
              transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          >
            EXPANSION
          </span>
        </button>

        {/* ───── 가운데 구분선 ───── */}
        <div className="relative w-px flex items-center justify-center">
          {/* 위아래 15% 여백을 둔 얇은 선 */}
          <div className="absolute inset-y-[15%] w-px bg-gray-200" />
        </div>

        {/* ───── PRISM 오른쪽 패널 ───── */}
        <button
          className="flex-1 flex items-center justify-center relative group transition-all duration-500 cursor-pointer border-none outline-none bg-white"
          onMouseEnter={() => setHoveredSide('right')}
          onMouseLeave={() => setHoveredSide(null)}
          onClick={() => onEnter('Prism')}
          style={{
            flex: hoveredSide === 'right' ? 1.08 : hoveredSide === 'left' ? 0.92 : 1,
          }}
        >
          {/* 마우스 올릴 때 나타나는 은은한 빛 효과 */}
          <div
            className="absolute inset-0 transition-opacity duration-500"
            style={{
              opacity: hoveredSide === 'right' ? 1 : 0,
              background:
                'radial-gradient(ellipse at center, rgba(15,23,42,0.03) 0%, transparent 70%)',
            }}
          />

          {/* PRISM 텍스트 */}
          <span
            className={`
              text-[18px] min-[2560px]:text-[22px] tracking-[0.25em] font-medium transition-all duration-400
              ${
                hoveredSide === 'right'
                  ? 'text-slate-900 tracking-[0.35em] scale-105'
                  : 'text-gray-400'
              }
            `}
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              transform: hoveredSide === 'right' ? 'scale(1.04)' : 'scale(1)',
              transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          >
            PRISM
          </span>
        </button>
      </div>
    </div>
  );
};
