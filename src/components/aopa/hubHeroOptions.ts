/**
 * Allowed values for `HubHero` props (`HubHero.astro`).
 * Import these constants when building CMS picklists or validation.
 * If your design deck uses different names, rename these literals to match.
 */
export const HUB_HERO_BACKGROUNDS = ["neutral", "brand", "dark"] as const;
export type HubHeroBackground = (typeof HUB_HERO_BACKGROUNDS)[number];

export const HUB_HERO_VARIANTS = ["split", "centered"] as const;
export type HubHeroVariant = (typeof HUB_HERO_VARIANTS)[number];

export const HUB_HERO_MIN_HEIGHTS = ["short", "tall", "viewport"] as const;
export type HubHeroMinHeight = (typeof HUB_HERO_MIN_HEIGHTS)[number];

export const HUB_HERO_IMAGE_POSITIONS = ["left", "right"] as const;
export type HubHeroImagePosition = (typeof HUB_HERO_IMAGE_POSITIONS)[number];
