# IIC THE PAGES Frontend - 프로젝트 메모리

## 프로젝트 개요
- **목적**: IIC(젠틀몬스터 등) 글로벌 매장 파이프라인 관리 대시보드 프론트엔드
- **레퍼런스**: `~/Downloads/PB(Pipeline Board)_1080/` (동일 구조/디자인 목표)
- **경로**: `/Users/hanhyeji/IdeaProjects/iic-the-pages-frontend`

## 기술 스택
- React 18.3 + TypeScript + Vite 6 + SWC
- Tailwind CSS v4 (`@tailwindcss/vite` 플러그인 방식)
- shadcn/ui (Radix UI 기반) - `src/components/ui/`
- Recharts (차트), lucide-react (아이콘), motion (애니메이션)
- react-hook-form, sonner (toast), cmdk, vaul

## 디렉토리 구조
```
src/
├── App.tsx              # 최상위 앱 컴포넌트 (네비게이션 상태 관리)
├── main.tsx             # 앱 진입점
├── index.css            # 글로벌 스타일 (Google Fonts + Tailwind v4)
├── types/index.ts       # 공통 타입 정의 (Store, FilterState 등)
├── components/
│   ├── dashboard/       # 비즈니스 컴포넌트
│   └── ui/              # shadcn/ui 컴포넌트
├── utils/cn.ts          # tailwind-merge + clsx 유틸
├── hooks/               # 커스텀 훅 (추후 추가)
├── app/data/stores.ts   # 정적 데이터 (샘플 매장 데이터)
└── assets/              # 이미지 등
```

## 핵심 패턴 & 컨벤션

### 네이밍
- 컴포넌트: PascalCase (`LandingPage`, `ProgressBoard`)
- 파일: kebab-case (UI), PascalCase (컴포넌트)
- 상태: camelCase (`activeLevel1`, `showLanding`)
- 상수: SCREAMING_SNAKE_CASE (`PIPELINE_STATUS_COLORS`, `INITIAL_FILTERS`)

### CLAUDE.md 필수 규칙
1. 스타일링: Tailwind CSS (Vanilla CSS 선호)
2. 상태 관리: React Hook (useState, useMemo 등)
3. 아이콘: lucide-react
4. 데이터: `src/app/data/` 경로 정적 데이터
5. 모든 코드에 한국어 주석 (비전공자도 이해 가능)
6. 디자인: rounded-[32px]/[40px], bg-[#f8f9fb] + white 카드, shadow-sm
7. 커밋: 한국어 메시지, author=`hanhyeji9384 <gpwl3489@gmail.com>`

### 파이프라인 상태 색상 (types/index.ts의 PIPELINE_STATUS_COLORS)
- Plan/Planned: `#64748B` (슬레이트)
- Confirm/Confirmed: `#9694FF` (퍼플)
- Contract/Signed: `#EE99C2` (핑크)
- Space/Construction: `#0ea5e9` (하늘색)
- Open: `#7FC7D9` (청록)

### 상태 정규화 매핑
구 상태 → 신 상태 (컴포넌트마다 normalizeStatus() 함수 사용)
- Plan → Planned, Confirm → Confirmed, Contract → Signed, Space → Construction

### 네비게이션 구조 (3단계)
- Level 1: Expansion / Prism
- Level 2 (Expansion): Stores / Wholesale / Lens
- Level 3 (Stores): ProgressBoard / PipelineList / PnL / Schedule / Map

### shadcn/ui import 주의사항
레퍼런스 파일에 `@radix-ui/react-xxx@버전` 형식으로 버전이 붙어있음
→ 이 프로젝트에서는 버전 없이 `@radix-ui/react-xxx`로 사용
→ `src/components/ui/utils.ts`에 cn() 함수 별도 정의 (shadcn/ui용)

## 현재 구현 상태
- LandingPage: 완료 (Expansion/Prism 선택 화면)
- Header: 완료 (3단계 네비게이션)
- ProgressBoard: 완료 (파이프라인 현황 보드, KPI 카드)
- PipelineList: 완료 (필터링 + 정렬 테이블)
- ComingSoon: 완료 (미구현 화면 플레이스홀더)
- App.tsx: 완료 (전체 상태 관리 뼈대)

## 미구현 (추후 작업)
- PnLView (손익계산서)
- ScheduleView (캘린더)
- MapCanvas (Google Maps 연동)
- StoreDetail / CandidateStoreDetail 패널
- DashboardView (분석 차트)
- Sidebar (필터 + 매장 목록)
- SettingsDialog

## Tailwind v4 설정 방식
- `vite.config.ts`에 `tailwindcss()` 플러그인 직접 추가
- 별도 `tailwind.config.js` 파일 불필요
- `src/index.css`에 `@import "tailwindcss"` 선언
