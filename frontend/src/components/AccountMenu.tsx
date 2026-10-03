import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { authConfig, currentAccount, googleAuthURL, logout, passwordAuth, type Account } from "../api/auth";

export function AccountMenu() {
  const [account, setAccount] = useState<Account | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [googleNotice, setGoogleNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);

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
    setGoogleNotice("Loading Google sign-in…");
    if (Capacitor.isNativePlatform()) {
      setGoogleNotice("Use username and password here. Native Google sign-in needs the platform OAuth configuration.");
      return;
    }
    void authConfig().then((config) => {
      if (!active) return;
      setGoogleNotice(config.googleConfigured ? "" : "Google sign-in will be available once configured.");
    }).catch((error: unknown) => { if (active) setGoogleNotice(error instanceof Error ? error.message : "Google sign-in is unavailable."); });
    return () => { active = false; };
  }, [open]);

  function startGoogle() {
    if (Capacitor.isNativePlatform()) {
      setNotice("Native Google sign-in needs a system-browser callback. Use username and password for now.");
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
    try { await logout(); setAccount(null); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not sign out."); }
    finally { setBusy(false); }
  }

  return <div className="account-menu">
    {account ? <>
      <span className="account-username" title={account.username}>{account.username}</span>
      <button className="nav-link" type="button" disabled={busy} onClick={() => void signOut()}>{busy ? "Signing out…" : "Sign out"}</button>
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
      <button className="google-oauth-button" type="button" disabled={busy} onClick={startGoogle}>{mode === "register" ? "Sign up with Google" : "Sign in with Google"}</button>
      {googleNotice && <p className="auth-description" role="status">{googleNotice}</p>}
      <p className="auth-local-note">New to PickLah? Google creates your account automatically. Already joined? It signs you in.</p>
      <p className="auth-switch">{mode === "login" ? "New here?" : "Already have an account?"} <button className="text-action" type="button" disabled={busy} onClick={() => { setMode(mode === "login" ? "register" : "login"); setNotice(""); setPassword(""); }}>{mode === "login" ? "Create an account" : "Sign in"}</button></p>
      <p className="auth-local-note">Your wheel stays on this device. Creating an account does not upload it.</p>
    </dialog>
  </div>;
}
