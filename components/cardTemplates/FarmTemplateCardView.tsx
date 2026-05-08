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
function debugLog(...args: unknown[]) {
  if (PERF) console.log("[Template Export]", ...args);
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

/* ─── Image wait utility ──────────────────────────────── */

type ImageLoadResult =
  | { ok: true; naturalWidth: number; naturalHeight: number }
  | { ok: false; reason: string };

function waitForImage(img: HTMLImageElement): Promise<ImageLoadResult> {
  return new Promise((resolve) => {
    if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
      resolve({ ok: true, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
      return;
    }
    if (img.complete && img.naturalWidth === 0) {
      resolve({ ok: false, reason: "image broken (naturalWidth=0)" });
      return;
    }
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      if (ok && img.naturalWidth > 0) {
        resolve({ ok: true, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
      } else {
        resolve({ ok: false, reason: `load failed (naturalWidth=${img.naturalWidth})` });
      }
    };
    img.onload = () => done(true);
    img.onerror = () => done(false);
    // Timeout after 15s
    setTimeout(() => done(false), 15000);
  });
}

async function waitForImages(node: HTMLElement): Promise<{ allReady: boolean; details: string[] }> {
  const images = node.querySelectorAll<HTMLImageElement>("img");
  const details: string[] = [];
  let allReady = true;

  for (const img of Array.from(images)) {
    const src = img.src.slice(0, 80);
    const result = await waitForImage(img);
    if (result.ok) {
      details.push(`OK  ${result.naturalWidth}x${result.naturalHeight} src=${src}`);
    } else {
      details.push(`FAIL ${result.reason} src=${src}`);
      allReady = false;
    }
  }

  return { allReady, details };
}

/* ─── Mobile detection ────────────────────────────────── */

function getIsMobile(): boolean {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
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
  const isCutout = config.templateMode === "cutoutOverlay";
  const overlaySrc = config.overlayImage ?? "";

  useEffect(() => {
    setIsMobile(getIsMobile());
  }, []);

  // Preload backgrounds
  useEffect(() => {
    const t0 = performance.now();
    const cached = isImageCached(previewBg);
    preloadImage(previewBg).then(() => {
      if (!cached) logPerf("bg preview preloaded", t0);
      setBgReady(true);
    });
    if (exportBg !== previewBg && !isImageCached(exportBg)) {
      preloadImage(exportBg);
    }
    // Preload overlay image for cutout mode
    if (isCutout && overlaySrc && !isImageCached(overlaySrc)) {
      preloadImage(overlaySrc);
    }
  }, [previewBg, exportBg, isCutout, overlaySrc]);

  // Check template image exists
  useEffect(() => {
    const src = isCutout && overlaySrc ? overlaySrc : previewBg;
    const img = new Image();
    img.onload = () => setImageMissing(false);
    img.onerror = () => setImageMissing(true);
    img.src = src;
  }, [previewBg, isCutout, overlaySrc]);

  // Memoize model mapping
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
  const filename = `${safeName}-card.png`;

  const handleSave = useCallback(async () => {
    if (!cardRef.current) return;
    const t0 = performance.now();
    setIsSaving(true);
    setSaveError(null);

    const cardEl = cardRef.current;
    const mobile = getIsMobile();

    // ── Export params ──
    const exportWidth = mobile ? 1200 : 1500;
    const exportHeight = mobile ? 1600 : 2000;
    const pixelRatios = mobile ? [1, 1.5] : [2, 1];

    // ── Debug log ──
    debugLog("=== export start ===");
    debugLog("selectedTemplateId:", config.id);
    debugLog("templateMode:", config.templateMode ?? "background");
    debugLog("overlayImage:", overlaySrc || "(none)");
    debugLog("portraitImage src type:", (() => {
      const u = model.portraitImageUrl;
      if (!u) return "none";
      if (u.startsWith("blob:")) return "blob";
      if (u.startsWith("data:")) return "data:image";
      if (u.startsWith("http")) return "http";
      return "public path";
    })());
    debugLog("isMobile:", mobile);
    debugLog("exportWidth:", exportWidth, "exportHeight:", exportHeight);
    debugLog("pixelRatios:", pixelRatios);

    // Try export with fallback pixelRatios
    let lastError: unknown = null;

    for (const pixelRatio of pixelRatios) {
      try {
        debugLog(`attempt pixelRatio=${pixelRatio}`);

        // Clone DOM node offscreen
        const clone = cardEl.cloneNode(true) as HTMLElement;
        clone.style.position = "fixed";
        clone.style.left = "-10000px";
        clone.style.top = "0";
        clone.style.width = `${exportWidth}px`;
        clone.style.height = `${exportHeight}px`;
        clone.style.opacity = "1";
        clone.style.visibility = "visible";
        clone.style.pointerEvents = "none";
        clone.style.zIndex = "-1";
        document.body.appendChild(clone);

        // ── Wait for ALL images ──
        const imgCount = clone.querySelectorAll("img").length;
        debugLog(`images in export node: ${imgCount}`);

        const { allReady, details } = await waitForImages(clone);
        debugLog("image load results:", details);

        if (!allReady) {
          document.body.removeChild(clone);
          // If overlay or portrait image failed, report clearly
          const failDetail = details.find((d) => d.startsWith("FAIL"));
          throw new Error(failDetail ? `图片尚未加载完成：${failDetail}` : "图片尚未加载完成，请稍后重试");
        }

        // ── Export ──
        debugLog("html-to-image start");
        const { toBlob } = await import("html-to-image");
        const blob = await toBlob(clone, { pixelRatio });
        debugLog("html-to-image done, blob size:", blob?.size ?? 0);
        logPerf(`export toBlob (pixelRatio=${pixelRatio})`, t0);

        // Clean up clone
        document.body.removeChild(clone);

        if (!blob) throw new Error("生成图片失败");

        // ── White detection ──
        if (blob.size < 20000) {
          debugLog("WARNING: blob size < 20KB, possible blank image");
          throw new Error("导出失败，图片内容为空，请重试");
        }
        debugLog("blob size OK:", blob.size);

        // ── Direct download ──
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = filename;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 10000);

        debugLog("download triggered");
        logPerf("export complete", t0);
        setIsSaving(false);
        return; // success
      } catch (e) {
        lastError = e;
        debugLog("export attempt failed:", e);

        // Clean up lingering clone
        const lingering = document.querySelector('[style*="left: -10000px"]');
        if (lingering) lingering.remove();

        // If this was the last pixelRatio attempt, handle fallback
        if (pixelRatio === pixelRatios[pixelRatios.length - 1]) {
          console.error("[Template] export failed:", e);
          const msg = e instanceof Error ? e.message : "导出失败";

          // Try fallback: open image in new tab for manual save
          try {
            const { toPng } = await import("html-to-image");
            const dataUrl = await toPng(cardEl, { pixelRatio: 2 });
            const w = window.open("");
            if (w) {
              w.document.write(
                `<html><body style="margin:0;background:#0b0a08;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100dvh;"><img src="${dataUrl}" style="max-width:100%;max-height:90dvh;border-radius:4px;" /><p style="color:#8b8076;font-size:14px;font-family:sans-serif;margin-top:12px;">长按图片保存到相册</p></body></html>`,
              );
              setSaveError(null);
            } else {
              setSaveError("弹出窗口被拦截，请允许弹窗后重试");
            }
          } catch {
            setSaveError(msg || "下载失败，请截图保存");
          }
        }
        // else: continue to next pixelRatio
      }
    }

    setIsSaving(false);
  }, [filename, config.id, config.templateMode, overlaySrc, model.portraitImageUrl]);

  // Template image missing
  if (imageMissing) {
    const missingSrc = isCutout ? overlaySrc : previewBg;
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
            请检查 {missingSrc}
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
