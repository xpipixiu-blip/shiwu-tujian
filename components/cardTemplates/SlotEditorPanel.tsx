"use client";

import React from "react";
import type { TemplateConfig, SlotId } from "@/lib/cardTemplateTypes";
import { toAdjustableConfigJSON, generateTSConfigSource, copyToClipboard, downloadAsFile } from "@/components/cardTemplates/configExportUtils";

type Props = {
  config: TemplateConfig;
  selectedSlot: SlotId | null;
  onSelectSlot: (id: SlotId | null) => void;
  onUpdateSlot: (slotId: SlotId, field: string, value: number) => void;
  onReset: () => void;
  originalConfig: TemplateConfig;
  hasChanges: boolean;
};

const SLOT_LABELS: { id: SlotId; label: string }[] = [
  { id: "name", label: "名称区" },
  { id: "badge", label: "徽章区" },
  { id: "portrait", label: "图片框" },
  { id: "portraitInset", label: "图片内边距" },
  { id: "portraitUnderlay", label: "透卡底图" },
  { id: "info1", label: "信息行1" },
  { id: "info2", label: "信息行2" },
  { id: "bio", label: "简介区" },
  { id: "footerCircle_0", label: "底栏圆1" },
  { id: "footerCircle_1", label: "底栏圆2" },
  { id: "footerCircle_2", label: "底栏圆3" },
  { id: "footerCircle_3", label: "底栏圆4" },
  { id: "footerCircle_4", label: "底栏圆5" },
  { id: "footerCircle_5", label: "底栏圆6" },
];

function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max = 4000,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
      <span style={{ minWidth: 24, color: "#8b8076" }}>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={1}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (!isNaN(v)) onChange(v);
        }}
        style={{
          width: 64,
          padding: "2px 6px",
          fontSize: 12,
          background: "#1a1510",
          border: "1px solid rgba(185,154,91,0.25)",
          borderRadius: 3,
          color: "#c8b88a",
          fontFamily: "monospace",
        }}
      />
    </label>
  );
}

export default function SlotEditorPanel({
  config,
  selectedSlot,
  onSelectSlot,
  onUpdateSlot,
  onReset,
  originalConfig,
  hasChanges,
}: Props) {
  const isCutout = config.templateMode === "cutoutOverlay";
  const filteredLabels = SLOT_LABELS.filter((s) => {
    if (s.id === "portraitUnderlay" && !isCutout) return false;
    return true;
  });

  const [copied, setCopied] = React.useState(false);

  const handleCopyJSON = async () => {
    const json = toAdjustableConfigJSON(config);
    await copyToClipboard(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportTS = () => {
    const source = generateTSConfigSource(config, `${config.id.replace(/-/g, "_")}Config`);
    downloadAsFile(source, `${config.id}.ts`, "text/typescript");
  };

  const slot = selectedSlot;
  const circleIdx = slot?.startsWith("footerCircle") ? parseInt(slot.split("_")[1] ?? "0", 10) : -1;

  return (
    <div style={{ marginTop: 16, fontFamily: "system-ui, sans-serif" }}>
      {/* Slot selector */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
        {filteredLabels.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelectSlot(s.id)}
            style={{
              padding: "3px 8px",
              fontSize: 11,
              borderRadius: 3,
              border: selectedSlot === s.id
                ? "1px solid rgba(185,154,91,0.5)"
                : "1px solid rgba(255,255,255,0.1)",
              background: selectedSlot === s.id
                ? "rgba(185,154,91,0.15)"
                : "rgba(255,255,255,0.03)",
              color: selectedSlot === s.id ? "#d3bd82" : "#8b8076",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Numeric inputs */}
      {slot && (
        <div
          style={{
            padding: 12,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          {slot === "portraitInset" ? (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <NumberInput label="上" value={config.slots.portraitInset.top} onChange={(v) => onUpdateSlot(slot, "top", v)} />
              <NumberInput label="右" value={config.slots.portraitInset.right} onChange={(v) => onUpdateSlot(slot, "right", v)} />
              <NumberInput label="下" value={config.slots.portraitInset.bottom} onChange={(v) => onUpdateSlot(slot, "bottom", v)} />
              <NumberInput label="左" value={config.slots.portraitInset.left} onChange={(v) => onUpdateSlot(slot, "left", v)} />
            </div>
          ) : slot === "portraitUnderlay" ? (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <NumberInput label="X" value={config.portraitUnderlay?.x ?? config.slots.portrait.x} onChange={(v) => onUpdateSlot(slot, "x", v)} />
              <NumberInput label="Y" value={config.portraitUnderlay?.y ?? config.slots.portrait.y} onChange={(v) => onUpdateSlot(slot, "y", v)} />
              <NumberInput label="W" value={config.portraitUnderlay?.w ?? config.slots.portrait.w} onChange={(v) => onUpdateSlot(slot, "w", v)} />
              <NumberInput label="H" value={config.portraitUnderlay?.h ?? config.slots.portrait.h} onChange={(v) => onUpdateSlot(slot, "h", v)} />
            </div>
          ) : circleIdx >= 0 ? (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <NumberInput label="CX" value={config.slots.footerCircles[circleIdx]?.cx ?? 0} onChange={(v) => onUpdateSlot(slot, "cx", v)} />
              <NumberInput label="CY" value={config.slots.footerCircles[circleIdx]?.cy ?? 0} onChange={(v) => onUpdateSlot(slot, "cy", v)} />
              <NumberInput label="Ø" value={config.slots.footerCircles[circleIdx]?.diameter ?? 0} onChange={(v) => onUpdateSlot(slot, "diameter", v)} min={20} />
            </div>
          ) : (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <NumberInput label="X" value={(config.slots[slot as keyof typeof config.slots] as { x: number })?.x ?? 0} onChange={(v) => onUpdateSlot(slot, "x", v)} />
              <NumberInput label="Y" value={(config.slots[slot as keyof typeof config.slots] as { y: number })?.y ?? 0} onChange={(v) => onUpdateSlot(slot, "y", v)} />
              <NumberInput label="W" value={(config.slots[slot as keyof typeof config.slots] as { w: number })?.w ?? 0} onChange={(v) => onUpdateSlot(slot, "w", v)} min={20} />
              <NumberInput label="H" value={(config.slots[slot as keyof typeof config.slots] as { h: number })?.h ?? 0} onChange={(v) => onUpdateSlot(slot, "h", v)} min={20} />
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleCopyJSON}
          style={{
            flex: 1,
            padding: "6px 12px",
            fontSize: 12,
            borderRadius: 4,
            border: "1px solid rgba(185,154,91,0.3)",
            background: "rgba(185,154,91,0.08)",
            color: "#c8b88a",
            cursor: "pointer",
          }}
        >
          {copied ? "已复制" : "复制 JSON"}
        </button>
        <button
          onClick={handleExportTS}
          style={{
            flex: 1,
            padding: "6px 12px",
            fontSize: 12,
            borderRadius: 4,
            border: "1px solid rgba(185,154,91,0.3)",
            background: "rgba(185,154,91,0.08)",
            color: "#c8b88a",
            cursor: "pointer",
          }}
        >
          导出 .ts 文件
        </button>
        <button
          onClick={onReset}
          disabled={!hasChanges}
          style={{
            flex: 1,
            padding: "6px 12px",
            fontSize: 12,
            borderRadius: 4,
            border: "1px solid rgba(255,100,100,0.2)",
            background: hasChanges ? "rgba(255,100,100,0.08)" : "rgba(255,255,255,0.02)",
            color: hasChanges ? "#c88b8b" : "#555",
            cursor: hasChanges ? "pointer" : "default",
            opacity: hasChanges ? 1 : 0.5,
          }}
        >
          重置
        </button>
      </div>
    </div>
  );
}
