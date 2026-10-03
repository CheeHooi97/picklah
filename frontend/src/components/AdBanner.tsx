import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { createBannerController, inlineBannerMargin } from "../platform/banner-controller";

const testAds = import.meta.env.VITE_ADS_USE_TEST_IDS !== "false";
const adId = testAds ? "ca-app-pub-3940256099942544/6300978111" : (import.meta.env.VITE_ADMOB_ANDROID_BANNER_ID || "").trim();
const native = Capacitor.getPlatform() === "android";
const preview = import.meta.env.DEV && import.meta.env.VITE_ADS_PREVIEW === "true";
let sdk: Promise<typeof import("@capacitor-community/admob")> | undefined;
const loadSDK = () => sdk ??= import("@capacitor-community/admob");

const banner = createBannerController({
  async prepare() {
    const { AdMob, AdmobConsentStatus } = await loadSDK();
    await AdMob.initialize({ initializeForTesting: testAds });
    let consent = await AdMob.requestConsentInfo();
    if (consent.isConsentFormAvailable && consent.status === AdmobConsentStatus.REQUIRED) consent = await AdMob.showConsentForm();
    window.dispatchEvent(new CustomEvent("picklah-ad-consent", { detail: consent.privacyOptionsRequirementStatus === "REQUIRED" }));
    return consent.canRequestAds === true;
  },
  async show(options) {
    const { AdMob, BannerAdPosition, BannerAdSize } = await loadSDK();
    await AdMob.showBanner({ ...options, adSize: BannerAdSize.BANNER, position: BannerAdPosition.TOP_CENTER, isTesting: testAds });
  },
  async remove() { await (await loadSDK()).AdMob.removeBanner(); },
  onError() { console.warn("AdMob banner unavailable; keeping the ad placeholder."); },
});

export function AdBanner() {
  const slot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!native || !adId) return;
    let release: (() => void) | undefined;
    let currentMargin = -1;
    const update = () => {
      const nav = document.querySelector<HTMLElement>(".mobile-workspace-nav");
      const bounds = slot.current?.getBoundingClientRect();
      const navTop = nav?.getBoundingClientRect().height ? nav.getBoundingClientRect().top : window.innerHeight;
      const safeTop = parseFloat(getComputedStyle(document.querySelector(".app-shell")!).paddingTop) || 0;
      const margin = inlineBannerMargin(bounds, navTop, safeTop);
      const focused = document.activeElement;
      const editing = focused instanceof HTMLElement && (focused.matches("input, textarea") || focused.isContentEditable);
      const blocked = margin === null || editing || document.querySelector("dialog[open], .template-menu") !== null || document.visibilityState === "hidden" || document.documentElement.dataset.adPrivacyOpen === "true";
      if (blocked) { release?.(); release = undefined; return; }
      // The plugin adds the Android status-bar inset to TOP_CENTER itself.
      if (release && currentMargin === margin) return;
      release?.(); currentMargin = margin!;
      release = banner.acquire({ adId, margin: margin! });
    };
    const observer = new MutationObserver(update);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["open", "data-mobile-screen"] });
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(document.querySelector(".page-main")!);
    update();
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("resize", update);
    let scrollTimer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      release?.(); release = undefined;
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(update, 180);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const retry = () => { release?.(); release = undefined; update(); };
    window.addEventListener("online", retry);
    window.addEventListener("picklah-ad-privacy", retry);
    return () => {
      observer.disconnect(); resizeObserver.disconnect(); release?.(); clearTimeout(scrollTimer);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("online", retry);
      window.removeEventListener("picklah-ad-privacy", retry);
    };
  }, []);

  if (!native && !preview) return null;
  return <aside className="ad-banner-placeholder" aria-label="Advertisement" data-ad-provider="admob">
    <span>Advertisement</span>
    <div ref={slot} className="ad-banner-slot">{preview ? "Ad placeholder" : null}</div>
  </aside>;
}

export function AdPrivacyOptions() {
  const [required, setRequired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const update = (event: Event) => setRequired((event as CustomEvent<boolean>).detail);
    window.addEventListener("picklah-ad-consent", update);
    return () => window.removeEventListener("picklah-ad-consent", update);
  }, []);
  if (!native || !required) return null;
  const openPrivacy = async () => {
    setBusy(true); setNotice("");
    document.documentElement.dataset.adPrivacyOpen = "true";
    window.dispatchEvent(new Event("picklah-ad-privacy"));
    try { await (await loadSDK()).AdMob.showPrivacyOptionsForm(); }
    catch { setNotice("Ad privacy options could not load. Please try again."); }
    finally {
      delete document.documentElement.dataset.adPrivacyOpen;
      window.dispatchEvent(new Event("picklah-ad-privacy"));
      setBusy(false);
    }
  };
  return <div><button className="text-action" type="button" disabled={busy} onClick={() => void openPrivacy()}>Ad privacy options</button>{notice && <p className="editor-note" role="status">{notice}</p>}</div>;
}
