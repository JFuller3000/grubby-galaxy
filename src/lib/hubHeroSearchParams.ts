import {
	HUB_HERO_IMAGE_ALIGNS,
	HUB_HERO_IMAGE_WIDTHS,
	HUB_HERO_MIN_HEIGHTS,
	HUB_HERO_VARIANTS,
	type HubHeroImageAlign,
	type HubHeroImageWidth,
	type HubHeroMinHeight,
	type HubHeroVariant,
} from "../components/aopa/hubHeroOptions";

/**
 * Optional gate for share links: toolbar “Update URL now” sets `hh=1` with the rest
 * of the query string. Hero props merge whenever the URL includes any known hub-hero
 * field key (see `hubHeroQueryKeys`), or when `hh=1` is present (even with no other keys).
 */
export const HUB_HERO_PREVIEW_QUERY_KEY = "hh";

/** Query keys used by the hub hero preview page and dev toolbar. */
export const hubHeroQueryKeys = {
	hubName: "hubName",
	/** Preferred lockup label source (replaces `hubName` in new links/forms). */
	pillarName: "pillarName",
	title: "title",
	description: "description",
	minHeight: "minHeight",
	variant: "variant",
	imageSrc: "imageSrc",
	imageAlt: "imageAlt",
	imageWidth: "imageWidth",
	imageAlign: "imageAlign",
	primaryLabel: "primaryLabel",
	primaryHref: "primaryHref",
	secondaryLabel: "secondaryLabel",
	secondaryHref: "secondaryHref",
	/** Secondary CTA style variant. */
	secondaryStyle: "secondaryStyle",
	/** 0–1 fill opacity for gray hero panels; omit for solid. */
	lockupOpacity: "lockupOpacity",
} as const;

/** Legacy URL key kept so older shared links still resolve. */
const LEGACY_HUB_HERO_PRIMARY_COLOR_QUERY_KEY = "primaryColor";
const LEGACY_HUB_HERO_COLOR_SCHEME_QUERY_KEY = "colorScheme";
const LEGACY_HUB_HERO_LOCKUP_OVERLAY_COLOR_QUERY_KEY = "lockupOverlayColor";
const LEGACY_HUB_HERO_COPY_TONE_QUERY_KEY = "copyTone";
const LEGACY_HUB_HERO_LOCKUP_COPY_TONE_QUERY_KEY = "lockupCopyTone";
const HUB_HERO_SECONDARY_STYLES = ["default", "alternate"] as const;
export type HubHeroSecondaryStyle = (typeof HUB_HERO_SECONDARY_STYLES)[number];

function pickLiteral<T extends string>(
	allowed: readonly T[],
	value: string | null,
): T | undefined {
	if (value == null || value === "") return;
	return (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

export function isSafeHttpUrl(value: string): boolean {
	try {
		const u = new URL(value);
		return u.protocol === "https:" || u.protocol === "http:";
	} catch {
		return false;
	}
}

/** Default hero field color (replaces former “brand” preset). */
export const DEFAULT_HUB_HERO_PRIMARY_COLOR = "#d4ecf7";
export const DEFAULT_HUB_HERO_PILLAR_NAME = "Community";
export const HUB_HERO_PILLAR_OPTIONS = ["Advocate", "Learn", "Fly", "Community"] as const;

/** Default gray for full inner + split lockup / split-only panel (was `rgb(234 234 234)`). */
export const DEFAULT_HUB_HERO_LOCKUP_OVERLAY_COLOR = "#eaeaea";

const COLOR_SCHEME_LOCKUP_OVERLAY_MAP: Record<string, string> = {
	"#115678": "#eaeaea", // Advocate
	"#1d356d": "#4a4a4a", // Learn (charcoal)
	"#2079a2": "#1d356d", // Fly
	"#d4ecf7": "#eaeaea", // Community
};

const COLOR_SCHEME_COPY_TONE_MAP: Record<string, "dark" | "light"> = {
	"#115678": "dark", // Advocate
	"#1d356d": "light", // Learn
	"#2079a2": "light", // Fly
	"#d4ecf7": "dark", // Community
};

const PILLAR_NAME_COLOR_SCHEME_MAP: Record<string, string> = {
	advocate: "#115678",
	learn: "#1d356d",
	fly: "#2079a2",
	community: "#d4ecf7",
};

const HEX_TO_PILLAR_NAME_MAP: Record<string, string> = {
	"#115678": "Advocate",
	"#1d356d": "Learn",
	"#2079a2": "Fly",
	"#d4ecf7": "Community",
};

/** `#rgb` or `#rrggbb` only (safe for CSS custom property). */
export function isValidHubHeroPrimaryHex(value: string): boolean {
	const t = value.trim();
	const v = t.startsWith("#") ? t : `#${t}`;
	return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);
}

export function normalizeHubHeroPrimaryHex(value: string): string | undefined {
	const t = value.trim();
	if (!t) return undefined;
	const v = t.startsWith("#") ? t : `#${t}`;
	if (!isValidHubHeroPrimaryHex(v)) return undefined;
	return v.toLowerCase();
}

/** Normalize user input pillar names to canonical labels. */
export function normalizeHubHeroPillarName(value: string): string | undefined {
	const trimmed = value.trim();
	if (!trimmed) return undefined;
	const canonical = HEX_TO_PILLAR_NAME_MAP[PILLAR_NAME_COLOR_SCHEME_MAP[trimmed.toLowerCase()]];
	return canonical ?? undefined;
}

/** Derive hero fill color from the selected pillar name. */
export function colorSchemeFromPillarName(pillarName: string | undefined): string {
	const normalized = normalizeHubHeroPillarName(pillarName ?? "");
	if (!normalized) return DEFAULT_HUB_HERO_PRIMARY_COLOR;
	return PILLAR_NAME_COLOR_SCHEME_MAP[normalized.toLowerCase()] ?? DEFAULT_HUB_HERO_PRIMARY_COLOR;
}

/** Derive panel tint from color scheme; keeps lockup tone in sync with selected scheme. */
export function lockupOverlayColorFromColorScheme(colorScheme: string): string {
	const normalized =
		normalizeHubHeroPrimaryHex(colorScheme) ?? DEFAULT_HUB_HERO_PRIMARY_COLOR;
	return COLOR_SCHEME_LOCKUP_OVERLAY_MAP[normalized] ?? DEFAULT_HUB_HERO_LOCKUP_OVERLAY_COLOR;
}

/** Derive body copy tone from selected color scheme. */
export function copyToneFromColorScheme(colorScheme: string): "dark" | "light" {
	const normalized =
		normalizeHubHeroPrimaryHex(colorScheme) ?? DEFAULT_HUB_HERO_PRIMARY_COLOR;
	return COLOR_SCHEME_COPY_TONE_MAP[normalized] ?? "dark";
}

/** Derive lockup copy tone from selected color scheme. */
export function lockupCopyToneFromColorScheme(colorScheme: string): "dark" | "light" {
	// Currently follows the same mapping as body copy tone.
	return copyToneFromColorScheme(colorScheme);
}

export type HubHeroResolvedFromUrl = {
	/** Legacy lockup label key kept for backward compatibility with existing shared links. */
	hubName?: string;
	/** Lockup label shown after `AOPA |` under the wings mark. */
	pillarName?: string;
	title: string;
	description?: string;
	minHeight: HubHeroMinHeight;
	variant: HubHeroVariant;
	imageSrc?: string;
	imageAlt?: string;
	imageWidth: HubHeroImageWidth;
	imageAlign: HubHeroImageAlign;
	primaryLabel: string;
	primaryHref: string;
	secondaryLabel: string;
	secondaryHref: string;
	secondaryStyle: HubHeroSecondaryStyle;
	/** Split + lockup column and full-variant gray inner. Omitted or solid when var unset. */
	lockupOverlayOpacity?: number;
};

/**
 * Partial overrides from the URL (only keys present in the query string).
 */
export function parseHubHeroSearchParams(
	searchParams: URLSearchParams,
): Partial<HubHeroResolvedFromUrl> {
	const out: Partial<HubHeroResolvedFromUrl> = {};
	const k = hubHeroQueryKeys;

	if (searchParams.has(k.hubName)) {
		const v = (searchParams.get(k.hubName) ?? "").trim();
		out.hubName = v.length > 0 ? v : undefined;
	}
	if (searchParams.has(k.pillarName)) {
		const v = (searchParams.get(k.pillarName) ?? "").trim();
		out.pillarName = normalizeHubHeroPillarName(v);
	}
	if (searchParams.has(k.title)) {
		out.title = (searchParams.get(k.title) ?? "").trim();
	}
	if (searchParams.has(k.description)) {
		out.description = searchParams.get(k.description) ?? "";
	}
	const rawColorScheme = searchParams.get(LEGACY_HUB_HERO_COLOR_SCHEME_QUERY_KEY);
	const rawLegacyPrimaryColor = searchParams.get(LEGACY_HUB_HERO_PRIMARY_COLOR_QUERY_KEY);
	if (rawColorScheme != null || rawLegacyPrimaryColor != null) {
		const raw = (rawColorScheme ?? rawLegacyPrimaryColor ?? "").trim();
		const hex = raw === "" ? DEFAULT_HUB_HERO_PRIMARY_COLOR : normalizeHubHeroPrimaryHex(raw);
		if (hex) {
			const pillarFromLegacyColor = HEX_TO_PILLAR_NAME_MAP[hex];
			if (pillarFromLegacyColor && !out.pillarName) out.pillarName = pillarFromLegacyColor;
		}
	}
	const mh = pickLiteral(HUB_HERO_MIN_HEIGHTS, searchParams.get(k.minHeight));
	if (mh) out.minHeight = mh;
	const v = pickLiteral(HUB_HERO_VARIANTS, searchParams.get(k.variant));
	if (v) out.variant = v;
	if (searchParams.has(k.imageSrc)) {
		const src = (searchParams.get(k.imageSrc) ?? "").trim();
		out.imageSrc = src.length > 0 && isSafeHttpUrl(src) ? src : undefined;
	}
	if (searchParams.has(k.imageAlt)) {
		out.imageAlt = searchParams.get(k.imageAlt) ?? "";
	}
	const iw = pickLiteral(HUB_HERO_IMAGE_WIDTHS, searchParams.get(k.imageWidth));
	if (iw) out.imageWidth = iw;
	const ia = pickLiteral(HUB_HERO_IMAGE_ALIGNS, searchParams.get(k.imageAlign));
	if (ia) out.imageAlign = ia;
	if (searchParams.has(k.primaryLabel)) {
		out.primaryLabel = (searchParams.get(k.primaryLabel) ?? "").trim();
	}
	if (searchParams.has(k.primaryHref)) {
		out.primaryHref = (searchParams.get(k.primaryHref) ?? "").trim();
	}
	if (searchParams.has(k.secondaryLabel)) {
		out.secondaryLabel = (searchParams.get(k.secondaryLabel) ?? "").trim();
	}
	if (searchParams.has(k.secondaryHref)) {
		out.secondaryHref = (searchParams.get(k.secondaryHref) ?? "").trim();
	}
	const secondaryStyle = pickLiteral(HUB_HERO_SECONDARY_STYLES, searchParams.get(k.secondaryStyle));
	if (secondaryStyle) out.secondaryStyle = secondaryStyle;
	if (searchParams.has(k.lockupOpacity)) {
		const raw = (searchParams.get(k.lockupOpacity) ?? "").trim();
		if (raw.length > 0) {
			const n = Number(raw);
			if (Number.isFinite(n)) {
				out.lockupOverlayOpacity = Math.min(1, Math.max(0, n));
			}
		}
	}
	return out;
}

const hubHeroKeySet = new Set<string>([
	...Object.values(hubHeroQueryKeys),
	LEGACY_HUB_HERO_COLOR_SCHEME_QUERY_KEY,
	LEGACY_HUB_HERO_PRIMARY_COLOR_QUERY_KEY,
	LEGACY_HUB_HERO_LOCKUP_OVERLAY_COLOR_QUERY_KEY,
	LEGACY_HUB_HERO_COPY_TONE_QUERY_KEY,
	LEGACY_HUB_HERO_LOCKUP_COPY_TONE_QUERY_KEY,
]);

/** True if the URL contains any hub-hero field keys (excluding the preview gate). */
export function hasHubHeroContentParams(searchParams: URLSearchParams): boolean {
	for (const key of searchParams.keys()) {
		if (hubHeroKeySet.has(key)) return true;
	}
	return false;
}

export function isHubHeroPreviewQueryEnabled(searchParams: URLSearchParams): boolean {
	return searchParams.get(HUB_HERO_PREVIEW_QUERY_KEY) === "1";
}

/** True when query params should be merged over `defaults` in hero.astro. */
export function hubHeroUrlOverridesSearchParams(searchParams: URLSearchParams): boolean {
	return (
		isHubHeroPreviewQueryEnabled(searchParams) || hasHubHeroContentParams(searchParams)
	);
}

export function resolveHubHeroFromUrl(
	searchParams: URLSearchParams,
	defaults: HubHeroResolvedFromUrl,
): HubHeroResolvedFromUrl {
	if (!hubHeroUrlOverridesSearchParams(searchParams)) {
		return { ...defaults };
	}
	return { ...defaults, ...parseHubHeroSearchParams(searchParams) };
}

/** Dev banner: URL includes at least one known hero field (props are driven from the URL). */
export function hubHeroUrlOverridesActive(searchParams: URLSearchParams): boolean {
	return hasHubHeroContentParams(searchParams);
}

/** Previously used for a “params ignored” banner; merge no longer requires `hh=1`. */
export function hubHeroUrlParamsIgnored(_searchParams: URLSearchParams): boolean {
	return false;
}
