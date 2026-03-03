# IIC THE PAGES - Feature Spec Analyzer Memory

## 프로젝트 기본 정보
- 경로: `/Users/hanhyeji/IdeaProjects/iic-the-pages-frontend`
- 목적: IIC 글로벌 매장 파이프라인 관리 대시보드 (내부 툴)
- 브랜드: Gentle Monster, Tamburins, Nudake, Atiissu, Nuflaat
- 기술 스택: React 18 + TypeScript + Vite 6 + Tailwind CSS v4 + Recharts + motion

## 구현 완료 컴포넌트
- `LandingPage.tsx`: Expansion/Prism 선택 화면 (hover 애니메이션)
- `Header.tsx`: 3단계 계층 네비게이션 (드롭다운 딜레이 타이머 방식)
- `ProgressBoard.tsx`: 파이프라인 현황 보드 (GoalModal + 2개 차트 + 상태 매트릭스 테이블)
- `PipelineList.tsx`: 파이프라인 리스트 테이블 (7개 필터 + 11개 정렬)
- `ComingSoon.tsx`: 미구현 화면 플레이스홀더

## 핵심 데이터 모델 위치
- `src/types/index.ts`: Store, FilterState, BrandDefinition, 상태 색상 매핑
- `src/app/data/stores.ts`: IIC_STORES (14개 샘플), 경쟁사/선호 브랜드, REGION_MAPPING

## 미구현 기능 (ComingSoon)
- P&L View, Schedule View, Map View (Google Maps 연동 예정)
- Dashboard View, Wholesale, Lens, Prism 전체

## 기능 정의서 출력 파일
- `/Users/hanhyeji/IdeaProjects/iic-the-pages-frontend/feature-spec-analyzer.md`
- 총 52개 기능 ID (F-001 ~ F-052)

## 파이프라인 상태 흐름
Plan → Confirm → Contract → Space → Open → (Close)
(구 명칭: Planned, Confirmed, Signed, Construction 병행 사용)

## 네비게이션 구조
Level1: Expansion | Prism
Level2 (Expansion): Stores | Wholesale | Lens
Level3 (Stores): ProgressBoard | PipelineList | PnL | Schedule | Map
