export type Account = { id: string; username: string; displayName?: string };
const base = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

async function request<T>(path: string, body?: unknown): Promise<T> {
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
export const authConfig = () => request<{ googleConfigured: boolean }>("config");
export const passwordAuth = (mode: "login" | "register", username: string, password: string) => request<{ account: Account }>(mode, { username, password });
export const googleAuthURL = (returnPath: string) => `${base}/v1/auth/oauth/google/start?return_path=${encodeURIComponent(returnPath)}`;
export const logout = () => request<void>("logout", {});
