# 기능 정의서 (Functional Specification)

> **프로젝트명**: IIC THE PAGES — Pipeline Dashboard Frontend
> **작성일**: 2026-02-27
> **분석 대상**: `/Users/hanhyeji/IdeaProjects/iic-the-pages-frontend` (전체 소스코드)
> **분석 기준**: 실제 코드 기반, 추측 없음

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택](#2-기술-스택)
3. [디렉토리 구조](#3-디렉토리-구조)
4. [기능 목록 총괄표](#4-기능-목록-총괄표)
5. [페이지별 기능 상세 정의](#5-페이지별-기능-상세-정의)
6. [공통 컴포넌트 분석](#6-공통-컴포넌트-분석)
7. [데이터 모델 분석](#7-데이터-모델-분석)
8. [상수 및 설정 값](#8-상수-및-설정-값)
9. [미구현 및 계획 기능](#9-미구현-및-계획-기능)

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | THE PAGES — IIC Pipeline Dashboard |
| 주요 목적 | IIC 그룹(젠틀몬스터, 탬버린즈, 누데이크 등) 글로벌 매장 파이프라인 현황 관리 및 시각화 |
| 도메인 | 글로벌 Retail 매장 확장 관리 (Global Store Expansion Management) |
| 아키텍처 패턴 | SPA (Single Page Application), 컴포넌트 기반 상태 관리 |
| 렌더링 방식 | CSR (Client-Side Rendering) |
| 빌드 아웃풋 | `dist/` 폴더 (Vite 빌드) |
| HTML 진입점 | `index.html` (lang="ko", title="THE PAGES — IIC Pipeline Dashboard") |

### 서비스 배경
IIC 그룹이 운영하는 5개 브랜드(Gentle Monster, Tamburins, Nudake, Atiissu, Nuflaat)의 전 세계 매장을 **파이프라인 단계(Plan → Confirm → Contract → Space → Open → Close)** 별로 추적·관리하고, 연도별/국가별 목표 대비 실적을 시각화하는 내부 대시보드 툴입니다.

---

## 2. 기술 스택

### 코어 프레임워크

| 구분 | 라이브러리 | 버전 | 용도 |
|------|-----------|------|------|
| UI 프레임워크 | React | ^18.3.1 | 컴포넌트 기반 UI 구현 |
| 언어 | TypeScript | ^5.7.3 | 정적 타입 검사 |
| 빌드 도구 | Vite | ^6.3.5 | 개발 서버 및 번들링 |
| SWC 컴파일러 | @vitejs/plugin-react-swc | ^3.10.2 | 빠른 React 트랜스파일 |

### 스타일링

| 구분 | 라이브러리 | 버전 | 용도 |
|------|-----------|------|------|
| CSS 프레임워크 | Tailwind CSS | ^4.1.3 | 유틸리티 기반 스타일링 (v4 방식) |
| Tailwind Vite 플러그인 | @tailwindcss/vite | ^4.1.3 | Vite와 Tailwind v4 통합 |
| 클래스 병합 | tailwind-merge | ^2.6.0 | 충돌 클래스 자동 해결 |
| 조건부 클래스 | clsx | ^2.1.1 | 조건부 클래스 결합 |
| 클래스 변형 | class-variance-authority | ^0.7.1 | 컴포넌트 변형(variant) 관리 |
| 글꼴 | Google Fonts | - | Inter, Noto Sans KR, Noto Sans, Outfit |

### UI 컴포넌트

| 구분 | 라이브러리 | 버전 | 용도 |
|------|-----------|------|------|
| Headless UI | Radix UI (다수) | 각각 ^1.x ~ ^2.x | 접근성 보장 UI 프리미티브 |
| 아이콘 | lucide-react | ^0.487.0 | 아이콘 라이브러리 |
| 아이콘 활용 예시 | Bell, Settings, ChevronDown, Target, Save 등 | - | 네비게이션, 모달, 버튼 등 |

### 데이터 시각화

| 구분 | 라이브러리 | 버전 | 용도 |
|------|-----------|------|------|
| 차트 | Recharts | ^2.15.2 | BarChart, ComposedChart, Line |
| 지도 | @react-google-maps/api | ^2.20.3 | (설치됨, 미연동 상태) |

### 애니메이션 및 인터랙션

| 구분 | 라이브러리 | 버전 | 용도 |
|------|-----------|------|------|
| 애니메이션 | motion | ^11.18.2 | 모션 애니메이션 (motion.div) |
| 캐러셀 | embla-carousel-react | ^8.6.0 | (설치됨, 미사용 상태) |
| 드로어 | vaul | ^1.1.2 | 모바일 드로어 |
| 토스트 | sonner | ^2.0.3 | 알림 메시지 |

### 폼 및 기타

| 구분 | 라이브러리 | 버전 | 용도 |
|------|-----------|------|------|
| 폼 관리 | react-hook-form | ^7.55.0 | (설치됨, 미사용 상태) |
| 커맨드 팔레트 | cmdk | ^1.1.1 | (설치됨, 미사용 상태) |
| OTP 입력 | input-otp | ^1.4.2 | (설치됨, 미사용 상태) |
| 캘린더 | react-day-picker | ^8.10.1 | (설치됨, 미사용 상태) |
| 테마 | next-themes | ^0.4.6 | (설치됨, 미사용 상태) |
| 패널 | react-resizable-panels | ^2.1.7 | (설치됨, 미사용 상태) |

### 개발 도구

| 구분 | 버전 |
|------|------|
| Node.js 타입 | @types/node ^20.10.0 |
| 개발 서버 포트 | 3000 |
| 경로 별칭 | `@` → `src/` |
| 빌드 타겟 | esnext |

---

## 3. 디렉토리 구조

```
iic-the-pages-frontend/
├── index.html                          # HTML 진입점 (lang="ko")
├── vite.config.ts                      # Vite 빌드 설정
├── tsconfig.json                       # TypeScript 설정
├── package.json                        # 의존성 관리
├── CLAUDE.md                           # Claude AI 에이전트 지침
├── dist/                               # 빌드 결과물
└── src/
    ├── main.tsx                        # React 앱 진입점 (#root 마운트)
    ├── App.tsx                         # 최상위 컴포넌트 (전체 상태 관리 허브)
    ├── index.css                       # 글로벌 CSS (변수, 폰트, 애니메이션)
    ├── types/
    │   └── index.ts                    # 공통 타입 정의 (Store, FilterState 등)
    ├── app/
    │   └── data/
    │       └── stores.ts               # 정적 샘플 데이터 (IIC 매장 목록)
    ├── assets/
    │   └── logo.avif                   # THE PAGES 브랜드 로고 이미지
    ├── utils/
    │   └── cn.ts                       # clsx + tailwind-merge 유틸리티
    └── components/
        ├── dashboard/                  # 비즈니스 로직 컴포넌트
        │   ├── LandingPage.tsx         # 시작 화면 (Expansion/Prism 선택)
        │   ├── Header.tsx              # 3단계 계층 네비게이션 바
        │   ├── ProgressBoard.tsx       # 파이프라인 현황 보드 (메인 대시보드)
        │   ├── PipelineList.tsx        # 파이프라인 리스트 테이블
        │   └── ComingSoon.tsx          # 미구현 화면 플레이스홀더
        └── ui/                         # shadcn/ui 기반 공통 UI 컴포넌트
            ├── avatar.tsx
            ├── badge.tsx
            ├── button.tsx
            ├── card.tsx
            ├── checkbox.tsx
            ├── command.tsx
            ├── dialog.tsx
            ├── drawer.tsx
            ├── dropdown-menu.tsx
            ├── form.tsx
            ├── input.tsx
            ├── label.tsx
            ├── popover.tsx
            ├── progress.tsx
            ├── scroll-area.tsx
            ├── select.tsx
            ├── separator.tsx
            ├── sheet.tsx
            ├── tabs.tsx
            ├── tooltip.tsx
            └── utils.ts               # cn() 함수 (shadcn/ui용)
```

---

## 4. 기능 목록 총괄표

| 기능 ID | 기능명 | 분류 | 상태 | 관련 파일 |
|---------|--------|------|------|-----------|
| F-001 | 랜딩 페이지 진입 선택 화면 | UI/UX | 구현 완료 | `LandingPage.tsx` |
| F-002 | 3단계 계층형 네비게이션 | UI/UX | 구현 완료 | `Header.tsx`, `App.tsx` |
| F-003 | 로고 클릭으로 랜딩 페이지 복귀 | 네비게이션 | 구현 완료 | `Header.tsx`, `App.tsx` |
| F-004 | Total Stores 카운터 표시 | 데이터 표시 | 구현 완료 | `Header.tsx`, `App.tsx` |
| F-005 | 알림 버튼 (UI만 구현) | UI/UX | 부분 구현 | `Header.tsx` |
| F-006 | 설정 버튼 (상태 연결만 구현) | UI/UX | 부분 구현 | `Header.tsx`, `App.tsx` |
| F-007 | 사용자 아바타 표시 | UI/UX | 부분 구현 | `Header.tsx` |
| F-008 | ProgressBoard 브랜드 필터 | 데이터 필터링 | 구현 완료 | `ProgressBoard.tsx` |
| F-009 | ProgressBoard 분석 연도 필터 (다중 선택) | 데이터 필터링 | 구현 완료 | `ProgressBoard.tsx` |
| F-010 | ProgressBoard 국가 필터 | 데이터 필터링 | 구현 완료 | `ProgressBoard.tsx` |
| F-011 | ProgressBoard 매장 분류 필터 | 데이터 필터링 | 구현 완료 | `ProgressBoard.tsx` |
| F-012 | 브랜드별 오픈 현황 요약 카드 | 데이터 표시 | 구현 완료 | `ProgressBoard.tsx` |
| F-013 | 파이프라인 상태별 요약 카드 | 데이터 표시 | 구현 완료 | `ProgressBoard.tsx` |
| F-014 | 확장 목표 설정 모달 (GoalModal) | 비즈니스 로직 | 구현 완료 | `ProgressBoard.tsx` |
| F-015 | 목표 일괄 입력 그리드 (배치 입력) | 비즈니스 로직 | 구현 완료 | `ProgressBoard.tsx` |
| F-016 | 목표 목록 관리 (추가/삭제) | 비즈니스 로직 | 구현 완료 | `ProgressBoard.tsx` |
| F-017 | 연도별 목표 vs 실적 적층 막대 차트 | 데이터 시각화 | 구현 완료 | `ProgressBoard.tsx` |
| F-018 | 국가별 확장 현황 복합 차트 | 데이터 시각화 | 구현 완료 | `ProgressBoard.tsx` |
| F-019 | 국가별 파이프라인 상태 매트릭스 테이블 | 데이터 시각화 | 구현 완료 | `ProgressBoard.tsx` |
| F-020 | ProgressBoard → PipelineList 연계 네비게이션 | 네비게이션 | 구현 완료 | `ProgressBoard.tsx`, `App.tsx` |
| F-021 | PipelineList 국가 다중 선택 필터 | 데이터 필터링 | 구현 완료 | `PipelineList.tsx` |
| F-022 | PipelineList 도시 필터 | 데이터 필터링 | 구현 완료 | `PipelineList.tsx` |
| F-023 | PipelineList 브랜드 필터 | 데이터 필터링 | 구현 완료 | `PipelineList.tsx` |
| F-024 | PipelineList 파이프라인 상태 필터 | 데이터 필터링 | 구현 완료 | `PipelineList.tsx` |
| F-025 | PipelineList 채널 유형 필터 | 데이터 필터링 | 구현 완료 | `PipelineList.tsx` |
| F-026 | PipelineList 분석 연도 다중 선택 필터 | 데이터 필터링 | 구현 완료 | `PipelineList.tsx` |
| F-027 | PipelineList 매장 분류 필터 | 데이터 필터링 | 구현 완료 | `PipelineList.tsx` |
| F-028 | PipelineList 필터 초기화 | 데이터 필터링 | 구현 완료 | `PipelineList.tsx` |
| F-029 | PipelineList 다중 컬럼 정렬 | 데이터 정렬 | 구현 완료 | `PipelineList.tsx` |
| F-030 | PipelineList 기본 정렬 (지역 순서 → 오픈일) | 데이터 정렬 | 구현 완료 | `PipelineList.tsx` |
| F-031 | PipelineList 매장 목록 테이블 표시 | 데이터 표시 | 구현 완료 | `PipelineList.tsx` |
| F-032 | PipelineList 합계 행 (총 매출/투자비) | 데이터 집계 | 구현 완료 | `PipelineList.tsx` |
| F-033 | 매장 클릭 → 지도 뷰 연계 | 네비게이션 | 부분 구현 | `PipelineList.tsx`, `App.tsx` |
| F-034 | 국가 클릭 → 지도 필터 연계 | 네비게이션 | 부분 구현 | `PipelineList.tsx`, `App.tsx` |
| F-035 | 반응형 폰트 스케일 | UI/UX | 구현 완료 | `App.tsx`, `index.css` |
| F-036 | 커스텀 스크롤바 스타일 | UI/UX | 구현 완료 | `index.css` |
| F-037 | CSS 애니메이션 (slide-in, fade-in) | UI/UX | 구현 완료 | `index.css` |
| F-038 | 글로벌 CSS 변수 (디자인 토큰) | 시스템 | 구현 완료 | `index.css` |
| F-039 | P&L View 플레이스홀더 | 시스템 | 미구현 | `App.tsx`, `ComingSoon.tsx` |
| F-040 | Schedule View 플레이스홀더 | 시스템 | 미구현 | `App.tsx`, `ComingSoon.tsx` |
| F-041 | Map View (Google Maps) 플레이스홀더 | 시스템 | 미구현 | `App.tsx`, `ComingSoon.tsx` |
| F-042 | Dashboard View 플레이스홀더 | 시스템 | 미구현 | `App.tsx`, `ComingSoon.tsx` |
| F-043 | Wholesale 섹션 플레이스홀더 | 시스템 | 미구현 | `App.tsx`, `ComingSoon.tsx` |
| F-044 | Lens 섹션 플레이스홀더 | 시스템 | 미구현 | `App.tsx`, `ComingSoon.tsx` |
| F-045 | Prism 섹션 플레이스홀더 | 시스템 | 미구현 | `App.tsx`, `ComingSoon.tsx` |
| F-046 | Settings Dialog (코드 주석 처리됨) | 시스템 | 미구현 | `App.tsx` |
| F-047 | 경쟁사 브랜드 데이터 구조 | 데이터 | 구현 완료 | `stores.ts`, `types/index.ts` |
| F-048 | 선호/인접 브랜드 데이터 구조 | 데이터 | 구현 완료 | `stores.ts`, `types/index.ts` |
| F-049 | 국가/지역 매핑 테이블 | 데이터 | 구현 완료 | `stores.ts` |
| F-050 | IIC 브랜드 판별 함수 | 비즈니스 로직 | 구현 완료 | `types/index.ts` |
| F-051 | 매장 분류 판별 함수 (getStoreClass) | 비즈니스 로직 | 구현 완료 | `types/index.ts` |
| F-052 | 통화 포맷 함수 (억/만 단위) | 비즈니스 로직 | 구현 완료 | `PipelineList.tsx` |

---

## 5. 페이지별 기능 상세 정의

---

### F-001: 랜딩 페이지 진입 선택 화면

- **분류**: UI/UX > 화면 구성 > 초기 진입
- **상태**: 구현 완료
- **관련 소스**: `src/components/dashboard/LandingPage.tsx`

**설명**
앱 최초 진입 시 표시되는 전체화면 선택 화면. 화면을 좌우로 나눠 `EXPANSION`(매장 확장 관리)과 `PRISM`(사업 분석) 두 영역 중 하나를 선택하도록 유도합니다.

**입력**
- `onEnter(level1: string)` 콜백 함수 (부모 컴포넌트 `App.tsx`에서 전달)

**처리 로직**

| 동작 | 설명 |
|------|------|
| 마우스 올림 (hover) | 올라간 쪽의 너비가 `flex: 1.08`로 넓어지고 반대쪽은 `flex: 0.92`로 좁아짐 (500ms 트랜지션) |
| 마우스 올림 시 시각 효과 | 배경에 방사형 그라디언트 오버레이 (opacity: 0 → 1) 표시, 텍스트가 `scale(1.04)`, 자간 확장 |
| 마우스 클릭 | `onEnter('Expansion')` 또는 `onEnter('Prism')` 호출 → 메인 대시보드로 전환 |
| 텍스트 기본 상태 | `text-gray-400` (회색), 호버 시 `text-slate-900` (거의 검정) |

**출력**
- 시각적 호버 피드백 (너비 비율, 색상, 스케일 변화)
- 선택 시 `App.tsx`의 `showLanding` 상태 `false`로 변경 → 메인 화면 전환

**상수/값**
- 애니메이션 이이징: `cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- 트랜지션 duration: 400ms~500ms
- 폰트: Inter, Helvetica Neue, sans-serif
- 글자 크기: `text-[18px]`, QHD(2560px)에서 `text-[22px]`

**연관 기능**: F-002

---

### F-002: 3단계 계층형 네비게이션

- **분류**: UI/UX > 네비게이션 > 헤더
- **상태**: 구현 완료
- **관련 소스**: `src/components/dashboard/Header.tsx`, `src/App.tsx`

**설명**
앱 상단에 고정된 헤더 컴포넌트로, 3개 계층의 메뉴를 제공합니다.

**메뉴 구조 (MENU_STRUCTURE 상수 기반)**

```
Level 1 (최상위 탭)
├── Expansion          → Level 2로 이동
│   ├── Stores         → Level 3으로 이동
│   │   ├── Progress Board   (ProgressBoard 탭)
│   │   ├── Pipeline List    (PipelineList 탭)
│   │   ├── P&L              (PnL 탭)
│   │   ├── Schedule         (Schedule 탭)
│   │   └── Map              (Map 탭)
│   ├── Wholesale      → WholesaleOverview 탭 (Coming Soon)
│   └── Lens           → LensOverview 탭 (Coming Soon)
└── Prism              → Coming Soon
```

**처리 로직**

| 동작 | 설명 |
|------|------|
| Level 1 클릭 | `activeLevel1` 변경, Expansion 선택 시 기본 Level2=Stores, 탭=ProgressBoard로 설정 |
| Level 2 마우스 오버 | 해당 Level 2 키를 `hoveredLevel2`에 저장 → Level 3 드롭다운 표시 |
| Level 2 마우스 이탈 | 150ms 딜레이 타이머 후 드롭다운 닫힘 (타이머 관리로 갑작스러운 닫힘 방지) |
| Level 3 드롭다운 진입 | 닫힘 타이머 취소 (드롭다운 유지) |
| Level 3 탭 클릭 | `onLevel2Change` + `onTabChange` 동시 호출, 드롭다운 닫힘 |
| Level 2 직접 클릭 | 해당 Level 2의 첫 번째 Level 3 탭 자동 선택 |

**시각적 상태**

| 상태 | Level 1 스타일 | Level 2 스타일 | Level 3 스타일 |
|------|---------------|----------------|----------------|
| 비활성 | `text-gray-500`, 배경 없음 | `text-gray-400`, 하단 선 없음 | `text-gray-600` |
| 활성 | `bg-slate-900 text-white` (pill 형태) | `text-blue-600` + 파란 하단 밑줄 (border-b-2) | `bg-blue-50 text-blue-600` + 파란 점 |

**컴포넌트 수신 Props**

| Prop | 타입 | 설명 |
|------|------|------|
| `activeLevel1` | string | 현재 활성 Level 1 키 |
| `activeLevel2` | string | 현재 활성 Level 2 키 |
| `activeTab` | string | 현재 활성 탭 키 |
| `totalStores` | number (기본값: 110) | 헤더 우측에 표시할 매장 수 |
| `onLevel1Change` | function | Level 1 변경 핸들러 |
| `onLevel2Change` | function | Level 2 변경 핸들러 |
| `onTabChange` | function | 탭 변경 핸들러 |
| `onSettingsClick` | function | 설정 버튼 클릭 핸들러 |
| `onLogoClick` | function | 로고 클릭 핸들러 |

**연관 기능**: F-001, F-003, F-004, F-005, F-006, F-007

---

### F-003: 로고 클릭으로 랜딩 페이지 복귀

- **분류**: 네비게이션 > 초기화
- **상태**: 구현 완료
- **관련 소스**: `src/App.tsx` (handleLogoClick), `src/components/dashboard/Header.tsx`

**설명**
헤더의 "THE PAGES" 이미지 로고를 클릭하면 앱의 모든 상태를 초기값으로 리셋하고 랜딩 페이지로 돌아갑니다.

**처리 로직 (handleLogoClick)**
```
1. showLanding = true (랜딩 페이지 표시)
2. activeLevel1 = 'Expansion'
3. activeLevel2 = 'Stores'
4. activeTab = 'ProgressBoard'
5. selectedStore = null (선택 매장 해제)
6. filters = INITIAL_FILTERS (필터 초기화)
7. pipelineInitialStatus/Brand/Years/Country/Class = undefined (파이프라인 초기 필터 해제)
```

**연관 기능**: F-001, F-002

---

### F-004: Total Stores 카운터 표시

- **분류**: 데이터 표시 > 헤더 통계
- **상태**: 구현 완료
- **관련 소스**: `src/App.tsx` (totalIICCount useMemo), `src/components/dashboard/Header.tsx`

**설명**
헤더 우측에 현재 `Open` 상태인 IIC 브랜드 매장의 총 수를 실시간으로 표시합니다.

**처리 로직 (useMemo)**
```
조건: store.brandCategory === 'iic' || isIICBrand(store.brand)
      AND store.status === 'Open'
결과: 조건 충족 매장 수를 카운트하여 헤더에 전달
```

**출력 형식**: `toLocaleString()` 적용 (천 단위 구분자 포함)

---

### F-008 ~ F-011: ProgressBoard 필터 시스템

- **분류**: 데이터 필터링 > ProgressBoard
- **상태**: 구현 완료
- **관련 소스**: `src/components/dashboard/ProgressBoard.tsx` (CustomSelect 컴포넌트)

**설명**
ProgressBoard 상단에 위치한 4개의 필터. 커스텀 드롭다운(`CustomSelect`) 방식으로 구현되어 있으며, 선택 시 모든 차트와 카드가 실시간으로 업데이트됩니다.

**필터 목록**

| 기능 ID | 필터명 | 상태 변수 | 선택지 | 다중 선택 |
|---------|--------|-----------|--------|----------|
| F-008 | Brand 필터 | `selectedBrand` | All Brands, GM, TAM, NUD, ATS, NUF | 단일 |
| F-009 | Analysis Year 필터 | `selectedYears` | 현재 연도 기준 -5 ~ +10년 (16개) | **다중** |
| F-010 | Country 필터 | `selectedCountry` | 한국, 일본, 중국, 동남아, 미주, 유럽, 중동, 호주, 기타 | 단일 |
| F-011 | Class 필터 | `selectedClass` | All Classes, Type-based, Standalone | 단일 |

**CustomSelect 드롭다운 동작**
- 한 번에 하나의 드롭다운만 열림 (`openFilter` 상태로 관리)
- 드롭다운 외부 클릭 시 닫힘 (투명 오버레이 방식)
- 다중 선택(연도)의 경우 체크 아이콘으로 선택 상태 표시
- 드롭다운 열릴 때 `motion.div`로 scale + opacity 애니메이션
- 연도 선택 시 현재 선택된 항목으로 자동 스크롤

---

### F-012: 브랜드별 오픈 현황 요약 카드

- **분류**: 데이터 표시 > ProgressBoard > KPI 카드
- **상태**: 구현 완료
- **관련 소스**: `src/components/dashboard/ProgressBoard.tsx` (brandOpenStats useMemo, SummaryCard)

**설명**
5개 IIC 브랜드(GM, TAM, NUD, ATS, NUF)별로 현재 오픈 매장 수를 카드 형태로 표시합니다. 5개 카드가 가로 그리드로 배치됩니다.

**데이터 집계 로직 (brandOpenStats)**
```
각 브랜드별:
1. 국가 필터 + 매장 분류 필터 적용 (브랜드 필터 제외, 전 브랜드 비교 목적)
2. status === 'Open' 인 매장만 카운트
3. 올해 오픈한 매장 수 (ChangOpenDate 또는 openDate 기준) 계산
4. trend 값으로 "+{thisYear 오픈 수}" 반환
```

**카드 UI (SummaryCard 컴포넌트)**
- 높이: `h-40`
- 테두리 반경: `rounded-[1.5rem]`
- 진입 애니메이션: `motion.div` (opacity: 0→1, y: 20→0)
- 필터에서 선택되지 않은 브랜드 카드는 `opacity-20`으로 흐리게 표시
- 카드 클릭 시 `onNavigateToExpansion` 호출 (지도 뷰로 이동, 해당 브랜드+Open 상태 필터 적용)

---

### F-013: 파이프라인 상태별 요약 카드

- **분류**: 데이터 표시 > ProgressBoard > KPI 카드
- **상태**: 구현 완료
- **관련 소스**: `src/components/dashboard/ProgressBoard.tsx` (stats useMemo)

**설명**
파이프라인 5개 단계(Open, Construction, Signed, Confirmed, Planned)별 현재 매장 수를 카드로 표시합니다.

**데이터 집계 로직 (stats.counts)**
```
연도 매칭 기준: openDate 또는 contract.startDate의 연도가 selectedYears에 포함되는지 확인
- Planned: status === 'Plan' || 'Planned'
- Confirmed: status === 'Confirm' || 'Confirmed'
- Signed: status === 'Contract' || 'Signed'
- Construction: status === 'Space' || 'Construction'
- Open: iicStores.length (오픈일 기준 연도 필터 적용된 매장 수)
```

**카드별 색상 바 (왼쪽 세로 바)**

| 상태 | 색상 클래스 |
|------|------------|
| Open | `bg-[#7FC7D9]` |
| Construction | `bg-sky-500` |
| Signed | `bg-cyan-500` |
| Confirmed | `bg-[#c084fc]` |
| Planned | `bg-slate-400` |

**카드 클릭 동작**: Construction/Signed/Confirmed/Planned 카드 클릭 시 해당 상태 필터가 적용된 PipelineList로 이동 (F-020 참조)

---

### F-014 ~ F-016: 확장 목표 설정 모달 (GoalModal)

- **분류**: 비즈니스 로직 > 목표 관리
- **상태**: 구현 완료
- **관련 소스**: `src/components/dashboard/ProgressBoard.tsx` (GoalModal 컴포넌트)

**설명**
ProgressBoard 우측 상단의 데이터베이스 아이콘 버튼을 클릭하면 열리는 모달. 연도/국가/브랜드별 목표 매장 수를 설정하고 저장합니다.

**F-015: 목표 일괄 입력 그리드 (Batch Entry Grid)**

배치 입력 테이블 구조:

| 입력 필드 | 선택지 |
|-----------|--------|
| 연도 | 현재 연도 기준 -5 ~ +10년 (SELECT) |
| 나라 | 한국, 일본, 중국, 동남아, 미주, 유럽, 중동, 호주, 기타 (SELECT) |
| 브랜드별 목표 수 | GM / TAM / NUD / NUF / ATS (숫자 입력, 0이면 추가 제외) |

**F-016: 목표 목록 관리**

| 동작 | 처리 |
|------|------|
| 리스트에 추가 | target > 0 인 브랜드만 GoalEntry로 변환, 동일 연도+국가+브랜드 조합 존재 시 업데이트 |
| 목록 표시 | 연도+국가 기준 그룹화하여 테이블 표시 |
| 삭제 | 그룹 단위 삭제 (같은 연도+국가의 모든 브랜드 목표 삭제) |
| 저장 | `onSave(goals)` 콜백 호출 → ProgressBoard 상위 상태 업데이트 → 모달 닫힘 |
| 취소 | 변경사항 무시, 모달 닫힘 |

**GoalEntry 데이터 구조**

```typescript
interface GoalEntry {
  id: string;     // 고유 ID (Date.now() 기반)
  year: number;   // 목표 연도
  country: string; // 국가/지역 (한국어)
  brand: string;  // 브랜드명 (전체 이름)
  target: number; // 목표 매장 수
}
```

**브랜드 약칭 ↔ 전체 이름 매핑**

| 약칭 | 전체 이름 |
|------|---------|
| GM | Gentle Monster |
| TAM | Tamburins |
| NUD | Nudake |
| NUF | Nuflaat |
| ATS | Atiissu |

---

### F-017: 연도별 목표 vs 실적 적층 막대 차트

- **분류**: 데이터 시각화 > ProgressBoard > 차트 1
- **상태**: 구현 완료
- **관련 소스**: `src/components/dashboard/ProgressBoard.tsx` (targetVsOpenTrend useMemo, BarChart)

**설명**
선택된 연도(들)의 확장 목표(Target)와 실제 파이프라인 진행 현황(Open, Construction, Signed)을 적층 막대 차트로 비교합니다.

**차트 제목**: "Store Expansion Goals"

**차트 데이터 구성 (targetVsOpenTrend)**

| 데이터 키 | 계산 방식 | 색상 |
|-----------|---------|------|
| TargetTotal | 해당 연도 목표 수 + 이전 연도 오픈 누적 수 | `#E2E8F0` (회색) |
| OpenCurr | 해당 연도에 오픈한 매장 수 | `#38BDF8` (파란색) |
| Construction | 해당 연도 공사 중 매장 수 | `#BAE6FD` (연파란색) |
| Signed | 해당 연도 계약 완료 매장 수 | `#F1F5F9` (연회색) |

**동적 바 크기 조정 (dynamicBarSize)**

| 선택된 연도 수 | 바 너비(px) |
|--------------|------------|
| 1개 | 320 |
| 2개 | 240 |
| 3개 | 180 |
| 4~5개 | 120 |
| 6~8개 | 80 |
| 9개 이상 | 60 |

**툴팁 동작**
- 바 위에 마우스 올리면 해당 연도의 Open/Construction/Signed 매장 목록이 스크롤 가능한 팝업으로 표시
- 팝업 내 매장 이름 클릭 시 `onNavigateToStoreDetail` 콜백 호출 (지도 뷰로 이동)
- 팝업 스타일: `rounded-[3rem]`, `min-w-[320px]`, `max-w-[400px]`

**바 내부 레이블**
- TargetTotal 바: 중앙에 "TARGET" 텍스트 + 목표 숫자 (흰색 배경 바의 회색 텍스트)
- OpenCurr 바: "{연도} OPEN ({수}" 형식 (흰색 텍스트)
- Construction 바: "CONSTRUCTION ({수})" 형식
- Signed 바: "SIGNED ({수})" 형식

---

### F-018: 국가별 확장 현황 복합 차트

- **분류**: 데이터 시각화 > ProgressBoard > 차트 2
- **상태**: 구현 완료
- **관련 소스**: `src/components/dashboard/ProgressBoard.tsx` (expansionByCountry useMemo, ComposedChart)

**설명**
9개 지역(한국, 일본, 중국, 동남아, 미주, 유럽, 중동, 호주, 기타)별로 오픈 매장 수와 목표 대비 진행률을 복합 차트(막대+라인)로 표시합니다.

**차트 제목**: "Expansion by Country"

**차트 구성**

| 요소 | 데이터 키 | 유형 | 색상 |
|------|---------|------|------|
| 오픈 매장 | Open | 적층 막대 (하단) | `#7FC7D9` (청록) |
| 목표 미달성 | Remaining (= Total - Open) | 적층 막대 (상단) | `#CBD5E1` (슬레이트) |
| 진행률 | progress (%) | 라인 차트 (오른쪽 Y축) | `#2563EB` (파란색) |

**툴팁**: 해당 국가의 오픈 수, 목표 수, 진행률(%) + 오픈 매장 이름 목록

---

### F-019: 국가별 파이프라인 상태 매트릭스 테이블

- **분류**: 데이터 시각화 > ProgressBoard > 테이블
- **상태**: 구현 완료
- **관련 소스**: `src/components/dashboard/ProgressBoard.tsx` (statusGridData useMemo)

**설명**
국가별로 파이프라인 각 단계(Open, Construction, Signed, Confirmed, Planned)의 매장 수를 표(행렬) 형태로 표시합니다.

**테이블 구조**

| 열 | 내용 |
|----|------|
| Country | 지역명 (한국어) |
| Target | GoalModal에서 설정한 목표 수 |
| Open | 오픈 매장 수 + 달성률(%) |
| Construction | 공사 중 매장 수 |
| Signed | 계약 완료 매장 수 |
| Confirmed | 확정 매장 수 |
| Planned | 계획 중 매장 수 |

**합계 행 (tfoot)**: 각 열의 합계를 굵은 글씨로 표시, 목표는 파란색, 각 상태별 색상 적용

**오픈 셀 클릭**: 해당 국가 첫 번째 오픈 매장의 상세 패널로 이동 (`onNavigateToStoreDetail`)

**상태 정규화 로직**
- `space` / `construction` → `Construction`
- `contract` / `signed` → `Signed`
- `confirm` / `confirmed` / `negotiation` → `Confirmed`
- `plan` / `planed` / `planned` → `Planned`

---

### F-020: ProgressBoard → PipelineList 연계 네비게이션

- **분류**: 네비게이션 > 탭 간 연계
- **상태**: 구현 완료
- **관련 소스**: `src/App.tsx` (handleNavigateToPipelineList), `src/components/dashboard/ProgressBoard.tsx`

**설명**
ProgressBoard의 상태별 카드를 클릭하면, 해당 상태 필터가 미리 적용된 상태로 PipelineList 탭으로 이동합니다.

**전달되는 초기 필터 값**

| 변수명 | 전달 내용 |
|--------|---------|
| `pipelineInitialStatus` | 클릭한 파이프라인 상태 ('Construction', 'Signed' 등) |
| `pipelineInitialBrand` | 현재 선택된 브랜드 (All Brands면 undefined) |
| `pipelineInitialYears` | 현재 선택된 연도 목록 |
| `pipelineInitialCountry` | 현재 선택된 국가 (All Countries면 undefined) |
| `pipelineInitialClass` | 현재 선택된 분류 (All Classes면 undefined) |

**초기화 동작**: PipelineList를 떠나 다른 탭으로 이동 시 모든 초기 필터 값 `undefined`로 초기화

---

### F-021 ~ F-028: PipelineList 필터 시스템

- **분류**: 데이터 필터링 > PipelineList
- **상태**: 구현 완료
- **관련 소스**: `src/components/dashboard/PipelineList.tsx`

**설명**
파이프라인 테이블 상단의 7개 필터. ProgressBoard에서 초기 필터를 전달받아 진입할 수 있으며, 독립적으로도 조작 가능합니다.

**필터 목록 및 구현 방식**

| 기능 ID | 필터명 | 구현 방식 | 상태 변수 | 다중 선택 |
|---------|--------|----------|----------|---------|
| F-021 | 국가 (Country) | 커스텀 드롭다운 (검색 입력 포함) | `selectedCountry` (배열) | **다중** |
| F-022 | 도시 (City) | HTML select | `selectedCity` | 단일 |
| F-023 | 브랜드 (Brand) | HTML select | `selectedBrand` | 단일 |
| F-024 | 파이프라인 상태 | HTML select | `selectedStatus` | 단일 |
| F-025 | 채널 유형 (Channel) | HTML select | `selectedChannel` | 단일 |
| F-026 | 분석 연도 | 커스텀 드롭다운 | `selectedAnalysisYears` (배열) | **다중** |
| F-027 | 매장 분류 (Class) | HTML select | `selectedClass` | 단일 |

**F-028: 필터 초기화**
- 활성 필터가 하나라도 있을 때 X 버튼 표시
- 클릭 시 모든 필터를 기본값(all/빈 배열)으로 초기화

**도시 필터 연동**: 국가 필터 선택 시 해당 국가에 속한 도시만 도시 필터에 표시

---

### F-029 ~ F-030: PipelineList 정렬 기능

- **분류**: 데이터 정렬 > PipelineList
- **상태**: 구현 완료
- **관련 소스**: `src/components/dashboard/PipelineList.tsx`

**정렬 가능 컬럼**

| 정렬 키 | 컬럼명 | 정렬 기준 |
|---------|--------|---------|
| `country` | 국가 | getRegionRank() 지역 순서 (한국=1, 일본=2, 중국=3, 동남아=4, 미주=5, 유럽=6, 중동=7, 호주=8) |
| `city` | 도시 | 도시명 알파벳 |
| `name` | 매장명 | 매장명 알파벳 |
| `brand` | 브랜드 | 브랜드명 알파벳 |
| `openDate` | 예상 오픈일 | 날짜 문자열 비교 |
| `area` | 면적 | 숫자 비교 |
| `channel` | 채널 | 채널명 알파벳 |
| `status` | 상태 | 상태명 알파벳 |
| `sales` | 예상 매출 | estimatedSales 또는 monthlySales |
| `capex` | 투자비 | investment 값 |
| `margin` | 예상 영업이익률 | estimatedMargin 또는 expectedOperatingProfitRatio |

**정렬 순환 방식**: 클릭 1회 → 오름차순, 클릭 2회 → 내림차순, 클릭 3회 → 정렬 해제 (기본 정렬 복귀)

**F-030 기본 정렬**: 지역 순서(`getRegionRank`) → 오픈 예정일 순

---

### F-031: PipelineList 매장 목록 테이블 표시

- **분류**: 데이터 표시 > PipelineList > 테이블
- **상태**: 구현 완료
- **관련 소스**: `src/components/dashboard/PipelineList.tsx`

**테이블 컬럼 구성**

| 컬럼 | 데이터 소스 | 비고 |
|------|-----------|------|
| 국가 | `store.location.country` | 클릭 시 지도 국가 필터 연계 (F-034) |
| 도시 | `store.location.city` | |
| 매장명 | `store.name` | 클릭 시 지도 상세 패널 연계 (F-033) |
| 브랜드 | `store.brand` | |
| 예상 오픈일 | `openDate` 또는 `ChangOpenDate` 또는 `contract.startDate` (우선순위 순) | |
| 면적 | `store.size` 또는 `store.area` | |
| 채널 | `store.type` | FS, Mall, Department Store 등 |
| Class | `getStoreClass(store.type)` 반환값 | 배지(badge): Type-based=보라, Standalone=청록 |
| 상태 (단계) | `store.status` | 상태별 배지 색상 적용 |
| 예상 월 매출액 | `estimatedSales` 또는 `monthlySales` | 억/만 단위 포맷 |
| 투자비 | `financial.investment` | 억/만 단위 포맷 |
| 예상 영업이익률 | `estimatedMargin` 또는 `expectedOperatingProfitRatio` | `{수치}%` 형식 |

**상태 배지 색상**

| 상태 | 배경색 | 텍스트색 |
|------|--------|---------|
| Open | `bg-emerald-100` | `text-emerald-800` |
| Construction / Space | `bg-blue-100` | `text-blue-800` |
| Signed / Contract | `bg-pink-100` | `text-pink-800` |
| Confirmed / Confirm | `bg-indigo-100` | `text-indigo-800` |
| Reject | `bg-red-100` | `text-red-800` |
| Pending | `bg-orange-100` | `text-orange-800` |
| 기타 | `bg-slate-100` | `text-slate-800` |

**파이프라인 대상 상태**: Plan, Planned, Confirmed, Signed, Construction, Space, Contract, Reject, Pending (Open 제외, IIC 브랜드만 표시)

---

### F-032: PipelineList 합계 행

- **분류**: 데이터 집계 > PipelineList
- **상태**: 구현 완료
- **관련 소스**: `src/components/dashboard/PipelineList.tsx`

**설명**
필터 적용 결과 표시된 매장들의 합계를 테이블 하단에 표시합니다.

| 항목 | 계산 방식 |
|------|---------|
| 총 파이프라인 수 | 필터링된 매장 수 |
| 예상 월 매출액 합계 | `estimatedSales` 또는 `monthlySales`의 합 |
| 투자비 합계 | `financial.investment`의 합 |

---

## 6. 공통 컴포넌트 분석

---

### C-001: ComingSoon 컴포넌트

- **분류**: UI/UX > 플레이스홀더
- **상태**: 구현 완료
- **관련 소스**: `src/components/dashboard/ComingSoon.tsx`

**설명**
아직 개발되지 않은 화면(P&L, Schedule, Map, Dashboard, Wholesale, Lens, Prism)에 표시되는 안내 컴포넌트.

**Props**

| Prop | 타입 | 설명 |
|------|------|------|
| `pageName` | string (옵션) | 표시할 페이지 이름. 미전달 시 "Coming Soon" 표시 |

**렌더링**: `FileText` 아이콘 + 페이지명 + "이 페이지는 곧 공개될 예정입니다." 안내 문구

---

### C-002: SummaryCard 컴포넌트

- **분류**: UI/UX > 카드
- **상태**: 구현 완료
- **관련 소스**: `src/components/dashboard/ProgressBoard.tsx` (내부 컴포넌트)

**설명**
ProgressBoard에서 브랜드별/상태별 매장 수를 표시하는 카드 컴포넌트. `motion.div`로 구현되어 진입 애니메이션이 적용됩니다.

**Props**

| Prop | 타입 | 설명 |
|------|------|------|
| `title` | string | 카드 상단 레이블 |
| `value` | string | 메인 숫자 값 |
| `trend` | string | 증감 표시 문자열 |
| `isPositive` | boolean | 증감 방향 |
| `bgColor` | string | 배경 색상 클래스 (기본: `bg-white`) |
| `textColor` | string | 텍스트 색상 클래스 |
| `barColor` | string (옵션) | 왼쪽 색상 바 클래스 |
| `onClick` | function (옵션) | 클릭 핸들러 |

**애니메이션**: `initial={{ opacity: 0, y: 20 }}` → `animate={{ opacity: 1, y: 0 }}`

---

### C-003: CustomSelect 컴포넌트

- **분류**: UI/UX > 폼 > 드롭다운
- **상태**: 구현 완료
- **관련 소스**: `src/components/dashboard/ProgressBoard.tsx` (내부 컴포넌트)

**설명**
ProgressBoard 필터에 사용되는 커스텀 스타일 드롭다운 컴포넌트. Pill 형태 스타일, 애니메이션 드롭다운, 다중 선택 지원.

**Props**

| Prop | 타입 | 설명 |
|------|------|------|
| `label` | string | 드롭다운 상단 레이블 |
| `value` | string \| number[] | 현재 선택값 |
| `options` | (string \| number)[] | 선택 가능한 옵션 목록 |
| `onChange` | function | 변경 핸들러 |
| `icon` | React.ElementType | 오른쪽 아이콘 컴포넌트 |
| `id` | string | 드롭다운 식별자 (openFilter 상태에 사용) |
| `minWidth` | string | 최소 너비 (기본: '200px') |
| `multiple` | boolean | 다중 선택 여부 (기본: false) |

---

### C-004: shadcn/ui 기반 UI 컴포넌트 라이브러리

- **분류**: UI/UX > 공통 컴포넌트
- **상태**: 설치 완료 (일부 미사용)
- **관련 소스**: `src/components/ui/` (20개 파일)

**구현된 UI 컴포넌트 목록**

| 컴포넌트 | 파일 | 기반 라이브러리 | 실제 사용 |
|---------|------|--------------|---------|
| Button | `button.tsx` | Radix Slot + CVA | 일부 사용 |
| Card, CardHeader, CardTitle 등 | `card.tsx` | 자체 구현 | 일부 사용 |
| Badge | `badge.tsx` | Radix Slot + CVA | 미사용 (직접 span 사용) |
| Dialog, DialogContent 등 | `dialog.tsx` | @radix-ui/react-dialog | 미사용 (GoalModal 자체 구현) |
| Progress | `progress.tsx` | @radix-ui/react-progress | 미사용 |
| Select, SelectTrigger 등 | `select.tsx` | @radix-ui/react-select | 미사용 (직접 HTML select 사용) |
| Avatar | `avatar.tsx` | @radix-ui/react-avatar | 미사용 |
| Checkbox | `checkbox.tsx` | @radix-ui/react-checkbox | 미사용 |
| Command | `command.tsx` | cmdk | 미사용 |
| Drawer | `drawer.tsx` | vaul | 미사용 |
| DropdownMenu | `dropdown-menu.tsx` | @radix-ui/react-dropdown-menu | 미사용 |
| Form | `form.tsx` | react-hook-form | 미사용 |
| Input | `input.tsx` | 자체 구현 | 미사용 |
| Label | `label.tsx` | @radix-ui/react-label | 미사용 |
| Popover | `popover.tsx` | @radix-ui/react-popover | 미사용 |
| ScrollArea | `scroll-area.tsx` | @radix-ui/react-scroll-area | 미사용 |
| Separator | `separator.tsx` | @radix-ui/react-separator | 미사용 |
| Sheet | `sheet.tsx` | @radix-ui/react-dialog (응용) | 미사용 |
| Tabs | `tabs.tsx` | @radix-ui/react-tabs | 미사용 |
| Tooltip | `tooltip.tsx` | @radix-ui/react-tooltip | 미사용 |

---

### C-005: cn() 유틸리티 함수

- **분류**: 시스템 > 유틸리티
- **상태**: 구현 완료
- **관련 소스**: `src/utils/cn.ts`, `src/components/ui/utils.ts`

**설명**
Tailwind CSS 클래스들을 조건부로 결합하고 충돌을 자동 해결하는 헬퍼 함수. 두 파일에 동일한 구현이 있음(하나는 비즈니스 컴포넌트용, 하나는 shadcn/ui용).

```typescript
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

---

## 7. 데이터 모델 분석

---

### 7.1 Store (매장) 데이터 모델

**파일**: `src/types/index.ts`

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| `id` | string | 필수 | 매장 고유 식별자 (UUID 형식) |
| `name` | string | 필수 | 매장 이름 |
| `brand` | string | 필수 | 브랜드명 |
| `type` | string | 필수 | 채널 유형 (FS, Mall, Department Store, Duty Free, Premium Outlet, Pop-up, Haus) |
| `location.city` | string | 필수 | 도시명 |
| `location.country` | string | 필수 | 국가명 (영어) |
| `location.lat` | number | 필수 | 위도 |
| `location.lng` | number | 필수 | 경도 |
| `status` | string | 필수 | 파이프라인 상태 (아래 참조) |
| `statusYear` | number | 선택 | 상태가 기록된 연도 |
| `brandCategory` | 'iic' \| 'competitor' \| 'preferred' | 선택 | 브랜드 카테고리 |
| `openDate` | string | 선택 | 예상/실제 오픈일 (YYYY-MM-DD) |
| `ChangOpenDate` | string | 선택 | 변경된 오픈일 |
| `ChangCloseDate` | string | 선택 | 변경된 폐점일 |
| `size` | string | 선택 | 매장 규모 문자열 (예: '200sqm') |
| `area` | number | 선택 | 매장 면적 (sqm) |
| `rent` | string | 선택 | 임대료 정보 문자열 |
| `contract.startDate` | string | 선택 | 계약 시작일 |
| `contract.endDate` | string | 선택 | 계약 종료일 |
| `contract.renewalOption` | boolean | 선택 | 갱신 옵션 여부 |
| `contract.documentUrl` | string | 선택 | 계약서 파일 URL |
| `financial.monthlyRent` | number | 선택 | 월 임대료 |
| `financial.currency` | string | 선택 | 통화 (KRW, USD, JPY 등) |
| `financial.monthlySales` | number | 선택 | 월 매출 |
| `financial.salesPerSqm` | number | 선택 | 평방미터당 매출 |
| `financial.investment` | number | 선택 | 총 투자비 |
| `financial.investmentInterior` | number | 선택 | 인테리어 투자비 |
| `financial.investmentFurniture` | number | 선택 | 가구 투자비 |
| `financial.investmentFacade` | number | 선택 | 파사드 투자비 |
| `financial.investmentOther` | number | 선택 | 기타 투자비 |
| `financial.deposit` | number | 선택 | 보증금 |
| `financial.rentType` | 'fixed' \| 'commission' | 선택 | 임대 방식 |
| `financial.rentCommission` | number | 선택 | 수수료율 (%) |
| `financial.expectedOperatingProfitRatio` | number | 선택 | 예상 영업이익률 (%) |
| `financial.estimatedSales` | number | 선택 | 예상 월 매출 (파이프라인용) |
| `financial.estimatedMargin` | number | 선택 | 예상 마진율 (%) |
| `financial.yearlySales` | {year, amount}[] | 선택 | 연도별 매출 데이터 |
| `images.front` | string | 선택 | 정면 사진 URL |
| `images.side` | string | 선택 | 측면 사진 URL |
| `images.interior` | string | 선택 | 내부 사진 URL |
| `images.floorplan` | string | 선택 | 평면도 URL |
| `negotiationHistory` | {date, notes, user}[] | 선택 | 협상 이력 |

---

### 7.2 파이프라인 상태 값

**파일**: `src/types/index.ts`

| 상태값 | 의미 | 정규화 후 |
|--------|------|---------|
| Plan | 계획 단계 | Planned |
| Planned | 계획 단계 (동의어) | Planned |
| Confirm | 확인/협의 단계 | Confirmed |
| Confirmed | 확인/협의 단계 (동의어) | Confirmed |
| Contract | 계약 완료 | Signed |
| Signed | 계약 완료 (동의어) | Signed |
| Space | 공간 준비/공사 | Construction |
| Construction | 공사 중 (동의어) | Construction |
| Open | 오픈 완료 | Open |
| Close | 폐점 | Close |
| Reject | 거절 (파이프라인 전용) | - |
| Pending | 보류 (파이프라인 전용) | - |

---

### 7.3 FilterState (필터 상태) 데이터 모델

**파일**: `src/types/index.ts`

| 필드명 | 타입 | 초기값 | 설명 |
|--------|------|--------|------|
| `status` | string[] | ['Open', 'Construction', 'Signed', 'Confirmed', 'Planned'] | 파이프라인 상태 필터 |
| `brand` | string[] | ['Gentle Monster', 'Tamburins', 'Nudake', 'Atiissu', 'Nuflaat'] | IIC 브랜드 필터 |
| `channel` | string[] | [전체 채널 목록] | 채널 유형 필터 |
| `country` | string[] | [전체 지역 목록] | 국가/지역 필터 |
| `storeClass` | string[] | ['Type-based', 'Standalone'] | 매장 분류 필터 |
| `competitorBrands` | string[] | [] | 경쟁사 브랜드 필터 |
| `preferredBrands` | string[] | [] | 선호/인접 브랜드 필터 |
| `smartGlass` | string[] | [] | 스마트 글라스 브랜드 필터 |
| `dataLayers` | string[] | [] | 지도 데이터 레이어 |

---

### 7.4 BrandDefinition (브랜드 정의) 데이터 모델

**파일**: `src/types/index.ts`

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `name` | string | 브랜드명 |
| `logo` | string (선택) | 브랜드 로고 URL 또는 base64 |
| `markerImage` | string (선택) | 지도 마커 이미지 URL 또는 base64 |

---

### 7.5 정적 데이터 (stores.ts)

**파일**: `src/app/data/stores.ts`

**IIC_STORES**: 실제 IIC 매장 샘플 데이터

| 매장 ID | 브랜드 | 위치 | 상태 | 오픈일 |
|---------|--------|------|------|--------|
| gm-seoul-garosu | Gentle Monster | 서울, 한국 | Open | 2018-03-15 |
| gm-tokyo-omotesando | Gentle Monster | 도쿄, 일본 | Open | 2020-11-20 |
| gm-shanghai-xintiandi | Gentle Monster | 상하이, 중국 | Open | 2019-06-01 |
| gm-ny-soho | Gentle Monster | 뉴욕, 미국 | Open | 2021-09-15 |
| gm-paris-marais | Gentle Monster | 파리, 프랑스 | Open | 2022-04-20 |
| gm-dubai-mall | Gentle Monster | 두바이, UAE | Construction | 예정 2026-03-01 |
| gm-london-covent | Gentle Monster | 런던, 영국 | Signed | 예정 2025-12-01 |
| gm-singapore-orchard | Gentle Monster | 싱가포르 | Confirmed | 예정 2026-06-01 |
| gm-sydney-pitt | Gentle Monster | 시드니, 호주 | Planned | 예정 2026-09-01 |
| tb-seoul-hannam | Tamburins | 서울, 한국 | Open | 2021-05-10 |
| tb-tokyo-shibuya | Tamburins | 도쿄, 일본 | Open | 2022-08-20 |
| tb-hk-central | Tamburins | 홍콩, 중국 | Signed | 예정 2025-11-01 |
| nd-seoul-seongsu | Nudake | 서울, 한국 | Open | 2021-10-01 |
| nd-tokyo-ginza | Nudake | 도쿄, 일본 | Construction | 예정 2025-12-15 |

**INITIAL_COMPETITOR_BRANDS** (경쟁사 브랜드 초기 목록)
- RayBan, Aesop, Pesade, London Bagel Museum, Matin Kim, Polga

**INITIAL_PREFERRED_BRANDS** (선호/인접 브랜드 초기 목록)
- Acne Studios, Adidas, Alexander Wang, ALO, Ami, Apple, Balenciaga, Bottega Veneta, Burberry, Cartier, Celine, Chanel, Dior, Gucci, Hermes, Louis Vuitton, Lululemon, Miu Miu, Nike, PRADA

**REGION_MAPPING** (국가명 → 한국어 지역명 변환 테이블)

| 지역 레이블 | 포함 키워드 |
|-----------|---------|
| 한국 | South Korea, Korea, Seoul, Busan, Daegu, Incheon |
| 일본 | Japan, Tokyo, Osaka, Kyoto, Fukuoka, Nagoya |
| 중국 | China, Hong Kong, Taiwan, Macau, Shanghai, Beijing, Chengdu |
| 동남아 | Singapore, Thailand, Vietnam, Malaysia, Indonesia, Philippines, Bangkok, Ho Chi Minh |
| 미주 | USA, Canada, Mexico, United States, America, New York, Los Angeles, Miami |
| 유럽 | UK, France, Germany, Italy, Spain, Europe, United Kingdom, London, Paris, Berlin, Milan |
| 중동 | UAE, Saudi Arabia, Dubai, Middle East, Qatar, Kuwait |
| 호주 | Australia, New Zealand, Sydney, Melbourne |
| 기타 | India, Brazil, Argentina, South Africa, Russia, Unknown |

---

## 8. 상수 및 설정 값

---

### 8.1 네비게이션 타입 정의

**파일**: `src/types/index.ts`

```typescript
type Level1Key = 'Expansion' | 'Prism';
type Level2Key = 'Stores' | 'Wholesale' | 'Lens' | '';
type TabKey = 'ProgressBoard' | 'PipelineList' | 'PnL' | 'Schedule' | 'Map' | 'Store Info' | 'Dashboard' | 'WholesaleOverview' | 'LensOverview' | '';
```

---

### 8.2 파이프라인 상태 색상 매핑

**파일**: `src/types/index.ts` (`PIPELINE_STATUS_COLORS`)

| 상태 | 색상 코드 | 색상 설명 |
|------|---------|---------|
| Plan / Planned | `#64748B` | 슬레이트 회색 |
| Confirm / Confirmed | `#9694FF` | 보라 |
| Contract / Signed | `#EE99C2` | 핑크 |
| Space / Construction | `#0ea5e9` | 하늘색 |
| Open | `#7FC7D9` | 청록 |
| Close | `#94a3b8` | 연회색 |

---

### 8.3 IIC 브랜드 목록

**파일**: `src/types/index.ts` (`IIC_BRANDS_LOWERCASE`)

```
'gentle monster', 'tamburins', 'nudake', 'atiissu', 'nuflaat'
```

---

### 8.4 매장 채널 분류

**파일**: `src/types/index.ts`

| 채널 | 분류 (StoreClass) |
|------|-----------------|
| Department Store | Type-based |
| Mall | Type-based |
| Duty Free | Type-based |
| Premium Outlet | Type-based |
| FS (Flagship Store) | Standalone |
| Pop-up | Standalone |
| Haus | Standalone |

---

### 8.5 글로벌 CSS 변수 (디자인 토큰)

**파일**: `src/index.css`

| 변수명 | 값 | 용도 |
|--------|-----|------|
| `--color-bg-primary` | #f8f9fb | 페이지 배경 |
| `--color-bg-card` | #ffffff | 카드 배경 |
| `--color-status-plan` | #64748B | Plan 상태 |
| `--color-status-confirm` | #9694FF | Confirm 상태 |
| `--color-status-contract` | #EE99C2 | Contract 상태 |
| `--color-status-space` | #0ea5e9 | Space 상태 |
| `--color-status-open` | #7FC7D9 | Open 상태 |
| `--color-text-primary` | #0f172a | 주요 텍스트 |
| `--color-text-secondary` | #64748b | 보조 텍스트 |
| `--color-text-muted` | #94a3b8 | 흐린 텍스트 |
| `--color-border` | #e2e8f0 | 기본 테두리 |
| `--font-primary` | Inter, Noto Sans KR, Noto Sans | 기본 폰트 |
| `--font-display` | Outfit, Inter | 디스플레이 폰트 |

---

### 8.6 반응형 폰트 스케일

**파일**: `src/index.css`, `src/App.tsx`

| 화면 너비 | 기본 폰트 크기 |
|---------|-------------|
| ~1439px | 13px |
| 1440px~ | 14px |
| 1920px~ (FHD) | 15px |
| 2560px~ (QHD) | 16px |

---

### 8.7 커스텀 CSS 애니메이션

**파일**: `src/index.css`

| 애니메이션 클래스 | 동작 |
|----------------|------|
| `.slide-in-from-right` | 오른쪽에서 슬라이드인 (상세 패널 등장용) |
| `.fade-in` | 위에서 아래로 페이드인 (opacity 0→1, Y 4px→0) |
| `.slide-in-from-top` | 위에서 아래로 슬라이드 (드롭다운용) |
| `.animate-in` | 200ms, cubic-bezier(0.25, 0.46, 0.45, 0.94) |

---

## 9. 미구현 및 계획 기능

---

### 9.1 미구현 뷰 (ComingSoon 플레이스홀더)

| 기능 ID | 기능명 | 현재 상태 | 비고 |
|---------|--------|---------|------|
| F-039 | P&L View (손익계산서) | `ComingSoon` 표시 | 탭 키: `PnL` |
| F-040 | Schedule View (일정 캘린더) | `ComingSoon` 표시 | 탭 키: `Schedule` |
| F-041 | Map View (지도) | `ComingSoon` 표시 + "Google Maps 연동 예정" | 탭 키: `Map`, `Store Info` |
| F-042 | Dashboard View | `ComingSoon` 표시 | 탭 키: `Dashboard` |
| F-043 | Wholesale 섹션 | `ComingSoon` 표시 | Level 2: `Wholesale` |
| F-044 | Lens 섹션 | `ComingSoon` 표시 | Level 2: `Lens` |
| F-045 | Prism 섹션 전체 | `ComingSoon` 표시 | Level 1: `Prism` |

---

### 9.2 코드에 주석 처리된 미구현 기능

**파일**: `src/App.tsx`

```tsx
{/* TODO: SettingsDialog 컴포넌트 추가 예정 */}
{/* <SettingsDialog
    open={isSettingsOpen}
    onOpenChange={setIsSettingsOpen}
    competitorBrands={competitorBrandsList}
    preferredBrands={preferredBrandsList}
    onUpdateCompetitorBrands={setCompetitorBrandsList}
    onUpdatePreferredBrands={setPreferredBrandsList}
  /> */}
```

| 기능 ID | 기능명 | 예정 기능 |
|---------|--------|---------|
| F-046 | Settings Dialog | 경쟁사 브랜드 목록 관리, 선호/인접 브랜드 목록 관리 |

---

### 9.3 구조는 있으나 연결되지 않은 기능

| 항목 | 현재 상태 | 필요한 작업 |
|------|---------|----------|
| 알림 (Bell 버튼) | 버튼 UI만 존재, 클릭 핸들러 없음 | 알림 목록 기능 구현 |
| 사용자 아바타 ("IIC" 이니셜) | UI만 존재, 로그인 연동 없음 | 인증 시스템 연동 |
| 매장 클릭 → 상세 패널 | 콜백은 구현되어 있으나 Map View 미구현 | Map View 및 StoreDetail 패널 구현 |
| 국가 클릭 → 지도 필터 | 콜백은 구현되어 있으나 Map View 미구현 | Map View 구현 및 Google Maps 연동 |
| `_selectedStore` 상태 | 선언되어 있으나 렌더링에 미사용 | StoreDetail 패널 컴포넌트 연결 |
| `_searchQuery` 상태 | 선언되어 있으나 검색 UI 없음 | 검색 입력 UI 및 필터 로직 연결 |
| `_filters` 상태 | 선언되어 있으나 Map View에만 활용 예정 | 사이드바 필터 컴포넌트 구현 |
| `@react-google-maps/api` | 설치됨 | Google Maps 지도 뷰 구현 |
| `react-day-picker` | 설치됨 | Schedule View 캘린더 구현 |
| `recharts` 추가 차트 | 설치됨 | Dashboard View 차트 구현 |
| `react-hook-form` | 설치됨 | 폼이 있는 화면(SettingsDialog 등) 구현 |

---

### 9.4 에이전트 메모리에 기록된 계획 기능

**파일**: `.claude/agent-memory/clean-code-architect/MEMORY.md`

| 항목 | 내용 |
|------|------|
| PnLView | 손익계산서 뷰 |
| ScheduleView | 캘린더 뷰 |
| MapCanvas | Google Maps 연동 지도 뷰 |
| StoreDetail | 오픈 매장 상세 패널 |
| CandidateStoreDetail | 파이프라인 후보 매장 상세 패널 |
| DashboardView | 분석 차트 뷰 |
| Sidebar | 필터 + 매장 목록 사이드바 |
| SettingsDialog | 경쟁사/선호 브랜드 설정 다이얼로그 |

---

*이 문서는 2026-02-27 기준 소스코드를 철저히 분석하여 작성되었습니다. 추측이나 가정 없이 실제 구현된 코드만을 기준으로 작성하였습니다.*