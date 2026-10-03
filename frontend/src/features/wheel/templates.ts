import type { WheelDraft, WheelTemplate } from "./types";

export const templates: WheelTemplate[] = [
  {
    key: "what-makan",
    title: "What makan?",
    description: "Pick a Malaysian food favourite.",
    options: ["Pan Mee", "Nasi Lemak", "Roti Canai", "Chicken Rice", "Bak Kut Teh", "Satay", "Sushi", "Burger"],
  },
  {
    key: "where-to-eat",
    title: "Where should we eat?",
    description: "Choose a place or add your shortlist.",
    options: ["Mamak", "Food court", "Hawker centre", "Cafe"],
  },
  {
    key: "who-pays",
    title: "Who pays today?",
    description: "Add everyone in the group.",
    options: [],
  },
  {
    key: "who-does-the-task",
    title: "Who does the task?",
    description: "Add names to decide who goes first.",
    options: [],
  },
  {
    key: "what-movie",
    title: "What movie tonight?",
    description: "Add the movies you are considering.",
    options: [],
  },
  {
    key: "what-game",
    title: "What game do we play?",
    description: "Add games your group can play.",
    options: [],
  },
];

export const defaultDraft: WheelDraft = {
  title: templates[0].title,
  templateKey: templates[0].key,
  options: [...templates[0].options],
};

export function templateByKey(key: string): WheelTemplate | undefined {
  return templates.find((template) => template.key === key);
}

export function emojiForOption(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes("pan mee")) return "🍜";
  if (normalized.includes("nasi")) return "🍛";
  if (normalized.includes("roti") || normalized.includes("flatbread")) return "🫓";
  if (normalized.includes("satay")) return "🍢";
  if (normalized.includes("laksa") || normalized.includes("kuey teow")) return "🍜";
  if (normalized.includes("rendang")) return "🍖";
  if (normalized.includes("chicken rice")) return "🍗";
  if (normalized.includes("bak kut teh")) return "🍲";
  if (normalized.includes("sushi")) return "🍣";
  if (normalized.includes("burger")) return "🍔";
  if (normalized.includes("mamak")) return "🥘";
  return "✦";
}
