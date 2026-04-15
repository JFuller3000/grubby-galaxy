/**
 * Allowed values for `HubHero` props (`HubHero.astro`).
 * Import these constants when building CMS picklists or validation.
 * If your design deck uses different names, rename these literals to match.
 */
export const HUB_HERO_VARIANTS = ["split", "full"] as const;
export type HubHeroVariant = (typeof HUB_HERO_VARIANTS)[number];

export const HUB_HERO_MIN_HEIGHTS = ["short", "tall", "viewport"] as const;
export type HubHeroMinHeight = (typeof HUB_HERO_MIN_HEIGHTS)[number];

/** Hero-level background image width */
export const HUB_HERO_IMAGE_WIDTHS = ["full", "half"] as const;
export type HubHeroImageWidth = (typeof HUB_HERO_IMAGE_WIDTHS)[number];

/** When width is half, which side the photo occupies */
export const HUB_HERO_IMAGE_ALIGNS = ["left", "right"] as const;
export type HubHeroImageAlign = (typeof HUB_HERO_IMAGE_ALIGNS)[number];

/** Headline + description (`copyTone`) and lockup AOPA + hub line (`lockupCopyTone`). */
export const HUB_HERO_COPY_TONES = ["dark", "light"] as const;
export type HubHeroCopyTone = (typeof HUB_HERO_COPY_TONES)[number];
