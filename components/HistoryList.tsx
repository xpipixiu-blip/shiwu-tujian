"use client";

import type { AtlasCard } from "@/lib/types";

type Props = { cards: AtlasCard[]; onSelect: (card: AtlasCard) => void; onDelete: (id: string) => void };

export default function HistoryList({ cards, onSelect, onDelete }: Props) {
  if (cards.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-[10px] font-medium text-warm-200 uppercase tracking-[0.2em]">历史图鉴 ({cards.length})</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {cards.map((card) => (
          <div key={card.id} onClick={() => onSelect(card)}
            className="group relative bg-ink-800 border border-ink-600 rounded-sm p-2 cursor-pointer hover:border-gold-500/30 transition-all">
            {card.croppedImageUrl && (
              <div className="w-full aspect-square rounded-sm overflow-hidden mb-1.5 border border-ink-600">
                <img src={card.croppedImageUrl} alt={card.fantasyName} className="w-full h-full object-cover" />
              </div>
            )}
            <p className="text-[11px] font-medium text-gold-400/80 truncate">{card.fantasyName}</p>
            <p className="text-[9px] text-warm-100 truncate">{card.city} · {card.category}</p>
            <button onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
              className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
              style={{background:"rgba(0,0,0,0.7)",color:"#8b5e5e"}}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
