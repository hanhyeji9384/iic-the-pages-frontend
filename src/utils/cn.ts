// ============================================================
// cn() 유틸리티 함수
// 여러 CSS 클래스를 합치고 중복/충돌을 자동으로 해결해줍니다.
// 비전공자 설명: 버튼이 여러 스타일을 가질 때, 서로 충돌하는 스타일을
// 자동으로 정리해주는 도우미 함수입니다.
// ============================================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind CSS 클래스들을 안전하게 합치는 함수
 *
 * 사용 예시:
 * cn('px-4 py-2', isActive && 'bg-blue-500', 'text-white')
 * → 'px-4 py-2 bg-blue-500 text-white' (isActive가 true일 때)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
