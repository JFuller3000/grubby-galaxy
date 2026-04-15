import {
	HUB_HERO_IMAGE_ALIGNS,
	HUB_HERO_IMAGE_WIDTHS,
	HUB_HERO_MIN_HEIGHTS,
	HUB_HERO_VARIANTS,
	HUB_HERO_COPY_TONES,
	type HubHeroCopyTone,
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
	columnName: "columnName",
	title: "title",
	description: "description",
	/** Hero section fill (`--aopa-hero-primary`); `#rgb` or `#rrggbb`. */
	primaryColor: "primaryColor",
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
	/** 0–1 fill opacity for gray hero panels; omit for solid. */
	lockupOpacity: "lockupOpacity",
	/** Panel fill hue (`#rgb` / `#rrggbb`); `color-mix` with `lockupOpacity`. */
	lockupOverlayColor: "lockupOverlayColor",
	/** `dark` | `light` — headline + description. */
	copyTone: "copyTone",
	/** `dark` | `light` — AOPA + hub name in the lockup column. */
	lockupCopyTone: "lockupCopyTone",
} as const;

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

/** Default gray for full inner + split lockup / split-only panel (was `rgb(234 234 234)`). */
export const DEFAULT_HUB_HERO_LOCKUP_OVERLAY_COLOR = "#eaeaea";

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

/** `<input type="color">` requires `#rrggbb`. */
export function hexForColorInput(
	value: string,
	fallbackHex: string = DEFAULT_HUB_HERO_PRIMARY_COLOR,
): string {
	const h = (normalizeHubHeroPrimaryHex(value) ?? fallbackHex).toLowerCase();
	const m = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(h);
	if (m) return `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}`;
	return h;
}

export type HubHeroResolvedFromUrl = {
	/** Legacy lockup label key kept for backward compatibility with existing shared links. */
	hubName?: string;
	/** Lockup label shown after `AOPA |` under the wings mark. */
	columnName?: string;
	title: string;
	description?: string;
	/** Section / half-hero fill via `--aopa-hero-primary`. */
	primaryColor: string;
	/** Panel tint via `--aopa-hero-lockup-overlay-color` (with opacity). */
	lockupOverlayColor: string;
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
	/** Split + lockup column and full-variant gray inner. Omitted or solid when var unset. */
	lockupOverlayOpacity?: number;
	copyTone: HubHeroCopyTone;
	lockupCopyTone: HubHeroCopyTone;
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
	if (searchParams.has(k.columnName)) {
		const v = (searchParams.get(k.columnName) ?? "").trim();
		out.columnName = v.length > 0 ? v : undefined;
	}
	if (searchParams.has(k.title)) {
		out.title = (searchParams.get(k.title) ?? "").trim();
	}
	if (searchParams.has(k.description)) {
		out.description = searchParams.get(k.description) ?? "";
	}
	if (searchParams.has(k.primaryColor)) {
		const raw = (searchParams.get(k.primaryColor) ?? "").trim();
		if (raw === "") {
			out.primaryColor = DEFAULT_HUB_HERO_PRIMARY_COLOR;
		} else {
			const hex = normalizeHubHeroPrimaryHex(raw);
			if (hex) out.primaryColor = hex;
		}
	}
	if (searchParams.has(k.lockupOverlayColor)) {
		const raw = (searchParams.get(k.lockupOverlayColor) ?? "").trim();
		if (raw === "") {
			out.lockupOverlayColor = DEFAULT_HUB_HERO_LOCKUP_OVERLAY_COLOR;
		} else {
			const hex = normalizeHubHeroPrimaryHex(raw);
			if (hex) out.lockupOverlayColor = hex;
		}
	}
	const mh = pickLiteral(HUB_HERO_MIN_HEIGHTS, searchParams.get(k.minHeight));
	if (mh) out.minHeight = mh;
	const v = pickLiteral(HUB_HERO_VARIANTS, searchParams.get(k.variant));
	if (v) out.variant = v;
	const copyTone = pickLiteral(HUB_HERO_COPY_TONES, searchParams.get(k.copyTone));
	if (copyTone) out.copyTone = copyTone;
	const lockupCopyTone = pickLiteral(HUB_HERO_COPY_TONES, searchParams.get(k.lockupCopyTone));
	if (lockupCopyTone) out.lockupCopyTone = lockupCopyTone;
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

const hubHeroKeySet = new Set<string>(Object.values(hubHeroQueryKeys));

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
