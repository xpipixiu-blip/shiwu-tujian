"use client";

import { useState, useRef } from "react";
import { CITIES } from "@/lib/cities";
import type { CityProfile } from "@/lib/cities";

type Props = {
  value: CityProfile | null;
  onChange: (city: CityProfile) => void;
  disabled?: boolean;
};

export default function CitySelector({ value, onChange, disabled }: Props) {
  const [customName, setCustomName] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-stone-400 uppercase tracking-widest">
        风格来源
      </h2>
      <p className="text-[10px] text-stone-600 -mt-2">
        选择或输入城市 / 游戏 / 世界观 / 地区
      </p>

      <div className="flex flex-wrap gap-2">
        {CITIES.map((city) => (
          <button
            key={city.id}
            disabled={disabled}
            onClick={() => onChange(city)}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium border transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                value?.id === city.id
                  ? "bg-amber-800/80 text-amber-100 border-amber-600 shadow-lg shadow-amber-900/30"
                  : "bg-stone-800/80 text-stone-300 border-stone-700 hover:border-amber-700/50 hover:text-amber-200"
              }
            `}
          >
            {city.name}
            <span className="block text-[10px] opacity-60">{city.vibe}</span>
          </button>
        ))}

        <button
          disabled={disabled}
          onClick={() => {
            setShowCustom(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          className={`
            px-3 py-2 rounded-lg text-sm font-medium border transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              showCustom
                ? "bg-amber-800/80 text-amber-100 border-amber-600"
                : "bg-stone-800/80 text-stone-400 border-stone-700 hover:border-amber-700/50 hover:text-amber-200"
            }
          `}
        >
          + 自定义
        </button>
      </div>

      {showCustom && (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customName.trim()) {
                onChange({
                  id: customName.trim(),
                  name: customName.trim(),
                  vibe: "自定义",
                  tone: "独特的",
                  prefixStyles: [customName.trim()],
                  suffixStyles: [`·${customName.trim()}志`],
                  descriptionFlavor: "独特气质",
                  statModifiers: ["独特度"],
                });
                setShowCustom(false);
                setCustomName("");
              }
            }}
            placeholder="输入城市 / 游戏 / 世界观 / 地区"
            className="flex-1 px-3 py-2 bg-stone-800/80 border border-stone-700 rounded-lg text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-600"
          />
          <button
            disabled={!customName.trim() || disabled}
            onClick={() => {
              if (customName.trim()) {
                onChange({
                  id: customName.trim(),
                  name: customName.trim(),
                  vibe: "自定义",
                  tone: "独特的",
                  prefixStyles: [customName.trim()],
                  suffixStyles: [`·${customName.trim()}志`],
                  descriptionFlavor: "独特气质",
                  statModifiers: ["独特度"],
                });
                setShowCustom(false);
                setCustomName("");
              }
            }}
            className="px-4 py-2 bg-amber-800/80 text-amber-100 rounded-lg text-sm font-medium border border-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认
          </button>
        </div>
      )}
    </div>
  );
}
