import { Capacitor, CapacitorHttp } from "@capacitor/core";
export type Account = { id: string; username: string; displayName?: string; email?: string };
const base = (import.meta.env.VITE_API_BASE_URL || (Capacitor.getPlatform() === "android" ? import.meta.env.VITE_PUBLIC_URL || "https://picklah.my" : "")).replace(/\/$/, "");

async function request<T>(path: string, body?: unknown): Promise<T> {
  if (Capacitor.getPlatform() === "android") {
    if (!base.startsWith("https://")) throw new Error("The Android app needs an HTTPS API address. Set VITE_API_BASE_URL when building it.");
    // The native HTTP stack retains HttpOnly session cookies across API requests.
    const response = await CapacitorHttp.request({
      url: `${base}/v1/auth/${path}`, method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json" }, data: body,
      responseType: "json", connectTimeout: 10000, readTimeout: 20000,
    });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(response.data?.error?.message || (response.status === 404 ? "Update the server to enable Android Google sign-in." : "Could not connect. Please try again."));
    }
    return response.data as T;
  }
  const response = await fetch(`${base}/v1/auth/${path}`, {
    credentials: "include",
    ...(body === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    throw new Error(data?.error?.message || "Could not connect. Please try again.");
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export const currentAccount = () => request<{ account: Account | null }>("me");
export const authConfig = () => request<{ googleConfigured: boolean; nativeGoogleConfigured?: boolean; googleClientId?: string }>("config");
export const nativeGoogleChallenge = () => request<{ nonce: string; clientId: string }>("google/native/challenge", {});
export const nativeGoogleAuth = (idToken: string, nonce: string) => request<{ account: Account }>("google/native", { idToken, nonce });
export const passwordAuth = (mode: "login" | "register", username: string, password: string) => request<{ account: Account }>(mode, { username, password });
export const googleAuthURL = (returnPath: string) => `${base}/v1/auth/oauth/google/start?return_path=${encodeURIComponent(returnPath)}`;
export const logout = () => request<void>("logout", {});
