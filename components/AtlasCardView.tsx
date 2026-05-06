"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { toBlob, toPng } from "html-to-image";
import type { AtlasCard as AtlasCardType, NumericStat, TextStat } from "@/lib/types";

type Props = { card: AtlasCardType; onEdit: () => void; onClose?: () => void };

function NumericStatBar({ stat }: { stat: NumericStat }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] text-warm-200 w-14 shrink-0">{stat.label}</span>
      <div className="flex-1 h-[3px] bg-ink-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${stat.score}%`, background: `linear-gradient(90deg, transparent, ${scoreColor(stat.score)})` }}
        />
      </div>
      <span className="text-[12px] text-gold-400/80 tabular-nums w-8 text-right">{stat.score}</span>
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
    <div className="flex items-center gap-3">
      <span className="text-[12px] text-warm-200 w-14 shrink-0">{stat.label}</span>
      <span className="text-[13px] text-warm-300 font-medium">{stat.value}</span>
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
    .replace(/[\\/:*?"<>|]/g, "-").slice(0, 80);
  const imageSrc = card.croppedImageUrl || card.imageUrl;

  const handleSave = useCallback(async () => {
    if (!cardRef.current) return;
    setIsSaving(true); setSaveError(null);
    try {
      const blob = await toBlob(cardRef.current, { pixelRatio: 2, backgroundColor: "#17130f" });
      if (!blob) throw new Error("生成图片失败");
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] }); setIsSaving(false); return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = filename; link.href = url;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      setIsSaving(false);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") { setIsSaving(false); return; }
      try {
        const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: "#17130f" });
        const w = window.open("");
        if (w) {
          w.document.write(
            `<html><body style="margin:0;background:#0b0a08;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100dvh;">` +
            `<img src="${dataUrl}" style="max-width:100%;max-height:90dvh;border-radius:4px;" />` +
            `<p style="color:#8b8076;font-size:14px;font-family:sans-serif;margin-top:12px;">长按图片保存到相册</p></body></html>`);
        } else { setSaveError("弹出窗口被拦截"); }
      } catch { setSaveError("保存失败，请截图保存"); }
      setIsSaving(false);
    }
  }, [filename]);

  return (
    <div className="flex justify-center">
      <div className="relative w-full max-w-[360px] mx-auto">

        {/* Card body — captured for export */}
        <div
          ref={cardRef}
          className="relative card-stone card-gold-border"
          style={{ borderRadius: 4, padding: 16, width: "100%", maxWidth: 360, boxSizing: "border-box" }}
        >
          {/* 1. Cropped image — ~45% of card */}
          {imageSrc && (
            <div className="mb-4 rounded-sm overflow-hidden" style={{ border: "1px solid rgba(185,154,91,0.3)" }}>
              <img src={imageSrc} alt="" className="w-full aspect-[1/1] object-cover" crossOrigin="anonymous" />
            </div>
          )}

          {/* 2. Name + category same row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%", marginBottom: 4 }}>
            <h2
              style={{ flex: 1, minWidth: 0, fontSize: 22, fontWeight: 700, letterSpacing: "0.08em", lineHeight: 1.3, color: "#c7aa67", fontFamily: "var(--font-display), serif" }}
            >
              {card.fantasyName}
            </h2>
            <span
              style={{
                flexShrink: 0,
                minWidth: "max-content",
                width: "auto",
                padding: "6px 10px",
                lineHeight: 1,
                fontSize: 11,
                fontWeight: 500,
                whiteSpace: "nowrap",
                writingMode: "horizontal-tb",
                wordBreak: "keep-all",
                overflowWrap: "normal",
                color: "#b99a5b",
                background: "rgba(185,154,91,0.08)",
                border: "1px solid rgba(185,154,91,0.2)",
                borderRadius: 3,
              }}
            >
              {card.category}
            </span>
          </div>

          {/* Subtle divider */}
          <div className="w-full h-px mb-3" style={{ background: "rgba(185,154,91,0.15)" }} />

          {/* 3. Description */}
          <p className="text-[14px] leading-relaxed mb-4" style={{ color: "#c8b88a" }}>
            {card.description}
          </p>

          {/* 4. Stats */}
          <div className="space-y-2.5 mb-4">
            {card.stats.slice(0, 3).map((stat, i) =>
              stat.type === "numeric" ? <NumericStatBar key={i} stat={stat} /> : <TextStatBadge key={i} stat={stat} />
            )}
          </div>

          {/* 5. Fun fact */}
          <div className="w-full h-px mb-2.5" style={{ background: "rgba(185,154,91,0.12)" }} />
          <p className="text-[12px] leading-relaxed" style={{ color: "#7a7268" }}>
            {card.funFact}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          {onClose && (
            <button onClick={onClose} disabled={isSaving}
              className="flex-1 py-2 rounded text-xs font-medium border border-ink-600 text-warm-200 hover:border-gold-500/30 transition-colors disabled:opacity-50">关闭</button>)}
          <button onClick={onEdit} disabled={isSaving}
            className="flex-1 py-2 rounded text-xs font-medium border transition-colors disabled:opacity-50"
            style={{ background: "rgba(185,154,91,0.1)", borderColor: "rgba(185,154,91,0.25)", color: "#c7aa67" }}>编辑名称</button>
          <button onClick={handleSave} disabled={isSaving}
            className="flex-1 py-2 rounded text-xs font-medium border border-ink-600 text-warm-200 hover:border-gold-500/30 transition-colors disabled:opacity-50">
            {isSaving ? <span className="flex items-center justify-center gap-1"><span className="inline-block w-3 h-3 border border-ink-600 border-t-gold-500 rounded-full animate-spin" />处理中</span>
              : isMobile ? "保存/分享" : "下载 PNG"}
          </button>
        </div>
        {saveError && <p className="text-center text-xs mt-2" style={{ color: "#8b5e5e" }}>{saveError}</p>}
      </div>
    </div>
  );
}
