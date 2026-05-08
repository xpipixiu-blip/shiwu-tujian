"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import FarmTemplateCard from "@/components/cardTemplates/FarmTemplateCard";
import { farmTemplateConfig } from "@/lib/farmTemplateConfig";
import { getTemplateConfig } from "@/lib/templateConfigs";
import { mapAtlasCardToTemplateModel } from "@/lib/cardTemplateMapping";
import type { AtlasCard } from "@/lib/types";

const PERF = process.env.NODE_ENV === "development";
function logPerf(label: string, start: number) {
  if (PERF) console.log(`[Template Perf] ${label}: ${(performance.now() - start).toFixed(1)}ms`);
}

/* ─── Template image cache ─────────────────────────────── */

type CacheEntry = { loaded: boolean; promise: Promise<void> | null };
const imageCache = new Map<string, CacheEntry>();

function preloadImage(url: string): Promise<void> {
  const existing = imageCache.get(url);
  if (existing?.loaded) return Promise.resolve();
  if (existing?.promise) return existing.promise;

  const entry: CacheEntry = { loaded: false, promise: null };
  entry.promise = new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => { entry.loaded = true; resolve(); };
    img.onerror = () => { entry.loaded = true; resolve(); };
    img.src = url;
    // Try to decode immediately if supported
    if (img.decode) {
      img.decode().then(() => { entry.loaded = true; resolve(); }).catch(() => {});
    }
  });
  imageCache.set(url, entry);
  return entry.promise;
}

function isImageCached(url: string): boolean {
  return imageCache.get(url)?.loaded === true;
}

/* ─── Component ───────────────────────────────────────── */

type Props = {
  card: AtlasCard;
  onEdit: () => void;
  onClose?: () => void;
};

function FarmTemplateCardViewInner({ card, onEdit, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [imageMissing, setImageMissing] = useState(false);
  const [bgReady, setBgReady] = useState(false);

  const config = useMemo(
    () => getTemplateConfig(card.cardPreset ?? "farm-template") ?? farmTemplateConfig,
    [card.cardPreset],
  );
  const previewBg = config.backgroundImagePreview || config.backgroundImage;
  const exportBg = config.backgroundImageExport || config.backgroundImage;

  useEffect(() => {
    setIsMobile("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  // Preload both preview and export backgrounds
  useEffect(() => {
    const t0 = performance.now();
    const cached = isImageCached(previewBg);
    preloadImage(previewBg).then(() => {
      if (!cached) logPerf("bg preview preloaded", t0);
      setBgReady(true);
    });
    // Also warm export image in background
    if (exportBg !== previewBg && !isImageCached(exportBg)) {
      preloadImage(exportBg);
    }
  }, [previewBg, exportBg]);

  // Check template image exists
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageMissing(false);
    img.onerror = () => setImageMissing(true);
    img.src = previewBg;
  }, [previewBg]);

  // Memoize model mapping — uses original croppedImageUrl directly
  const model = useMemo(() => {
    const t0 = performance.now();
    const m = mapAtlasCardToTemplateModel(card);
    if (PERF) {
      logPerf("mapToTemplateModel", t0);
      console.log("[Template Debug] statItems from AtlasCard:", JSON.stringify(m.statItems));
      console.log("[Template Debug] raw card.stats:", JSON.stringify(card.stats));
    }
    return m;
  }, [
    card.id, card.fantasyName, card.category, card.description,
    card.funFact, card.croppedImageUrl, card.imageUrl,
    JSON.stringify(card.facts), JSON.stringify(card.stats),
  ]);

  const safeName = card.fantasyName.replace(/[\\/:*?"<>|]/g, "-").slice(0, 40);
  const filename = `${safeName}-farm-card.png`;

  const handleSave = useCallback(async () => {
    if (!cardRef.current) return;
    const t0 = performance.now();
    setIsSaving(true);
    setSaveError(null);

    const cardEl = cardRef.current;

    try {
      // Use offscreen clone at export resolution — never touch visible card
      const clone = cardEl.cloneNode(true) as HTMLElement;
      clone.style.position = "fixed";
      clone.style.left = "-10000px";
      clone.style.top = "0";
      clone.style.width = "1500px";
      clone.style.pointerEvents = "none";
      clone.style.zIndex = "-1";
      document.body.appendChild(clone);

      // Wait for images in clone to load
      const images = clone.querySelectorAll<HTMLImageElement>("img");
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) { resolve(); return; }
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }),
        ),
      );

      // Dynamic import html-to-image
      const { toBlob } = await import("html-to-image");

      logPerf("export toBlob start", t0);
      const blob = await toBlob(clone, { pixelRatio: 1 });
      logPerf("export toBlob done", t0);

      // Clean up clone
      document.body.removeChild(clone);

      if (!blob) throw new Error("生成图片失败");

      // Always direct browser download — never share
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = filename;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      logPerf("export complete", t0);
      setIsSaving(false);
    } catch (e) {
      // Clean up clone if still present
      const lingering = document.querySelector('[style*="left: -10000px"]');
      if (lingering) lingering.remove();

      console.error("[Template] export failed:", e);
      try {
        // Fallback: open image in new tab for manual save
        const { toPng } = await import("html-to-image");
        const dataUrl = await toPng(cardEl, { pixelRatio: 3 });
        const w = window.open("");
        if (w) {
          w.document.write(
            `<html><body style="margin:0;background:#0b0a08;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100dvh;"><img src="${dataUrl}" style="max-width:100%;max-height:90dvh;border-radius:4px;" /><p style="color:#8b8076;font-size:14px;font-family:sans-serif;margin-top:12px;">长按图片保存到相册</p></body></html>`,
          );
        } else {
          setSaveError("弹出窗口被拦截，请允许弹窗后重试");
        }
      } catch {
        setSaveError("下载失败，请截图保存");
      }
      setIsSaving(false);
    }
  }, [filename]);

  // Template image missing
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
          {onClose && (
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 rounded text-xs font-medium border border-ink-600 text-warm-200 hover:border-gold-500/30 transition-colors"
            >
              关闭
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="relative w-full max-w-[420px] mx-auto">
        <FarmTemplateCard
          ref={cardRef}
          model={model}
          config={config}
        />

        {/* Action buttons */}
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

export default React.memo(FarmTemplateCardViewInner);
