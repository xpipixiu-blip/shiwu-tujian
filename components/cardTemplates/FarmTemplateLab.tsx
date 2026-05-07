"use client";

import React, { useRef, useState } from "react";
import { toPng } from "html-to-image";
import FarmTemplateCard from "@/components/cardTemplates/FarmTemplateCard";
import { farmTemplateConfig } from "@/lib/farmTemplateConfig";
import {
  mapToTemplateModel,
  type MockAtlasData,
} from "@/lib/cardTemplateMapping";
import type { DebugMode } from "@/lib/cardTemplateTypes";

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
    { label: "甜度", value: "85", score: 85 },
    { label: "脆爽", value: "72", score: 72 },
    { label: "香气", value: "68", score: 68 },
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

export default function FarmTemplateLab() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [debugMode, setDebugMode] = useState<DebugMode | "">("full");
  const [exporting, setExporting] = useState(false);

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
        <div className="mb-8">
          <div className="max-w-[420px] mx-auto">
            <FarmTemplateCard
              ref={cardRef}
              model={model}
              config={farmTemplateConfig}
              debugMode={currentDebugMode}
            />
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
              <dd className="text-[#e5d6b0]">{farmTemplateConfig.id}</dd>
            </div>
            <div>
              <dt className="text-[#8b8076]">模板名称</dt>
              <dd className="text-[#e5d6b0]">{farmTemplateConfig.label}</dd>
            </div>
            <div>
              <dt className="text-[#8b8076]">设计尺寸</dt>
              <dd className="text-[#e5d6b0]">
                {farmTemplateConfig.designWidth} ×{" "}
                {farmTemplateConfig.designHeight}
              </dd>
            </div>
            <div>
              <dt className="text-[#8b8076]">portraitInset</dt>
              <dd className="text-[#e5d6b0]">
                t{farmTemplateConfig.slots.portraitInset.top} r
                {farmTemplateConfig.slots.portraitInset.right} b
                {farmTemplateConfig.slots.portraitInset.bottom} l
                {farmTemplateConfig.slots.portraitInset.left}
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
                  name: farmTemplateConfig.slots.name,
                  badge: farmTemplateConfig.slots.badge,
                  portrait: farmTemplateConfig.slots.portrait,
                  portraitInset: farmTemplateConfig.slots.portraitInset,
                  info1: farmTemplateConfig.slots.info1,
                  info2: farmTemplateConfig.slots.info2,
                  bio: farmTemplateConfig.slots.bio,
                  footerCircles: farmTemplateConfig.slots.footerCircles,
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
              {JSON.stringify(farmTemplateConfig.typography, null, 2)}
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
