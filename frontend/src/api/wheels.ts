import type { WheelDraft, WheelResponse, WheelTemplate } from "../features/wheel/types";

const apiBase = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const body = await response.json() as { error?: { message?: string } };
      message = body.error?.message ?? message;
    } catch {
      // Keep the generic user-facing message for non-JSON failures.
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function getTemplates(): Promise<WheelTemplate[]> {
  const response = await fetch(`${apiBase}/v1/templates`);
  const data = await parseResponse<{ templates: WheelTemplate[] }>(response);
  return data.templates;
}

export async function publishWheel(draft: WheelDraft): Promise<{ publicId: string; url: string }> {
  const response = await fetch(`${apiBase}/v1/wheels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  return parseResponse(response);
}

export async function getWheel(publicId: string): Promise<WheelResponse> {
  const response = await fetch(`${apiBase}/v1/wheels/${encodeURIComponent(publicId)}`);
  return parseResponse(response);
}
