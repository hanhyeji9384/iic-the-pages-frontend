// ============================================================
// ImageWithFallback 컴포넌트
// 이미지 로드에 실패했을 때 대체 아이콘을 보여주는 이미지 컴포넌트입니다.
// 네트워크 오류나 잘못된 URL로 이미지를 불러오지 못할 때 자동으로 처리합니다.
// ============================================================

import React, { useState } from 'react'

// 이미지 로드 실패 시 보여줄 기본 SVG 아이콘 (회색 깨진 이미지 아이콘)
const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

/**
 * 이미지 컴포넌트 - 로드 실패 시 자동으로 대체 이미지를 표시합니다.
 * 일반 <img> 태그와 동일한 방식으로 사용 가능합니다.
 */
export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  // 이미지 로드 오류 발생 여부 상태 (false: 정상, true: 오류 발생)
  const [didError, setDidError] = useState(false)

  // 이미지 로드 실패 시 실행되는 함수
  const handleError = () => {
    setDidError(true)
  }

  const { src, alt, style, className, ...rest } = props

  // 오류가 발생한 경우: 회색 배경과 깨진 이미지 아이콘 표시
  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
      </div>
    </div>
  ) : (
    // 정상적인 경우: 이미지를 그대로 표시하고, 오류 발생 시 handleError 호출
    <img src={src} alt={alt} className={className} style={style} {...rest} onError={handleError} />
  )
}
