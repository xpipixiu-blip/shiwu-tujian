"use client";

import { CARD_PRESETS } from "@/lib/types";
import type { CardPreset } from "@/lib/types";

type Props = { value: CardPreset; onChange: (p: CardPreset) => void; disabled?: boolean };

export default function CardPresetSelector({ value, onChange, disabled }: Props) {
  return (
    <div className="space-y-2">
      <h2 className="text-[10px] font-medium text-warm-200 uppercase tracking-[0.2em]">卡片风格</h2>
      <div className="flex flex-wrap gap-1.5">
        {CARD_PRESETS.map((p) => (
          <button key={p.id} disabled={disabled}
            onClick={() => onChange(p.id)}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition-all disabled:opacity-50 ${
              value === p.id
                ? "border-gold-500/40 text-gold-400"
                : "bg-ink-800 border-ink-600 text-warm-200 hover:border-gold-500/30"
            }`}
            style={value === p.id ? { background: "rgba(185,154,91,0.1)" } : {}}>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
