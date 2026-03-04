// =============================================================================
// Brand Assets — 이미지 경로 중앙 관리
// 비전공자 설명: 앱에서 사용하는 로고, 아이콘 등 이미지의 경로를
// 한 곳에 모아 관리하는 파일입니다. 이미지 변경 시 이 파일만 수정하면 됩니다.
// =============================================================================

// ─── Title Logo ──────────────────────────────────────────────────────────────

// 프로덕션 환경: assets 폴더의 로고 이미지를 사용합니다
import titleLogoAsset from "../assets/logo.avif";
export const titleLogo: string = titleLogoAsset;

// ─── Dashboard UI Assets ─────────────────────────────────────────────────────

// 사용자 아바타 기본 이미지
export const userAvatar = "https://images.unsplash.com/photo-1689600944138-da3b150d9cb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=80&q=80";

// ─── Utility Icons (SVG 인라인 아이콘) ────────────────────────────────────────

// AI 반짝임 아이콘 (보라색)
export const aiIcon = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"/></svg>`)}`;

// 전체 선택 체크 아이콘
export const selectAllIcon = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12l3 3 5-5"/></svg>`)}`;

// ─── Brand Logos (Clearbit Logo API — 고품질 무료 로고) ──────────────────────

export const appleIcon          = "https://logo.clearbit.com/apple.com";
export const nikeIcon           = "https://logo.clearbit.com/nike.com";
export const balenciagaIcon     = "https://logo.clearbit.com/balenciaga.com";
export const raybanIcon         = "https://logo.clearbit.com/ray-ban.com";
export const lululemonIcon      = "https://logo.clearbit.com/lululemon.com";
export const burberryIcon       = "https://logo.clearbit.com/burberry.com";
export const adidasIcon         = "https://logo.clearbit.com/adidas.com";
export const chanelIcon         = "https://logo.clearbit.com/chanel.com";
export const aloIcon            = "https://logo.clearbit.com/aloyoga.com";
export const googleIcon         = "https://logo.clearbit.com/google.com";
export const samsungIcon        = "https://logo.clearbit.com/samsung.com";
export const metaIcon           = "https://logo.clearbit.com/meta.com";
export const louisVuittonIcon   = "https://logo.clearbit.com/louisvuitton.com";
export const bottegaVenetaIcon  = "https://logo.clearbit.com/bottegaveneta.com";
export const acneStudiosIcon    = "https://logo.clearbit.com/acnestudios.com";
export const amiIcon            = "https://logo.clearbit.com/amiparis.com";
export const pradaIcon          = "https://logo.clearbit.com/prada.com";
