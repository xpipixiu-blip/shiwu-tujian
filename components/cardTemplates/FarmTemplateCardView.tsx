"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import FarmTemplateCard from "@/components/cardTemplates/FarmTemplateCard";
import { farmTemplateConfig } from "@/lib/farmTemplateConfig";
import { getTemplateConfig } from "@/lib/templateConfigs";
import { mapAtlasCardToTemplateModel } from "@/lib/cardTemplateMapping";
import type { AtlasCard } from "@/lib/types";

const DEV = process.env.NODE_ENV === "development";
function debugLog(...args: unknown[]) {
  if (DEV) console.log("[Template Export]", ...args);
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
    setTimeout(() => done(false), 15000);
  });
}

async function waitForImages(node: HTMLElement): Promise<{ allReady: boolean; details: string[] }> {
  const images = node.querySelectorAll<HTMLImageElement>("img");
  const details: string[] = [];
  let allReady = true;

  for (const img of Array.from(images)) {
    const src = img.src.slice(0, 100);
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
  const [imageMissing, setImageMissing] = useState(false);

  const config = useMemo(
    () => getTemplateConfig(card.cardPreset ?? "farm-template") ?? farmTemplateConfig,
    [card.cardPreset],
  );
  const previewBg = config.backgroundImagePreview || config.backgroundImage;
  const exportBg = config.backgroundImageExport || config.backgroundImage;
  const isCutout = config.templateMode === "cutoutOverlay";
  const overlaySrc = config.overlayImage ?? "";

  useEffect(() => {
    const t0 = performance.now();
    const cached = isImageCached(previewBg);
    preloadImage(previewBg).then(() => {
      if (!cached && DEV) console.log("[Template Perf] bg preview preloaded:", (performance.now() - t0).toFixed(1) + "ms");
    });
    if (exportBg !== previewBg && !isImageCached(exportBg)) {
      preloadImage(exportBg);
    }
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

  const model = useMemo(() => {
    const m = mapAtlasCardToTemplateModel(card);
    if (DEV) {
      console.log("[Template Debug] statItems:", JSON.stringify(m.statItems));
      console.log("[Template Debug] portraitImageUrl prefix:", m.portraitImageUrl.slice(0, 60));
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
    const t0 = performance.now();
    setIsSaving(true);
    setSaveError(null);

    const targetNode = cardRef.current;
    const mobile = getIsMobile();

    // ═══ DIAGNOSTICS: inspect target node ═══
    debugLog("=== export diagnostics ===");
    debugLog("selectedTemplateId:", config.id);
    debugLog("templateMode:", config.templateMode ?? "background");
    debugLog("overlayImage:", overlaySrc || "(none)");
    debugLog("isMobile:", mobile);

    if (!targetNode) {
      setSaveError("导出失败：没有截到卡片内容，请重试。");
      debugLog("FAIL: targetNode is null");
      setIsSaving(false);
      return;
    }

    const rect = targetNode.getBoundingClientRect();
    debugLog("targetNode.className:", targetNode.className);
    debugLog("targetNode.getBoundingClientRect:", {
      width: rect.width,
      height: rect.height,
      left: rect.left,
      top: rect.top,
    });

    const cs = getComputedStyle(targetNode);
    debugLog("targetNode computed:", {
      display: cs.display,
      visibility: cs.visibility,
      opacity: cs.opacity,
      transform: cs.transform,
    });
    debugLog("targetNode.innerHTML.length:", targetNode.innerHTML.length);

    const imgsInNode = targetNode.querySelectorAll("img").length;
    debugLog("targetNode img count:", imgsInNode);

    // ═══ GUARDS ═══
    if (rect.width === 0 || rect.height === 0) {
      setSaveError("导出失败：没有截到卡片内容，请重试。");
      debugLog("FAIL: target node width or height is 0");
      setIsSaving(false);
      return;
    }
    if (cs.display === "none") {
      setSaveError("导出失败：没有截到卡片内容，请重试。");
      debugLog("FAIL: target node display:none");
      setIsSaving(false);
      return;
    }
    if (cs.visibility === "hidden") {
      setSaveError("导出失败：没有截到卡片内容，请重试。");
      debugLog("FAIL: target node visibility:hidden");
      setIsSaving(false);
      return;
    }
    if (cs.opacity === "0") {
      setSaveError("导出失败：没有截到卡片内容，请重试。");
      debugLog("FAIL: target node opacity:0");
      setIsSaving(false);
      return;
    }
    if (imgsInNode === 0) {
      setSaveError("导出失败：没有截到卡片内容，请重试。");
      debugLog("FAIL: no images in target node");
      setIsSaving(false);
      return;
    }

    // ═══ Wait for all images ═══
    const { allReady, details } = await waitForImages(targetNode);
    debugLog("image load results:", details);

    if (!allReady) {
      const failDetail = details.find((d) => d.startsWith("FAIL"));
      setSaveError(failDetail ? `模板图片加载失败：${failDetail}` : "图片尚未加载完成，请稍后重试");
      debugLog("FAIL: images not ready");
      setIsSaving(false);
      return;
    }

    // Check no naturalWidth=0
    for (const d of details) {
      if (d.includes("0x")) {
        setSaveError("导出失败：图片naturalWidth为0，请重试。");
        debugLog("FAIL: naturalWidth=0 detected in:", d);
        setIsSaving(false);
        return;
      }
    }

    // ═══ Double rAF to ensure paint ═══
    await new Promise<void>((resolve) => { requestAnimationFrame(() => { requestAnimationFrame(() => resolve()); }); });

    // ═══ Export params ═══
    const exportWidth = mobile ? 1200 : 1500;
    const pixelRatios = mobile ? [1, 1.5] : [2, 1];

    debugLog("exportWidth:", exportWidth, "pixelRatios:", pixelRatios);

    // ═══ EXPORT: try visible node first, then clone ═══
    for (const pixelRatio of pixelRatios) {
      try {
        debugLog(`attempt visible node capture, pixelRatio=${pixelRatio}`);

        const { toBlob } = await import("html-to-image");
        const blob = await toBlob(targetNode, {
          pixelRatio,
          width: targetNode.offsetWidth,
          height: targetNode.offsetHeight,
        });

        debugLog("toBlob done, blob size:", blob?.size ?? 0);

        if (!blob) throw new Error("生成图片失败");
        if (blob.size < 20000) {
          debugLog("WARNING: blob size < 20KB, possible blank image, trying clone...");
          // Fall through to clone attempt
        } else {
          // Success — direct download
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = filename;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 10000);

          debugLog("download triggered via visible node");
          debugLog("export complete in", (performance.now() - t0).toFixed(0) + "ms");
          setIsSaving(false);
          return;
        }
      } catch (e) {
        debugLog("visible node capture failed:", e);
        // Continue to clone attempt
      }
    }

    // ═══ FALLBACK: try offscreen clone ═══
    debugLog("trying offscreen clone...");
    for (const pixelRatio of pixelRatios) {
      try {
        debugLog(`clone attempt pixelRatio=${pixelRatio}`);

        const clone = targetNode.cloneNode(true) as HTMLElement;
        clone.style.position = "fixed";
        clone.style.left = "-9999px";
        clone.style.top = "0";
        clone.style.width = `${exportWidth}px`;
        clone.style.opacity = "1";
        clone.style.visibility = "visible";
        clone.style.pointerEvents = "none";
        clone.style.overflow = "hidden";
        clone.style.zIndex = "-1";
        document.body.appendChild(clone);

        // Double rAF for clone layout
        await new Promise<void>((resolve) => { requestAnimationFrame(() => { requestAnimationFrame(() => resolve()); }); });

        // Wait for clone images
        const cloneImgs = clone.querySelectorAll("img").length;
        debugLog(`clone img count: ${cloneImgs}`);

        const { allReady: cloneReady, details: cloneDetails } = await waitForImages(clone);
        debugLog("clone image results:", cloneDetails);

        if (!cloneReady) {
          document.body.removeChild(clone);
          throw new Error("clone images not ready");
        }

        const { toBlob } = await import("html-to-image");
        const blob = await toBlob(clone, { pixelRatio });

        document.body.removeChild(clone);
        debugLog("clone toBlob done, blob size:", blob?.size ?? 0);

        if (!blob) throw new Error("生成图片失败");
        if (blob.size < 20000) {
          throw new Error("导出失败，图片内容为空，请重试");
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = filename;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 10000);

        debugLog("download triggered via clone");
        debugLog("export complete in", (performance.now() - t0).toFixed(0) + "ms");
        setIsSaving(false);
        return;
      } catch (e) {
        debugLog("clone attempt failed:", e);
        const lingering = document.querySelector('[style*="left: -9999px"]');
        if (lingering) lingering.remove();
      }
    }

    // ═══ LAST RESORT: open in new tab ═══
    debugLog("all export methods failed, trying new-tab fallback");
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(targetNode, {
        pixelRatio: 2,
        width: targetNode.offsetWidth,
        height: targetNode.offsetHeight,
      });
      debugLog("fallback toPng dataUrl length:", dataUrl.length);
      if (dataUrl.length < 5000) {
        throw new Error("导出的图片内容异常短");
      }
      const w = window.open("");
      if (w) {
        w.document.write(
          `<html><body style="margin:0;background:#0b0a08;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100dvh;"><img src="${dataUrl}" style="max-width:100%;max-height:90dvh;border-radius:4px;" /><p style="color:#8b8076;font-size:14px;font-family:sans-serif;margin-top:12px;">长按图片保存到相册</p></body></html>`,
        );
        setSaveError(null);
      } else {
        setSaveError("弹出窗口被拦截，请允许弹窗后重试");
      }
    } catch (e) {
      debugLog("fallback also failed:", e);
      const msg = e instanceof Error ? e.message : "下载失败，请截图保存";
      setSaveError(msg || "下载失败，请截图保存");
    }

    setIsSaving(false);
  }, [filename, config.id, config.templateMode, overlaySrc]);

  if (imageMissing) {
    const missingSrc = isCutout ? overlaySrc : previewBg;
    return (
      <div className="flex justify-center">
        <div
          className="relative w-full max-w-[420px] mx-auto p-6 rounded text-center"
          style={{ background: "#1a1510", border: "1px solid rgba(185,154,91,0.2)" }}
        >
          <p className="text-sm" style={{ color: "#c8b88a", fontFamily: "var(--font-display)" }}>
            模板图片未找到
          </p>
          <p className="text-xs mt-2" style={{ color: "#8b8076" }}>
            请检查 {missingSrc}
          </p>
          {onClose && (
            <button onClick={onClose} className="mt-4 px-4 py-2 rounded text-xs font-medium border border-ink-600 text-warm-200 hover:border-gold-500/30 transition-colors">
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
        <FarmTemplateCard ref={cardRef} model={model} config={config} />

        <div className="flex gap-2 mt-3">
          {onClose && (
            <button onClick={onClose} disabled={isSaving}
              className="flex-1 py-2 rounded text-xs font-medium border border-ink-600 text-warm-200 hover:border-gold-500/30 transition-colors disabled:opacity-50">
              关闭
            </button>
          )}
          <button onClick={onEdit} disabled={isSaving}
            className="flex-1 py-2 rounded text-xs font-medium border transition-colors disabled:opacity-50"
            style={{ background: "rgba(185,154,91,0.1)", borderColor: "rgba(185,154,91,0.25)", color: "#c7aa67" }}>
            编辑名称
          </button>
          <button onClick={handleSave} disabled={isSaving}
            className="flex-1 py-2 rounded text-xs font-medium border border-ink-600 text-warm-200 hover:border-gold-500/30 transition-colors disabled:opacity-50">
            {isSaving ? (
              <span className="flex items-center justify-center gap-1">
                <span className="inline-block w-3 h-3 border border-ink-600 border-t-gold-500 rounded-full animate-spin" />
                处理中
              </span>
            ) : "下载 PNG"}
          </button>
        </div>
        {saveError && (
          <p className="text-center text-xs mt-2" style={{ color: "#8b5e5e" }}>{saveError}</p>
        )}
      </div>
    </div>
  );
}

export default React.memo(FarmTemplateCardViewInner);
