"use client";

import { useState, useRef } from "react";
import { CITIES } from "@/lib/cities";
import type { CityProfile } from "@/lib/cities";

type Props = { value: CityProfile | null; onChange: (city: CityProfile) => void; disabled?: boolean };

export default function CitySelector({ value, onChange, disabled }: Props) {
  const [customName, setCustomName] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const createProfile = (name: string): CityProfile => ({
    id: name, name, vibe: "自定义", tone: "独特的",
    prefixStyles: [name], suffixStyles: [`·${name}录`],
    descriptionFlavor: `${name}风格`, statModifiers: [],
  });

  return (
    <div className="space-y-2">
      <h2 className="text-[10px] font-medium text-warm-200 uppercase tracking-[0.2em]">风格来源</h2>
      <p className="text-[9px] text-warm-100 -mt-1">输入城市 / 游戏 / 世界观可生成风格化图鉴；输入「普通介绍」则生成普通物品介绍</p>

      <div className="flex flex-wrap gap-1.5">
        {CITIES.map((city) => (
          <button key={city.id} disabled={disabled}
            onClick={() => onChange(city)}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition-all disabled:opacity-50 ${
              value?.id === city.id
                ? "border-gold-500/40 text-gold-400"
                : "bg-ink-800 border-ink-600 text-warm-200 hover:border-gold-500/30"
            }`}
            style={value?.id === city.id ? { background: "rgba(185,154,91,0.1)" } : {}}>
            {city.name}
            <span className="block text-[9px] opacity-50">{city.vibe}</span>
          </button>
        ))}
        <button disabled={disabled}
          onClick={() => { setShowCustom(true); setTimeout(() => inputRef.current?.focus(), 100); }}
          className={`px-3 py-1.5 rounded text-xs font-medium border transition-all disabled:opacity-50 ${
            showCustom ? "border-gold-500/40 text-gold-400" : "bg-ink-800 border-ink-600 text-warm-100 hover:border-gold-500/30"
          }`}
          style={showCustom ? { background: "rgba(185,154,91,0.1)" } : {}}>
          + 自定义
        </button>
      </div>

      {showCustom && (
        <div className="flex gap-2">
          <input ref={inputRef} type="text" value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customName.trim()) {
                onChange(createProfile(customName.trim()));
                setShowCustom(false); setCustomName("");
              }
            }}
            placeholder="例如：上海、艾尔登法环、马德里、普通介绍"
            className="flex-1 px-3 py-2 bg-ink-800 border border-ink-600 rounded text-sm text-warm-400 placeholder-warm-100 focus:outline-none focus:border-gold-500/30" />
          <button disabled={!customName.trim() || disabled}
            onClick={() => {
              if (customName.trim()) {
                onChange(createProfile(customName.trim()));
                setShowCustom(false); setCustomName("");
              }
            }}
            className="px-4 py-2 rounded text-xs font-medium border border-gold-500/30 text-gold-400 disabled:opacity-50"
            style={{ background: "rgba(185,154,91,0.1)" }}>
            确认
          </button>
        </div>
      )}
    </div>
  );
}
