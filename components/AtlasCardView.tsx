"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { toBlob, toPng } from "html-to-image";
import type { AtlasCard as AtlasCardType, NumericStat, TextStat } from "@/lib/types";

type Props = {
  card: AtlasCardType;
  onEdit: () => void;
  onClose?: () => void;
};

/* ── Sub-components ─────────────────────────────────────── */

function NumericStatBar({ stat }: { stat: NumericStat }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-warm-200 w-12 shrink-0">{stat.label}</span>
      <div className="flex-1 h-[2px] bg-ink-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${stat.score}%`,
            background: `linear-gradient(90deg, transparent, ${scoreColor(stat.score)})`,
          }}
        />
      </div>
      <span className="text-[10px] text-gold-400/80 tabular-nums w-8 text-right">
        {stat.score}
      </span>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return "#d3bd82";
  if (score >= 50) return "#c7aa67";
  if (score >= 30) return "#b99a5b";
  return "#8b6914";
}

function TextStatBadge({ stat }: { stat: TextStat }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-warm-200 w-12 shrink-0">{stat.label}</span>
      <span className="text-[10px] text-warm-300 font-medium">{stat.value}</span>
    </div>
  );
}

export default function AtlasCardView({ card, onEdit, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  const filename = `识物图鉴-${card.city}-${card.fantasyName}.png`
    .replace(/[\\/:*?"<>|]/g, "-")
    .slice(0, 80);

  const imageSrc = card.croppedImageUrl || card.imageUrl;

  const handleSave = useCallback(async () => {
    if (!cardRef.current) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const blob = await toBlob(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#17130f",
      });
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
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setIsSaving(false);
        return;
      }
      try {
        const dataUrl = await toPng(cardRef.current, {
          pixelRatio: 2,
          backgroundColor: "#17130f",
        });
        const w = window.open("");
        if (w) {
          w.document.write(
            `<html><body style="margin:0;background:#0b0a08;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100dvh;">` +
              `<img src="${dataUrl}" style="max-width:100%;max-height:90dvh;border-radius:4px;" />` +
              `<p style="color:#8b8076;font-size:14px;font-family:sans-serif;margin-top:12px;">长按图片保存到相册</p>` +
              `</body></html>`
          );
        } else {
          setSaveError("弹出窗口被拦截，请在浏览器设置中允许");
        }
      } catch {
        setSaveError("保存失败，请截图保存");
      }
      setIsSaving(false);
    }
  }, [filename]);

  return (
    <div className="flex justify-center">
      <div className="relative w-full max-w-[360px] mx-auto">
        {/* ── Card body: captured for export ───────────────── */}
        <div
          ref={cardRef}
          className="relative card-stone card-gold-border noise-overlay"
          style={{ borderRadius: 4, padding: 20 }}
        >
          {/* Four corner decorations */}
          <img src="/assets_ui/corner-bronze-top-left.png" alt="" className="card-corner card-corner-tl" />
          <img src="/assets_ui/corner-bronze-top-left.png" alt="" className="card-corner card-corner-tr" />
          <img src="/assets_ui/corner-bronze-top-left.png" alt="" className="card-corner card-corner-bl" />
          <img src="/assets_ui/corner-bronze-top-left.png" alt="" className="card-corner card-corner-br" />

          {/* Red seal — bottom-right corner */}
          <img
            src="/assets_ui/seal-red.png"
            alt=""
            className="absolute bottom-3 right-3 w-10 h-10 opacity-40 pointer-events-none"
          />

          {/* ── 1. Cropped image ──────────────────────────── */}
          {imageSrc && (
            <div className="mb-4 rounded-sm overflow-hidden border border-gold-500/30">
              <img
                src={imageSrc}
                alt={card.fantasyName}
                className="w-full aspect-square object-cover"
                crossOrigin="anonymous"
              />
            </div>
          )}

          {/* ── 2. Fantasy name ───────────────────────────── */}
          <h2
            className="text-lg text-center tracking-[0.15em] mb-2 leading-tight"
            style={{
              color: "#c7aa67",
              fontFamily: "var(--font-display), serif",
            }}
          >
            {card.fantasyName}
          </h2>

          {/* ── 3. Category badge ─────────────────────────── */}
          <div className="flex justify-center mb-3">
            <span
              className="inline-block px-2.5 py-0.5 text-[11px] font-medium tracking-wider"
              style={{
                color: "#b99a5b",
                background: "rgba(185,154,91,0.08)",
                border: "1px solid rgba(185,154,91,0.2)",
                borderRadius: 3,
              }}
            >
              {card.category}
            </span>
          </div>

          {/* Visual spacer */}
          <div className="w-8 h-px mx-auto mb-3" style={{ background: "rgba(185,154,91,0.25)" }} />

          {/* ── 4. Description ────────────────────────────── */}
          <p
            className="text-[12px] leading-relaxed text-center italic mb-4 px-1"
            style={{ color: "#c8b88a" }}
          >
            {card.description}
          </p>

          {/* ── 5. Stats ──────────────────────────────────── */}
          <div className="space-y-2 mb-4">
            {card.stats.slice(0, 3).map((stat, i) =>
              stat.type === "numeric" ? (
                <NumericStatBar key={i} stat={stat} />
              ) : (
                <TextStatBadge key={i} stat={stat} />
              )
            )}
          </div>

          {/* ── 6. Fun fact ────────────────────────────────── */}
          <div
            className="w-full h-px mb-2.5"
            style={{ background: "rgba(185,154,91,0.12)" }}
          />
          <p className="text-[9px] leading-relaxed text-center px-2" style={{ color: "#5c5750" }}>
            {card.funFact}
          </p>
        </div>

        {/* ── Action buttons (outside captured area) ──────── */}
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
          <p className="text-center text-xs" style={{ color: "#8b5e5e" }}>{saveError}</p>
        )}
      </div>
    </div>
  );
}
