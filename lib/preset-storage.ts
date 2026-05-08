import type { CardPreset } from "./types";
import { CARD_PRESETS } from "./types";

const KEY = "chuunibyou-card-preset";

export function loadPreset(): CardPreset | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(KEY);
    if (v && CARD_PRESETS.some((p) => p.id === v)) return v as CardPreset;
  } catch { /* ignore */ }
  return null;
}

export function savePreset(preset: CardPreset): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, preset); } catch { /* ignore */ }
}
