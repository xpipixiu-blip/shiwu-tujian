import type { AtlasCard } from "./types";

const STORAGE_KEY = "chuunibyou-atlas-cards";

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
  // Keep max 50 cards to avoid localStorage bloat
  const trimmed = cards.slice(0, 50);
  // Only store essential fields, strip imageUrl if it's too large
  const toSave = trimmed.map((c) => ({
    ...c,
    imageUrl: c.imageUrl.length > 200_000 ? "" : c.imageUrl,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
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
