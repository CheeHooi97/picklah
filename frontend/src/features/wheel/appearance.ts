import { emojiForOption } from "./templates";
import type { WheelAppearance, WheelDraft } from "./types";
import { validGifSource } from "./media";

export const choiceColors = [
  "#dc353f", "#168646", "#ffc629", "#2878c8", "#8654bd",
  "#e88224", "#159b9b", "#d45b94", "#647541", "#705347",
];

export function appendChoices(draft: WheelDraft, values: string[]): WheelDraft {
  const options = [...draft.options];
  const appearances = draft.options.map((_, index) => appearanceFor(draft, index));
  const used = new Set(appearances.map((appearance) => appearance.color.toLowerCase()));
  for (const value of values) {
    const unused = choiceColors.filter((color) => !used.has(color));
    const candidates = unused.length ? unused : choiceColors;
    const color = candidates[Math.floor(Math.random() * candidates.length)];
    options.push(value);
    const appearance = appearanceFor({ ...draft, options: [value], appearances: undefined }, 0);
    appearances.push({ ...appearance, color });
    used.add(color);
  }
  return { ...draft, options, appearances };
}

export function appearanceFor(draft: WheelDraft, index: number): WheelAppearance {
  const saved = draft.appearances?.[index];
  return {
    color: saved?.color || choiceColors[index % choiceColors.length],
    emoji: saved?.emoji ?? (emojiForOption(draft.options[index] || "") === "✦" ? "" : emojiForOption(draft.options[index] || "")),
    gifUrl: saved?.gifUrl || "",
  };
}

export function validGifURL(value: string): boolean {
  return validGifSource(value);
}

export function labelColor(color: string): string {
  const rgb = color.slice(1).match(/.{2}/g)?.map((part) => parseInt(part, 16) / 255) || [0, 0, 0];
  const linear = rgb.map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  return luminance > 0.179 ? "#111111" : "#ffffff";
}
