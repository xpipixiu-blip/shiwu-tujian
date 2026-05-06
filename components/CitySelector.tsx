"use client";

import { useState, useRef } from "react";
import { CITIES } from "@/lib/cities";
import type { CityProfile } from "@/lib/cities";

type Props = { value: CityProfile | null; onChange: (city: CityProfile) => void; disabled?: boolean };

type PresetGroup = { label: string; items: string[] };

const PRESET_GROUPS: PresetGroup[] = [
  { label: "常用", items: ["普通介绍", "星露谷", "艾尔登法环", "马德里", "蒸汽朋克"] },
  { label: "城市/地区", items: ["上海", "马德里", "里斯本", "墨西哥城", "南法小镇", "日式便利店"] },
  { label: "游戏/作品", items: ["星露谷", "艾尔登法环", "塞尔达传说", "赛博朋克2077", "原神", "宝可梦", "哈利波特"] },
  { label: "幻想设定", items: ["蒸汽朋克", "北欧神话", "东方志怪", "废土荒原", "深海遗迹", "太空殖民地", "魔法学院"] },
];

const ALL_PRESETS = [...CITIES];

function findProfile(name: string): CityProfile | null {
  return ALL_PRESETS.find((c) => c.name === name || c.id === name) ?? null;
}

export default function CitySelector({ value, onChange, disabled }: Props) {
  const [customName, setCustomName] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const createProfile = (name: string): CityProfile => ({
    id: name, name, vibe: "自定义", tone: "独特的",
    prefixStyles: [name], suffixStyles: [`·${name}录`],
    descriptionFlavor: `${name}风格`, statModifiers: [],
  });

  const handlePresetClick = (name: string) => {
    const preset = findProfile(name);
    onChange(preset ?? createProfile(name));
  };

  return (
    <div className="space-y-2">
      <h2 className="text-[10px] font-medium text-warm-200 uppercase tracking-[0.2em]">风格来源 / 设定预设</h2>
      <p className="text-[9px] text-warm-100 -mt-1">选择设定预设，或输入任意城市 / 游戏 / 小说 / 世界观 / 风格关键词。输入「普通介绍」可生成写实说明卡。</p>

      {PRESET_GROUPS.map((group) => (
        <div key={group.label} className="space-y-1">
          <span className="text-[9px] text-warm-100 px-0.5">{group.label}</span>
          <div className="flex flex-wrap gap-1.5">
            {group.items.map((name) => {
              const selected = value?.name === name || value?.id === name;
              return (
                <button key={name} disabled={disabled}
                  onClick={() => handlePresetClick(name)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-all disabled:opacity-50 ${
                    selected
                      ? "border-gold-500/40 text-gold-400"
                      : "bg-ink-800 border-ink-600 text-warm-200 hover:border-gold-500/30"
                  }`}
                  style={selected ? { background: "rgba(185,154,91,0.1)" } : {}}>
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Custom input */}
      <button disabled={disabled}
        onClick={() => { setShowCustom(!showCustom); if (!showCustom) setTimeout(() => inputRef.current?.focus(), 100); }}
        className={`px-3 py-1.5 rounded text-xs font-medium border transition-all disabled:opacity-50 ${
          showCustom ? "border-gold-500/40 text-gold-400" : "bg-ink-800 border-ink-600 text-warm-100 hover:border-gold-500/30"
        }`}
        style={showCustom ? { background: "rgba(185,154,91,0.1)" } : {}}>
        {showCustom ? "收起" : "+ 自定义风格来源"}
      </button>

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
            placeholder="例如：星露谷、艾尔登法环、马德里、蒸汽朋克、普通介绍"
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
