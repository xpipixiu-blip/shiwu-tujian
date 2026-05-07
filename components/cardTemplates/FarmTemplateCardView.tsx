"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { toBlob, toPng } from "html-to-image";
import FarmTemplateCard from "@/components/cardTemplates/FarmTemplateCard";
import { farmTemplateConfig } from "@/lib/farmTemplateConfig";
import { mapAtlasCardToTemplateModel } from "@/lib/cardTemplateMapping";
import type { AtlasCard } from "@/lib/types";

const PERF = process.env.NODE_ENV === "development";

function logPerf(label: string, start: number) {
  if (PERF) console.log(`[Template Perf] ${label}: ${(performance.now() - start).toFixed(1)}ms`);
}

/* ─── Template background preloader ───────────────────── */
/* Singleton: load once, reuse across mounts. */

let bgPreloadPromise: Promise<void> | null = null;
let bgPreloaded = false;

function ensureBgPreloaded(): Promise<void> {
  if (bgPreloaded) return Promise.resolve();
  if (bgPreloadPromise) return bgPreloadPromise;

  bgPreloadPromise = new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => { bgPreloaded = true; resolve(); };
    img.onerror = () => { bgPreloaded = true; resolve(); }; // still resolve, card shows error
    img.src = farmTemplateConfig.backgroundImage;
  });
  return bgPreloadPromise;
}

/* ─── Component ───────────────────────────────────────── */

type Props = {
  card: AtlasCard;
  onEdit: () => void;
  onClose?: () => void;
};

export default function FarmTemplateCardView({ card, onEdit, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [imageMissing, setImageMissing] = useState(false);
  const [bgReady, setBgReady] = useState(bgPreloaded);

  useEffect(() => {
    setIsMobile("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  // Preload template background
  useEffect(() => {
    if (bgPreloaded) return;
    const t0 = performance.now();
    ensureBgPreloaded().then(() => {
      logPerf("background preloaded", t0);
      setBgReady(true);
    });
  }, []);

  // Pre-check template image (one-shot)
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageMissing(false);
    img.onerror = () => setImageMissing(true);
    img.src = farmTemplateConfig.backgroundImage;
  }, []);

  // Memoize the mapping — only re-run when card data actually changes
  const tMap0 = performance.now();
  const model = useMemo(() => {
    const t0 = performance.now();
    const m = mapAtlasCardToTemplateModel(card);
    logPerf("mapAtlasCardToTemplateModel", t0);
    return m;
  }, [card.id, card.fantasyName, card.category, card.description,
      card.funFact, card.croppedImageUrl, card.imageUrl,
      // Facts / stats are compared by structural hash via JSON
      JSON.stringify(card.facts), JSON.stringify(card.stats)]);
  logPerf("FarmTemplateCardView render (after useMemo)", tMap0);

  const safeName = card.fantasyName.replace(/[\\/:*?"<>|]/g, "-").slice(0, 40);
  const filename = `${safeName}-farm-card.png`;

  const handleSave = useCallback(async () => {
    if (!cardRef.current) return;
    const t0 = performance.now();
    setIsSaving(true);
    setSaveError(null);

    try {
      const cardEl = cardRef.current;
      const displayWidth = cardEl.offsetWidth;
      const targetWidth = 1500;
      const pixelRatio = targetWidth / displayWidth;

      logPerf("export start", t0);
      const blob = await toBlob(cardEl, { pixelRatio });
      logPerf("export toBlob done", t0);
      if (!blob) throw new Error("生成图片失败");

      const file = new File([blob], filename, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
        setIsSaving(false);
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = filename;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      setIsSaving(false);
      logPerf("export complete", t0);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setIsSaving(false);
        return;
      }
      try {
        const dataUrl = await toPng(cardRef.current, { pixelRatio: 1500 / (cardRef.current?.offsetWidth || 420) });
        const w = window.open("");
        if (w) {
          w.document.write(
            `<html><body style="margin:0;background:#0b0a08;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100dvh;"><img src="${dataUrl}" style="max-width:100%;max-height:90dvh;border-radius:4px;" /><p style="color:#8b8076;font-size:14px;font-family:sans-serif;margin-top:12px;">长按图片保存到相册</p></body></html>`,
          );
        } else {
          setSaveError("弹出窗口被拦截");
        }
      } catch {
        setSaveError("保存失败，请截图保存");
      }
      setIsSaving(false);
      logPerf("export fallback done", t0);
    }
  }, [filename]);

  // Template image missing state
  if (imageMissing) {
    return (
      <div className="flex justify-center">
        <div
          className="relative w-full max-w-[420px] mx-auto p-6 rounded text-center"
          style={{
            background: "#1a1510",
            border: "1px solid rgba(185,154,91,0.2)",
          }}
        >
          <p className="text-sm" style={{ color: "#c8b88a", fontFamily: "var(--font-display)" }}>
            模板图片未找到
          </p>
          <p className="text-xs mt-2" style={{ color: "#8b8076" }}>
            请检查 public/templates/farm-card-v1.png
          </p>
          <div className="flex gap-2 mt-4 justify-center">
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded text-xs font-medium border border-ink-600 text-warm-200 hover:border-gold-500/30 transition-colors"
              >
                关闭
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="relative w-full max-w-[420px] mx-auto">
        {/* ── Card body ──────────────────────────────── */}
        <FarmTemplateCard
          ref={cardRef}
          model={model}
          config={farmTemplateConfig}
        />

        {/* ── Action buttons ─────────────────────────── */}
        <div className="flex gap-2 mt-3">
          {onClose && (
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-2 rounded text-xs font-medium border border-ink-600 text-warm-200 hover:border-gold-500/30 transition-colors disabled:opacity-50"
            >
              关闭
            </button>
          )}
          <button
            onClick={onEdit}
            disabled={isSaving}
            className="flex-1 py-2 rounded text-xs font-medium border transition-colors disabled:opacity-50"
            style={{
              background: "rgba(185,154,91,0.1)",
              borderColor: "rgba(185,154,91,0.25)",
              color: "#c7aa67",
            }}
          >
            编辑名称
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2 rounded text-xs font-medium border border-ink-600 text-warm-200 hover:border-gold-500/30 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-1">
                <span className="inline-block w-3 h-3 border border-ink-600 border-t-gold-500 rounded-full animate-spin" />
                处理中
              </span>
            ) : isMobile ? (
              "保存/分享"
            ) : (
              "下载 PNG"
            )}
          </button>
        </div>
        {saveError && (
          <p className="text-center text-xs mt-2" style={{ color: "#8b5e5e" }}>
            {saveError}
          </p>
        )}
      </div>
    </div>
  );
}
