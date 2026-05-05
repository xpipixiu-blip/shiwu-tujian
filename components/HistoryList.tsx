"use client";

import type { AtlasCard } from "@/lib/types";

type Props = {
  cards: AtlasCard[];
  onSelect: (card: AtlasCard) => void;
  onDelete: (id: string) => void;
};

export default function HistoryList({ cards, onSelect, onDelete }: Props) {
  if (cards.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-stone-400 uppercase tracking-widest">
        历史图鉴 ({cards.length})
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => onSelect(card)}
            className="group relative bg-stone-900/80 border border-stone-800 rounded-xl p-3 cursor-pointer hover:border-amber-800/50 transition-all"
          >
            {/* Thumbnail */}
            {card.imageUrl && (
              <div className="w-full aspect-square rounded-lg overflow-hidden mb-2 bg-stone-800 border border-stone-700/50">
                <img
                  src={card.imageUrl}
                  alt={card.fantasyName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Info */}
            <p className="text-xs font-medium text-amber-400/80 truncate">
              {card.fantasyName}
            </p>
            <p className="text-[10px] text-stone-500 truncate">
              {card.city} · {card.category}
            </p>

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(card.id);
              }}
              className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-stone-900/90 text-stone-500 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/80 hover:text-red-400"
              title="删除"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
