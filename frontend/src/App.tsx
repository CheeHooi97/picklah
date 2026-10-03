import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { ChoiceEditor } from "./components/ChoiceEditor";
import { AccountMenu } from "./components/AccountMenu";
import { AdBanner, AdPrivacyOptions } from "./components/AdBanner";
import { ChoiceIcon } from "./components/ChoiceIcon";
import { WheelVisual } from "./components/WheelVisual";
import { getTemplates, getWheel, publishWheel } from "./api/wheels";
import { defaultDraft, templates as starterTemplates } from "./features/wheel/templates";
import { randomIndex, winnerRotation } from "./features/wheel/random";
import { appendChoices, appearanceFor, validGifURL } from "./features/wheel/appearance";
import { embeddedBytes, MAX_WHEEL_IMAGE_BYTES } from "./features/wheel/media";
import { loadDraft, saveDraft } from "./features/wheel/storage";
import type { WheelAppearance, WheelDraft, WheelTemplate } from "./features/wheel/types";
import { copyText, shareLink } from "./platform/share";
import { updatePageSEO } from "./seo";

function publicIDFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/w\/([A-Za-z0-9_-]{22})\/?$/);
  return match ? match[1] : null;
}

function sharedURL(publicID: string): string {
  const base = (import.meta.env.VITE_PUBLIC_URL || window.location.origin).replace(/\/$/, "");
  return base + "/w/" + publicID;
}

function Brand() {
  return (
    <a className="brand" href="/" aria-label="PickLah home">
      <img className="brand-icon" src="/picklah-logo.png" width="44" height="46" alt="" />
      <span>Pick</span><span className="brand-accent">Lah</span><i aria-hidden="true" />
    </a>
  );
}

function ResultIcon({ appearance }: { appearance: WheelAppearance }) {
  return <span className="result-emoji" aria-hidden="true"><ChoiceIcon appearance={appearance} /></span>;
}

export function App() {
  const initialSharedID = useRef(publicIDFromPath(window.location.pathname)).current;
  const [draft, setDraft] = useState<WheelDraft>(defaultDraft);
  const [availableTemplates, setAvailableTemplates] = useState<WheelTemplate[]>(starterTemplates);
  const [sharedID, setSharedID] = useState<string | null>(initialSharedID);
  const [sharedReadOnly, setSharedReadOnly] = useState(initialSharedID !== null);
  const [sharedLoading, setSharedLoading] = useState(initialSharedID !== null);
  const [remoteError, setRemoteError] = useState("");
  const [shareURL, setShareURL] = useState("");
  const [shareNotice, setShareNotice] = useState("");
  const [pageNotice, setPageNotice] = useState("");
  const [draftSaveNotice, setDraftSaveNotice] = useState("");
  const [previousWheel, setPreviousWheel] = useState<{ draft: WheelDraft; sharedID: string | null; sharedReadOnly: boolean; shareURL: string } | null>(null);
  const [ready, setReady] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [mobileScreen, setMobileScreen] = useState<"wheel" | "choices">("wheel");
  const [templateMenuPosition, setTemplateMenuPosition] = useState({ left: 16, top: 0, width: 360, maxHeight: 580 });
  const [spinning, setSpinning] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<number | null>(null);
  const [removeWinners, setRemoveWinners] = useState(false);
  const [excludedChoices, setExcludedChoices] = useState<number[]>([]);
  const spinTimer = useRef<number | null>(null);
  const pendingSpin = useRef<{ winner: number; rotation: number; deadline: number } | null>(null);
  const sharingRef = useRef(false);
  const headerRef = useRef<HTMLElement>(null);
  const templateButtonRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!templatesOpen) return;
    const positionMenu = () => {
      const button = templateButtonRef.current?.getBoundingClientRect();
      if (!button) return;
      const width = Math.min(360, window.innerWidth - 32);
      const top = button.bottom + 8;
      setTemplateMenuPosition({
        left: Math.max(16, Math.min(button.left, window.innerWidth - width - 16)),
        top,
        width,
        maxHeight: Math.max(0, Math.min(580, window.innerHeight - top - 16)),
      });
    };
    positionMenu();
    window.addEventListener("resize", positionMenu);
    window.addEventListener("scroll", positionMenu, true);
    return () => {
      window.removeEventListener("resize", positionMenu);
      window.removeEventListener("scroll", positionMenu, true);
    };
  }, [templatesOpen]);

  useEffect(() => {
    updatePageSEO();
  }, [sharedID]);

  useEffect(() => {
    if (!templatesOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setTemplatesOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setTemplatesOpen(false);
        templateButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [templatesOpen]);

  useEffect(() => {
    let active = true;
    void loadDraft().then((saved) => {
      if (!active) return;
      if (!initialSharedID && saved) setDraft(saved);
      setReady(true);
    });
    void getTemplates().then((items) => {
      if (active && items.length > 0) setAvailableTemplates(items);
    }).catch(() => undefined);
    return () => {
      active = false;
      if (spinTimer.current !== null) window.clearTimeout(spinTimer.current);
    };
  }, [initialSharedID]);

  useEffect(() => {
    if (import.meta.env.PROD && !Capacitor.isNativePlatform() && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (!ready || sharedReadOnly) return;
    let active = true;
    void saveDraft(draft).then((saved) => {
      if (active) setDraftSaveNotice(saved ? "" : "This device could not save your draft. Keep this page open, remove an image, or share the wheel to keep a copy.");
    });
    return () => { active = false; };
  }, [draft, ready, sharedReadOnly]);

  useEffect(() => {
    if (!sharedID) {
      setSharedLoading(false);
      return;
    }
    let active = true;
    setSharedLoading(true);
    setRemoteError("");
    void getWheel(sharedID).then((wheel) => {
      if (!active) return;
      const nextDraft: WheelDraft = {
        title: wheel.title,
        templateKey: wheel.templateKey || "",
        options: wheel.options.map((option) => option.label),
      };
      nextDraft.appearances = wheel.options.map((option, index) => option.color
        ? { color: option.color, emoji: option.emoji || "", gifUrl: option.gifUrl || "" }
        : appearanceFor(nextDraft, index));
      setDraft(nextDraft);
      setExcludedChoices([]);
      setRotation(0);
      setShareURL(sharedURL(wheel.publicId));
      setWinner(null);
      setSharedLoading(false);
    }).catch((error: unknown) => {
      if (!active) return;
      setRemoteError(error instanceof Error ? error.message : "This shared wheel could not be opened.");
      setSharedLoading(false);
    });
    return () => {
      active = false;
    };
  }, [sharedID]);

  useEffect(() => {
    let removeListener: (() => void) | undefined;
    if (Capacitor.isNativePlatform()) {
      void CapacitorApp.addListener("appUrlOpen", ({ url }) => {
        const id = publicIDFromPath(new URL(url).pathname);
        if (!id) return;
        window.history.pushState({}, "", "/w/" + id);
        setSharedReadOnly(true);
        setSharedID(id);
      }).then((listener) => {
        removeListener = () => void listener.remove();
      });
      void CapacitorApp.getLaunchUrl().then((launch) => {
        if (!launch || !launch.url) return;
        const id = publicIDFromPath(new URL(launch.url).pathname);
        if (!id) return;
        window.history.replaceState({}, "", "/w/" + id);
        setSharedReadOnly(true);
        setSharedID(id);
      }).catch(() => undefined);
    }
    const handlePopState = () => {
      const id = publicIDFromPath(window.location.pathname);
      setSharedReadOnly(id !== null);
      setSharedID(id);
      if (!id) {
        setShareURL("");
        setRemoteError("");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      if (removeListener) removeListener();
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  function editDraft(update: (current: WheelDraft) => WheelDraft) {
    setExcludedChoices([]);
    setRotation(0);
    if (sharedID) {
      window.history.replaceState({}, "", "/");
      setSharedReadOnly(false);
      setSharedID(null);
    }
    setDraft(update);
    setWinner(null);
    setShareURL("");
    setShareNotice("");
    setRemoteError("");
  }

  function selectTemplate(template: WheelTemplate) {
    setPreviousWheel({ draft, sharedID, sharedReadOnly, shareURL });
    editDraft(() => ({ title: template.title, templateKey: template.key, options: [...template.options] }));
    setPageNotice("Template applied. Your previous wheel can be restored.");
    setTemplatesOpen(false);
  }

  function makeOwnWheel() {
    setExcludedChoices([]);
    setRotation(0);
    setPreviousWheel({ draft, sharedID, sharedReadOnly, shareURL });
    window.history.replaceState({}, "", "/");
    setSharedReadOnly(false);
    setSharedID(null);
    setRemoteError("");
    setShareURL("");
    setShareNotice("");
    setPageNotice("New wheel started. Your previous wheel can be restored.");
    setWinner(null);
    setDraft({ title: "My wheel", templateKey: "", options: ["Option 1", "Option 2"] });
  }

  function undoReplacement() {
    if (!previousWheel || spinning || sharing) return;
    setExcludedChoices([]);
    setRotation(0);
    window.history.replaceState({}, "", previousWheel.sharedID ? "/w/" + previousWheel.sharedID : "/");
    setDraft(previousWheel.draft);
    setSharedID(previousWheel.sharedID);
    setSharedReadOnly(previousWheel.sharedReadOnly);
    setShareURL(previousWheel.shareURL);
    setRemoteError("");
    setShareNotice("");
    setWinner(null);
    setPreviousWheel(null);
    setPageNotice("Your previous wheel has been restored.");
  }

  function makeCopy() {
    window.history.replaceState({}, "", "/");
    setSharedReadOnly(false);
    setSharedID(null);
    setShareURL("");
    setPageNotice("This wheel is now your editable copy.");
  }

  const imageBytes = draft.options.reduce((total, _, index) => total + embeddedBytes(appearanceFor(draft, index).gifUrl), 0);
  const validWheel =
    imageBytes <= MAX_WHEEL_IMAGE_BYTES &&
    draft.title.trim().length > 0 &&
    draft.title.trim().length <= 100 &&
    draft.options.length >= 2 &&
    draft.options.every((option, index) => option.trim().length > 0 && option.trim().length <= 80 && validGifURL(appearanceFor(draft, index).gifUrl));
  const readOnly = sharedID !== null && sharedReadOnly;
  const wheelIndexes = draft.options.map((_, index) => index).filter((index) => !excludedChoices.includes(index));
  const nextSpinIndexes = removeWinners && winner !== null ? wheelIndexes.filter((index) => index !== winner) : wheelIndexes;
  const roundComplete = removeWinners && validWheel && nextSpinIndexes.length === 0;
  const canSpin = ready && !sharedLoading && !remoteError && !spinning && !sharing && validWheel && nextSpinIndexes.length > 0;

  function restartRound() {
    setExcludedChoices([]);
    setWinner(null);
    setRotation(0);
  }

  function spin() {
    if (!canSpin || pendingSpin.current) return;
    const selectedSegment = randomIndex(nextSpinIndexes.length);
    const selected = nextSpinIndexes[selectedSegment];
    if (removeWinners && winner !== null) setExcludedChoices((current) => [...current, winner]);
    // Vary the landing point while keeping clear of the separator on either side.
    const landingFraction = 0.1 + 0.8 * (randomIndex(1_000_000) / 999_999);
    const target = winnerRotation(rotation, nextSpinIndexes.length, selectedSegment, landingFraction);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reducedMotion ? 250 : 4900;
    pendingSpin.current = { winner: selected, rotation: target, deadline: Date.now() + duration };
    setWinner(null);
    setSpinning(true);
    setRotation(target);
    spinTimer.current = window.setTimeout(finishSpin, duration + 150);
  }

  function finishSpin() {
    const pending = pendingSpin.current;
    if (!pending) return;
    pendingSpin.current = null;
    if (spinTimer.current !== null) window.clearTimeout(spinTimer.current);
    spinTimer.current = null;
    // Disabling the transition snaps an interrupted animation inside the selected section.
    setRotation(((pending.rotation % 360) + 360) % 360);
    setWinner(pending.winner);
    setSpinning(false);
  }

  useEffect(() => {
    const resumeSpin = () => {
      if (document.visibilityState === "visible" && pendingSpin.current && Date.now() >= pendingSpin.current.deadline) finishSpin();
    };
    document.addEventListener("visibilitychange", resumeSpin);
    return () => document.removeEventListener("visibilitychange", resumeSpin);
  }, []);

  async function shareWheel() {
    if (!validWheel || sharedLoading || spinning || sharingRef.current) return;
    if (!sharedID) {
      setShareNotice("Sharing new wheels is coming soon. Your wheel stays on this device.");
      return;
    }
    sharingRef.current = true;
    setSharing(true);
    setShareNotice("");
    setPageNotice("");
    try {
      let url = shareURL;
      if (!url || !sharedID) {
        const normalized: WheelDraft = {
          title: draft.title.trim(),
          templateKey: draft.templateKey,
          options: draft.options.map((option) => option.trim()),
          appearances: draft.options.map((_, index) => appearanceFor(draft, index)),
        };
        const published = await publishWheel(normalized);
        setDraft(normalized);
        url = sharedURL(published.publicId);
        window.history.pushState({}, "", "/w/" + published.publicId);
        setSharedReadOnly(false);
        setSharedID(published.publicId);
        setShareURL(url);
      }
      if (Capacitor.isNativePlatform() && !import.meta.env.VITE_PUBLIC_URL) {
        setShareNotice("Set VITE_PUBLIC_URL to your public website address before sharing from the mobile app.");
        return;
      }
      const outcome = await shareLink(draft.title, url);
      setShareNotice(outcome === "copied" ? "Link copied. Send it to your group." : outcome === "shared" ? "Your wheel is ready to share." : "Share cancelled. The link is ready below.");
    } catch (error) {
      setShareNotice(error instanceof Error ? error.message : "Could not share this wheel. Your draft is saved on this device.");
    } finally {
      sharingRef.current = false;
      setSharing(false);
    }
  }

  async function copyShareURL() {
    try {
      await copyText(shareURL);
      setShareNotice("Link copied. Send it to your group.");
    } catch {
      setShareNotice("Copy the link from the field below.");
    }
  }

  const winnerText = winner !== null ? draft.options[winner] : "";

  return (
    <div className="app-shell" data-mobile-screen={mobileScreen}>
      <header className="topbar" ref={headerRef}>
        <Brand />
        <nav className="top-nav" aria-label="Main navigation">
          <button ref={templateButtonRef} className="nav-link" type="button" onClick={() => setTemplatesOpen((open) => !open)} aria-expanded={templatesOpen} aria-controls="template-menu" disabled={spinning || sharing}>
            Templates
          </button>
          <button className="nav-link new-wheel-action" type="button" onClick={makeOwnWheel} disabled={spinning || sharing}>New wheel</button>
          <AccountMenu />
          <button className="nav-share" type="button" aria-label={!sharedID ? "Sharing new wheels is coming soon" : sharing ? "Preparing share link" : "Share wheel"} title={!sharedID ? "Sharing new wheels is coming soon. Your wheel stays on this device." : undefined} onClick={() => void shareWheel()} disabled={!sharedID || !validWheel || sharedLoading || spinning || sharing}>
            <span className="share-full">{!sharedID ? "Share · Coming soon" : sharing ? "Preparing…" : "Share wheel"}</span>
            <span className="share-short">{!sharedID ? "Coming soon" : sharing ? "Wait…" : "Share"}</span>
          </button>
        </nav>
        {templatesOpen && (
          <div id="template-menu" className="template-menu" style={templateMenuPosition} aria-label="Wheel templates">
            {availableTemplates.map((template) => (
              <button type="button" key={template.key} onClick={() => selectTemplate(template)}>
                <span>{template.title}</span>
                <small>{template.description}</small>
              </button>
            ))}
          </div>
        )}
      </header>

      <AdBanner />

      <main className="page-main">
        <h1>{draft.title || "Pick something"}</h1>
        {!sharedID && <p className="page-description">A little spin. One less decision.</p>}
        {sharedID && <p className="shared-caption">A shared wheel. Everyone gets their own spin.</p>}
        {pageNotice && <div className="draft-notice"><span role="status">{pageNotice}</span>{previousWheel && <button className="text-action" type="button" onClick={undoReplacement} disabled={spinning || sharing}>Undo</button>}</div>}
        {remoteError && (
          <div className="page-alert" role="alert">
            <p>{remoteError}</p>
            <button type="button" className="text-action" onClick={makeOwnWheel}>Make your own</button>
          </div>
        )}

        <div className="workspace-grid">
          <section id="spin-wheel" tabIndex={-1} className="wheel-column" aria-label="Decision wheel">
            <WheelVisual options={wheelIndexes.map((index) => draft.options[index])} appearances={wheelIndexes.map((index) => appearanceFor(draft, index))} rotation={rotation} winnerIndex={winner === null ? null : wheelIndexes.indexOf(winner)} spinning={spinning} onSpinEnd={finishSpin} />
            <button className="spin-button" type="button" onClick={spin} disabled={!canSpin || sharing} aria-label={sharedLoading ? "Loading shared wheel" : spinning ? "Spinning the wheel" : roundComplete ? "Round complete" : "Spin the wheel"}>
              {sharedLoading ? "LOADING…" : spinning ? "SPINNING…" : roundComplete ? "ROUND COMPLETE" : "SPIN"}
            </button>
            <div className="spin-settings">
              <label className="remove-winners-toggle">
                <input type="checkbox" checked={removeWinners} disabled={spinning || sharing || sharedLoading} onChange={(event) => { setRemoveWinners(event.target.checked); restartRound(); }} aria-describedby="remove-winners-help" />
                Remove winners from the next spin
              </label>
              <p id="remove-winners-help">{removeWinners ? "Each choice wins once per round. Restarting restores all choices." : "Choices can win again. Tick to pick without repeats."}</p>
              {removeWinners && <div className="round-controls"><span role="status">{roundComplete ? "All choices have been picked." : `${nextSpinIndexes.length} ${nextSpinIndexes.length === 1 ? "choice" : "choices"} left${spinning ? " · spinning…" : ""}`}</span><button className="text-action" type="button" onClick={restartRound} disabled={spinning || sharing || sharedLoading || (winner === null && excludedChoices.length === 0)}>Restart round</button></div>}
            </div>
            <div className={winner !== null ? "result-panel result-visible" : undefined} aria-live="polite" aria-atomic="true">
              {winner !== null ? (
                <>
                  <span className="result-spark spark-left" aria-hidden="true">✦</span>
                  <ResultIcon appearance={appearanceFor(draft, winner)} />
                  <span className="result-text">{winnerText}!</span>
                  <span className="result-spark spark-right" aria-hidden="true">✦</span>
                </>
              ) : null}
            </div>
            {winner !== null && !roundComplete && (
              <button className="spin-again" type="button" onClick={spin} disabled={!canSpin}>Spin again</button>
            )}
            {!validWheel && !remoteError && (
              <p className="validation-hint" role="status">
                {imageBytes > MAX_WHEEL_IMAGE_BYTES ? "The wheel's images exceed 2 MB. Remove an image or choose a smaller file." : !draft.title.trim() ? "Enter a wheel title in Choices to spin." : draft.title.trim().length > 100 ? "Keep the wheel title within 100 characters." : draft.options.length < 2 ? "Add at least two choices to spin." : draft.options.some((option) => !option.trim() || option.trim().length > 80) ? "Check the highlighted choices before spinning." : "Check the image links in Choices. Use a valid HTTPS image URL or remove the image."}
              </p>
            )}
            {sharedID && (
              <button className="text-action make-copy" type="button" onClick={makeCopy} disabled={spinning || sharing || sharedLoading}>Make your own copy</button>
            )}
          </section>

          <aside id="choices-panel" className="editor-column">
            <ChoiceEditor
              draft={draft}
              disabled={readOnly || sharedLoading || spinning || sharing}
              readOnly={readOnly}
              onTitleChange={(title) => editDraft((current) => ({ ...current, title }))}
              onAppearanceChange={(index, update) => editDraft((current) => ({
                ...current,
                appearances: current.options.map((_, position) => position === index ? { ...appearanceFor(current, position), ...update } : appearanceFor(current, position)),
              }))}
              onOptionChange={(index, value) => editDraft((current) => {
                const options = [...current.options];
                options[index] = value;
                return { ...current, options };
              })}
              onAddOption={() => editDraft((current) => appendChoices(current, [""]))}
              onRemoveOption={(index) => editDraft((current) => ({ ...current, options: current.options.filter((_, optionIndex) => optionIndex !== index), appearances: current.options.map((_, position) => appearanceFor(current, position)).filter((_, position) => position !== index) }))}
              onImportOptions={(values) => editDraft((current) => appendChoices(current, values))}
            />
            <button className="mobile-back-to-wheel text-action" type="button" onClick={() => setMobileScreen("wheel")}>Done · Back to wheel</button>
            <button className="mobile-new-wheel text-action" type="button" onClick={makeOwnWheel} disabled={spinning || sharing}>Start a new wheel</button>
            <button className="share-button" type="button" onClick={() => void shareWheel()} disabled={!sharedID || !validWheel || sharedLoading || spinning || sharing} aria-busy={sharing} aria-describedby={!sharedID ? "sharing-availability" : undefined}>
              {!sharedID ? "Share · Coming soon" : sharing ? "Preparing your link…" : "Share link"}
            </button>
            {!sharedID && <p id="sharing-availability" className="editor-note">Sharing new wheels is coming soon. You can keep editing and spinning on this device.</p>}
            {shareURL && (
              <div className="share-link-wrap">
                <label htmlFor="share-url">Wheel link</label>
                <div className="share-link-row">
                  <input id="share-url" value={shareURL} readOnly onFocus={(event) => event.currentTarget.select()} />
                  <button className="copy-button" type="button" onClick={() => void copyShareURL()}>Copy</button>
                </div>
              </div>
            )}
            {shareNotice && <p className="action-notice" role="status">{shareNotice}</p>}
            <AdPrivacyOptions />
          </aside>
        </div>

        <p className="privacy-note">Your draft stays on this device. Signing in does not upload it.</p>
        {draftSaveNotice && <p className="validation-hint" role="status">{draftSaveNotice}</p>}
      </main>
      <nav className="mobile-workspace-nav" aria-label="Wheel and choices">
        <button type="button" aria-current={mobileScreen === "wheel" ? "page" : undefined} aria-controls="spin-wheel" onClick={() => setMobileScreen("wheel")}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 3v9l7.8 4.5M12 12l-7.8 4.5" /><circle cx="12" cy="12" r="2" /></svg>
          <span>Wheel</span>
        </button>
        <button type="button" aria-current={mobileScreen === "choices" ? "page" : undefined} aria-controls="choices-panel" onClick={() => setMobileScreen("choices")}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></svg>
          <span>Choices <span className="mobile-choice-count">{draft.options.length}</span></span>
        </button>
      </nav>
      <footer className="page-footer">
        <span>PickLah</span>
        <a href={Capacitor.isNativePlatform() ? "/privacy/index.html" : "/privacy/"}>Privacy policy</a>
        <span>Cannot decide? PickLah.</span>
      </footer>
    </div>
  );
}
