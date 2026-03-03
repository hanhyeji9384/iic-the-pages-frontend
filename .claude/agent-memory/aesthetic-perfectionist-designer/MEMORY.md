# IIC THE PAGES Frontend - Design System Memory

## Project Overview
- React + TypeScript + Vite + Tailwind CSS v4
- App: store expansion management dashboard for IIC (Korean fashion group)
- Brands: Gentle Monster, Tamburins, Nudake, Atiissu, Nuflaat

## Styling Conventions
- **Tailwind CSS v4**: `@import "tailwindcss"` syntax (NOT v3's `@tailwind base/components/utilities`)
- **No CSS Modules** - all inline Tailwind classes
- **Responsive font scale**: text-[13px] base, 14px@1440px, 15px@1920px, 16px@2560px
- **Primary font**: Inter, Noto Sans KR, Noto Sans (loaded from Google Fonts in index.css)
- **Display font**: Outfit

## Color Palette (CSS Variables in index.css)
- `--color-bg-primary`: #f8f9fb (page bg)
- `--color-bg-card`: #ffffff
- Status: Plan=#64748B, Confirm=#9694FF, Contract=#EE99C2, Space=#0ea5e9, Open=#7FC7D9
- Text: primary=#0f172a, secondary=#64748b, muted=#94a3b8
- Border: #e2e8f0

## Key Design Tokens Used in Components
- ProgressBoard bg: `bg-[#F5F5F5]`
- Chart 1 bar colors: TargetTotal=#E2E8F0 (gray), OpenCurr=#38BDF8 (blue), Construction=#BAE6FD (light blue), Signed=#F1F5F9 (pale)
- Chart 2 bar colors: Open=#7FC7D9 (teal), Remaining=#CBD5E1 (slate)
- Chart 2 line: stroke=#2563EB (blue-600)
- SummaryCard height: h-40, border-radius: rounded-[1.5rem]
- Chart 1 card border-radius: rounded-[2.5rem]
- Chart 2 card border-radius: rounded-[3rem]
- Status Matrix text sizes: country=text-[21px], values=text-[23px]

## Component Architecture
- `App.tsx` - Navigation state + top-level routing
- `Header.tsx` - 3-level nav: Level1 (Expansion/Prism pill buttons), Level2 (Stores/Wholesale/Lens underline tabs), Level3 (dropdown)
- `LandingPage.tsx` - Fullscreen split panel (EXPANSION | PRISM) with hover expand animation
- `ProgressBoard.tsx` - Dashboard with GoalModal, SummaryCard, 2 recharts + status matrix table
- `PipelineList.tsx` - Pipeline table with filters (country/brand/status/year multi-select, city/channel/class single)
- `ComingSoon.tsx` - Placeholder for unimplemented views

## Logo Usage
- Import: `import titleLogo from '../../assets/logo.avif'`
- Header: `<img src={titleLogo} alt="THE PAGES" className="h-[32px] w-auto mr-2 cursor-pointer" />`
- LandingPage: `<img src={titleLogo} alt="THE PAGES" className="h-[36px] min-[2560px]:h-[48px] w-auto" />`

## Data/Type Facts
- `Store.status` values in data: Open, Plan, Planned, Confirmed, Signed, Construction, Space, Contract, Reject, Pending
- `Store.ChangOpenDate` - actual open date (when store is Open)
- `Store.openDate` - planned open date (for pipeline)
- `Store.statusYear` - fallback year field
- `Store.financial.estimatedSales`, `.estimatedMargin`, `.investment`, `.monthlySales`, `.monthlyRent`
- `getStoreClass(type)` from types - returns 'Type-based' | 'Standalone'
- `isIICBrand(brand)` from types

## Animation Libraries
- `motion` from `motion/react` (version ^11.18.2) - used in SummaryCard `motion.div`
- Transition easing: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (standard UX)
- LandingPage panel expand: `flex: 1.08` on hover, `0.92` on other side, duration 500ms

## ProgressBoard: CustomSelect Pattern
- Inline component defined inside ProgressBoard (shares `openFilter` state)
- `openFilter` state prevents multiple dropdowns open simultaneously
- Motion dropdown: `initial={{ opacity: 0, y: 10, scale: 0.95 }}` `animate={{ opacity: 1, y: 0, scale: 1 }}`
- Pill style: `rounded-full px-8 py-3.5` with `min-width` prop
- Multi-select for Analysis Year: `multiple={true}` prop

## Navigation Brand Default
- ProgressBoard: `selectedBrand` starts as `'All Brands'` (reference uses `'GM'` but All Brands is better UX)
- Header Level2 active = `'Stores'` by default, active tab = `'ProgressBoard'`

## Build
- `npm run build` - clean build, no errors
- Chunk size warning is expected (recharts + motion = large bundle)
- Tailwind v4 does not need postcss.config separately (uses Vite plugin)
