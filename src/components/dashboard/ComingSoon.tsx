// ============================================================
// ComingSoon - 준비 중인 페이지 플레이스홀더
// 아직 개발되지 않은 화면에 표시되는 안내 컴포넌트입니다.
// ============================================================

import React from 'react';
import { FileText } from 'lucide-react';

interface ComingSoonProps {
  /** 표시할 페이지 이름 */
  pageName?: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ pageName }) => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50/50">
      <div className="text-center space-y-3">
        {/* 아이콘 */}
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center">
          <FileText className="w-8 h-8 text-gray-300" />
        </div>
        {/* 안내 텍스트 */}
        <div>
          <h3 className="text-lg font-bold text-gray-400">
            {pageName || 'Coming Soon'}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            이 페이지는 곧 공개될 예정입니다.
          </p>
        </div>
      </div>
    </div>
  );
};
