import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { authConfig, currentAccount, googleAuthURL, logout, nativeGoogleAuth, nativeGoogleChallenge, passwordAuth, type Account } from "../api/auth";
import { NativeGoogle } from "../platform/google";

export function AccountMenu() {
  const [account, setAccount] = useState<Account | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [googleNotice, setGoogleNotice] = useState("");
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const accountDetails = useRef<HTMLDetailsElement>(null);
  const submitting = useRef(false);

  useEffect(() => {
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !accountDetails.current?.contains(event.target)) accountDetails.current?.removeAttribute("open");
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && accountDetails.current?.open) {
        accountDetails.current.removeAttribute("open");
        accountDetails.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); };
  }, []);

  useEffect(() => {
    let active = true;
    const url = new URL(window.location.href);
    const result = url.searchParams.get("oauth");
    if (result) {
      const messages: Record<string, string> = {
        oauth_unavailable: "Google sign-in is not configured yet. Use your username and password.",
        oauth_cancelled: "Google sign-in was cancelled. You can try again.",
        oauth_state_invalid: "Google sign-in expired. Please try again.",
        oauth_failed: "Google sign-in could not be completed. Please try again.",
      };
      if (result !== "success") { setNotice(messages[result] || "Google sign-in could not be completed."); setOpen(true); }
      url.searchParams.delete("oauth");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    }
    void currentAccount().then(({ account }) => { if (active) setAccount(account); }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    dialog.current?.querySelector<HTMLInputElement>("#auth-username")?.focus();
    let active = true;
    setGoogleAvailable(false);
    setGoogleNotice("Loading Google sign-in…");
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() !== "android") {
      setGoogleNotice("Google sign-in is unavailable in this app. Use your username and password.");
      return;
    }
    void authConfig().then((config) => {
      if (!active) return;
      const available = Capacitor.getPlatform() === "android" ? Boolean(config.nativeGoogleConfigured && config.googleClientId) : config.googleConfigured;
      setGoogleAvailable(available);
      setGoogleNotice(available ? "" : "Google sign-in is currently unavailable. Update the server configuration or use your username and password.");
    }).catch(() => { if (active) setGoogleNotice("Google sign-in could not be loaded. Close and reopen this dialog to try again, or use your username and password."); });
    return () => { active = false; };
  }, [open]);

  async function startGoogle() {
    if (!googleAvailable || busy || submitting.current) return;
    if (Capacitor.getPlatform() === "android") {
      submitting.current = true; setBusy(true); setNotice("");
      try {
        const challenge = await nativeGoogleChallenge();
        const credential = await NativeGoogle.signIn(challenge);
        const result = await nativeGoogleAuth(credential.idToken, challenge.nonce);
        setAccount(result.account); setPassword(""); dialog.current?.close();
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Google sign-in failed. Please try again.");
      } finally { submitting.current = false; setBusy(false); }
      return;
    }
    setBusy(true);
    setNotice("Opening Google sign-in…");
    window.location.assign(googleAuthURL(window.location.pathname));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setNotice("");
    try {
      const result = await passwordAuth(mode, username, password);
      setAccount(result.account); setPassword(""); dialog.current?.close();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Sign-in failed. Please try again."); }
    finally { submitting.current = false; setBusy(false); }
  }

  async function signOut() {
    setBusy(true); setNotice("");
    try { await logout(); setAccount(null); if (Capacitor.getPlatform() === "android") await NativeGoogle.signOut().catch(() => undefined); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not sign out."); }
    finally { setBusy(false); }
  }

  return <div className="account-menu">
    {account ? <>
      <details className="account-disclosure" ref={accountDetails}>
        <summary className="account-trigger" aria-label="Account options">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg>
          <svg className="account-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>
        </summary>
        <div className="account-popover">
          <div className="account-identity"><small>Signed in as</small><strong>{account.email || account.displayName || (account.username.startsWith("google_") ? "Google account" : account.username)}</strong>{account.email && account.displayName && <small>{account.displayName}</small>}</div>
          <a href={Capacitor.isNativePlatform() ? "/privacy/index.html" : "/privacy/"}>Privacy policy</a>
          <button type="button" disabled={busy} onClick={() => void signOut()}>{busy ? "Signing out…" : "Sign out"}</button>
        </div>
      </details>
      {notice && <span className="account-error" role="alert">{notice}</span>}
    </> : <button className="nav-link" type="button" onClick={() => { setMode("login"); setNotice(""); setBusy(false); setOpen(true); }}>Sign in</button>}
    <dialog ref={dialog} className="auth-dialog" aria-labelledby="auth-title" onClose={() => { setOpen(false); setPassword(""); setBusy(false); }} onCancel={(event) => { if (busy) event.preventDefault(); }}>
      <button className="auth-close" aria-label="Close sign-in" type="button" disabled={busy} onClick={() => dialog.current?.close()}>×</button>
      <img src="/picklah-emoji.png" className="auth-mascot" alt="" />
      <h2 id="auth-title">{mode === "login" ? "Welcome back" : "Join PickLah"}</h2>
      <p className="auth-description">{mode === "login" ? "Sign in to your PickLah account." : "One account for your next little decision."}</p>
      <form onSubmit={(event) => void submit(event)}>
        <fieldset disabled={busy}>
          <label htmlFor="auth-username">Username</label>
          <input autoFocus id="auth-username" name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required minLength={3} maxLength={32} pattern="[A-Za-z0-9_]{3,32}" />
          {mode === "register" && <small>3–32 letters, numbers, or underscores. Case does not matter.</small>}
          <label htmlFor="auth-password">Password</label>
          <input id="auth-password" name="password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={mode === "register" ? 10 : undefined} />
          {mode === "register" && <small>At least 10 characters, up to 72 bytes.</small>}
          <button className="auth-submit" type="submit">{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
        </fieldset>
      </form>
      {notice && <p className="auth-error" role="alert">{notice}</p>}
      <div className="auth-divider"><span>or</span></div>
      <button className="google-oauth-button" type="button" disabled={busy || !googleAvailable} aria-describedby={googleNotice ? "google-availability" : undefined} onClick={() => void startGoogle()}>{mode === "register" ? "Sign up with Google" : "Sign in with Google"}</button>
      {googleNotice && <p id="google-availability" className="auth-description" role="status">{googleNotice}</p>}
      {googleAvailable && <p className="auth-local-note">New to PickLah? Google creates your account automatically. Already joined? It signs you in.</p>}
      <p className="auth-switch">{mode === "login" ? "New here?" : "Already have an account?"} <button className="text-action" type="button" disabled={busy} onClick={() => { setMode(mode === "login" ? "register" : "login"); setNotice(""); setPassword(""); }}>{mode === "login" ? "Create an account" : "Sign in"}</button></p>
      <p className="auth-local-note">Your wheel stays on this device. Creating an account does not upload it.</p>
      <p className="auth-local-note"><a href={Capacitor.isNativePlatform() ? "/privacy/index.html" : "/privacy/"}>Read our privacy policy</a></p>
    </dialog>
  </div>;
}
