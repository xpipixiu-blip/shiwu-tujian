"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { toBlob, toPng } from "html-to-image";
import type { AtlasCard as AtlasCardType, NumericStat, TextStat, CardPreset } from "@/lib/types";

type Props = { card: AtlasCardType; onEdit: () => void; onClose?: () => void };

/* ── Theme system ────────────────────────────────────────── */

type Theme = {
  bg: string;              // card background
  bgHex: string;           // bg as hex (for toBlob)
  nameColor: string;
  nameFont: string;
  descColor: string;
  dividerColor: string;
  funColor: string;
  statLabelColor: string;
  statValueColor: string;
  statBarTrack: string;
  statBarHigh: string;
  statBarMid: string;
  statBarLow: string;
  statBarMin: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeRadius: number;
  imageBorder: string;
  cardBorder: string;
  cardOutline: string;
  cardShadow: string;
};

const THEMES: Record<CardPreset, Theme> = {
  antique: {
    bg: "#17130f",
    bgHex: "#17130f",
    nameColor: "#c7aa67",
    nameFont: "var(--font-display), serif",
    descColor: "#c8b88a",
    dividerColor: "rgba(185,154,91,0.15)",
    funColor: "#7a7268",
    statLabelColor: "#8b8076",
    statValueColor: "rgba(199,170,103,0.8)",
    statBarTrack: "#1e1a15",
    statBarHigh: "#d3bd82",
    statBarMid: "#c7aa67",
    statBarLow: "#b99a5b",
    statBarMin: "#8b6914",
    badgeColor: "#b99a5b",
    badgeBg: "rgba(185,154,91,0.08)",
    badgeBorder: "rgba(185,154,91,0.2)",
    badgeRadius: 3,
    imageBorder: "rgba(185,154,91,0.3)",
    cardBorder: "rgba(185,154,91,0.5)",
    cardOutline: "rgba(185,154,91,0.12)",
    cardShadow: "none",
  },
  game: {
    bg: "linear-gradient(180deg, #0d1117 0%, #111820 100%)",
    bgHex: "#0d1117",
    nameColor: "#8bc29a",
    nameFont: "system-ui, -apple-system, sans-serif",
    descColor: "#b8c5c8",
    dividerColor: "rgba(139,194,154,0.2)",
    funColor: "#6b7c80",
    statLabelColor: "#7a8c90",
    statValueColor: "rgba(139,194,154,0.9)",
    statBarTrack: "#1a2428",
    statBarHigh: "#8bc29a",
    statBarMid: "#6ba87a",
    statBarLow: "#4a8a5a",
    statBarMin: "#3a6a4a",
    badgeColor: "#8bc29a",
    badgeBg: "rgba(139,194,154,0.1)",
    badgeBorder: "rgba(139,194,154,0.25)",
    badgeRadius: 8,
    imageBorder: "rgba(139,194,154,0.25)",
    cardBorder: "rgba(139,194,154,0.4)",
    cardOutline: "rgba(139,194,154,0.08)",
    cardShadow: "0 0 12px rgba(139,194,154,0.06)",
  },
  "liquid-metal": {
    bg: "linear-gradient(180deg, #1a1c1e 0%, #1f2225 100%)",
    bgHex: "#1a1c1e",
    nameColor: "#d0d4d8",
    nameFont: "system-ui, -apple-system, sans-serif",
    descColor: "#9ca3a8",
    dividerColor: "rgba(180,185,190,0.12)",
    funColor: "#6b7280",
    statLabelColor: "#8b9095",
    statValueColor: "rgba(200,205,210,0.85)",
    statBarTrack: "#262a2e",
    statBarHigh: "#c8cdd2",
    statBarMid: "#a8adb2",
    statBarLow: "#888d92",
    statBarMin: "#686d72",
    badgeColor: "#b4b9be",
    badgeBg: "rgba(180,185,190,0.08)",
    badgeBorder: "rgba(180,185,190,0.2)",
    badgeRadius: 2,
    imageBorder: "rgba(160,165,170,0.25)",
    cardBorder: "rgba(160,165,170,0.4)",
    cardOutline: "rgba(160,165,170,0.08)",
    cardShadow: "none",
  },
  encyclopedia: {
    bg: "linear-gradient(180deg, #f5f0e8 0%, #ede4d8 100%)",
    bgHex: "#f5f0e8",
    nameColor: "#5c3d2e",
    nameFont: "var(--font-display), serif",
    descColor: "#4a3728",
    dividerColor: "rgba(92,61,46,0.15)",
    funColor: "#6b5544",
    statLabelColor: "#7a6250",
    statValueColor: "rgba(92,61,46,0.85)",
    statBarTrack: "#ddd4c8",
    statBarHigh: "#7a5038",
    statBarMid: "#8c6045",
    statBarLow: "#a07050",
    statBarMin: "#6b4030",
    badgeColor: "#5c3d2e",
    badgeBg: "rgba(92,61,46,0.06)",
    badgeBorder: "rgba(92,61,46,0.2)",
    badgeRadius: 3,
    imageBorder: "rgba(92,61,46,0.2)",
    cardBorder: "rgba(92,61,46,0.35)",
    cardOutline: "rgba(92,61,46,0.08)",
    cardShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
};

/* ── Sub-components ─────────────────────────────────────── */

function NumericStatBar({ stat, t }: { stat: NumericStat; t: Theme }) {
  function barColor(score: number) {
    if (score >= 80) return t.statBarHigh;
    if (score >= 50) return t.statBarMid;
    if (score >= 30) return t.statBarLow;
    return t.statBarMin;
  }
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] w-14 shrink-0" style={{ color: t.statLabelColor }}>{stat.label}</span>
      <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: t.statBarTrack }}>
        <div className="h-full rounded-full" style={{ width: `${stat.score}%`, background: `linear-gradient(90deg, transparent, ${barColor(stat.score)})` }} />
      </div>
      <span className="text-[12px] tabular-nums w-8 text-right" style={{ color: t.statValueColor }}>{stat.score}</span>
    </div>
  );
}

function TextStatBadge({ stat, t }: { stat: TextStat; t: Theme }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] w-14 shrink-0" style={{ color: t.statLabelColor }}>{stat.label}</span>
      <span className="text-[13px] font-medium" style={{ color: t.descColor }}>{stat.value}</span>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */

export default function AtlasCardView({ card, onEdit, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => { setIsMobile("ontouchstart" in window || navigator.maxTouchPoints > 0); }, []);

  const preset = card.cardPreset ?? "antique";
  const t = THEMES[preset];

  const filename = `识物图鉴-${card.city}-${card.fantasyName}.png`.replace(/[\\/:*?"<>|]/g, "-").slice(0, 80);
  const imageSrc = card.croppedImageUrl || card.imageUrl;

  const handleSave = useCallback(async () => {
    if (!cardRef.current) return;
    setIsSaving(true); setSaveError(null);
    try {
      const blob = await toBlob(cardRef.current, { pixelRatio: 2, backgroundColor: t.bgHex });
      if (!blob) throw new Error("生成图片失败");
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file] }); setIsSaving(false); return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.download = filename; link.href = url;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 3000); setIsSaving(false);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") { setIsSaving(false); return; }
      try {
        const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: t.bgHex });
        const w = window.open("");
        if (w) { w.document.write(`<html><body style="margin:0;background:${t.bgHex};display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100dvh;"><img src="${dataUrl}" style="max-width:100%;max-height:90dvh;border-radius:4px;" /><p style="color:#8b8076;font-size:14px;font-family:sans-serif;margin-top:12px;">长按图片保存到相册</p></body></html>`); }
        else { setSaveError("弹出窗口被拦截"); }
      } catch { setSaveError("保存失败，请截图保存"); }
      setIsSaving(false);
    }
  }, [filename, t.bgHex]);

  return (
    <div className="flex justify-center">
      <div className="relative w-full max-w-[360px] mx-auto">
        {/* Card body */}
        <div
          ref={cardRef}
          style={{
            background: t.bg, borderRadius: 4, padding: 16, width: "100%", maxWidth: 360, boxSizing: "border-box",
            border: `1px solid ${t.cardBorder}`, outline: `1px solid ${t.cardOutline}`, outlineOffset: 2,
            boxShadow: t.cardShadow, position: "relative",
          }}
        >
          {/* 1. Image */}
          {imageSrc && (
            <div className="mb-4 rounded-sm overflow-hidden" style={{ border: `1px solid ${t.imageBorder}` }}>
              <img src={imageSrc} alt="" className="w-full aspect-[1/1] object-cover" crossOrigin="anonymous" />
            </div>
          )}

          {/* 2. Name + category same row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%", marginBottom: 4 }}>
            <h2 style={{ flex: 1, minWidth: 0, fontSize: 22, fontWeight: 700, letterSpacing: "0.08em", lineHeight: 1.3, color: t.nameColor, fontFamily: t.nameFont }}>
              {card.fantasyName}
            </h2>
            <span style={{
              flexShrink: 0, minWidth: "max-content", width: "auto", padding: "6px 10px",
              lineHeight: 1, fontSize: 11, fontWeight: 500, whiteSpace: "nowrap",
              writingMode: "horizontal-tb", wordBreak: "keep-all", overflowWrap: "normal",
              color: t.badgeColor, background: t.badgeBg, border: `1px solid ${t.badgeBorder}`, borderRadius: t.badgeRadius,
            }}>{card.category}</span>
          </div>

          {/* Divider */}
          <div className="w-full h-px mb-3" style={{ background: t.dividerColor }} />

          {/* 3. Description */}
          <p className="text-[14px] leading-relaxed mb-4" style={{ color: t.descColor }}>{card.description}</p>

          {/* 4. Stats */}
          <div className="space-y-2.5 mb-4">
            {card.stats.slice(0, 3).map((stat, i) =>
              stat.type === "numeric" ? <NumericStatBar key={i} stat={stat} t={t} /> : <TextStatBadge key={i} stat={stat} t={t} />
            )}
          </div>

          {/* 5. Fun fact */}
          <div className="w-full h-px mb-2.5" style={{ background: t.dividerColor }} />
          <p className="text-[12px] leading-relaxed" style={{ color: t.funColor }}>{card.funFact}</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          {onClose && <button onClick={onClose} disabled={isSaving} className="flex-1 py-2 rounded text-xs font-medium border border-ink-600 text-warm-200 hover:border-gold-500/30 transition-colors disabled:opacity-50">关闭</button>}
          <button onClick={onEdit} disabled={isSaving} className="flex-1 py-2 rounded text-xs font-medium border transition-colors disabled:opacity-50" style={{ background: "rgba(185,154,91,0.1)", borderColor: "rgba(185,154,91,0.25)", color: "#c7aa67" }}>编辑名称</button>
          <button onClick={handleSave} disabled={isSaving} className="flex-1 py-2 rounded text-xs font-medium border border-ink-600 text-warm-200 hover:border-gold-500/30 transition-colors disabled:opacity-50">
            {isSaving ? <span className="flex items-center justify-center gap-1"><span className="inline-block w-3 h-3 border border-ink-600 border-t-gold-500 rounded-full animate-spin" />处理中</span> : isMobile ? "保存/分享" : "下载 PNG"}
          </button>
        </div>
        {saveError && <p className="text-center text-xs mt-2" style={{ color: "#8b5e5e" }}>{saveError}</p>}
      </div>
    </div>
  );
}
