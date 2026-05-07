"use client";

import React, { useRef, useState } from "react";
import { toPng } from "html-to-image";
import FarmTemplateCard from "@/components/cardTemplates/FarmTemplateCard";
import { farmTemplateConfig } from "@/lib/farmTemplateConfig";
import {
  museumTemplateConfig,
  rainbowTemplateConfig,
  sleekTemplateConfig,
} from "@/lib/templateConfigs";
import {
  mapToTemplateModel,
  type MockAtlasData,
} from "@/lib/cardTemplateMapping";
import type { DebugMode, TemplateConfig } from "@/lib/cardTemplateTypes";

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
];

export default function FarmTemplateLab() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [debugMode, setDebugMode] = useState<DebugMode | "">("full");
  const [exporting, setExporting] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState(LAB_TEMPLATES[0]);

  const model = mapToTemplateModel(MOCK_DATA);

  const handleExport = async () => {
    if (!cardRef.current) return;
    setExporting(true);

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
      link.download = "farm-template-card-preview.png";
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export failed:", err);
      alert("导出失败，请重试。");
    } finally {
      setExporting(false);
    }
  };

  const currentDebugMode: DebugMode | undefined =
    debugMode === "" ? undefined : debugMode;

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
          精校准模式 — 验证槽位与模板对齐
        </p>

        {/* ── Toolbar ────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-xs text-[#8b8076]">模板：</span>
          {LAB_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTemplate(t)}
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
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-xs text-[#8b8076]">调试：</span>
          {DEBUG_MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setDebugMode(m.value)}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
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
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-1.5 rounded text-xs font-medium bg-[#b99a5b] text-[#0b0a08] hover:bg-[#c7aa67] disabled:opacity-50 transition-colors"
          >
            {exporting ? "导出中..." : "导出 PNG (1500×2000)"}
          </button>
        </div>

        {/* ── Card preview ───────────────────────────── */}
        <div className="mb-4">
          <div className="max-w-[420px] mx-auto">
            <FarmTemplateCard
              ref={cardRef}
              model={model}
              config={activeTemplate.config}
              debugMode={currentDebugMode}
            />
          </div>
        </div>

        {/* ── Portrait debug ─────────────────────────── */}
        <div className="mb-8 border border-[#8b8076]/20 rounded-lg p-4 bg-[#11100d]">
          <h3 className="text-sm font-semibold text-[#8b8076] mb-2">Portrait 诊断</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
            <span className="text-[#8b8076]">portraitImageUrl exists</span>
            <span className={model.portraitImageUrl ? "text-green-400" : "text-red-400"}>
              {model.portraitImageUrl ? "true" : "false"}
            </span>
            <span className="text-[#8b8076]">srcType</span>
            <span className="text-[#e5d6b0]">
              {model.portraitImageUrl
                ? model.portraitImageUrl.startsWith("blob:")
                  ? "blob"
                  : model.portraitImageUrl.startsWith("data:")
                    ? "data:image"
                    : model.portraitImageUrl.startsWith("http")
                      ? "http"
                      : model.portraitImageUrl.startsWith("/")
                        ? "public path"
                        : "other"
                : "empty"}
            </span>
            <span className="text-[#8b8076]">src length</span>
            <span className="text-[#e5d6b0]">
              {model.portraitImageUrl ? model.portraitImageUrl.length.toLocaleString() + " chars" : "N/A"}
            </span>
            <span className="text-[#8b8076]">src prefix</span>
            <span className="text-[#e5d6b0] truncate max-w-[200px]">
              {model.portraitImageUrl ? model.portraitImageUrl.slice(0, 60) + "…" : "—"}
            </span>
          </div>
        </div>

        {/* ── Config info ────────────────────────────── */}
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
                {activeTemplate.config.designWidth} ×{" "}
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
              槽位坐标（设计坐标系 3000 × 4000）
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

          {/* Mock data */}
          <div className="mt-4 pt-4 border-t border-[#8b8076]/15">
            <h3 className="text-sm font-semibold text-[#8b8076] mb-2">
              Mock 数据
            </h3>
            <pre className="text-xs text-[#8b8076] bg-[#0b0a08] rounded p-3 overflow-auto max-h-48">
              {JSON.stringify(MOCK_DATA, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
