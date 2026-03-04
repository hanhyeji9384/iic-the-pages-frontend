# 기능 정의서 (Functional Specification)
## IIC THE PAGES — Pipeline & Expansion Management Dashboard

> 최종 작성일: 2026-03-04
> 분석 대상: `/Users/hanhyeji/IdeaProjects/iic-the-pages-frontend/src/` 전체

---

## 1. 프로젝트 개요 (Project Overview)

| 항목 | 내용 |
|------|------|
| **프로젝트명** | IIC THE PAGES |
| **목적** | IIC 글로벌 매장 파이프라인 현황 관리 내부 대시보드 |
| **관리 브랜드** | Gentle Monster, Tamburins, Nudake, Atiissu, Nuflaat |
| **아키텍처** | Single Page Application (SPA) + Supabase Edge Function 백엔드 + Supabase RDB Direct |
| **배포** | Vite 빌드 → 정적 호스팅 / 백엔드는 Supabase Edge Function |

---

## 2. 기술 스택 (Tech Stack)

| 구분 | 기술 |
|------|------|
| **UI 프레임워크** | React 18 + TypeScript |
| **빌드 도구** | Vite 6 |
| **스타일링** | Tailwind CSS v4 |
| **UI 컴포넌트** | shadcn/ui (Radix UI 기반) |
| **차트** | Recharts |
| **애니메이션** | motion/react |
| **지도** | Google Maps JavaScript API (`@react-google-maps/api`) |
| **아이콘** | lucide-react |
| **알림 토스트** | Sonner |
| **인증** | Supabase Auth (이메일/비밀번호 인증, 세션 관리) |
| **백엔드 서버** | Supabase Edge Function (Hono 프레임워크, Deno 런타임) |
| **데이터베이스** | Supabase PostgreSQL RDB (Direct Query via `supabaseDataClient.ts`) |
| **데이터베이스 (레거시)** | Supabase PostgreSQL KV Store (`kv_store_51087ee6` 테이블, 아카이브 상태) |
| **파일 스토리지** | Supabase Storage (`make-51087ee6-photos` 버킷) |

---

## 3. 디렉토리 구조

```
src/
├── App.tsx                          # 앱 최상위 컴포넌트 (라우팅·전역 상태·인증 관리)
├── main.tsx                         # React 앱 진입점
├── index.css                        # 전역 스타일
├── styles/globals.css               # Tailwind 글로벌 설정
├── types/index.ts                   # 공통 타입 정의 (Store, FilterState 등)
├── app/data/stores.ts               # 초기 샘플 데이터 (IIC_STORES, 브랜드 목록)
├── assets/                          # 이미지 에셋 (PNG 아이콘, logo.avif)
├── components/
│   ├── dashboard/                   # 주요 화면 컴포넌트
│   │   ├── LandingPage.tsx          # 시작 화면 (Expansion/Prism 선택)
│   │   ├── LoginPage.tsx            # 로그인 페이지 (Supabase Auth 연동)
│   │   ├── ForcePasswordChange.tsx  # 초기 비밀번호 강제 변경 화면
│   │   ├── AdminPage.tsx            # 관리자 콘솔 (8탭 구성)
│   │   ├── AdminUsersSection.tsx    # 관리자 — 사용자 관리 CRUD
│   │   ├── ProgressView.tsx         # 목표 대비 진행률 대시보드
│   │   ├── Header.tsx               # 상단 3단 계층 네비게이션
│   │   ├── Sidebar.tsx              # 지도 뷰 왼쪽 필터·검색 패널
│   │   ├── MapCanvas.tsx            # Google Maps 지도 뷰 (핵심 컴포넌트)
│   │   ├── StoreDetail.tsx          # 오픈 매장 상세 패널
│   │   ├── CandidateStoreDetail.tsx # 파이프라인 후보점 상세 패널
│   │   ├── DashboardView.tsx        # 종합 KPI 대시보드
│   │   ├── ProgressBoard.tsx        # 파이프라인 진행 현황 보드
│   │   ├── PipelineList.tsx         # 파이프라인 리스트 테이블
│   │   ├── PnLView.tsx              # 손익계산서 (P&L) 테이블 뷰
│   │   ├── ScheduleView.tsx         # 연간 일정 캘린더
│   │   ├── LineManagerPanel.tsx     # 지도 파이프라인 연결선 관리 패널
│   │   ├── AddEntityPanel.tsx       # 지도 매장 추가/관리 패널
│   │   ├── TrafficManagerPanel.tsx  # 트래픽 구역 관리 패널
│   │   ├── SearchAutocomplete.tsx   # 지도 장소 검색 자동완성
│   │   ├── SettingsDialog.tsx       # 설정 다이얼로그 (브랜드 관리)
│   │   ├── StoreCard.tsx            # 사이드바용 매장 카드 컴포넌트
│   │   ├── YearlyStatusCharts.tsx   # 연도별 매장 수 추이 차트 (현재 비활성)
│   │   └── ComingSoon.tsx           # 미구현 화면 플레이스홀더
│   ├── figma/
│   │   └── ImageWithFallback.tsx    # 이미지 로딩 실패 시 폴백 처리
│   └── ui/                          # shadcn/ui 공통 컴포넌트
│       └── (accordion, badge, button, calendar, card, chart, ...)
├── utils/
│   ├── supabaseDataClient.ts        # Supabase RDB Direct 데이터 클라이언트
│   ├── storeMapper.ts               # DB 행 ↔ Store 타입 변환 매퍼
│   ├── brand-assets.ts              # 브랜드 에셋 (로고·아이콘) 중앙 관리
│   ├── dataClient.ts                # Supabase REST API 클라이언트 (레거시 KV)
│   ├── mockApi.ts                   # 오프라인 폴백용 Mock API
│   ├── mockLineServer.ts            # 오프라인 폴백용 Mock 라인 서버
│   └── supabase/
│       ├── client.ts                # Supabase 클라이언트 초기화 (Auth + RDB)
│       └── info.tsx                 # Supabase 프로젝트 ID / Anon Key
└── supabase/functions/server/
    ├── index.tsx                    # Hono REST API 서버 (Edge Function 메인)
    ├── kv_store.tsx                 # Supabase KV Store 유틸리티
    └── seed_data.ts                 # 서버 초기 샘플 데이터
```

---

## 4. 기능 목록 총괄표

| 기능 ID | 기능명 | 카테고리 | 구현 상태 | 관련 파일 |
|---------|--------|----------|----------|----------|
| F-001 | 랜딩 페이지 — Expansion/Prism 선택 | 전체 앱 구조 | 구현 완료 | `LandingPage.tsx` |
| F-002 | 3단 계층 네비게이션 헤더 | 네비게이션 | 구현 완료 | `Header.tsx` |
| F-003 | 설정 버튼 진입점 | 네비게이션 | 구현 완료 | `Header.tsx` |
| F-004 | 로고 클릭 → 랜딩 페이지 복귀 | 네비게이션 | 구현 완료 | `Header.tsx` |
| F-005 | 앱 전역 상태 관리 (네비게이션·필터·알림) | 전체 앱 구조 | 구현 완료 | `App.tsx` |
| F-006 | 서버 데이터 초기화 및 전체 데이터 로드 | 전체 앱 구조 | 구현 완료 | `App.tsx`, `supabaseDataClient.ts` |
| F-007 | 필터링된 매장 목록 계산 (지도 표시용) | 전체 앱 구조 | 구현 완료 | `App.tsx` |
| F-008 | 계약 만료 임박 판별 로직 | 전체 앱 구조 | 구현 완료 | `App.tsx` |
| F-009 | 저매출 알림 모드 | 전체 앱 구조 | 구현 완료 | `App.tsx` |
| F-010 | Google Maps 지도 렌더링 | 지도 | 구현 완료 | `MapCanvas.tsx` |
| F-011 | 지도 스타일 전환 (Map/Satellite) | 지도 | 구현 완료 | `MapCanvas.tsx` |
| F-012 | 매장 마커 렌더링 (브랜드별 색상·약자) | 지도 | 구현 완료 | `MapCanvas.tsx` |
| F-013 | 매장 마커 호버 툴팁 | 지도 | 구현 완료 | `MapCanvas.tsx` |
| F-014 | 파이프라인 연결선(Polyline) 렌더링 | 지도 | 구현 완료 | `MapCanvas.tsx` |
| F-015 | 트래픽 구역 원(Circle) 렌더링 | 지도 | 구현 완료 | `MapCanvas.tsx` |
| F-016 | 스트리트 뷰 (Street View Panorama) | 지도 | 구현 완료 | `MapCanvas.tsx` |
| F-017 | 지도 줌인/줌아웃 버튼 | 지도 | 구현 완료 | `MapCanvas.tsx` |
| F-018 | 지도 장소 검색 (Google Places Autocomplete) | 검색 | 구현 완료 | `MapCanvas.tsx`, `SearchAutocomplete.tsx` |
| F-019 | 검색 자동완성 드롭다운 | 검색 | 구현 완료 | `SearchAutocomplete.tsx` |
| F-020 | 저매출·계약 만료 알림 버튼 (지도 내) | 지도 | 구현 완료 | `MapCanvas.tsx` |
| F-021 | 지도 도구 패널 전환 (Line/Store/Comp/Traffic) | 지도 | 구현 완료 | `MapCanvas.tsx`, `App.tsx` |
| F-022 | 사이드바 — 매장 텍스트 검색 | 사이드바 | 구현 완료 | `Sidebar.tsx` |
| F-023 | 사이드바 — 파이프라인 상태 필터 | 사이드바 | 구현 완료 | `Sidebar.tsx` |
| F-024 | 사이드바 — IIC 브랜드 필터 | 사이드바 | 구현 완료 | `Sidebar.tsx` |
| F-025 | 사이드바 — 채널 유형 필터 | 사이드바 | 구현 완료 | `Sidebar.tsx` |
| F-026 | 사이드바 — 국가/지역 필터 | 사이드바 | 구현 완료 | `Sidebar.tsx` |
| F-027 | 사이드바 — 매장 분류(Type-based/Standalone) 필터 | 사이드바 | 구현 완료 | `Sidebar.tsx` |
| F-028 | 사이드바 — 경쟁사 브랜드 필터 | 사이드바 | 구현 완료 | `Sidebar.tsx` |
| F-029 | 사이드바 — 선호/인접 브랜드 필터 | 사이드바 | 구현 완료 | `Sidebar.tsx` |
| F-030 | 사이드바 — 스마트 글라스 브랜드 필터 | 사이드바 | 구현 완료 | `Sidebar.tsx` |
| F-031 | 사이드바 — 데이터 레이어 필터 (Pipeline/Traffic Heatmap) | 사이드바 | 구현 완료 | `Sidebar.tsx` |
| F-032 | 사이드바 — IIC/경쟁사 탭 전환 | 사이드바 | 구현 완료 | `Sidebar.tsx` |
| F-033 | 사이드바 — 필터 활성화 시 해당 섹션 자동 펼침 | 사이드바 | 구현 완료 | `Sidebar.tsx` |
| F-034 | 사이드바 — 매장 카드 목록 표시 | 사이드바 | 구현 완료 | `Sidebar.tsx`, `StoreCard.tsx` |
| F-035 | 매장 카드 클릭 → 상세 패널 열기 | 사이드바 | 구현 완료 | `App.tsx` |
| F-036 | 오픈 매장 상세 패널 — 개요 탭 | 매장 상세 | 구현 완료 | `StoreDetail.tsx` |
| F-037 | 오픈 매장 상세 패널 — P&L 탭 (차트·연도별 매출) | 매장 상세 | 구현 완료 | `StoreDetail.tsx` |
| F-038 | 오픈 매장 상세 패널 — 이미지 탭 (사진 업로드) | 매장 상세 | 구현 완료 | `StoreDetail.tsx` |
| F-039 | 오픈 매장 상세 패널 — 협상 이력 탭 (CRUD) | 매장 상세 | 구현 완료 | `StoreDetail.tsx` |
| F-040 | 오픈 매장 상세 패널 — 리뷰 탭 | 매장 상세 | 구현 완료 | `StoreDetail.tsx` |
| F-041 | 오픈 매장 — 스트리트 뷰 바로가기 | 매장 상세 | 구현 완료 | `StoreDetail.tsx` |
| F-042 | 후보점 상세 패널 — Summary 탭 | 매장 상세 | 구현 완료 | `CandidateStoreDetail.tsx` |
| F-043 | 후보점 상세 패널 — P&L 탭 (수식 기반 자동 계산) | 매장 상세 | 구현 완료 | `CandidateStoreDetail.tsx` |
| F-044 | 후보점 상세 패널 — Details(협상 이력) 탭 (CRUD) | 매장 상세 | 구현 완료 | `CandidateStoreDetail.tsx` |
| F-045 | 후보점 상세 패널 — Committee(체크포인트) 탭 (CRUD) | 매장 상세 | 구현 완료 | `CandidateStoreDetail.tsx` |
| F-046 | 후보점 — 파이프라인 상태 변경 | 매장 상세 | 구현 완료 | `CandidateStoreDetail.tsx` |
| F-047 | 후보점 — 매장 삭제 | 매장 상세 | 구현 완료 | `CandidateStoreDetail.tsx` |
| F-048 | Progress Board — 파이프라인 현황 보드 | 대시보드 | 구현 완료 | `ProgressBoard.tsx` |
| F-049 | Progress Board — 브랜드별 파이프라인 바 차트 | 대시보드 | 구현 완료 | `ProgressBoard.tsx` |
| F-050 | Progress Board — 파이프라인 상태 매트릭스 테이블 | 대시보드 | 구현 완료 | `ProgressBoard.tsx` |
| F-051 | Progress Board — 연간 목표 설정 모달 (GoalModal) | 대시보드 | 구현 완료 | `ProgressBoard.tsx` |
| F-052 | Progress Board — 필터 (브랜드·국가·연도·분류) | 대시보드 | 구현 완료 | `ProgressBoard.tsx` |
| F-053 | Progress Board → PipelineList 드릴다운 | 대시보드 | 구현 완료 | `ProgressBoard.tsx`, `App.tsx` |
| F-054 | Pipeline List — 파이프라인 매장 테이블 | 대시보드 | 구현 완료 | `PipelineList.tsx` |
| F-055 | Pipeline List — 다중 필터 (국가·도시·브랜드·상태·채널·연도·분류) | 대시보드 | 구현 완료 | `PipelineList.tsx` |
| F-056 | Pipeline List — 11개 컬럼 정렬 | 대시보드 | 구현 완료 | `PipelineList.tsx` |
| F-057 | Pipeline List — 매장 행 클릭 → 상세 패널 | 대시보드 | 구현 완료 | `PipelineList.tsx` |
| F-058 | Pipeline List — 국가 클릭 → ProgressBoard 연동 | 대시보드 | 구현 완료 | `PipelineList.tsx` |
| F-059 | P&L View — 파이프라인 매장별 손익계산서 테이블 | P&L | 구현 완료 | `PnLView.tsx` |
| F-060 | P&L View — Sales/CAPEX/Rent 3개 입력 → 5개 비용 자동 계산 | P&L | 구현 완료 | `PnLView.tsx` |
| F-061 | P&L View — Store-level OP 및 OP Margin % 자동 산출 | P&L | 구현 완료 | `PnLView.tsx` |
| F-062 | P&L View — 매장 헤더 클릭 → 편집 다이얼로그 | P&L | 구현 완료 | `PnLView.tsx` |
| F-063 | P&L View — 빠른 금액 입력 버튼 (만원/억원 단위) | P&L | 구현 완료 | `PnLView.tsx` |
| F-064 | P&L View — 다중 필터 (국가·도시·브랜드·상태·채널·연도·분류) | P&L | 구현 완료 | `PnLView.tsx` |
| F-065 | P&L View — 전체 합계 열 (Total Column) | P&L | 구현 완료 | `PnLView.tsx` |
| F-066 | P&L View — 금액 한국식 표기 변환 (억/만 단위) | P&L | 구현 완료 | `PnLView.tsx` |
| F-067 | Schedule View — 연간 캘린더 보드 | 스케줄 | 구현 완료 | `ScheduleView.tsx` |
| F-068 | Schedule View — 이벤트 추가 다이얼로그 | 스케줄 | 구현 완료 | `ScheduleView.tsx` |
| F-069 | Schedule View — 이벤트 수정 및 삭제 | 스케줄 | 구현 완료 | `ScheduleView.tsx` |
| F-070 | Schedule View — 연도 탐색 (이전/다음 연도) | 스케줄 | 구현 완료 | `ScheduleView.tsx` |
| F-071 | Schedule View — 매장 검색 연동 (이벤트 생성 시) | 스케줄 | 구현 완료 | `ScheduleView.tsx` |
| F-072 | Schedule View — 이벤트 색상 선택 (9가지) | 스케줄 | 구현 완료 | `ScheduleView.tsx` |
| F-073 | Schedule View — 이벤트 데이터 Supabase 저장/로드 | 스케줄 | 구현 완료 | `ScheduleView.tsx`, `supabaseDataClient.ts` |
| F-074 | Dashboard View — KPI 카드 4개 | 대시보드 | 구현 완료 | `DashboardView.tsx` |
| F-075 | Dashboard View — 파이프라인 단계 전환율(Conversion Rate) 계산 | 대시보드 | 구현 완료 | `DashboardView.tsx` |
| F-076 | Dashboard View — 브랜드별/지역별 매출 차트 | 대시보드 | 구현 완료 | `DashboardView.tsx` |
| F-077 | Dashboard View — Top Stores 목록 (페이지네이션) | 대시보드 | 구현 완료 | `DashboardView.tsx` |
| F-078 | Dashboard View — 저성과 매장 모달 | 대시보드 | 구현 완료 | `DashboardView.tsx` |
| F-079 | Dashboard View — 계약 만료 예정 매장 모달 | 대시보드 | 구현 완료 | `DashboardView.tsx` |
| F-080 | Dashboard View — 연도 선택 (이전/다음) | 대시보드 | 구현 완료 | `DashboardView.tsx` |
| F-081 | 파이프라인 연결선 관리 패널 — 선 추가 (두 점 선택) | 도구 패널 | 구현 완료 | `LineManagerPanel.tsx` |
| F-082 | 파이프라인 연결선 관리 패널 — 색상·두께 설정 | 도구 패널 | 구현 완료 | `LineManagerPanel.tsx` |
| F-083 | 파이프라인 연결선 관리 패널 — 저장된 선 목록 표시 | 도구 패널 | 구현 완료 | `LineManagerPanel.tsx` |
| F-084 | 파이프라인 연결선 관리 패널 — 선 삭제 | 도구 패널 | 구현 완료 | `LineManagerPanel.tsx` |
| F-085 | 파이프라인 연결선 관리 패널 — 선 포커스 (지도 이동) | 도구 패널 | 구현 완료 | `LineManagerPanel.tsx` |
| F-086 | 매장 추가 패널 — IIC 매장 추가 (지도 클릭 위치 선택) | 도구 패널 | 구현 완료 | `AddEntityPanel.tsx` |
| F-087 | 매장 추가 패널 — 경쟁사/선호 브랜드 매장 추가 | 도구 패널 | 구현 완료 | `AddEntityPanel.tsx` |
| F-088 | 매장 추가 패널 — 저장된 매장 목록 표시 및 수정·삭제 | 도구 패널 | 구현 완료 | `AddEntityPanel.tsx` |
| F-089 | 트래픽 구역 패널 — 원형 구역 그리기 | 도구 패널 | 구현 완료 | `TrafficManagerPanel.tsx` |
| F-090 | 트래픽 구역 패널 — 색상·투명도 설정 | 도구 패널 | 구현 완료 | `TrafficManagerPanel.tsx` |
| F-091 | 트래픽 구역 패널 — 구역 저장·삭제·포커스 | 도구 패널 | 구현 완료 | `TrafficManagerPanel.tsx` |
| F-092 | 설정 다이얼로그 — 경쟁사 브랜드 CRUD | 설정 | 구현 완료 | `SettingsDialog.tsx` |
| F-093 | 설정 다이얼로그 — 선호/인접 브랜드 CRUD | 설정 | 구현 완료 | `SettingsDialog.tsx` |
| F-094 | 설정 다이얼로그 — 브랜드 로고 이미지 업로드 | 설정 | 구현 완료 | `SettingsDialog.tsx` |
| F-095 | 설정 다이얼로그 — 지도 마커 이미지 업로드 | 설정 | 구현 완료 | `SettingsDialog.tsx` |
| F-096 | 데이터 API — IIC 매장 CRUD (Supabase RDB) | 데이터/API | 구현 완료 | `supabaseDataClient.ts` |
| F-097 | 데이터 API — 경쟁사 매장 CRUD (Supabase RDB) | 데이터/API | 구현 완료 | `supabaseDataClient.ts` |
| F-098 | 데이터 API — 파이프라인 연결선 CRUD (Supabase RDB) | 데이터/API | 구현 완료 | `supabaseDataClient.ts` |
| F-099 | 데이터 API — 트래픽 구역 CRUD (Supabase RDB) | 데이터/API | 구현 완료 | `supabaseDataClient.ts` |
| F-100 | 데이터 API — 협상 이력 조회·저장 (Supabase RDB) | 데이터/API | 구현 완료 | `supabaseDataClient.ts` |
| F-101 | 데이터 API — 체크포인트 조회·저장 (Supabase RDB) | 데이터/API | 구현 완료 | `supabaseDataClient.ts` |
| F-102 | 데이터 API — 목표(Goals) 조회·저장 (Supabase RDB) | 데이터/API | 구현 완료 | `supabaseDataClient.ts` |
| F-103 | 데이터 API — 경쟁사·선호 브랜드 목록 CRUD (Supabase RDB) | 데이터/API | 구현 완료 | `supabaseDataClient.ts` |
| F-104 | 데이터 API — 일정 이벤트 조회·저장 (Supabase RDB) | 데이터/API | 구현 완료 | `supabaseDataClient.ts` |
| F-105 | 데이터 API — 파일 업로드 (Supabase Storage) | 데이터/API | 구현 완료 | `supabaseDataClient.ts` |
| F-106 | 데이터 API — 초기 데이터 시딩 (seed) | 데이터/API | 구현 완료 | `supabaseDataClient.ts`, `server/index.tsx` |
| F-107 | 백엔드 — Hono REST API 서버 (Edge Function) | 백엔드 | 구현 완료 | `server/index.tsx` |
| F-108 | 백엔드 — Supabase KV Store 래퍼 (upsert·get·del·getByPrefix) | 백엔드 | 구현 완료 | `server/kv_store.tsx` |
| F-109 | 백엔드 — 파일 업로드 버킷 자동 초기화 | 백엔드 | 구현 완료 | `server/index.tsx` |
| F-110 | 백엔드 — CORS 설정 (전체 도메인 허용) | 백엔드 | 구현 완료 | `server/index.tsx` |
| F-111 | 백엔드 — 헬스 체크 엔드포인트 | 백엔드 | 구현 완료 | `server/index.tsx` |
| F-112 | 공통 유틸 — 채널명 → StoreClass 변환 (`getStoreClass`) | 타입/모델 | 구현 완료 | `types/index.ts` |
| F-113 | 공통 유틸 — IIC 브랜드 여부 확인 (`isIICBrand`) | 타입/모델 | 구현 완료 | `types/index.ts` |
| F-114 | 공통 유틸 — 파이프라인 상태 색상 매핑 (`PIPELINE_STATUS_COLORS`) | 타입/모델 | 구현 완료 | `types/index.ts` |
| F-115 | 공통 유틸 — cn 클래스 병합 유틸 | UI 공통 | 구현 완료 | `utils/cn.ts` |
| F-116 | 공통 유틸 — ImageWithFallback (이미지 로드 실패 시 대체) | UI 공통 | 구현 완료 | `components/figma/ImageWithFallback.tsx` |
| F-117 | YearlyStatusCharts — 연도별 누적 매장 수 추이 계산 | 대시보드 | 부분 구현 | `YearlyStatusCharts.tsx` |
| F-118 | Wholesale View | 네비게이션 | 미구현 | `ComingSoon.tsx` |
| F-119 | Lens View | 네비게이션 | 미구현 | `ComingSoon.tsx` |
| F-120 | Prism 전체 | 네비게이션 | 미구현 | — |
| F-121 | 로그인 페이지 (이메일/비밀번호 인증) | 인증 | 구현 완료 | `LoginPage.tsx` |
| F-122 | 자동 계정 생성 (signUp probe) | 인증 | 구현 완료 | `LoginPage.tsx` |
| F-123 | 로그인 실패 진단 (diagnoseLoginFailure) | 인증 | 구현 완료 | `LoginPage.tsx` |
| F-124 | 이메일/비밀번호 인증 (Supabase Auth) | 인증 | 구현 완료 | `LoginPage.tsx`, `supabase/client.ts` |
| F-125 | 강제 비밀번호 변경 (ForcePasswordChange) | 인증 | 구현 완료 | `ForcePasswordChange.tsx` |
| F-126 | 초기 비밀번호 감지 (detectMustChangePassword) | 인증 | 구현 완료 | `LoginPage.tsx` |
| F-127 | 관리자 페이지 — 8탭 콘솔 (AdminPage) | 관리자 | 구현 완료 | `AdminPage.tsx` |
| F-128 | 관리자 — 사용자 관리 CRUD (AdminUsersSection) | 관리자 | 구현 완료 | `AdminUsersSection.tsx` |
| F-129 | 관리자 — 사용자 역할 관리 (admin/editor/viewer) | 관리자 | 구현 완료 | `AdminUsersSection.tsx` |
| F-130 | 관리자 — 사용자 비밀번호 리셋 | 관리자 | 구현 완료 | `AdminUsersSection.tsx` |
| F-131 | 관리자 — 시스템 개요 대시보드 (AdminOverview) | 관리자 | 구현 완료 | `AdminPage.tsx` |
| F-132 | Progress View — 목표 대비 진행률 대시보드 | 대시보드 | 구현 완료 | `ProgressView.tsx` |
| F-133 | Progress View — 원형 진행률 차트 (CircularProgress) | 대시보드 | 구현 완료 | `ProgressView.tsx` |
| F-134 | Progress View — 12개월 Trajectory 차트 | 대시보드 | 구현 완료 | `ProgressView.tsx` |
| F-135 | Progress View — 브랜드별/지역별 목표 설정 모달 (GoalModal) | 대시보드 | 구현 완료 | `ProgressView.tsx` |
| F-136 | Progress View — 브랜드 탭 필터 (All/GM/TB/ND/NF/AT) | 대시보드 | 구현 완료 | `ProgressView.tsx` |
| F-137 | Supabase RDB Direct Client (supabaseDataClient) | 데이터/API | 구현 완료 | `supabaseDataClient.ts` |
| F-138 | DB-Store 타입 매핑 (storeMapper) | 데이터/API | 구현 완료 | `storeMapper.ts` |
| F-139 | Supabase 클라이언트 초기화 (supabase/client) | 인프라 | 구현 완료 | `supabase/client.ts` |
| F-140 | 브랜드 에셋 중앙 관리 (brand-assets) | UI 공통 | 구현 완료 | `brand-assets.ts` |

---

## 5. 상세 기능 정의

### F-001: 랜딩 페이지 — Expansion/Prism 선택

- **카테고리**: 전체 앱 구조
- **관련 파일**: `src/components/dashboard/LandingPage.tsx`
- **설명**: 앱 최초 진입 시 표시되는 화면. 화면을 좌우로 분할하여 Expansion(매장 확장 관리)과 Prism(사업 분석) 중 하나를 선택하도록 한다.
- **입력**: 마우스 hover, 클릭
- **처리 로직**:
  - `hoveredSide` 상태에 따라 hover된 쪽의 `flex` 비율을 1.08로, 반대쪽을 0.92로 조정하는 CSS 전환 애니메이션 적용
  - 클릭 시 `onEnter(level1)` 콜백을 호출하여 App.tsx에서 `showLanding = false`, `activeLevel1 = 선택값` 처리
  - 가운데 세로 구분선 존재
  - THE PAGES 로고(logo.avif) 상단 중앙 배치
- **출력**: 선택된 Level1 키(`'Expansion'` 또는 `'Prism'`)를 상위 컴포넌트로 전달
- **구현 상태**: 구현 완료

---

### F-002: 3단 계층 네비게이션 헤더

- **카테고리**: 네비게이션
- **관련 파일**: `src/components/dashboard/Header.tsx`
- **설명**: 화면 상단에 위치한 3단계 계층 메뉴 바. THE PAGES 로고가 왼쪽에, 알림 벨·설정 아이콘이 오른쪽에 위치한다.
- **메뉴 구조**:
  ```
  Level 1: Expansion | Prism
  └─ Level 2 (Expansion): Stores | Wholesale | Lens
     └─ Level 3 (Stores): Progress Board | Pipeline List | P&L | Schedule | Map | Dashboard | Progress
     └─ Level 3 (Wholesale): Coming Soon
     └─ Level 3 (Lens): Coming Soon
  ```
- **처리 로직**: 드롭다운 타이머 방식(마우스 이탈 후 일정 시간 후 닫힘). Level 1 변경 시 Level 2·3을 기본값으로 리셋.
- **출력**: 선택된 Level1/Level2/Tab 키를 콜백으로 전달
- **구현 상태**: 구현 완료

---

### F-005: 앱 전역 상태 관리

- **카테고리**: 전체 앱 구조
- **관련 파일**: `src/App.tsx`
- **설명**: `App.tsx`가 전체 앱의 상태 허브 역할을 한다. 모든 주요 상태가 이곳에서 선언되고 자식 컴포넌트로 props로 전달된다.
- **주요 상태 목록**:

| 상태 변수 | 타입 | 설명 |
|-----------|------|------|
| `showLanding` | boolean | 랜딩 페이지 표시 여부 |
| `isAuthenticated` | boolean | 로그인 완료 여부 |
| `mustChangePassword` | boolean | 초기 비밀번호 변경 필요 여부 |
| `showAdminPage` | boolean | 관리자 페이지 표시 여부 |
| `activeLevel1` | string | 현재 Level1 메뉴 |
| `activeLevel2` | string | 현재 Level2 메뉴 |
| `activeTab` | string | 현재 탭 |
| `allStores` | Store[] | IIC + 경쟁사 전체 매장 |
| `selectedStore` | Store\|null | 상세 패널 표시 대상 |
| `searchQuery` | string | 검색어 |
| `filters` | FilterState | 사이드바 필터 상태 |
| `showLowSalesAlert` | boolean | 저매출 알림 모드 |
| `showExpirationAlert` | boolean | 계약 만료 알림 모드 |
| `selectedYear` | number | 기준 연도 |
| `competitorBrandsList` | BrandDefinition[] | 경쟁사 브랜드 목록 |
| `preferredBrandsList` | BrandDefinition[] | 선호 브랜드 목록 |
| `activeTool` | string\|null | 현재 활성화된 지도 도구 |
| `lines` | SavedLine[] | 파이프라인 연결선 목록 |
| `savedTrafficZones` | TrafficZone[] | 트래픽 구역 목록 |

- **구현 상태**: 구현 완료

---

### F-121: 로그인 페이지

- **카테고리**: 인증
- **관련 파일**: `src/components/dashboard/LoginPage.tsx`
- **설명**: 앱 진입 시 가장 먼저 표시되는 이메일/비밀번호 기반 로그인 화면. Supabase Auth와 연동되며, 계정이 없으면 자동으로 생성하는 3단계 로그인 흐름을 구현한다.
- **UI 구성**:
  - THE PAGES 로고 (brand-assets에서 import)
  - 이메일 입력 필드 (Mail 아이콘)
  - 비밀번호 입력 필드 (Lock 아이콘)
  - Login 버튼 (로딩 시 스피너 표시)
  - 오류 메시지 (빨간 배경 카드)
  - 진단 정보 (앰버 배경 카드, 설정 변경 안내)
  - 초기 비밀번호 힌트 (파란 배경 카드)
- **처리 로직** (3단계):
  1. **Step 1**: `supabase.auth.signInWithPassword()` 시도
  2. **Step 2**: 실패 시 `diagnoseLoginFailure()` 호출하여 원인 분석
  3. **Step 3**: 자동 계정 생성 후 재로그인 시도
- **출력**: `onLoginSuccess({ mustChangePassword })` 콜백
- **구현 상태**: 구현 완료

---

### F-122: 자동 계정 생성 (signUp probe)

- **카테고리**: 인증
- **관련 파일**: `src/components/dashboard/LoginPage.tsx`
- **설명**: 로그인 실패 시 격리된(isolated) Supabase 클라이언트로 `signUp()`을 호출하여 계정 존재 여부를 판별하고, 계정이 없으면 자동으로 생성한다.
- **처리 로직**:
  - `getIsolatedClient()`: `persistSession: false`, `autoRefreshToken: false`인 별도 Supabase 클라이언트 생성 (메인 세션 덮어쓰기 방지)
  - signUp 성공 + `identities`가 비어있으면 → 이미 존재하는 계정 (anti-enumeration)
  - signUp 성공 + identities 있으면 → 신규 계정 생성됨, `autoCreated: true` 반환
  - signUp 후 `email_confirmed_at`이 있으면 자동 확인 완료
- **구현 상태**: 구현 완료

---

### F-123: 로그인 실패 진단 (diagnoseLoginFailure)

- **카테고리**: 인증
- **관련 파일**: `src/components/dashboard/LoginPage.tsx`
- **설명**: Supabase의 `Invalid login credentials` 에러를 세분화 진단하여 사용자에게 구체적인 해결 방법을 안내한다.
- **진단 결과 타입**:
  - `not_exists`: 계정 미존재 → 자동 생성 시도
  - `email_unconfirmed`: 이메일 인증 미완료 → Supabase Dashboard 설정 변경 안내
  - `wrong_password`: 비밀번호 불일치
  - `signup_disabled`: 회원가입 비활성화 → 관리자 수동 계정 생성 안내
  - `unknown`: 알 수 없는 오류
- **구현 상태**: 구현 완료

---

### F-124: 이메일/비밀번호 인증 (Supabase Auth)

- **카테고리**: 인증
- **관련 파일**: `src/components/dashboard/LoginPage.tsx`, `src/utils/supabase/client.ts`
- **설명**: Supabase Auth 서비스를 통한 이메일/비밀번호 기반 인증. 세션은 브라우저 localStorage에 자동 저장되어 새로고침 시에도 로그인이 유지된다.
- **세션 관리**: `autoRefreshToken: true`, `persistSession: true`, 커스텀 lock 구현 (동시 토큰 갱신 충돌 방지)
- **구현 상태**: 구현 완료

---

### F-125: 강제 비밀번호 변경 (ForcePasswordChange)

- **카테고리**: 인증
- **관련 파일**: `src/components/dashboard/ForcePasswordChange.tsx`
- **설명**: 초기 비밀번호로 로그인한 사용자에게 새 비밀번호 설정을 강제하는 화면. 비밀번호 변경 전까지 대시보드 접근이 차단된다.
- **UI 구성**:
  - 경고 배너 (앰버 배경, ShieldAlert 아이콘)
  - 로그인 계정 정보 표시 (이메일, 아바타)
  - 새 비밀번호 입력 (최소 6자)
  - 비밀번호 확인 입력
  - 비밀번호 표시/숨기기 토글 (Eye/EyeOff)
  - 실시간 일치 여부 피드백
- **처리 로직**:
  - `supabase.auth.updateUser({ password, data: { password_changed: true } })` 호출
  - `user_metadata.password_changed = true` 설정으로 재로그인 시 강제 변경 스킵
- **구현 상태**: 구현 완료

---

### F-126: 초기 비밀번호 감지 (detectMustChangePassword)

- **카테고리**: 인증
- **관련 파일**: `src/components/dashboard/LoginPage.tsx`
- **설명**: 로그인 성공 후 사용자가 초기 비밀번호를 아직 변경하지 않았는지 감지하는 함수.
- **판별 로직** (우선순위 순):
  1. `app_metadata.must_change_password === true` → 강제 변경 (레거시 Edge Function 경로)
  2. `user_metadata.password_changed === true` → 이미 변경됨, 스킵
  3. 둘 다 없으면 → 첫 로그인으로 판단, 강제 변경 필요
- **구현 상태**: 구현 완료

---

### F-127: 관리자 페이지 — 8탭 콘솔 (AdminPage)

- **카테고리**: 관리자
- **관련 파일**: `src/components/dashboard/AdminPage.tsx`
- **설명**: 관리자 전용 콘솔 페이지. 왼쪽 사이드바 네비게이션 + 오른쪽 콘텐츠 영역으로 구성된다.
- **탭 구성** (8개):

| 탭 키 | 탭 레이블 | 아이콘 | 구현 상태 |
|--------|----------|--------|----------|
| overview | Overview | BarChart3 | 구현 완료 |
| users | Users | Users | 구현 완료 |
| stores | Stores | Store | Phase 2 예정 |
| brands | Brands | Tag | Phase 2 예정 |
| pipelines | Pipelines & Zones | Route | Phase 2 예정 |
| schedule | Schedule | Calendar | Phase 2 예정 |
| goals | Goals | Target | Phase 2 예정 |
| system | System | Settings | Phase 2 예정 |

- **UI 특징**: 다크 사이드바(`bg-slate-900`), `Back to Dashboard` 버튼, 사용자명·역할 표시
- **구현 상태**: 구현 완료 (Overview + Users 탭, 나머지 Placeholder)

---

### F-128: 관리자 — 사용자 관리 CRUD (AdminUsersSection)

- **카테고리**: 관리자
- **관련 파일**: `src/components/dashboard/AdminUsersSection.tsx`
- **설명**: 관리자가 시스템 사용자를 조회·추가·수정·삭제할 수 있는 관리 화면.
- **기능 목록**:
  - `public.users` 테이블에서 사용자 목록 직접 조회
  - 사용자 추가 다이얼로그 (이메일, 이름, 역할, 부서)
  - 사용자 정보 수정 (인라인 편집)
  - 사용자 삭제 (확인 다이얼로그)
  - 검색 (이메일/이름 기준)
  - 역할 필터 (all/admin/editor/viewer)
  - 상태 필터 (all/active/inactive)
- **데이터 소스**: `supabase.from('users').select('*')` — RDB 직접 쿼리
- **구현 상태**: 구현 완료

---

### F-129: 관리자 — 사용자 역할 관리

- **카테고리**: 관리자
- **관련 파일**: `src/components/dashboard/AdminUsersSection.tsx`
- **설명**: 사용자별 역할(admin/editor/viewer)을 설정하고 관리하는 기능.
- **역할 정의**:

| 역할 | 레이블 | 색상 | 아이콘 |
|------|--------|------|--------|
| admin | Admin | red | Shield |
| editor | Editor | amber | Pencil |
| viewer | Viewer | blue | Eye |

- **구현 상태**: 구현 완료

---

### F-130: 관리자 — 사용자 비밀번호 리셋

- **카테고리**: 관리자
- **관련 파일**: `src/components/dashboard/AdminUsersSection.tsx`
- **설명**: 관리자가 특정 사용자의 비밀번호를 초기 비밀번호(`이메일아이디!@` 형식)로 리셋하는 기능. Edge Function의 Admin API를 통해 처리한다.
- **처리 흐름**: 확인 다이얼로그 → Edge Function `/admin/reset-password` 호출 → `user_metadata.password_changed = false` 설정
- **구현 상태**: 구현 완료

---

### F-131: 관리자 — 시스템 개요 대시보드 (AdminOverview)

- **카테고리**: 관리자
- **관련 파일**: `src/components/dashboard/AdminPage.tsx`
- **설명**: 관리자 콘솔의 기본 화면. 시스템 상태를 요약하는 4개의 통계 카드와 RDB 모드 안내 배너를 표시한다.
- **통계 카드**: RDB Tables (14), Active Mode (RDB), Auth Provider (Supabase), Role System (Active)
- **정보 배너**: RDB-Only Mode 활성 상태 안내, KV Store 아카이브 상태 설명
- **구현 상태**: 구현 완료

---

### F-132: Progress View — 목표 대비 진행률 대시보드

- **카테고리**: 대시보드
- **관련 파일**: `src/components/dashboard/ProgressView.tsx`
- **설명**: IIC 글로벌 매장 확장 목표 대비 현재 진행률을 시각화하는 대시보드. 3컬럼 그리드 레이아웃.
- **레이아웃 구성**:
  - 상단: 12개월 Trajectory 차트 (F-134)
  - 좌측 컬럼: 브랜드별 CircularProgress + 브랜드 목록
  - 중앙 컬럼: IIC Global Growth CircularProgress + Opened/Closed YTD 통계
  - 우측 컬럼: 지역별 CircularProgress + 지역 목록
- **데이터 계산**:
  - IIC 매장만 필터링 (`brandCategory === 'iic'` 또는 `isIICBrand()`)
  - 목표 = Open 매장 수 + 2026 목표 합계 - Close 매장 수
  - Opened YTD = `ChangOpenDate`가 현재 연도인 매장 수
  - Closed YTD = `ChangCloseDate`가 현재 연도인 매장 수
- **구현 상태**: 구현 완료

---

### F-133: Progress View — 원형 진행률 차트 (CircularProgress)

- **카테고리**: 대시보드
- **관련 파일**: `src/components/dashboard/ProgressView.tsx`
- **설명**: SVG 기반 원형 진행률 차트 컴포넌트. 외곽 원호(stroke)로 달성률을 시각화한다.
- **Props**: `size`, `strokeWidth`, `percentage`, `label`, `count`, `total`
- **계산**: `circumference = radius * 2 * PI`, `offset = circumference - (percentage / 100) * circumference`
- **애니메이션**: CSS `transition-all duration-1000 ease-out`
- **구현 상태**: 구현 완료

---

### F-134: Progress View — 12개월 Trajectory 차트

- **카테고리**: 대시보드
- **관련 파일**: `src/components/dashboard/ProgressView.tsx`
- **설명**: Recharts AreaChart 기반 12개월 실적/예측 추이 차트.
- **데이터 구조**: `{ name: 'Jan'~'Dec', actual: number|null, forecast: number }`
- **차트 구성**:
  - Actual 영역: 실선(`strokeWidth: 1.5`), 그라데이션 채우기
  - Forecast 영역: 점선(`strokeDasharray: "4 4"`), actual이 null인 월만 표시
  - Target 기준선: 목표 수치 수평 기준
- **구현 상태**: 구현 완료

---

### F-135: Progress View — 브랜드별/지역별 목표 설정 모달 (GoalModal)

- **카테고리**: 대시보드
- **관련 파일**: `src/components/dashboard/ProgressView.tsx`
- **설명**: 연도·국가·브랜드별 확장 목표를 설정하는 모달 다이얼로그.
- **입력 항목**: 연도 (현재~+10년), 국가 (8개 지역), 브랜드 (5개 IIC), 목표 매장 수
- **기능**: 목표 추가, 목표 삭제, 전체 저장 (`dataClient.saveGoals()`)
- **UI**: `rounded-[2rem]`, 풀스크린 모달, `Target` 아이콘
- **구현 상태**: 구현 완료

---

### F-136: Progress View — 브랜드 탭 필터

- **카테고리**: 대시보드
- **관련 파일**: `src/components/dashboard/ProgressView.tsx`
- **설명**: All/GM/TB/ND/NF/AT 6개 탭 버튼으로 특정 브랜드의 진행률만 필터링하여 표시.
- **브랜드 매핑**: `GM → gentle monster`, `TB → tamburins`, `ND → nudake`, `NF → nuflaat`, `AT → atiissu`
- **구현 상태**: 구현 완료

---

### F-137: Supabase RDB Direct Client (supabaseDataClient)

- **카테고리**: 데이터/API
- **관련 파일**: `src/utils/supabaseDataClient.ts`
- **설명**: KV Store를 거치지 않고 Supabase PostgreSQL RDB 테이블을 직접 쿼리하는 데이터 클라이언트. 앱 시작 시 RDB 연결 상태를 자동 진단한다.
- **주요 테이블 접근**:
  - `v_store_full` (뷰): 매장 + 브랜드 + 계약 + 재무 조인 뷰
  - `stores`: 매장 기본 정보
  - `brands`: 브랜드 정보
  - `store_images`: 매장 사진
  - `yearly_sales`: 연도별 매출
  - `contracts`: 계약 정보
  - `store_financials`: 재무 정보
  - `pipelines`: 파이프라인 연결선
  - `traffic_zones`: 트래픽 구역
  - `negotiation_history`: 협상 이력
  - `checkpoints`: 체크포인트
  - `goals`: 확장 목표
  - `schedule_events`: 일정 이벤트
- **진단 기능**: `diagnoseRdb()` — brands, stores, v_store_full 테이블/뷰 접근 여부 확인 후 콘솔 출력
- **구현 상태**: 구현 완료

---

### F-138: DB-Store 타입 매핑 (storeMapper)

- **카테고리**: 데이터/API
- **관련 파일**: `src/utils/storeMapper.ts`
- **설명**: RDB 데이터베이스의 행(row) 데이터를 프론트엔드 `Store` 타입으로 변환하는 매퍼 함수 모듈.
- **주요 함수**:
  - `mapDbRowToStore(row, images?, yearlySales?, negotiationHistory?)`: v_store_full 뷰 행 → Store 객체
  - `mapDbBrandToDef(row)`: brands 테이블 행 → BrandDefinition 객체
- **매핑 예시**: `store_name → name`, `brand_name → brand`, `channel → type`, `lat/lng → location.lat/lng`
- **구현 상태**: 구현 완료

---

### F-139: Supabase 클라이언트 초기화

- **카테고리**: 인프라
- **관련 파일**: `src/utils/supabase/client.ts`
- **설명**: Supabase JavaScript SDK의 클라이언트 인스턴스를 생성하고 앱 전체에서 공유하는 싱글톤 모듈.
- **설정**:
  - `storageKey`: `sb-{projectId}-auth-token` (localStorage 키)
  - `autoRefreshToken: true` (토큰 자동 갱신)
  - `persistSession: true` (새로고침 시 세션 유지)
  - 커스텀 `lock` 함수: Promise 체인 기반 동시성 제어 (Navigator LockManager 타임아웃 방지)
- **구현 상태**: 구현 완료

---

### F-140: 브랜드 에셋 중앙 관리 (brand-assets)

- **카테고리**: UI 공통
- **관련 파일**: `src/utils/brand-assets.ts`
- **설명**: 앱 전체에서 사용하는 로고, 아이콘, 브랜드 이미지 경로를 한 곳에서 관리하는 중앙 에셋 모듈.
- **관리 에셋**:
  - `titleLogo`: THE PAGES 타이틀 로고 (logo.avif import)
  - `userAvatar`: 기본 사용자 아바타 이미지 URL
  - `aiIcon`: AI 반짝임 SVG 인라인 아이콘
  - `selectAllIcon`: 전체 선택 체크 SVG 아이콘
  - 경쟁사 브랜드 로고: Clearbit Logo API 활용 (Apple, Nike, Balenciaga 등 17개)
- **구현 상태**: 구현 완료

---

## 6. 화면별 기능 매핑 (Screen-Feature Matrix)

| 화면 (Screen) | 관련 기능 ID |
|---------------|-------------|
| **LoginPage** (로그인) | F-121, F-122, F-123, F-124, F-126 |
| **ForcePasswordChange** (비밀번호 변경) | F-125 |
| **LandingPage** (시작 화면) | F-001 |
| **Header** (네비게이션 헤더) | F-002, F-003, F-004 |
| **MapCanvas** (지도 뷰) | F-010, F-011, F-012, F-013, F-014, F-015, F-016, F-017, F-018, F-020, F-021 |
| **SearchAutocomplete** (장소 검색) | F-018, F-019 |
| **Sidebar** (사이드바) | F-022, F-023, F-024, F-025, F-026, F-027, F-028, F-029, F-030, F-031, F-032, F-033, F-034, F-035 |
| **StoreDetail** (오픈 매장 상세) | F-036, F-037, F-038, F-039, F-040, F-041 |
| **CandidateStoreDetail** (후보점 상세) | F-042, F-043, F-044, F-045, F-046, F-047 |
| **ProgressBoard** (파이프라인 현황) | F-048, F-049, F-050, F-051, F-052, F-053 |
| **PipelineList** (파이프라인 리스트) | F-054, F-055, F-056, F-057, F-058 |
| **PnLView** (손익계산서) | F-059, F-060, F-061, F-062, F-063, F-064, F-065, F-066 |
| **ScheduleView** (연간 일정) | F-067, F-068, F-069, F-070, F-071, F-072, F-073 |
| **DashboardView** (종합 대시보드) | F-074, F-075, F-076, F-077, F-078, F-079, F-080 |
| **LineManagerPanel** (연결선 관리) | F-081, F-082, F-083, F-084, F-085 |
| **AddEntityPanel** (매장 추가) | F-086, F-087, F-088 |
| **TrafficManagerPanel** (트래픽 구역) | F-089, F-090, F-091 |
| **SettingsDialog** (설정) | F-092, F-093, F-094, F-095 |
| **AdminPage** (관리자 콘솔) | F-127, F-131 |
| **AdminUsersSection** (사용자 관리) | F-128, F-129, F-130 |
| **ProgressView** (진행률 대시보드) | F-132, F-133, F-134, F-135, F-136 |
| **App.tsx** (전역 상태) | F-005, F-006, F-007, F-008, F-009 |

---

## 7. FE/BE 구분표

모든 기능을 프론트엔드(FE), 백엔드(BE), 또는 양쪽 연동(FE+BE)으로 분류한 표이다.

### FE-Only (프론트엔드만)

프론트엔드 코드만으로 동작하며, 서버 API 호출이 없는 기능.

| 기능 ID | 기능명 |
|---------|--------|
| F-001 | 랜딩 페이지 — Expansion/Prism 선택 |
| F-002 | 3단 계층 네비게이션 헤더 |
| F-003 | 설정 버튼 진입점 |
| F-004 | 로고 클릭 → 랜딩 페이지 복귀 |
| F-005 | 앱 전역 상태 관리 |
| F-007 | 필터링된 매장 목록 계산 |
| F-008 | 계약 만료 임박 판별 로직 |
| F-009 | 저매출 알림 모드 |
| F-010 | Google Maps 지도 렌더링 |
| F-011 | 지도 스타일 전환 |
| F-012 | 매장 마커 렌더링 |
| F-013 | 매장 마커 호버 툴팁 |
| F-014 | 파이프라인 연결선 렌더링 |
| F-015 | 트래픽 구역 원 렌더링 |
| F-016 | 스트리트 뷰 |
| F-017 | 지도 줌인/줌아웃 버튼 |
| F-019 | 검색 자동완성 드롭다운 |
| F-020 | 저매출·계약 만료 알림 버튼 |
| F-021 | 지도 도구 패널 전환 |
| F-022 | 사이드바 — 매장 텍스트 검색 |
| F-023 | 사이드바 — 파이프라인 상태 필터 |
| F-024 | 사이드바 — IIC 브랜드 필터 |
| F-025 | 사이드바 — 채널 유형 필터 |
| F-026 | 사이드바 — 국가/지역 필터 |
| F-027 | 사이드바 — 매장 분류 필터 |
| F-028 | 사이드바 — 경쟁사 브랜드 필터 |
| F-029 | 사이드바 — 선호/인접 브랜드 필터 |
| F-030 | 사이드바 — 스마트 글라스 브랜드 필터 |
| F-031 | 사이드바 — 데이터 레이어 필터 |
| F-032 | 사이드바 — IIC/경쟁사 탭 전환 |
| F-033 | 사이드바 — 필터 활성화 시 자동 펼침 |
| F-034 | 사이드바 — 매장 카드 목록 표시 |
| F-035 | 매장 카드 클릭 → 상세 패널 열기 |
| F-036 | 오픈 매장 상세 — 개요 탭 |
| F-040 | 오픈 매장 상세 — 리뷰 탭 |
| F-041 | 오픈 매장 — 스트리트 뷰 바로가기 |
| F-042 | 후보점 상세 — Summary 탭 |
| F-043 | 후보점 상세 — P&L 탭 (수식 계산) |
| F-048 | Progress Board — 보드 레이아웃 |
| F-049 | Progress Board — 바 차트 |
| F-050 | Progress Board — 매트릭스 테이블 |
| F-053 | Progress Board → PipelineList 드릴다운 |
| F-054 | Pipeline List — 테이블 렌더링 |
| F-055 | Pipeline List — 다중 필터 |
| F-056 | Pipeline List — 컬럼 정렬 |
| F-057 | Pipeline List — 행 클릭 → 상세 |
| F-058 | Pipeline List — 국가 클릭 → ProgressBoard |
| F-059 | P&L View — 테이블 렌더링 |
| F-060 | P&L View — 수식 기반 자동 계산 |
| F-061 | P&L View — OP/Margin 자동 산출 |
| F-062 | P&L View — 편집 다이얼로그 |
| F-063 | P&L View — 빠른 금액 입력 |
| F-064 | P&L View — 다중 필터 |
| F-065 | P&L View — 전체 합계 열 |
| F-066 | P&L View — 금액 한국식 표기 |
| F-070 | Schedule View — 연도 탐색 |
| F-072 | Schedule View — 이벤트 색상 선택 |
| F-074 | Dashboard View — KPI 카드 |
| F-075 | Dashboard View — 전환율 계산 |
| F-076 | Dashboard View — 매출 차트 |
| F-077 | Dashboard View — Top Stores |
| F-078 | Dashboard View — 저성과 매장 모달 |
| F-079 | Dashboard View — 계약 만료 모달 |
| F-080 | Dashboard View — 연도 선택 |
| F-082 | 연결선 패널 — 색상·두께 설정 |
| F-112 | 채널명 → StoreClass 변환 |
| F-113 | IIC 브랜드 여부 확인 |
| F-114 | 파이프라인 상태 색상 매핑 |
| F-115 | cn 클래스 병합 유틸 |
| F-116 | ImageWithFallback |
| F-117 | YearlyStatusCharts 계산 로직 |
| F-118 | Wholesale View (미구현) |
| F-119 | Lens View (미구현) |
| F-120 | Prism 전체 (미구현) |
| F-126 | 초기 비밀번호 감지 |
| F-131 | 관리자 — 시스템 개요 대시보드 |
| F-133 | Progress View — 원형 진행률 차트 |
| F-134 | Progress View — Trajectory 차트 |
| F-136 | Progress View — 브랜드 탭 필터 |
| F-138 | DB-Store 타입 매핑 |
| F-140 | 브랜드 에셋 중앙 관리 |

### BE-Only (백엔드만)

Supabase Edge Function 서버 측에서만 동작하는 기능.

| 기능 ID | 기능명 |
|---------|--------|
| F-107 | Hono REST API 서버 |
| F-108 | Supabase KV Store 래퍼 |
| F-109 | 파일 업로드 버킷 자동 초기화 |
| F-110 | CORS 설정 |
| F-111 | 헬스 체크 엔드포인트 |

### FE+BE (프론트엔드 + 백엔드 연동)

프론트엔드 UI와 Supabase (Auth / RDB / Edge Function)가 함께 동작하는 기능.

| 기능 ID | 기능명 | 연동 대상 |
|---------|--------|----------|
| F-006 | 서버 데이터 초기화 및 전체 데이터 로드 | Supabase RDB |
| F-018 | 지도 장소 검색 | Google Places API |
| F-037 | 오픈 매장 — P&L 탭 | Supabase RDB |
| F-038 | 오픈 매장 — 이미지 탭 | Supabase Storage |
| F-039 | 오픈 매장 — 협상 이력 | Supabase RDB |
| F-044 | 후보점 — Details 탭 | Supabase RDB |
| F-045 | 후보점 — Committee 탭 | Supabase RDB |
| F-046 | 후보점 — 상태 변경 | Supabase RDB |
| F-047 | 후보점 — 매장 삭제 | Supabase RDB |
| F-051 | Progress Board — GoalModal | Supabase RDB |
| F-052 | Progress Board — 필터 | Supabase RDB |
| F-067 | Schedule View — 캘린더 보드 | Supabase RDB |
| F-068 | Schedule View — 이벤트 추가 | Supabase RDB |
| F-069 | Schedule View — 이벤트 수정/삭제 | Supabase RDB |
| F-071 | Schedule View — 매장 검색 연동 | Supabase RDB |
| F-073 | Schedule View — 데이터 저장/로드 | Supabase RDB |
| F-081 | 연결선 패널 — 선 추가 | Supabase RDB |
| F-083 | 연결선 패널 — 목록 표시 | Supabase RDB |
| F-084 | 연결선 패널 — 선 삭제 | Supabase RDB |
| F-085 | 연결선 패널 — 선 포커스 | Supabase RDB |
| F-086 | 매장 추가 패널 — IIC 매장 추가 | Supabase RDB |
| F-087 | 매장 추가 패널 — 경쟁사 매장 추가 | Supabase RDB |
| F-088 | 매장 추가 패널 — 목록 관리 | Supabase RDB |
| F-089 | 트래픽 구역 — 그리기 | Supabase RDB |
| F-090 | 트래픽 구역 — 색상/투명도 | Supabase RDB |
| F-091 | 트래픽 구역 — 저장/삭제 | Supabase RDB |
| F-092 | 설정 — 경쟁사 브랜드 CRUD | Supabase RDB |
| F-093 | 설정 — 선호 브랜드 CRUD | Supabase RDB |
| F-094 | 설정 — 브랜드 로고 업로드 | Supabase RDB |
| F-095 | 설정 — 마커 이미지 업로드 | Supabase RDB |
| F-096 | 데이터 API — IIC 매장 CRUD | Supabase RDB |
| F-097 | 데이터 API — 경쟁사 매장 CRUD | Supabase RDB |
| F-098 | 데이터 API — 파이프라인 CRUD | Supabase RDB |
| F-099 | 데이터 API — 트래픽 구역 CRUD | Supabase RDB |
| F-100 | 데이터 API — 협상 이력 | Supabase RDB |
| F-101 | 데이터 API — 체크포인트 | Supabase RDB |
| F-102 | 데이터 API — 목표(Goals) | Supabase RDB |
| F-103 | 데이터 API — 브랜드 목록 CRUD | Supabase RDB |
| F-104 | 데이터 API — 일정 이벤트 | Supabase RDB |
| F-105 | 데이터 API — 파일 업로드 | Supabase Edge Function + Storage |
| F-106 | 데이터 API — 초기 데이터 시딩 | Supabase Edge Function |
| F-121 | 로그인 페이지 | Supabase Auth |
| F-122 | 자동 계정 생성 | Supabase Auth |
| F-123 | 로그인 실패 진단 | Supabase Auth |
| F-124 | 이메일/비밀번호 인증 | Supabase Auth |
| F-125 | 강제 비밀번호 변경 | Supabase Auth |
| F-127 | 관리자 페이지 — 8탭 콘솔 | Supabase RDB |
| F-128 | 관리자 — 사용자 관리 CRUD | Supabase RDB + Auth |
| F-129 | 관리자 — 사용자 역할 관리 | Supabase RDB |
| F-130 | 관리자 — 비밀번호 리셋 | Supabase Edge Function + Auth |
| F-132 | Progress View — 진행률 대시보드 | Supabase RDB |
| F-135 | Progress View — GoalModal | Supabase RDB |
| F-137 | Supabase RDB Direct Client | Supabase RDB |
| F-139 | Supabase 클라이언트 초기화 | Supabase Auth + RDB |

---

## 8. 데이터 모델 요약

### Store 인터페이스

```typescript
interface Store {
  id: string;
  name: string;
  brand: string;
  type: string;
  location: {
    city: string;
    country: string;
    lat: number;
    lng: number;
  };
  size?: string;
  area?: number;
  rent?: string;
  status: PipelineStatus;
  statusYear?: number;
  brandCategory?: 'iic' | 'competitor' | 'preferred';
  openDate?: string;
  ChangOpenDate?: string;
  ChangCloseDate?: string;
  contract?: {
    startDate: string;
    endDate: string;
    renewalOption: boolean;
    documentUrl?: string;
  };
  financial?: {
    monthlyRent: number;
    currency: string;
    monthlySales: number;
    salesPerSqm: number;
    investment: number;
    deposit?: number;
    rentType?: 'fixed' | 'commission';
    rentCommission?: number;
    expectedOperatingProfitRatio?: number;
    estimatedSales?: number;
    estimatedMargin?: number;
    capex?: number;
    yearlySales?: { year: number; amount: number }[];
  };
  images?: {
    front?: string;
    side?: string;
    interior?: string;
    floorplan?: string;
  };
  negotiationHistory?: {
    date: string;
    notes: string;
    user: string;
  }[];
}
```

### 파이프라인 상태 흐름

```
Plan(Planned) → Confirm(Confirmed) → Contract(Signed) → Space(Construction) → Open
                                                                              ↓
                                                                           Close
                                     ↓ (언제든지 가능)
                                   Reject / Pending
```

| 신 상태명 | 구 상태명 (호환) | 색상 코드 |
|----------|--------------|----------|
| Planned | Plan | #64748B (슬레이트) |
| Confirmed | Confirm | #9694FF (퍼플) |
| Signed | Contract | #EE99C2 (핑크) |
| Construction | Space | #0ea5e9 (하늘) |
| Open | — | #7FC7D9 (청록) |
| Close | — | #94a3b8 (회색) |
| Reject | — | #EF4444 (빨강) |
| Pending | — | #F97316 (오렌지) |

### UserProfile 인터페이스 (관리자 사용자 관리)

```typescript
interface UserProfile {
  id: string;
  auth_id: string | null;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  department: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## 9. 주요 비즈니스 로직 설명

### 9.1 P&L 수식 기반 자동 계산 (핵심 비즈니스 로직)

**관련 파일**: `src/components/dashboard/PnLView.tsx`

**수식 전체**:
```
입력 3개:
  Sales    = 월 매출 (estimatedSales 또는 monthlySales)
  CAPEX    = 총 투자비 (financial.capex)
  Rent     = 월 임대료 (financial.monthlyRent)

자동 계산 5개:
  COGS          = Sales × 0.15   (매출원가 15%)
  Personnel     = Sales × 0.13   (인건비 13%)
  Depreciation  = CAPEX ÷ 48     (투자비 4년 상각)
  Payment       = Sales × 0.02   (지급수수료 2%)
  Others        = Sales × 0.05   (기타비용 5%)

최종 산출 2개:
  Store-level OP = Sales - COGS - Personnel - Rent - Depreciation - Payment - Others
  OP Margin %    = (Store-level OP ÷ Sales) × 100
```

### 9.2 파이프라인 상태 정규화

**관련 파일**: `App.tsx`, `Sidebar.tsx`, `PipelineList.tsx`, `MapCanvas.tsx`

```
구 상태명  →  신 상태명
Plan       →  Planned
Confirm    →  Confirmed
Contract   →  Signed
Space      →  Construction
```

### 9.3 인증 흐름 (Authentication Flow)

**관련 파일**: `LoginPage.tsx`, `ForcePasswordChange.tsx`, `App.tsx`

```
앱 시작
  → LoginPage 표시
    → 이메일/비밀번호 입력 → signInWithPassword()
      → 성공 → detectMustChangePassword()
        → mustChange=true → ForcePasswordChange 표시
          → 비밀번호 변경 완료 → 대시보드 진입
        → mustChange=false → 대시보드 진입
      → 실패 (Invalid credentials)
        → diagnoseLoginFailure() (signUp probe)
          → 계정 미존재 → 자동 생성 → 재로그인 → ForcePasswordChange
          → 이메일 미인증 → Supabase Dashboard 설정 안내
          → 비밀번호 불일치 → 오류 메시지 + 초기 비밀번호 힌트
          → 회원가입 비활성화 → 관리자 수동 생성 안내
```

### 9.4 국가/지역 매핑 및 정렬 우선순위

| 순위 | 지역 | 대표 키워드 |
|------|------|-----------|
| 1 | 한국 | South Korea, Korea, Seoul |
| 2 | 일본 | Japan, Tokyo, Osaka |
| 3 | 중국 | China, Hong Kong, Taiwan, Macau, Shanghai |
| 4 | 동남아 | Singapore, Thailand, Vietnam, Malaysia |
| 5 | 미주 | USA, United States, Canada |
| 6 | 유럽 | UK, France, Germany, Italy, Spain |
| 7 | 중동 | UAE, Saudi Arabia, Dubai |
| 8 | 호주 | Australia, New Zealand |
| 9 | 기타 | India, Brazil, Unknown |

---

## 10. 미구현 기능 및 개선 예정 (Unimplemented / Planned Features)

| 기능 | 현재 상태 | 비고 |
|------|----------|------|
| Wholesale View | ComingSoon 컴포넌트 표시 | Expansion > Wholesale 탭 |
| Lens View | ComingSoon 컴포넌트 표시 | Expansion > Lens 탭 |
| Prism 전체 | Landing에서 선택 가능하나 기능 없음 | 별도 개발 예정 |
| YearlyStatusCharts UI | 데이터 계산 로직만 구현, 화면 렌더링 주석 처리 | `YearlyStatusCharts.tsx` |
| Admin — Stores 탭 | Placeholder | Phase 2 예정 |
| Admin — Brands 탭 | Placeholder | Phase 2 예정 |
| Admin — Pipelines & Zones 탭 | Placeholder | Phase 2 예정 |
| Admin — Schedule 탭 | Placeholder | Phase 2 예정 |
| Admin — Goals 탭 | Placeholder | Phase 2 예정 |
| Admin — System 탭 | Placeholder | Phase 2 예정 |
| Traffic Heatmap 레이어 | 필터 옵션만 존재, 히트맵 미구현 | `Sidebar.tsx`, `MapCanvas.tsx` |
| Pipeline 데이터 레이어 토글 | 필터 옵션만 존재, 레이어 토글 미구현 | `Sidebar.tsx` |

---

## 11. shadcn/ui 공통 컴포넌트 목록

`src/components/ui/` 하위의 Radix UI 기반 공통 컴포넌트. 프로젝트 전반에서 재사용된다.

| 컴포넌트 | 주요 사용처 |
|---------|-----------|
| `accordion` | Sidebar 필터 섹션 접힘/펼침 |
| `alert-dialog` | 삭제 확인 다이얼로그 |
| `avatar` | ScheduleView 브랜드 아바타 |
| `badge` | 파이프라인 상태 배지, 브랜드 배지, 마커 상태 |
| `button` | 전역 버튼 |
| `card` | SearchAutocomplete, MapCanvas 정보 카드 |
| `chart` | Recharts 래퍼 (DashboardView) |
| `command` | PipelineList/PnLView 국가·연도 다중 선택 드롭다운, ScheduleView 매장 검색 |
| `dialog` | P&L 편집, 삭제 확인, 설정, 협상 이력 추가, 이벤트 상세 |
| `input` | 전역 텍스트 입력 |
| `label` | 폼 레이블 |
| `popover` | 다중 선택 드롭다운 트리거 |
| `scroll-area` | Sidebar 매장 목록, LineManagerPanel, AddEntityPanel 스크롤 |
| `select` | 단일 선택 드롭다운 |
| `separator` | 구분선 |
| `skeleton` | 로딩 상태 플레이스홀더 |
| `slider` | TrafficManagerPanel 투명도 조절 |
| `sonner` | 저장 완료/실패 토스트 알림 |
| `tabs` | StoreDetail, CandidateStoreDetail, SettingsDialog 탭 |
| `textarea` | 협상 이력 메모, 이벤트 내용 |
| `tooltip` | 버튼 설명 툴팁 |
| `use-mobile` | 모바일 화면 감지 훅 |
