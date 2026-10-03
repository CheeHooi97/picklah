import { useEffect, useRef, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { ChoiceEditor } from "./components/ChoiceEditor";
import { AccountMenu } from "./components/AccountMenu";
import { ChoiceIcon } from "./components/ChoiceIcon";
import { WheelVisual } from "./components/WheelVisual";
import { getTemplates, getWheel, publishWheel } from "./api/wheels";
import { defaultDraft, templates as starterTemplates } from "./features/wheel/templates";
import { randomIndex } from "./features/wheel/random";
import { appendChoices, appearanceFor, validGifURL } from "./features/wheel/appearance";
import { embeddedBytes, MAX_WHEEL_IMAGE_BYTES } from "./features/wheel/media";
import { loadDraft, saveDraft } from "./features/wheel/storage";
import type { WheelAppearance, WheelDraft, WheelTemplate } from "./features/wheel/types";
import { copyText, shareLink } from "./platform/share";

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
  const [ready, setReady] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<number | null>(null);
  const spinTimer = useRef<number | null>(null);
  const sharingRef = useRef(false);
  const headerRef = useRef<HTMLElement>(null);
  const templateButtonRef = useRef<HTMLButtonElement>(null);

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
    editDraft(() => ({ title: template.title, templateKey: template.key, options: [...template.options] }));
    setTemplatesOpen(false);
  }

  function makeOwnWheel() {
    window.history.replaceState({}, "", "/");
    setSharedReadOnly(false);
    setSharedID(null);
    setRemoteError("");
    setShareURL("");
    setShareNotice("");
    setPageNotice("");
    setWinner(null);
    setDraft({ title: "My wheel", templateKey: "", options: ["Option 1", "Option 2"] });
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
  const canSpin = ready && !sharedLoading && !remoteError && !spinning && !sharing && validWheel;

  function spin() {
    if (!canSpin) return;
    const selected = randomIndex(draft.options.length);
    const segmentAngle = 360 / draft.options.length;
    const current = ((rotation % 360) + 360) % 360;
    const centerOffset = segmentAngle * (selected + 0.5);
    const correction = (360 - current - centerOffset + 360) % 360;
    const target = rotation + 360 * 6 + correction;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reducedMotion ? 250 : 4900;
    setWinner(null);
    setSpinning(true);
    setRotation(target);
    spinTimer.current = window.setTimeout(() => {
      setWinner(selected);
      setSpinning(false);
    }, duration);
  }

  async function shareWheel() {
    if (!validWheel || sharedLoading || spinning || sharingRef.current) return;
    if (!sharedID) {
      setShareNotice("Sharing requires an active subscription. Your wheel stays on this device. Subscription sharing is not available yet.");
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
    <div className="app-shell">
      <header className="topbar" ref={headerRef}>
        <Brand />
        <nav className="top-nav" aria-label="Main navigation">
          <button ref={templateButtonRef} className="nav-link" type="button" onClick={() => setTemplatesOpen((open) => !open)} aria-expanded={templatesOpen} aria-controls="template-menu" disabled={spinning || sharing}>
            Templates
          </button>
          <button className="nav-link" type="button" onClick={makeOwnWheel} disabled={spinning || sharing}>Make your own</button>
          <AccountMenu />
          <button className="nav-share" type="button" aria-label={sharing ? "Preparing share link" : "Share wheel"} onClick={() => void shareWheel()} disabled={!validWheel || sharedLoading || spinning || sharing}>
            <span className="share-full">{sharing ? "Preparing…" : "Share wheel"}</span>
            <span className="share-short">{sharing ? "Wait…" : "Share"}</span>
          </button>
        </nav>
        {templatesOpen && (
          <div id="template-menu" className="template-menu" aria-label="Wheel templates">
            {availableTemplates.map((template) => (
              <button type="button" key={template.key} onClick={() => selectTemplate(template)}>
                <span>{template.title}</span>
                <small>{template.description}</small>
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="page-main">
        <h1>{draft.title || "Pick something"}</h1>
        {!sharedID && <p className="page-description">A little spin. One less decision.</p>}
        {sharedID && <p className="shared-caption">A shared wheel. Everyone gets their own spin.</p>}
        {remoteError && (
          <div className="page-alert" role="alert">
            <p>{remoteError}</p>
            <button type="button" className="text-action" onClick={makeOwnWheel}>Make your own</button>
          </div>
        )}

        <div className="workspace-grid">
          <section className="wheel-column" aria-label="Decision wheel">
            <WheelVisual options={draft.options} appearances={draft.options.map((_, index) => appearanceFor(draft, index))} rotation={rotation} winnerIndex={winner} spinning={spinning} />
            <button className="spin-button" type="button" onClick={spin} disabled={!canSpin || sharing} aria-label={sharedLoading ? "Loading shared wheel" : spinning ? "Spinning the wheel" : "Spin the wheel"}>
              {sharedLoading ? "LOADING…" : spinning ? "SPINNING…" : "SPIN"}
            </button>
            <div className={"result-panel " + (winner !== null ? "result-visible" : "")} aria-live="polite" aria-atomic="true">
              {winner !== null ? (
                <>
                  <span className="result-spark spark-left" aria-hidden="true">✦</span>
                  <ResultIcon appearance={appearanceFor(draft, winner)} />
                  <span className="result-text">{winnerText}!</span>
                  <span className="result-spark spark-right" aria-hidden="true">✦</span>
                </>
              ) : (
                <span className="result-prompt">{spinning ? "Here we go…" : "Tap SPIN to pick"}</span>
              )}
            </div>
            {winner !== null && (
              <button className="spin-again" type="button" onClick={spin} disabled={!canSpin}>Spin again</button>
            )}
            {!validWheel && !remoteError && (
              <p className="validation-hint" role="status">
                {imageBytes > MAX_WHEEL_IMAGE_BYTES ? "The wheel's images exceed 2 MB. Remove an image or choose a smaller file." : "Add a title, at least two named choices, and valid GIFs or image links to spin or share."}
              </p>
            )}
            {sharedID && (
              <button className="text-action make-copy" type="button" onClick={makeCopy} disabled={spinning || sharing || sharedLoading}>Make your own copy</button>
            )}
            {pageNotice && <p className="action-notice" role="status">{pageNotice}</p>}
          </section>

          <aside className="editor-column">
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
            <button className="share-button" type="button" onClick={() => void shareWheel()} disabled={!validWheel || sharedLoading || spinning || sharing} aria-busy={sharing}>
              {sharing ? "Preparing your link…" : shareURL ? "Share link" : "Share · subscription required"}
            </button>
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
          </aside>
        </div>

        <p className="privacy-note">Free and registered users’ wheels stay on this device. Only subscribers can save a wheel online to share.</p>
        {draftSaveNotice && <p className="validation-hint" role="status">{draftSaveNotice}</p>}
      </main>
      <footer className="page-footer">
        <span>PickLah</span>
        <span>Cannot decide? PickLah.</span>
      </footer>
    </div>
  );
}
