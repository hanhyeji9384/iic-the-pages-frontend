// ============================================================
// UI 컴포넌트 공통 유틸리티
// shadcn/ui 컴포넌트들이 사용하는 cn() 함수
// ============================================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind CSS 클래스들을 안전하게 합치는 함수
 * shadcn/ui 컴포넌트들은 이 파일의 cn을 사용합니다.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
