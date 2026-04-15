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
import {
	colorSchemeFromPillarName,
	copyToneFromColorScheme,
	HUB_HERO_PREVIEW_QUERY_KEY,
	hubHeroQueryKeys,
	isSafeHttpUrl,
	lockupOverlayColorFromColorScheme,
	lockupCopyToneFromColorScheme,
	normalizeHubHeroPillarName,
	resolveHubHeroFromUrl,
	type HubHeroResolvedFromUrl,
} from "../lib/hubHeroSearchParams";

const heightClassPrefix = "aopa-hub-hero--height-";

function pickHeight(v: string): HubHeroMinHeight {
	return (HUB_HERO_MIN_HEIGHTS as readonly string[]).includes(v)
		? (v as HubHeroMinHeight)
		: "tall";
}

function pickVariant(v: string): HubHeroVariant {
	return (HUB_HERO_VARIANTS as readonly string[]).includes(v)
		? (v as HubHeroVariant)
		: "full";
}

function pickImageWidth(v: string): HubHeroImageWidth {
	return (HUB_HERO_IMAGE_WIDTHS as readonly string[]).includes(v)
		? (v as HubHeroImageWidth)
		: "full";
}

function pickImageAlign(v: string): HubHeroImageAlign {
	return (HUB_HERO_IMAGE_ALIGNS as readonly string[]).includes(v)
		? (v as HubHeroImageAlign)
		: "left";
}

function stripHeroImageLayout(section: HTMLElement) {
	section.classList.remove(
		"aopa-hub-hero--has-hero-image",
		"aopa-hub-hero--hero-image-full",
		"aopa-hub-hero--hero-image-half",
	);
}

/** Push resolved values into the dev toolbar form (client). */
export function writeHubHeroFormFromResolved(
	form: HTMLFormElement,
	state: HubHeroResolvedFromUrl,
): void {
	const k = hubHeroQueryKeys;
	const set = (name: string, value: string) => {
		const el = form.elements.namedItem(name);
		if (
			el instanceof HTMLInputElement ||
			el instanceof HTMLTextAreaElement ||
			el instanceof HTMLSelectElement
		) {
			if (el instanceof HTMLInputElement && el.type === "color") {
				el.value = value;
			} else {
				el.value = value;
			}
		}
	};
	set(k.hubName, state.hubName ?? "");
	set(k.pillarName, state.pillarName ?? state.hubName ?? "");
	set(k.title, state.title);
	set(k.description, state.description ?? "");
	set(k.minHeight, state.minHeight);
	set(k.variant, state.variant);
	set(k.imageSrc, state.imageSrc ?? "");
	set(k.imageAlt, state.imageAlt ?? "");
	set(k.imageWidth, state.imageWidth);
	set(k.imageAlign, state.imageAlign);
	set(k.primaryLabel, state.primaryLabel);
	set(k.primaryHref, state.primaryHref);
	set(k.secondaryLabel, state.secondaryLabel);
	set(k.secondaryHref, state.secondaryHref);
	set(
		k.lockupOpacity,
		state.lockupOverlayOpacity != null && Number.isFinite(state.lockupOverlayOpacity)
			? String(state.lockupOverlayOpacity)
			: "",
	);
}

/**
 * Apply URL query params to the hero (and dev form when present). Needed for static
 * builds where SSR never sees `window.location.search`.
 */
export function hydrateHubHeroFromCurrentUrl(defaults: HubHeroResolvedFromUrl): void {
	const section = document.querySelector<HTMLElement>("[data-hub-hero-root]");
	if (!section) return;
	const sp = new URLSearchParams(window.location.search);
	const resolved = resolveHubHeroFromUrl(sp, defaults);
	applyHubHeroLiveState(section, resolved);
	const form = document.querySelector<HTMLFormElement>("[data-hh-dev-form]");
	if (form) {
		writeHubHeroFormFromResolved(form, resolved);
		const sync = form.querySelector<HTMLInputElement>("[data-hh-sync-url]");
		if (sync) {
			sync.checked = sp.get(HUB_HERO_PREVIEW_QUERY_KEY) === "1";
		}
	}
}

export function readHubHeroForm(form: HTMLFormElement): HubHeroResolvedFromUrl {
	const fd = new FormData(form);
	const g = (k: string) => (fd.get(k) as string | null) ?? "";
	const hubName = g(hubHeroQueryKeys.hubName).trim();
	const pillarName = normalizeHubHeroPillarName(g(hubHeroQueryKeys.pillarName)) ?? "";
	const imageSrc = g(hubHeroQueryKeys.imageSrc).trim();
	return {
		hubName: hubName.length > 0 ? hubName : undefined,
		pillarName: pillarName.length > 0 ? pillarName : undefined,
		title: g(hubHeroQueryKeys.title).trim(),
		description: g(hubHeroQueryKeys.description),
		minHeight: pickHeight(g(hubHeroQueryKeys.minHeight)),
		variant: pickVariant(g(hubHeroQueryKeys.variant)),
		imageSrc: imageSrc.length > 0 && isSafeHttpUrl(imageSrc) ? imageSrc : undefined,
		imageAlt: g(hubHeroQueryKeys.imageAlt),
		imageWidth: pickImageWidth(g(hubHeroQueryKeys.imageWidth)),
		imageAlign: pickImageAlign(g(hubHeroQueryKeys.imageAlign)),
		primaryLabel: g(hubHeroQueryKeys.primaryLabel).trim(),
		primaryHref: g(hubHeroQueryKeys.primaryHref).trim() || "#",
		secondaryLabel: g(hubHeroQueryKeys.secondaryLabel).trim(),
		secondaryHref: g(hubHeroQueryKeys.secondaryHref).trim() || "#",
		lockupOverlayOpacity: (() => {
			const raw = g(hubHeroQueryKeys.lockupOpacity).trim();
			if (raw === "") return undefined;
			const n = Number(raw);
			return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : undefined;
		})(),
	};
}

function stripPrefixedClasses(el: HTMLElement, prefix: string) {
	for (const c of [...el.classList]) {
		if (c.startsWith(prefix)) el.classList.remove(c);
	}
}

export function applyHubHeroLiveState(
	section: HTMLElement,
	state: HubHeroResolvedFromUrl,
): void {
	if (!section.querySelector(".aopa-hub-hero__body")) return;

	const lockupPillarName = state.pillarName?.trim() ?? "";
	const lockupHubName = state.hubName?.trim() ?? "";
	const hasLockup = lockupPillarName.length > 0 || lockupHubName.length > 0;
	const splitLayout = state.variant === "split";
	const fullLayout = !splitLayout;
	const imgSrc = state.imageSrc?.trim() ?? "";
	const hasImage = imgSrc.length > 0 && isSafeHttpUrl(imgSrc);
	const iw = state.imageWidth === "half" ? "half" : "full";
	const ia = state.imageAlign === "right" ? "right" : "left";
	const colorScheme = colorSchemeFromPillarName(state.pillarName);
	const copyTone = copyToneFromColorScheme(colorScheme);
	const lockupCopyTone = lockupCopyToneFromColorScheme(colorScheme);

	stripPrefixedClasses(section, "aopa-hub-hero--bg-");
	section.style.setProperty("--aopa-hero-primary", colorScheme);
	section.style.setProperty(
		"--aopa-hero-lockup-overlay-color",
		lockupOverlayColorFromColorScheme(colorScheme),
	);
	stripPrefixedClasses(section, heightClassPrefix);
	section.classList.add(`${heightClassPrefix}${state.minHeight}`);

	stripHeroImageLayout(section);
	if (hasImage) {
		section.classList.add("aopa-hub-hero--has-hero-image");
		section.classList.add(iw === "full" ? "aopa-hub-hero--hero-image-full" : "aopa-hub-hero--hero-image-half");
		section.style.setProperty("--hub-hero-bg-image", `url(${JSON.stringify(imgSrc)})`);
	} else {
		section.style.removeProperty("--hub-hero-bg-image");
	}

	if (
		state.lockupOverlayOpacity != null &&
		Number.isFinite(state.lockupOverlayOpacity)
	) {
		section.style.setProperty(
			"--aopa-hero-lockup-overlay-opacity",
			String(Math.min(1, Math.max(0, state.lockupOverlayOpacity))),
		);
	} else {
		section.style.removeProperty("--aopa-hero-lockup-overlay-opacity");
	}

	section.classList.toggle("aopa-hub-hero--variant-full", fullLayout);
	section.classList.toggle("aopa-hub-hero--has-lockup", hasLockup);
	section.classList.toggle("aopa-hub-hero--split", splitLayout);
	section.classList.toggle("aopa-hub-hero--copy-light", copyTone === "light");
	section.classList.toggle(
		"aopa-hub-hero--lockup-copy-light",
		hasLockup && lockupCopyTone === "light",
	);

	const bgLayer = section.querySelector<HTMLElement>("[data-hub-hero-bg]");
	if (bgLayer) {
		bgLayer.hidden = !hasImage;
		bgLayer.classList.toggle("aopa-hub-hero__bg--half-left", hasImage && iw === "half" && ia === "left");
		bgLayer.classList.toggle("aopa-hub-hero__bg--half-right", hasImage && iw === "half" && ia === "right");
	}

	const lockWrap = section.querySelector<HTMLElement>("[data-hub-lockup-wrap]");
	const lockLogo = section.querySelector<HTMLImageElement>("[data-hub-lockup-logo]");
	const lockPrefix = section.querySelector<HTMLElement>("[data-hub-lockup-prefix]");
	const lockColumn = section.querySelector<HTMLElement>("[data-hub-lockup-column]");
	const lockHub = section.querySelector<HTMLElement>("[data-hub-lockup-hub]");
	if (lockWrap) {
		lockWrap.hidden = !hasLockup;
	}
	if (lockLogo) {
		const lightSrc = lockLogo.dataset.lockupLogoLight ?? "/images/aopa-wings-logo-white.svg";
		const darkSrc = lockLogo.dataset.lockupLogoDark ?? "/images/aopa-wings-logo-blue.svg";
		lockLogo.src = lockupCopyTone === "light" ? lightSrc : darkSrc;
	}
	if (lockPrefix) {
		lockPrefix.textContent = `AOPA${lockupPillarName.length > 0 ? " | " : ""}`;
	}
	if (lockColumn) {
		lockColumn.textContent = lockupPillarName;
		lockColumn.hidden = lockupPillarName.length === 0;
	}
	if (lockHub) {
		lockHub.textContent = lockupHubName;
		lockHub.hidden = lockupHubName.length === 0;
	}

	const titleText = state.title.trim();
	const titleRoot = section.querySelector<HTMLElement>("[data-hub-title-root]");
	const titleEl = section.querySelector<HTMLElement>("[data-hub-title]");
	if (titleEl) titleEl.textContent = state.title;
	if (titleRoot) titleRoot.hidden = titleText.length === 0;

	const descEl = section.querySelector<HTMLElement>("[data-hub-description]");
	const descText = (state.description ?? "").trim();
	if (descEl) {
		descEl.textContent = state.description ?? "";
		descEl.hidden = descText.length === 0;
	}

	const hasTitle = titleText.length > 0;
	const hasDescription = descText.length > 0;
	if (hasTitle) {
		section.setAttribute("aria-labelledby", "aopa-hub-hero-title");
		section.removeAttribute("aria-label");
	} else if (hasDescription) {
		section.setAttribute("aria-labelledby", "aopa-hub-hero-description");
		section.removeAttribute("aria-label");
	} else {
		section.removeAttribute("aria-labelledby");
		section.setAttribute("aria-label", "Hero");
	}

	const actions = section.querySelector<HTMLElement>("[data-hub-actions]");
	const pCta = section.querySelector<HTMLAnchorElement>("[data-hub-cta-primary]");
	const sCta = section.querySelector<HTMLAnchorElement>("[data-hub-cta-secondary]");
	const pLabel = state.primaryLabel.trim();
	const sLabel = state.secondaryLabel.trim();
	const showP = pLabel.length > 0;
	const showS = sLabel.length > 0;
	if (actions) {
		actions.hidden = !showP && !showS;
	}
	if (pCta) {
		pCta.hidden = !showP;
		if (showP) {
			pCta.textContent = pLabel;
			pCta.href = state.primaryHref || "#";
		}
	}
	if (sCta) {
		sCta.hidden = !showS;
		if (showS) {
			sCta.textContent = sLabel;
			sCta.href = state.secondaryHref || "#";
		}
	}
}

export function buildHubHeroShareSearchParams(state: HubHeroResolvedFromUrl): URLSearchParams {
	const sp = new URLSearchParams();
	sp.set(HUB_HERO_PREVIEW_QUERY_KEY, "1");
	const k = hubHeroQueryKeys;
	if (state.hubName?.trim()) sp.set(k.hubName, state.hubName.trim());
	if (state.pillarName?.trim()) sp.set(k.pillarName, state.pillarName.trim());
	sp.set(k.title, state.title);
	if (state.description != null) sp.set(k.description, state.description);
	sp.set(k.minHeight, state.minHeight);
	sp.set(k.variant, state.variant);
	sp.set(k.imageWidth, state.imageWidth);
	sp.set(k.imageAlign, state.imageAlign);
	if (state.imageSrc?.trim()) sp.set(k.imageSrc, state.imageSrc.trim());
	if (state.imageAlt != null) sp.set(k.imageAlt, state.imageAlt);
	/* Always emit CTA fields so clearing a button survives refresh (merge beats defaults). */
	sp.set(k.primaryLabel, state.primaryLabel.trim());
	sp.set(k.primaryHref, (state.primaryHref ?? "").trim() || "#");
	sp.set(k.secondaryLabel, state.secondaryLabel.trim());
	sp.set(k.secondaryHref, (state.secondaryHref ?? "").trim() || "#");
	if (state.lockupOverlayOpacity != null && Number.isFinite(state.lockupOverlayOpacity)) {
		sp.set(k.lockupOpacity, String(state.lockupOverlayOpacity));
	}
	return sp;
}

export function wireHubHeroLivePreview(): void {
	const section = document.querySelector<HTMLElement>("[data-hub-hero-root]");
	const form = document.querySelector<HTMLFormElement>("[data-hh-dev-form]");
	if (!section || !form) return;

	let urlTimer: ReturnType<typeof setTimeout> | null = null;

	const syncUrlEnabled = () =>
		Boolean(form.querySelector<HTMLInputElement>("[data-hh-sync-url]")?.checked);

	const syncUrl = () => {
		const state = readHubHeroForm(form);
		const sp = buildHubHeroShareSearchParams(state);
		const next = `${window.location.pathname}?${sp.toString()}`;
		window.history.replaceState(null, "", next);
	};

	const applyDomOnly = () => {
		const state = readHubHeroForm(form);
		applyHubHeroLiveState(section, state);
	};

	const scheduleUrlSync = () => {
		if (!syncUrlEnabled()) return;
		if (urlTimer) clearTimeout(urlTimer);
		urlTimer = setTimeout(syncUrl, 350);
	};

	const onField = () => {
		applyDomOnly();
		scheduleUrlSync();
	};

	form.addEventListener("input", onField);
	form.addEventListener("change", onField);
	form.addEventListener("submit", (e) => {
		e.preventDefault();
		applyDomOnly();
		if (urlTimer) clearTimeout(urlTimer);
		urlTimer = null;
		// Explicit submit always writes shareable params (hh=1); checkbox only gates live debounced sync.
		syncUrl();
	});
}
