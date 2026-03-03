# 기능 정의서 (Functional Specification)
## IIC THE PAGES — Pipeline & Expansion Management Dashboard

> 최종 작성일: 2026-03-03
> 분석 대상: `/Users/hanhyeji/IdeaProjects/iic-the-pages-frontend/src/` 전체

---

## 1. 프로젝트 개요 (Project Overview)

| 항목 | 내용 |
|------|------|
| **프로젝트명** | IIC THE PAGES |
| **목적** | IIC 글로벌 매장 파이프라인 현황 관리 내부 대시보드 |
| **관리 브랜드** | Gentle Monster, Tamburins, Nudake, Atiissu, Nuflaat |
| **아키텍처** | Single Page Application (SPA) + Supabase Edge Function 백엔드 |
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
| **백엔드 서버** | Supabase Edge Function (Hono 프레임워크, Deno 런타임) |
| **데이터베이스** | Supabase PostgreSQL (KV Store 방식: `kv_store_51087ee6` 테이블) |
| **파일 스토리지** | Supabase Storage (`make-51087ee6-photos` 버킷) |

---

## 3. 디렉토리 구조

```
src/
├── App.tsx                          # 앱 최상위 컴포넌트 (라우팅·전역 상태 관리)
├── main.tsx                         # React 앱 진입점
├── index.css                        # 전역 스타일
├── styles/globals.css               # Tailwind 글로벌 설정
├── types/index.ts                   # 공통 타입 정의 (Store, FilterState 등)
├── app/data/stores.ts               # 초기 샘플 데이터 (IIC_STORES, 브랜드 목록)
├── assets/                          # 이미지 에셋 (PNG 아이콘, logo.avif)
├── components/
│   ├── dashboard/                   # 주요 화면 컴포넌트
│   │   ├── LandingPage.tsx          # 시작 화면 (Expansion/Prism 선택)
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
│   ├── dataClient.ts                # Supabase REST API 클라이언트
│   ├── mockApi.ts                   # 오프라인 폴백용 Mock API
│   ├── mockLineServer.ts            # 오프라인 폴백용 Mock 라인 서버
│   └── supabase/info.tsx            # Supabase 프로젝트 ID / Anon Key
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
| F-006 | 서버 데이터 초기화 및 전체 데이터 로드 | 전체 앱 구조 | 구현 완료 | `App.tsx`, `dataClient.ts` |
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
| F-073 | Schedule View — 이벤트 데이터 Supabase 저장/로드 | 스케줄 | 구현 완료 | `ScheduleView.tsx`, `dataClient.ts` |
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
| F-096 | 데이터 API — IIC 매장 CRUD (Supabase) | 데이터/API | 구현 완료 | `dataClient.ts` |
| F-097 | 데이터 API — 경쟁사 매장 CRUD (Supabase) | 데이터/API | 구현 완료 | `dataClient.ts` |
| F-098 | 데이터 API — 파이프라인 연결선 CRUD (Supabase) | 데이터/API | 구현 완료 | `dataClient.ts` |
| F-099 | 데이터 API — 트래픽 구역 CRUD (Supabase) | 데이터/API | 구현 완료 | `dataClient.ts` |
| F-100 | 데이터 API — 협상 이력 조회·저장 (Supabase) | 데이터/API | 구현 완료 | `dataClient.ts` |
| F-101 | 데이터 API — 체크포인트 조회·저장 (Supabase) | 데이터/API | 구현 완료 | `dataClient.ts` |
| F-102 | 데이터 API — 목표(Goals) 조회·저장 (Supabase) | 데이터/API | 구현 완료 | `dataClient.ts` |
| F-103 | 데이터 API — 경쟁사·선호 브랜드 목록 CRUD (Supabase) | 데이터/API | 구현 완료 | `dataClient.ts` |
| F-104 | 데이터 API — 일정 이벤트 조회·저장 (Supabase) | 데이터/API | 구현 완료 | `dataClient.ts` |
| F-105 | 데이터 API — 파일 업로드 (Supabase Storage) | 데이터/API | 구현 완료 | `dataClient.ts` |
| F-106 | 데이터 API — 초기 데이터 시딩 (seed) | 데이터/API | 구현 완료 | `dataClient.ts`, `server/index.tsx` |
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
     └─ Level 3 (Stores): Progress Board | Pipeline List | P&L | Schedule | Map
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
| `pipelineInitialStatus` | string | PipelineList 초기 상태 필터 |
| `pipelineInitialBrand` | string | PipelineList 초기 브랜드 필터 |
| `pipelineInitialYears` | number[] | PipelineList 초기 연도 필터 |
| `pipelineInitialCountry` | string | PipelineList 초기 국가 필터 |
| `pipelineInitialClass` | string | PipelineList 초기 분류 필터 |

- **구현 상태**: 구현 완료

---

### F-006: 서버 데이터 초기화 및 전체 데이터 로드

- **카테고리**: 전체 앱 구조
- **관련 파일**: `src/App.tsx`, `src/utils/dataClient.ts`
- **설명**: 앱 최초 로드 시(`useEffect([])`) 서버 데이터를 초기화하고 로드한다.
- **처리 순서**:
  1. `dataClient.seed()` — 서버 DB가 비어있으면 초기 샘플 데이터 투입
  2. `refreshData()` — IIC 매장 + 경쟁사 매장 + 파이프라인 선 + 트래픽 구역 + 브랜드 목록을 `Promise.all`로 병렬 조회
  3. IIC 매장 + 경쟁사 매장 합쳐서 `allStores`에 저장
  4. 서버에 저장된 브랜드 목록이 있으면 로컬 초기값 덮어쓰기
- **오류 처리**: 실패 시 `toast.error()` 표시
- **구현 상태**: 구현 완료

---

### F-007: 필터링된 매장 목록 계산 (지도 표시용)

- **카테고리**: 전체 앱 구조
- **관련 파일**: `src/App.tsx` (`filteredStores` useMemo)
- **설명**: 알림 모드 및 5가지 필터 조건을 순서대로 적용하여 지도에 표시할 최종 매장 목록을 계산한다.
- **필터 적용 순서**:
  1. 계약 만료 알림 모드: `isExpiringStore()` 결과만 반환
  2. 저매출 알림 모드: IIC 매장 중 일 평균 매출 ≤ 1,100만원만 반환
  3. 브랜드 필터: IIC 브랜드 + 경쟁사 + 선호 + 스마트글라스 `allowedBrands` 목록으로 필터링 (선택된 브랜드 없으면 빈 배열)
  4. 상태 필터: IIC 매장에만 적용, 경쟁사/선호 브랜드는 통과
  5. 채널 필터: IIC 매장에만 적용
  6. 매장 분류 필터: IIC 매장에만 적용
  7. 국가/지역 필터: 도시명·국가명 키워드 매칭
- **특이사항**: 구 상태명 → 신 상태명 정규화 (Plan→Planned, Confirm→Confirmed, Contract→Signed, Space→Construction)
- **구현 상태**: 구현 완료

---

### F-008: 계약 만료 임박 판별 로직

- **카테고리**: 전체 앱 구조
- **관련 파일**: `src/App.tsx` (`isExpiringStore` 함수)
- **처리 로직**:
  - 기준일: `2026-03-03` (오늘 날짜 하드코딩)
  - IIC 매장: `contract.endDate`까지 6개월 이내이면 `true`
  - 비IIC 브랜드: 2년 이내이면 `true`
- **구현 상태**: 구현 완료

---

### F-009: 저매출 알림 모드

- **카테고리**: 전체 앱 구조
- **관련 파일**: `src/App.tsx`
- **처리 로직**:
  - `showLowSalesAlert === true`일 때 활성
  - IIC 매장 중 선택된 연도의 연간 매출을 365로 나눈 일 평균 매출(만원 단위)이 **1,100만원 이하**인 매장만 표시
  - 계산식: `ceil(연간 매출 ÷ 365 ÷ 10000) ≤ 1100`
- **구현 상태**: 구현 완료

---

### F-010 ~ F-021: Google Maps 지도 뷰 (MapCanvas)

- **카테고리**: 지도
- **관련 파일**: `src/components/dashboard/MapCanvas.tsx`
- **설명**: Google Maps JavaScript API를 기반으로 전 세계 매장 위치를 지도 위에 시각화하는 핵심 컴포넌트.

**컴포넌트 계층 구조**:
- `MapCanvas` (외부 진입점)
  - `DirectMapLayer` — API가 이미 로드된 경우 (window.google.maps 존재 시)
  - `MapWithLoader` — `useJsApiLoader`로 동적 로드 (언어: ko, 버전: weekly)
    - `MapRenderer` — 실제 지도 + 모든 오버레이 렌더링

**MapCanvas 주요 기능 세부**:

| 기능 ID | 기능 | 세부 내용 |
|---------|------|---------|
| F-010 | 지도 렌더링 | 초기 중심 `{lat:30, lng:150}`, zoom 3. API Key: 코드 내 하드코딩. `disableDefaultUI:true` |
| F-011 | 스타일 전환 | Map: `lightMapStyles` (밝은 은빛, POI 아이콘 숨김, 대중교통 역 표시), Satellite: `mapTypeId:'hybrid'` |
| F-012 | 매장 마커 | `OverlayView`로 커스텀 HTML 마커. Open 상태: 원형, 파이프라인: 다이아몬드. 브랜드별 약자(G/T/N/A/Nf) + 색상 구분. 우선순위 정렬 후 렌더링 |
| F-013 | 마커 툴팁 | hover 시 매장명·브랜드·상태 배지가 있는 카드 오버레이 표시 |
| F-014 | 파이프라인 선 | `Polyline`으로 `lines` 배열 렌더링. 클릭 가능 |
| F-015 | 트래픽 구역 | `Circle`으로 `savedTrafficZones` 렌더링. 현재 그리는 원도 실시간 표시 |
| F-016 | 스트리트 뷰 | `StreetViewPanorama`. `OUTDOOR` 소스, `imageDateControl:true`, 닫기 버튼 |
| F-017 | 줌 버튼 | Plus/Minus 아이콘 버튼 (기본 UI `zoomControl:false` 비활성화 후 직접 구현) |
| F-018 | 장소 검색 | `places` 라이브러리 `AutocompleteService`. 한국어 결과 반환 |
| F-019 | 자동완성 | `SearchAutocomplete` 컴포넌트. `place_id`, 주요 이름, 부가 정보 표시. 클릭 시 `PlacesService.getDetails()`로 좌표 획득 후 지도 이동 |
| F-020 | 알림 버튼 | 지도 상단 우측: Bell(저매출), CalendarClock(계약 만료) 아이콘 버튼. 활성 시 색상 강조 |
| F-021 | 도구 전환 | Layers 버튼 → pipeline/store/comp/traffic 도구 선택 드롭다운 |

- **구현 상태**: 구현 완료

---

### F-022 ~ F-034: 사이드바 (Map View 전용)

- **카테고리**: 사이드바
- **관련 파일**: `src/components/dashboard/Sidebar.tsx`
- **설명**: Map 탭 화면 왼쪽의 필터·검색·매장 목록 패널. IIC 탭과 경쟁사 탭으로 구분.

**필터 상세**:

| 기능 ID | 필터 | UI | IIC 전용 | 옵션 |
|---------|------|----|---------|----|
| F-023 | 상태 | Collapsible 체크박스 | Y | Open, Construction, Signed, Confirmed, Planned |
| F-024 | 브랜드 | Collapsible 체크박스 | Y | GM, TAM, NUD, ATS, NUF |
| F-025 | 채널 | Collapsible 체크박스 | Y | FS, Dept, Mall, Duty Free, Premium Outlet, Pop-up, Haus |
| F-026 | 국가/지역 | Collapsible 체크박스 | N | 한국, 일본, 중국, 동남아, 미주, 유럽, 중동, 호주, 기타 |
| F-027 | 매장 분류 | Collapsible 체크박스 | Y | Type-based, Standalone |
| F-028 | 경쟁사 브랜드 | Collapsible 체크박스 | N | 설정에서 정의된 목록 |
| F-029 | 선호 브랜드 | Collapsible 체크박스 | N | 설정에서 정의된 목록 |
| F-030 | 스마트 글라스 | Collapsible 체크박스 | N | Meta, XREAL, Rokid, TCL RayNeo, Vuzix |
| F-031 | 데이터 레이어 | Collapsible 체크박스 | N | Pipeline, Traffic Heatmap |

**상태 카운트 표시 로직** (관계형): 다른 필터 조건(브랜드·채널·국가) 적용 후 해당 상태의 IIC 매장 수를 실시간 계산하여 각 상태 항목 옆에 표시

**자동 펼침**: 필터가 활성화된 섹션은 useEffect에서 감지하여 자동으로 펼쳐짐

- **구현 상태**: 구현 완료

---

### F-036 ~ F-041: 오픈 매장 상세 패널 (StoreDetail)

- **카테고리**: 매장 상세
- **관련 파일**: `src/components/dashboard/StoreDetail.tsx`
- **설명**: `Open` 상태인 IIC 매장 클릭 시 오른쪽에 슬라이드인으로 표시되는 상세 정보 패널.

**탭 구성 및 내용**:

| 탭 | 기능 ID | 주요 내용 |
|----|---------|----------|
| Overview | F-036 | 매장명·브랜드·채널·위치·면적·계약 기간·월 임대료·월 매출·투자비·보증금 |
| P&L | F-037 | 연도별 매출 Bar + Line 혼합 차트(Recharts). 전년 대비 증감률, 평당 매출 계산 표시 |
| Images | F-038 | 정면·측면·내부·평면도 사진 업로드·표시. `dataClient.uploadFile()` 후 URL 저장 |
| History | F-039 | 날짜·메모·담당자 이력 CRUD. 추가 다이얼로그, 수정 다이얼로그, 삭제. `dataClient.updateNegotiationHistory()` 연동 |
| Reviews | F-040 | 별점·텍스트 리뷰 (더미 데이터 표시) |

- **스트리트 뷰 버튼** (F-041): Camera 아이콘 버튼 클릭 → 해당 매장 좌표로 MapCanvas의 스트리트 뷰 진입
- **한국어 국가명 변환**: `convertKoreanCountryToEnglish()` 함수 내장 (25개 국가 매핑)
- **구현 상태**: 구현 완료

---

### F-042 ~ F-047: 파이프라인 후보점 상세 패널 (CandidateStoreDetail)

- **카테고리**: 매장 상세
- **관련 파일**: `src/components/dashboard/CandidateStoreDetail.tsx`
- **설명**: Plan/Confirm/Contract/Space/Construction 단계인 후보점 클릭 시 표시되는 상세 정보 패널.

**탭 구성 및 내용**:

| 탭 | 기능 ID | 주요 내용 |
|----|---------|----------|
| Summary | F-042 | 기본 정보, 예상 오픈일(ChangOpenDate 우선), 예상 매출·마진율, 투자비, 파이프라인 상태 배지 |
| P&L | F-043 | 수식 기반 P&L 읽기 전용 표시 (Sales→COGS 15%, Personnel 13%, Depreciation CAPEX÷48, Payment 2%, Others 5%) |
| Details | F-044 | 날짜·내용·담당자 이력 CRUD. `dataClient.updateNegotiationHistory()` 연동 |
| Committee | F-045 | 단계별 체크리스트 CRUD. `dataClient.updateCheckpoints()` 연동 |

- **상태 변경** (F-046): 드롭다운에서 Plan/Confirm/Contract/Space/Reject/Pending 선택 후 저장
- **매장 삭제** (F-047): Trash2 아이콘 클릭 → 확인 다이얼로그 → `onDelete(storeId)` 콜백
- **상태 한국어 레이블**: Plan→기획, Confirm→확정, Contract→계약완료, Space→공사중
- **초기 데이터 로드**: `useEffect`에서 `dataClient.getNegotiationHistory()`, `dataClient.getCheckpoints()` 병렬 호출
- **구현 상태**: 구현 완료

---

### F-048 ~ F-053: Progress Board (파이프라인 현황 보드)

- **카테고리**: 대시보드
- **관련 파일**: `src/components/dashboard/ProgressBoard.tsx`
- **설명**: Stores > Progress Board 탭에 표시되는 파이프라인 현황 요약 보드. 연간 목표 대비 실적을 시각화한다.

**구성 요소**:

1. **상단 필터바** (F-052): 브랜드(All/GM/TAM/NUD/ATS/NUF), 국가(9개 지역), 연도, 매장 분류 드롭다운
2. **Set Goal 버튼**: GoalModal 열기 (F-051)
3. **브랜드별 파이프라인 바 차트** (F-049, Recharts ComposedChart):
   - X축: 브랜드명
   - Y축: 매장 수
   - Stacked Bar: 파이프라인 단계별 색상 분류
   - Line: 목표 수치 오버레이
4. **파이프라인 상태 매트릭스 테이블** (F-050):
   - 행: 파이프라인 상태 (Planned/Confirmed/Signed/Construction/Open)
   - 열: 브랜드별 매장 수
   - 각 셀 클릭 → `onNavigateToPipelineList()` 콜백으로 PipelineList 드릴다운 진입 (F-053)
5. **GoalModal** (F-051): 연도·국가·브랜드별 목표 매장 수 일괄 입력 그리드. 기존 목표가 있으면 업데이트, 없으면 추가. `dataClient.saveGoals()` 저장
6. **애니메이션**: `motion/react` 페이드인 효과

**브랜드 색상**:
| 브랜드 | 색상 코드 |
|--------|----------|
| Gentle Monster | #C5DFF8 |
| Tamburins | #9694FF |
| Nudake | #EE99C2 |
| Atiissu | #0EA5E9 |
| Nuflaat | #7FC7D9 |

**상태 색상**:
| 상태 | 색상 코드 |
|------|----------|
| Planned | #64748B |
| Confirmed | #6347D1 |
| Signed | #EE99C2 |
| Construction | #7FC7D9 |
| Open | #10B981 |

- **초기 로드**: `dataClient.getGoals()` 호출
- **구현 상태**: 구현 완료

---

### F-054 ~ F-058: Pipeline List (파이프라인 리스트 테이블)

- **카테고리**: 대시보드
- **관련 파일**: `src/components/dashboard/PipelineList.tsx`
- **설명**: 모든 파이프라인 단계 IIC 매장을 상세 표 형태로 나열하는 화면.

**필터 구성** (7개):

| 필터 | UI 방식 | 비고 |
|------|---------|------|
| Country | Popover + Command (다중 선택) | 국가명 검색 가능 |
| City | Select (단일) | 선택된 국가의 도시만 표시 |
| Brand | Select (단일) | IIC 브랜드 5개 |
| Status | Select (단일) | 파이프라인 상태 |
| Channel | Select (단일) | FS, Mall 등 |
| Analysis Year | Popover + Command (다중 선택) | 현재 연도 기준 ±5~+10년 범위 |
| Class | Select (단일) | Type-based / Standalone |

**정렬 가능 컬럼** (11개): country, city, name, brand, openDate, area, channel, status, sales, capex, margin

**표시 컬럼**: Country/City, Store Name, Brand, Open Date, Area(㎡), Channel, Status, StoreClass, Sales(예상 매출), CAPEX(투자비), OP Margin(영업이익률)

**정렬 로직**: 헤더 클릭 시 asc → desc → 초기화 3단계 순환. null이면 지역 기본 정렬 유지.

**국가 정렬 우선순위**: 한국(1) > 일본(2) > 중국(3) > 동남아(4) > 미주(5) > 유럽(6) > 중동(7) > 호주(8) > 기타(9)

**ProgressBoard 드릴다운 진입**: `initialStatus`, `initialBrand`, `initialYears`, `initialCountryRegion`, `initialClass` props 수신 → useEffect로 필터 자동 적용

- **구현 상태**: 구현 완료

---

### F-059 ~ F-066: P&L View (손익계산서)

- **카테고리**: P&L
- **관련 파일**: `src/components/dashboard/PnLView.tsx`
- **설명**: 파이프라인 단계의 IIC 매장별 월간 손익 항목을 스프레드시트 형식으로 표시. 행은 P&L 항목, 열은 매장명.

**P&L 수식 기반 자동 계산 로직** (F-060, 핵심 기능):

3개 입력값(Sales, CAPEX, Rent)을 기반으로 5개 비용 항목이 자동 산출된다.

| 항목 | 타입 | 계산 수식 |
|------|------|-----------|
| CAPEX | 직접 입력 | — |
| Sales | 직접 입력 | — |
| COGS | 자동 계산 | Sales × 15% |
| Personnel | 자동 계산 | Sales × 13% |
| Rent | 직접 입력 | — |
| Depreciation | 자동 계산 | CAPEX ÷ 48 (48개월 = 4년) |
| Payment | 자동 계산 | Sales × 2% |
| Others | 자동 계산 | Sales × 5% |
| Store-level OP | 자동 계산 | Sales − (COGS + Personnel + Rent + Depreciation + Payment + Others) |
| OP Margin % | 자동 계산 | Store-level OP ÷ Sales × 100 |

**`getStorePnL()` 함수** (F-060, F-061):
- 매장의 `financial.estimatedSales` 또는 `financial.monthlySales`를 Sales로 사용
- `financial.capex`를 CAPEX로 사용
- `financial.monthlyRent`를 Rent로 사용
- 위 수식으로 나머지 항목 계산 후 반환

**편집 다이얼로그** (F-062):
- 매장 열 헤더 클릭 시 열림
- Sales, CAPEX, Rent 3개만 입력 가능
- 입력 변경 시 `editDerived` useMemo가 나머지 5개 항목을 실시간 계산하여 미리보기 표시
- 빠른 금액 입력 버튼 (F-063): 100만/500만/1000만/5000만원, 1억/5억/10억원
- 저장 시: `estimatedSales`, `monthlySales`, `capex`, `monthlyRent` 4개 필드만 업데이트 후 `onStoreUpdate()` → `dataClient.updateIICStore()` 호출

**금액 표기 변환** (F-066):
- ≥1억: `n억` 표기
- ≥1만: `n만` 표기
- 음수 지원 (`-n억`)
- 0이면 `-` 표시

**테이블 행 색상 구분**:
- CAPEX 행: 앰버(amber) 배경
- Sales 행: 에메랄드(emerald) 배경
- Store-level OP 행: 파란(blue) 배경, 음수면 빨간(red)

**전체 합계 열** (F-065): 모든 필터된 매장의 각 항목 합계 표시. OP Margin %는 합계 Sales 대비 합계 OP로 계산

**필터**: PipelineList와 동일한 7개 필터 구성

- **구현 상태**: 구현 완료

---

### F-067 ~ F-073: Schedule View (연간 일정 캘린더)

- **카테고리**: 스케줄
- **관련 파일**: `src/components/dashboard/ScheduleView.tsx`
- **설명**: 행은 지역, 열은 월(1~12)인 연간 스케줄 보드.

**행 헤더** (10개): ISSUE, KOREA, JAPAN, CHINA, S.E. ASIA, U.S, EUROPE, MIDDLE EAST, AUSTRALIA, OTHERS

**이벤트 데이터 구조**:
```typescript
{
  title: string,
  subtitle: string,
  content: string,
  storeName: string,    // 연관 매장명
  time: string,         // 상태 텍스트 (예: "On Track", "Delayed")
  month: string,        // "1" ~ "12"
  startRow: number,     // 행 인덱스 (0=ISSUE, 1=KOREA, ...)
  rowSpan: number,      // 행 병합 수
  colIndex: number,     // 열 인덱스 (0=1월, ..., 11=12월)
  color: string,        // Tailwind 배경색 클래스 (예: "bg-blue-500")
  year: number,
}
```

**색상 선택지** (9가지): Red, Orange, Yellow, Green, Emerald, Blue, Blue(Deep), Purple, Light Gray

**이벤트 추가 다이얼로그 입력 항목**:
- 제목, 지역(다중 선택 Popover+Command), 월(Select), 매장명(Combobox 검색), 공사 착공일, 오픈일, 색상 선택, 내용(Textarea)

**이벤트 수정 다이얼로그**: 클릭된 이벤트 상세 표시, 수정 모드 전환, 삭제 버튼

**데이터 연동** (F-073):
- 초기 로드: `dataClient.getScheduleEvents()` → 없으면 `DEFAULT_EVENTS`로 초기화 후 즉시 저장
- 매장 검색: `dataClient.getIICStores()` 호출
- 추가/수정/삭제 후: `dataClient.saveScheduleEvents()` 전체 배열 저장

**기본 예시 이벤트**: Store Opening Delay, Seoul Flagship Grand Opening 등 9개 기본 이벤트

- **구현 상태**: 구현 완료

---

### F-074 ~ F-080: Dashboard View (종합 대시보드)

- **카테고리**: 대시보드
- **관련 파일**: `src/components/dashboard/DashboardView.tsx`
- **설명**: IIC 브랜드 글로벌 성과를 한눈에 파악하는 종합 분석 화면.

**KPI 카드 4개** (F-074):
- 총 오픈 IIC 매장 수
- 파이프라인 중인 매장 수 (Plan~Construction)
- 선택 연도 연간 총 매출
- 계약 만료 예정 매장 수

**파이프라인 전환율 계산** (F-075):
```
각 단계 누적합 기준:
planPlus    = Plan + Confirm + Contract + Space + Open
confirmPlus = Confirm + Contract + Space + Open
contractPlus = Contract + Space + Open
spacePlus   = Space + Open

Confirm 전환율 = confirmPlus ÷ planPlus × 100
Contract 전환율 = contractPlus ÷ confirmPlus × 100
Space 전환율 = spacePlus ÷ contractPlus × 100
Open 전환율 = Open ÷ spacePlus × 100
```

**차트** (F-076):
- 브랜드별 연간 매출 BarChart (Recharts)
- 지역별 매출 분포 PieChart (Recharts)
- 월별 매출 추이 AreaChart (Recharts, 더미 데이터)

**Top Stores 모달** (F-077): 페이지당 15개, 이전/다음 페이지 버튼

**저성과 매장 모달** (F-078): 페이지당 8개

**계약 만료 예정 모달** (F-079): 페이지당 8개, 만료일 및 잔여 기간 표시

**연도 선택** (F-080): ChevronLeft/ChevronRight로 이전/다음 연도 탐색. `onYearChange` 콜백으로 App.tsx의 `selectedYear` 업데이트

- **구현 상태**: 구현 완료

---

### F-081 ~ F-085: 파이프라인 연결선 관리 패널 (LineManagerPanel)

- **카테고리**: 도구 패널
- **관련 파일**: `src/components/dashboard/LineManagerPanel.tsx`
- **설명**: `activeTool === 'pipeline'`일 때 표시. 지도 위 두 지점을 연결하는 선을 관리.

**SavedLine 타입**:
```typescript
{
  id: string,
  point1: { lat, lng },  // 시작점
  point2: { lat, lng },  // 끝점
  color: string,         // HEX 색상
  title: string,
  thickness: number,
  createdAt: string,
}
```

**기본 색상 팔레트**: 빨강(#EF4444), 파랑(#3B82F6), 초록(#10B981), 황색(#F59E0B), 보라(#8B5CF6), 회색(#6B7280)

**추가 모드** (F-081): 지도 클릭 → point1/point2 순서로 좌표 채워짐. 두 점 완성 후 저장 가능. `isAddLineMode` 상태로 제어

**데이터 연동**: `dataClient.getPipelines()` 초기 로드, `dataClient.addPipeline()` 저장, `dataClient.deletePipeline()` 삭제

- **구현 상태**: 구현 완료

---

### F-086 ~ F-088: 매장 추가 패널 (AddEntityPanel)

- **카테고리**: 도구 패널
- **관련 파일**: `src/components/dashboard/AddEntityPanel.tsx`
- **설명**: `activeTool === 'store'`(IIC) 또는 `'comp'`(경쟁사) 일 때 표시. 지도 위에 매장 추가·관리.

**IIC 매장 추가 입력 항목** (F-086): 브랜드(5개), 매장명, 파이프라인 상태, 도시, 국가, 채널, 면적(㎡), 월 임대료, 보증금, 메모. 지도 클릭 또는 Google Places 검색으로 위치 설정.

**경쟁사/선호 매장 추가 입력 항목** (F-087): 브랜드(경쟁사+선호+스마트글라스 목록), 매장명, 상태. 위치 동일하게 설정.

**목록 관리** (F-088): 저장된 IIC/경쟁사 매장 목록 표시. 각 항목 수정(Edit2 아이콘) 및 삭제(Trash2 아이콘). `dataClient.updateIICStore()`, `dataClient.updateCompStore()`, `dataClient.deleteStore()`, `dataClient.deleteCompStore()` 호출

**한국어 국가명 변환**: `convertKoreanCountryToEnglish()` 내장 (주소 검색 결과의 한국어 국가명 처리)

- **구현 상태**: 구현 완료

---

### F-089 ~ F-091: 트래픽 구역 관리 패널 (TrafficManagerPanel)

- **카테고리**: 도구 패널
- **관련 파일**: `src/components/dashboard/TrafficManagerPanel.tsx`
- **설명**: `activeTool === 'traffic'`일 때 표시. 원형 유동인구 구역 관리.

**TrafficZone 타입**:
```typescript
{
  id: string,
  name: string,
  center: { lat, lng },  // 원 중심점
  radius: number,         // 반지름 (미터)
  color: string,          // HEX
  opacity: number,        // 0~1
  createdAt: string,
}
```

**그리기 방식** (F-089): 그리기 모드 버튼 → 지도 클릭으로 중심점 설정 → 마우스 이동으로 반지름 조절 (지도의 `onMapMouseMove` 콜백으로 실시간 원 크기 업데이트)

**색상/투명도** (F-090): 색상 팔레트 + Slider 컴포넌트로 투명도 조절

**저장** (F-091): 구역 이름 입력 후 저장. ID는 `Math.random().toString(36).substr(2,9)` 생성. `dataClient.saveTrafficZone()` 연동. 삭제: `dataClient.deleteTrafficZone()`.

- **구현 상태**: 구현 완료

---

### F-092 ~ F-095: 설정 다이얼로그 (SettingsDialog)

- **카테고리**: 설정
- **관련 파일**: `src/components/dashboard/SettingsDialog.tsx`
- **설명**: Header 오른쪽 Settings 버튼 클릭 시 열리는 전체 높이의 80% 다이얼로그.

**탭 구성**: Competitor Brands | Preferred Brands

**BrandManager 서브 컴포넌트 기능**:
- 브랜드 이름 입력 후 추가 (F-092, F-093)
- 기존 브랜드명 인라인 수정 (Pencil 아이콘 클릭 후 Input 필드 활성화)
- 브랜드 삭제 (X 아이콘, 즉시 삭제)
- 로고 이미지 업로드 (F-094): `<input type="file" accept="image/*">` → FileReader로 base64 변환 → `BrandDefinition.logo`에 저장
- 지도 마커 이미지 업로드 (F-095): 동일 방식, `BrandDefinition.markerImage`에 저장

**데이터 연동**: 변경 시 `handleUpdateCompetitorBrands()` / `handleUpdatePreferredBrands()` → `dataClient.saveCompetitorBrands()` / `dataClient.savePreferredBrands()` 호출

- **구현 상태**: 구현 완료

---

### F-096 ~ F-111: 데이터 API 및 백엔드

- **카테고리**: 데이터/API, 백엔드
- **관련 파일**: `src/utils/dataClient.ts`, `src/supabase/functions/server/index.tsx`, `src/supabase/functions/server/kv_store.tsx`
- **설명**: 프론트엔드 → Supabase Edge Function → Supabase PostgreSQL(KV Store) 3계층 아키텍처.

**Supabase KV Store 키 구조**:

| Key 패턴 | 저장 데이터 |
|----------|------------|
| `store:iic:{id}` | IIC 매장 데이터 |
| `store:comp:{id}` | 경쟁사/선호 매장 데이터 |
| `pipeline:{id}` | 파이프라인 연결선 |
| `traffic-zone:{id}` | 트래픽 구역 |
| `neg_history:{storeId}` | 매장별 협상 이력 배열 |
| `checkpoints:{storeId}` | 매장별 체크포인트 배열 |
| `iic_goals` | 전체 목표 데이터 |
| `brands:competitor` | 경쟁사 브랜드 목록 |
| `brands:preferred` | 선호 브랜드 목록 |
| `schedule-events` | 일정 이벤트 배열 |

**REST API 엔드포인트 전체 목록**:

| Method | Path | 설명 |
|--------|------|------|
| GET | `/health` | 헬스 체크 |
| POST | `/seed?force=true` | 초기 데이터 시딩 |
| GET | `/stores/iic` | IIC 매장 전체 조회 |
| POST | `/stores/iic` | IIC 매장 추가 (id 없으면 `iic-{timestamp}` 자동 생성) |
| PUT | `/stores/iic/:id` | IIC 매장 수정 |
| DELETE | `/stores/iic/:id` | IIC 매장 삭제 |
| GET | `/stores/comp` | 경쟁사 매장 전체 조회 |
| POST | `/stores/comp` | 경쟁사 매장 추가 (id 없으면 `comp-{timestamp}` 자동 생성) |
| PUT | `/stores/comp/:id` | 경쟁사 매장 수정 |
| DELETE | `/stores/comp/:id` | 경쟁사 매장 삭제 |
| GET | `/pipelines` | 파이프라인 선 전체 조회 |
| POST | `/pipelines` | 파이프라인 선 추가 (id 없으면 `line-{timestamp}` 자동 생성) |
| DELETE | `/pipelines/:id` | 파이프라인 선 삭제 |
| GET | `/traffic-zones` | 트래픽 구역 전체 조회 |
| POST | `/traffic-zones` | 트래픽 구역 추가 (id 없으면 `zone-{timestamp}` 자동 생성) |
| DELETE | `/traffic-zones/:id` | 트래픽 구역 삭제 |
| GET | `/negotiation-history/:storeId` | 협상 이력 조회 (없으면 빈 배열 반환) |
| PUT | `/negotiation-history/:storeId` | 협상 이력 저장/전체 교체 |
| GET | `/checkpoints/:storeId` | 체크포인트 조회 (없으면 빈 배열 반환) |
| PUT | `/checkpoints/:storeId` | 체크포인트 저장/전체 교체 |
| GET | `/goals` | 목표 데이터 조회 (없으면 빈 객체 반환) |
| POST | `/goals` | 목표 데이터 저장 |
| GET | `/brands/competitor` | 경쟁사 브랜드 목록 조회 |
| POST | `/brands/competitor` | 경쟁사 브랜드 목록 저장 |
| GET | `/brands/preferred` | 선호 브랜드 목록 조회 |
| POST | `/brands/preferred` | 선호 브랜드 목록 저장 |
| GET | `/schedule-events` | 일정 이벤트 전체 조회 |
| POST | `/schedule-events` | 일정 이벤트 전체 저장 |
| POST | `/upload` | 파일 업로드 (multipart/form-data, 반환: `{path, url}`) |

**KV Store 핵심 함수** (`kv_store.tsx`):
- `set(key, value)`: upsert (INSERT OR UPDATE)
- `get(key)`: 단건 조회 (`maybeSingle()`, 없으면 undefined)
- `del(key)`: 삭제
- `getByPrefix(prefix)`: prefix로 시작하는 모든 key의 value 배열 반환 (`LIKE 'prefix%'`)

**인증**: Bearer Token (Supabase Anon Key, `src/utils/supabase/info.tsx`에서 읽음)

**CORS**: `origin: "*"`, GET/POST/PUT/DELETE/OPTIONS 허용

**버킷 초기화** (F-109): 서버 시작 시 `initBucket()` 자동 실행. `make-51087ee6-photos` 버킷이 없으면 비공개 버킷 생성

- **구현 상태**: 구현 완료

---

### F-117: YearlyStatusCharts (연도별 누적 매장 수 추이)

- **카테고리**: 대시보드
- **관련 파일**: `src/components/dashboard/YearlyStatusCharts.tsx`
- **설명**: 연도별 IIC 매장 누적 수를 계산하는 로직은 구현되어 있으나, 실제 UI 렌더링 부분은 주석 처리된 상태.

**데이터 계산 로직**:
- 대상 연도: `[2024, 2025, 2026, 2027]`
- IIC 매장만 필터링 (brandCategory === 'iic' 또는 브랜드명 포함 확인)
- 각 매장의 오픈 연도(openDate, statusYear 기준) ≤ 대상 연도이면 누적 카운트에 포함

- **구현 상태**: 부분 구현 (데이터 로직 완료, UI 비활성화)

---

## 6. 데이터 모델 요약

### Store 인터페이스

```typescript
interface Store {
  id: string;
  name: string;
  brand: string;             // 브랜드명
  type: string;              // 채널 (FS, Mall, Department Store, ...)
  location: {
    city: string;
    country: string;
    lat: number;
    lng: number;
  };
  size?: string;
  area?: number;             // 면적 (㎡)
  rent?: string;
  status: PipelineStatus;    // 파이프라인 상태
  statusYear?: number;
  brandCategory?: 'iic' | 'competitor' | 'preferred';
  openDate?: string;         // YYYY-MM-DD
  ChangOpenDate?: string;    // 변경된 오픈일
  ChangCloseDate?: string;   // 변경된 폐점일
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
    investmentInterior?: number;
    investmentFurniture?: number;
    investmentFacade?: number;
    investmentOther?: number;
    deposit?: number;
    rentType?: 'fixed' | 'commission';
    rentCommission?: number;
    expectedOperatingProfitRatio?: number;
    estimatedSales?: number;  // 예상 월 매출 (후보점, P&L 입력값)
    estimatedMargin?: number; // 예상 마진율
    cogs?: number;            // 매출원가 (미사용, 수식으로 계산)
    personnelCost?: number;   // 인건비 (미사용, 수식으로 계산)
    depreciation?: number;    // 감가상각 (미사용, 수식으로 계산)
    payment?: number;         // 지급수수료 (미사용, 수식으로 계산)
    others?: number;          // 기타비용 (미사용, 수식으로 계산)
    capex?: number;           // P&L 투자비 입력값 (Depreciation 계산 기준)
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

### StoreClass 분류

| 분류 | 해당 채널 | 정의 위치 |
|------|---------|---------|
| Type-based | Department Store, Mall, Duty Free, Premium Outlet | `types/index.ts` |
| Standalone | FS, Pop-up, Haus | `types/index.ts` |

### FilterState 인터페이스

```typescript
interface FilterState {
  status: string[];          // 파이프라인 상태
  brand: string[];           // IIC 브랜드
  channel: string[];         // 채널 유형
  country: string[];         // 국가/지역 한국어 레이블
  storeClass?: string[];     // 매장 분류
  competitorBrands?: string[]; // 경쟁사 브랜드
  preferredBrands?: string[];  // 선호 브랜드
  smartGlass?: string[];       // 스마트 글라스 브랜드
  dataLayers?: string[];       // 지도 데이터 레이어
}
```

**초기값 (`INITIAL_FILTERS`)**:
- status: `['Open', 'Construction', 'Signed', 'Confirmed', 'Planned']` (전체 선택)
- brand: 5개 IIC 브랜드 전체 선택
- channel: 7개 채널 전체 선택
- country: 9개 지역 전체 선택
- storeClass: 2가지 전체 선택

### SavedLine 인터페이스

```typescript
interface SavedLine {
  id: string;
  point1: { lat: number; lng: number };
  point2: { lat: number; lng: number };
  color: string;    // HEX (예: "#EF4444")
  title: string;
  thickness: number;
  createdAt: string;
}
```

### TrafficZone 인터페이스

```typescript
interface TrafficZone {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radius: number;    // 미터 단위
  color: string;     // HEX
  opacity: number;   // 0~1
  createdAt: string;
}
```

### BrandDefinition 인터페이스

```typescript
interface BrandDefinition {
  name: string;
  logo?: string;          // base64 또는 URL
  markerImage?: string;   // 지도 마커 이미지 base64 또는 URL
}
```

---

## 7. 주요 비즈니스 로직 설명

### 7.1 P&L 수식 기반 자동 계산 (핵심 비즈니스 로직)

**관련 파일**: `src/components/dashboard/PnLView.tsx`

**목적**: 영업 담당자가 Sales(월 매출), CAPEX(총 투자비), Rent(월 임대료) 3개 수치만 입력하면, 업계 표준 비율을 기반으로 나머지 모든 비용 항목과 영업이익이 자동으로 계산된다.

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

**저장 시 주의사항**: `cogs`, `personnelCost`, `depreciation`, `payment`, `others` 필드는 저장하지 않는다. 항상 수식으로 재계산하므로 `estimatedSales`/`monthlySales`/`capex`/`monthlyRent` 4개 필드만 저장한다.

---

### 7.2 파이프라인 상태 정규화

**관련 파일**: `App.tsx`, `Sidebar.tsx`, `PipelineList.tsx`, `MapCanvas.tsx`

데이터에 구 상태명과 신 상태명이 혼재하여 필터 적용 시 정규화가 필요하다.

```
구 상태명  →  신 상태명
Plan       →  Planned
Confirm    →  Confirmed
Contract   →  Signed
Space      →  Construction
```

필터 비교 시 두 방향 모두 허용: `filters.status.includes(normalized) || filters.status.includes(s.status)`

---

### 7.3 국가/지역 매핑 및 정렬 우선순위

**관련 파일**: `src/types/index.ts` (`REGION_MAPPING`), `PipelineList.tsx`, `PnLView.tsx`, `App.tsx`

국가명 문자열을 9개 지역 한국어 레이블로 변환.

**정렬 우선순위 (숫자가 낮을수록 먼저 표시)**:

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

### 7.4 매장 마커 브랜드 우선순위 렌더링

**관련 파일**: `src/components/dashboard/MapCanvas.tsx` (`sortedStores` useMemo)

지도에서 마커 겹침 시 중요 브랜드가 위에 표시되도록 오름차순 정렬 후 렌더링(마지막에 렌더링된 요소가 최상위에 위치).

```
Gentle Monster: 100 (최상위)
Tamburins: 90
Nudake: 80
Atiissu: 70
Nuflaat: 60
선호 브랜드: 50
경쟁사/기타: 40
```

---

### 7.5 저매출 알림 기준

**관련 파일**: `src/App.tsx`

IIC 매장 중 선택 연도의 연간 매출을 365일로 나눈 **일 평균 매출(만원)이 1,100만원 이하**인 매장.

```
일 평균 매출(원) = 연간 매출 ÷ 365
일 평균 매출(만원) = ceil(일 평균 매출(원) ÷ 10000)
저매출 조건: 일 평균 매출(만원) ≤ 1100
```

---

### 7.6 계약 만료 판별 기준

**관련 파일**: `src/App.tsx` (`isExpiringStore`)

| 브랜드 카테고리 | 만료 임박 기준 |
|--------------|-------------|
| IIC (iic 카테고리 또는 isIICBrand) | 계약 종료일까지 6개월 이내 |
| 기타 (경쟁사, 선호) | 계약 종료일까지 2년 이내 |

---

## 8. 미구현 기능 및 개선 예정 (Unimplemented / Planned Features)

| 기능 | 현재 상태 | 비고 |
|------|----------|------|
| Wholesale View | ComingSoon 컴포넌트 표시 | Expansion > Wholesale 탭 |
| Lens View | ComingSoon 컴포넌트 표시 | Expansion > Lens 탭 |
| Prism 전체 | Landing에서 선택 가능하나 기능 없음 | 별도 개발 예정 |
| YearlyStatusCharts UI | 데이터 계산 로직만 구현, 화면 렌더링 주석 처리 | `YearlyStatusCharts.tsx` |
| 브랜드 아이콘 이미지 | `MapCanvas.tsx`에 변수 선언만 있고 실제 이미지 미연결 (빈 문자열) | aiIcon, appleIcon 등 19개 |
| 헬스 체크 알림 (Bell 아이콘) | UI 버튼만 존재, 실제 알림 로직 없음 | `Header.tsx` |
| Traffic Heatmap 레이어 | 필터 옵션은 존재하지만 히트맵 표시 로직 미구현 | `Sidebar.tsx`, `MapCanvas.tsx` |
| Pipeline 데이터 레이어 토글 | 필터 옵션은 존재하지만 레이어 표시/숨김 로직 미구현 | `Sidebar.tsx` |

---

## 9. shadcn/ui 공통 컴포넌트 목록

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
| `use-mobile` | 모바일 화면 감지 훅 (현재 직접 사용처 없음) |
