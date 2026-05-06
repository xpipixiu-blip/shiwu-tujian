import type { CardPreset } from "./types";

const KEY = "chuunibyou-card-preset";

export function loadPreset(): CardPreset | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(KEY);
    if (v === "game" || v === "antique" || v === "liquid-metal" || v === "encyclopedia") return v;
  } catch { /* ignore */ }
  return null;
}

export function savePreset(preset: CardPreset): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, preset); } catch { /* ignore */ }
}
