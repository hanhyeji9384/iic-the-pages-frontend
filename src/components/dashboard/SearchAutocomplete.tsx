// ============================================================
// SearchAutocomplete 컴포넌트
// Google Places API로부터 받은 장소 자동완성 제안 목록을 보여주는 컴포넌트입니다.
// 검색창 아래에 드롭다운 형태로 표시되며, 항목 클릭 시 해당 장소로 이동합니다.
// ============================================================

import React from 'react';
import { MapPin } from 'lucide-react';
import { Card } from '../ui/card';

// 자동완성 제안 항목의 데이터 구조
export interface Suggestion {
  place_id: string;          // Google Places 고유 ID
  description: string;       // 장소 전체 설명
  structured_formatting: {
    main_text: string;       // 장소 주요 이름 (예: 강남역)
    secondary_text: string;  // 부가 정보 (예: 서울특별시 강남구)
  };
}

// 컴포넌트가 받는 속성(props) 정의
interface SearchAutocompleteProps {
  isVisible: boolean;                                           // 목록 표시 여부
  suggestions: Suggestion[];                                    // 자동완성 제안 목록
  onSelect: (placeId: string, description: string) => void;    // 항목 선택 시 실행할 함수
}

/**
 * 검색어 자동완성 드롭다운 목록
 * 검색창 아래에 표시되며 장소 목록을 보여줍니다.
 */
export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({ isVisible, suggestions, onSelect }) => {
  // 보이지 않거나 제안 목록이 비어있으면 아무것도 렌더링하지 않음
  if (!isVisible || suggestions.length === 0) return null;

  return (
    // 검색창 바로 아래에 절대 위치로 표시되는 카드
    <Card className="absolute top-full left-0 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
      <ul className="py-1">
        {suggestions.map((item, index) => (
          <React.Fragment key={item.place_id}>
            {/* 각 자동완성 제안 항목 */}
            <li
              className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors group"
              onClick={(e) => {
                e.stopPropagation();
                // 항목 클릭 시 선택 핸들러 호출
                onSelect(item.place_id, item.description);
              }}
              onMouseDown={(e) => e.preventDefault()} // 클릭 시 검색창 포커스가 해제되는 것을 방지
            >
              {/* 위치 핀 아이콘 */}
              <div className="mr-4 flex-shrink-0 bg-gray-100 p-2 rounded-full group-hover:bg-white group-hover:shadow-sm transition-all">
                <MapPin className="w-5 h-5 text-gray-400" />
              </div>
              {/* 장소 이름 및 부가 정보 */}
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-gray-900 truncate font-bold">
                  {item.structured_formatting.main_text}
                </div>
                <div className="text-[11px] text-gray-500 truncate">
                  {item.structured_formatting.secondary_text}
                </div>
              </div>
            </li>
            {/* 항목 사이 구분선 (마지막 항목 제외) */}
            {index < suggestions.length - 1 && (
              <div className="h-[1px] bg-gray-50 mx-4" />
            )}
          </React.Fragment>
        ))}
      </ul>
    </Card>
  );
};
