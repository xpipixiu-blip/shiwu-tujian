"use client";

import React, { useRef, useState, useCallback } from "react";
import { toPng } from "html-to-image";
import FarmTemplateCard from "@/components/cardTemplates/FarmTemplateCard";
import { farmTemplateConfig } from "@/lib/farmTemplateConfig";
import {
  museumTemplateConfig,
  rainbowTemplateConfig,
  sleekTemplateConfig,
  farmTemplateCutoutConfig,
  museumTemplateCutoutConfig,
  rainbowTemplateCutoutConfig,
  sleekTemplateCutoutConfig,
} from "@/lib/templateConfigs";
import SlotEditorPanel from "@/components/cardTemplates/SlotEditorPanel";
import {
  mapToTemplateModel,
  type MockAtlasData,
} from "@/lib/cardTemplateMapping";
import type { DebugMode, TemplateConfig, SlotId } from "@/lib/cardTemplateTypes";

/* ─── Mock data ───────────────────────────────────────── */

const MOCK_DATA: MockAtlasData = {
  fantasyName: "晨露绯红果",
  realName: "草莓",
  category: "水果",
  categoryIcon: "🍓",
  styleSource: "星露谷",
  croppedImageUrl: "",
  infoFacts: [
    { label: "产地", value: "温带果园" },
    { label: "成熟期", value: "春末" },
    { label: "营养", value: "维生素C丰富" },
  ],
  stats: [
    { label: "热量", value: "400卡", score: 82 },
    { label: "甜度", value: "85", score: 85 },
  ],
  description:
    "春末成熟的鲜红果实，带着清晨露水与泥土的甜香，常被视作农园里最温柔的收获。",
  funFact: "小知识：草莓表面的「小籽」其实才是它真正的果实。",
};

const DEBUG_MODES: { value: DebugMode | ""; label: string }[] = [
  { value: "", label: "关闭调试" },
  { value: "full", label: "内容 + 槽位框" },
  { value: "slots-only", label: "仅槽位框" },
];

/* ─── Component ───────────────────────────────────────── */

const LAB_TEMPLATES: { id: string; label: string; config: TemplateConfig }[] = [
  { id: "farm", label: "像素农场", config: farmTemplateConfig },
  { id: "museum", label: "古物馆藏", config: museumTemplateConfig },
  { id: "rainbow", label: "彩虹稀有", config: rainbowTemplateConfig },
  { id: "sleek", label: "拉丝金属", config: sleekTemplateConfig },
  { id: "farm-cutout", label: "像素农场·透卡", config: farmTemplateCutoutConfig },
  { id: "museum-cutout", label: "古物馆藏·透卡", config: museumTemplateCutoutConfig },
  { id: "rainbow-cutout", label: "彩虹稀有·透卡", config: rainbowTemplateCutoutConfig },
  { id: "sleek-cutout", label: "拉丝金属·透卡", config: sleekTemplateCutoutConfig },
];

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export default function FarmTemplateLab() {
  const cardRef = useRef<HTMLDivElement>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const [debugMode, setDebugMode] = useState<DebugMode | "">("full");
  const [exporting, setExporting] = useState(false);
  const [hideOverlay, setHideOverlay] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState(LAB_TEMPLATES[0]);

  // Interactive mode state
  const [interactive, setInteractive] = useState(false);
  const [mutableConfig, setMutableConfig] = useState<TemplateConfig>(() =>
    deepClone(LAB_TEMPLATES[0].config),
  );
  const [selectedSlot, setSelectedSlot] = useState<SlotId | null>(null);

  const model = mapToTemplateModel(MOCK_DATA);

  const handleSwitchTemplate = useCallback(
    (t: (typeof LAB_TEMPLATES)[number]) => {
      setActiveTemplate(t);
      if (interactive) {
        setMutableConfig(deepClone(t.config));
        setSelectedSlot(null);
      }
    },
    [interactive],
  );

  const handleToggleInteractive = useCallback(() => {
    setInteractive((prev) => {
      if (!prev) {
        // Turning ON: clone current config
        setMutableConfig(deepClone(activeTemplate.config));
        setSelectedSlot("portrait");
        setDebugMode("");
      }
      return !prev;
    });
  }, [activeTemplate.config]);

  const handleUpdateConfig = useCallback(
    (updater: (prev: TemplateConfig) => TemplateConfig) => {
      setMutableConfig((prev) => updater(prev));
    },
    [],
  );

  const handleUpdateSlot = useCallback(
    (slotId: SlotId, field: string, value: number) => {
      setMutableConfig((prev) => {
        const s = { ...prev.slots };
        if (slotId === "portraitInset") {
          const inset = { ...s.portraitInset, [field]: value };
          return { ...prev, slots: { ...s, portraitInset: inset } };
        }
        if (slotId === "portraitUnderlay") {
          const uly = { ...(prev.portraitUnderlay ?? s.portrait), [field]: value };
          return { ...prev, portraitUnderlay: uly };
        }
        if (slotId.startsWith("footerCircle")) {
          const idx = parseInt(slotId.split("_")[1] ?? "0", 10);
          const arr = [...s.footerCircles];
          arr[idx] = { ...arr[idx], [field]: value };
          return { ...prev, slots: { ...s, footerCircles: arr } };
        }
        const key = slotId as keyof typeof s;
        if (key in s) {
          return { ...prev, slots: { ...s, [key]: { ...(s[key] as object), [field]: value } } };
        }
        return prev;
      });
    },
    [],
  );

  const handleReset = useCallback(() => {
    setMutableConfig(deepClone(activeTemplate.config));
    setSelectedSlot(null);
  }, [activeTemplate.config]);

  const hasChanges =
    JSON.stringify(mutableConfig) !== JSON.stringify(activeTemplate.config);

  const handleExport = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    setHideOverlay(true);

    // Wait for React to remove overlay from DOM
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    try {
      const cardEl = cardRef.current;
      const displayWidth = cardEl.offsetWidth;
      const targetWidth = 1500;
      const pixelRatio = targetWidth / displayWidth;

      const dataUrl = await toPng(cardEl, {
        pixelRatio,
        quality: 1,
      });

      const link = document.createElement("a");
      link.download = "template-card-preview.png";
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export failed:", err);
      alert("导出失败，请重试。");
    } finally {
      setHideOverlay(false);
      setExporting(false);
    }
  };

  const currentDebugMode: DebugMode | undefined =
    debugMode === "" ? undefined : debugMode;

  const displayConfig = interactive ? mutableConfig : activeTemplate.config;

  return (
    <div className="min-h-screen bg-[#0b0a08] text-[#c8b88a] font-[var(--font-body)]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* ── Header ─────────────────────────────────── */}
        <h1
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          美工模板卡面实验室
        </h1>
        <p className="text-sm text-[#8b8076] mb-6">
          拖拽调整槽位 — 实时预览坐标
        </p>

        {/* ── Toolbar: template selector ──────────────── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-xs text-[#8b8076]">模板：</span>
          {LAB_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSwitchTemplate(t)}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                activeTemplate.id === t.id
                  ? "bg-[#b99a5b] text-[#0b0a08] border-[#b99a5b]"
                  : "border-[#8b8076]/30 hover:bg-[#1a1510] text-[#c8b88a]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Toolbar: debug + interactive + export ───── */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-xs text-[#8b8076]">调试：</span>
          {DEBUG_MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setDebugMode(m.value)}
              disabled={interactive}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors disabled:opacity-30 ${
                debugMode === m.value
                  ? "bg-[#b99a5b] text-[#0b0a08] border-[#b99a5b]"
                  : "border-[#8b8076]/30 hover:bg-[#1a1510] text-[#c8b88a]"
              }`}
            >
              {m.label}
            </button>
          ))}
          <div className="w-px h-5 bg-[#8b8076]/20 mx-1" />
          <button
            onClick={handleToggleInteractive}
            className={`px-4 py-1.5 rounded text-xs font-medium border transition-colors ${
              interactive
                ? "bg-[#c06090] text-white border-[#c06090]"
                : "border-[#8b8076]/30 hover:bg-[#1a1510] text-[#c8b88a]"
            }`}
          >
            {interactive ? "关闭调整" : "交互调整"}
          </button>
          <div className="w-px h-5 bg-[#8b8076]/20 mx-1" />
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-1.5 rounded text-xs font-medium bg-[#b99a5b] text-[#0b0a08] hover:bg-[#c7aa67] disabled:opacity-50 transition-colors"
          >
            {exporting ? "导出中..." : "导出 PNG (1500×2000)"}
          </button>
        </div>

        {/* ── Card preview ───────────────────────────── */}
        <div className="mb-4" ref={cardContainerRef}>
          <div className="max-w-[420px] mx-auto">
            <FarmTemplateCard
              ref={cardRef}
              model={model}
              config={displayConfig}
              debugMode={currentDebugMode}
              interactive={interactive}
              interactiveConfig={interactive ? mutableConfig : undefined}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
              onUpdateConfig={handleUpdateConfig}
              cardElRef={cardRef}
              hideOverlay={hideOverlay}
            />
          </div>
        </div>

        {/* ── Slot editor panel (when interactive) ────── */}
        {interactive && (
          <div className="mb-8 border border-[#c06090]/30 rounded-lg p-4 bg-[#11100d]">
            <SlotEditorPanel
              config={mutableConfig}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
              onUpdateSlot={handleUpdateSlot}
              onReset={handleReset}
              originalConfig={activeTemplate.config}
              hasChanges={hasChanges}
            />
          </div>
        )}

        {/* ── Config info (when NOT interactive) ──────── */}
        {!interactive && (
          <div className="border border-[#8b8076]/20 rounded-lg p-5 bg-[#11100d]">
            <h2
              className="text-lg font-bold mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              当前模板配置（精校准）
            </h2>

            {/* Basic info */}
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
              <div>
                <dt className="text-[#8b8076]">模板 ID</dt>
                <dd className="text-[#e5d6b0]">{activeTemplate.config.id}</dd>
              </div>
              <div>
                <dt className="text-[#8b8076]">模板名称</dt>
                <dd className="text-[#e5d6b0]">{activeTemplate.config.label}</dd>
              </div>
              <div>
                <dt className="text-[#8b8076]">设计尺寸</dt>
                <dd className="text-[#e5d6b0]">
                  {activeTemplate.config.designWidth} x{" "}
                  {activeTemplate.config.designHeight}
                </dd>
              </div>
              <div>
                <dt className="text-[#8b8076]">portraitInset</dt>
                <dd className="text-[#e5d6b0]">
                  t{activeTemplate.config.slots.portraitInset.top} r
                  {activeTemplate.config.slots.portraitInset.right} b
                  {activeTemplate.config.slots.portraitInset.bottom} l
                  {activeTemplate.config.slots.portraitInset.left}
                </dd>
              </div>
            </dl>

            {/* Slot coordinates */}
            <div className="mt-4 pt-4 border-t border-[#8b8076]/15">
              <h3 className="text-sm font-semibold text-[#8b8076] mb-2">
                槽位坐标（设计坐标系 3000 x 4000）
              </h3>
              <pre className="text-xs text-[#8b8076] bg-[#0b0a08] rounded p-3 overflow-auto max-h-64">
                {JSON.stringify(
                  {
                    name: activeTemplate.config.slots.name,
                    badge: activeTemplate.config.slots.badge,
                    portrait: activeTemplate.config.slots.portrait,
                    portraitInset: activeTemplate.config.slots.portraitInset,
                    info1: activeTemplate.config.slots.info1,
                    info2: activeTemplate.config.slots.info2,
                    bio: activeTemplate.config.slots.bio,
                    footerCircles: activeTemplate.config.slots.footerCircles,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>

            {/* Typography */}
            <div className="mt-4 pt-4 border-t border-[#8b8076]/15">
              <h3 className="text-sm font-semibold text-[#8b8076] mb-2">
                排版配置（字体 / 行高 / 颜色）
              </h3>
              <pre className="text-xs text-[#8b8076] bg-[#0b0a08] rounded p-3 overflow-auto max-h-64">
                {JSON.stringify(activeTemplate.config.typography, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
