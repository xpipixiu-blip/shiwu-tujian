import type { AtlasCard } from "./types";

const STORAGE_KEY = "chuunibyou-atlas-cards";
const MAX_CARDS = 30;

export function loadCards(): AtlasCard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AtlasCard[];
  } catch {
    return [];
  }
}

export function saveCard(card: AtlasCard): void {
  if (typeof window === "undefined") return;
  const cards = loadCards();
  const idx = cards.findIndex((c) => c.id === card.id);
  if (idx >= 0) {
    cards[idx] = card;
  } else {
    cards.unshift(card);
  }
  const trimmed = cards.slice(0, MAX_CARDS);
  // Strip large base64 fields — only save structured data, not images
  const toSave = trimmed.map((c) => ({
    ...c,
    imageUrl: "",
    croppedImageUrl: "",
  }));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // If still too large, trim more aggressively
    const minimal = trimmed.slice(0, 10).map((c) => ({
      ...c,
      imageUrl: "",
      croppedImageUrl: "",
    }));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
    } catch { /* storage full — silently ignore */ }
  }
}

export function deleteCard(id: string): void {
  if (typeof window === "undefined") return;
  const cards = loadCards().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
