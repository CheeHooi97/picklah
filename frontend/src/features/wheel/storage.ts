import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import type { WheelDraft } from "./types";

const STORAGE_KEY = "picklah.draft.v1";
const LOCAL_STORAGE_KEY = "picklah.draft.v1";
const VERSION = 1;

type StoredDraft = { version: number; draft: WheelDraft };

function isDraft(value: unknown): value is WheelDraft {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<WheelDraft>;
  return typeof candidate.title === "string" &&
    typeof candidate.templateKey === "string" &&
    Array.isArray(candidate.options) &&
    candidate.options.every((option) => typeof option === "string") &&
    (candidate.appearances === undefined || (Array.isArray(candidate.appearances) &&
      candidate.appearances.length === candidate.options.length &&
      candidate.appearances.every((item) => item && /^#[0-9a-f]{6}$/i.test(item.color) &&
        typeof item.emoji === "string" && typeof item.gifUrl === "string")));
}

function parseStored(value: string | null): WheelDraft | null {
  if (!value) return null;
  try {
    const stored = JSON.parse(value) as Partial<StoredDraft>;
    return stored.version === VERSION && isDraft(stored.draft) ? stored.draft : null;
  } catch {
    return null;
  }
}

export async function loadDraft(): Promise<WheelDraft | null> {
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    if (value) return parseStored(value);
  } catch {
    // Use browser storage as a fallback if the native preferences plugin is unavailable.
  }
  try {
    return parseStored(window.localStorage.getItem(LOCAL_STORAGE_KEY));
  } catch {
    return null;
  }
}

export async function saveDraft(draft: WheelDraft): Promise<boolean> {
  const value = JSON.stringify({ version: VERSION, draft } satisfies StoredDraft);
  try {
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: STORAGE_KEY, value });
      return true;
    }
    window.localStorage.setItem(LOCAL_STORAGE_KEY, value);
    return true;
  } catch {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, value);
      return true;
    } catch {
      return false;
    }
  }
}
