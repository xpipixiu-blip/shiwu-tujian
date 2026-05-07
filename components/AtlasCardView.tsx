"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { toBlob, toPng } from "html-to-image";
import type { AtlasCard as AtlasCardType, NumericStat, TextStat, CardPreset } from "@/lib/types";
import { getCategoryEmoji, EmojiSpan } from "@/lib/emoji-icons";
import FarmTemplateCardView from "@/components/cardTemplates/FarmTemplateCardView";

type Props = { card: AtlasCardType; onEdit: () => void; onClose?: () => void };

/* ── Theme system ────────────────────────────────────────── */

type Theme = {
  bg: string; bgHex: string;
  nameColor: string; nameFont: string; nameWeight: number;
  descColor: string;
  dividerColor: string; funColor: string;
  statLabelColor: string; statValueColor: string;
  statBarTrack: string; statBarHigh: string; statBarMid: string; statBarLow: string; statBarMin: string;
  badgeColor: string; badgeBg: string; badgeBorder: string; badgeRadius: number;
  imageBorder: string; imageInset: string;
  cardBorder: string; cardOutline: string; cardOutlineOffset: number; cardShadow: string;
};

const THEMES: Record<Exclude<CardPreset, "farm-template">, Theme> = {
  antique: {
    bg: "#17130f", bgHex: "#17130f",
    nameColor: "#c7aa67", nameFont: "var(--font-display), serif", nameWeight: 700,
    descColor: "#c8b88a",
    dividerColor: "rgba(185,154,91,0.15)", funColor: "#7a7268",
    statLabelColor: "#8b8076", statValueColor: "rgba(199,170,103,0.8)",
    statBarTrack: "#1e1a15", statBarHigh: "#d3bd82", statBarMid: "#c7aa67", statBarLow: "#b99a5b", statBarMin: "#8b6914",
    badgeColor: "#b99a5b", badgeBg: "rgba(185,154,91,0.08)", badgeBorder: "rgba(185,154,91,0.2)", badgeRadius: 3,
    imageBorder: "rgba(185,154,91,0.3)", imageInset: "none",
    cardBorder: "rgba(185,154,91,0.5)", cardOutline: "rgba(185,154,91,0.12)", cardOutlineOffset: 2, cardShadow: "none",
  },
  game: {
    bg: "#101418", bgHex: "#101418",
    nameColor: "#a0d6a8", nameFont: '"Courier New", "SF Mono", monospace', nameWeight: 700,
    descColor: "#c0c8b8",
    dividerColor: "rgba(139,194,154,0.25)", funColor: "#889080",
    statLabelColor: "#889480", statValueColor: "rgba(160,214,168,0.9)",
    statBarTrack: "#1a241c", statBarHigh: "#a0d6a8", statBarMid: "#78b880", statBarLow: "#509860", statBarMin: "#387840",
    badgeColor: "#a0d6a8", badgeBg: "rgba(139,194,154,0.08)", badgeBorder: "rgba(139,194,154,0.3)", badgeRadius: 0,
    imageBorder: "rgba(139,194,154,0.3)", imageInset: "none",
    cardBorder: "rgba(139,194,154,0.5)", cardOutline: "rgba(139,194,154,0.1)", cardOutlineOffset: 2,
    cardShadow: "2px 0 0 rgba(139,194,154,0.12), 0 2px 0 rgba(139,194,154,0.12), 4px 0 0 rgba(139,194,154,0.06), 0 4px 0 rgba(139,194,154,0.06)",
  },
  "liquid-metal": {
    bg: "linear-gradient(175deg, #2a2d30 0%, #1f2225 40%, #1a1c1e 100%)", bgHex: "#1a1c1e",
    nameColor: "#e8ecef", nameFont: "system-ui, -apple-system, sans-serif", nameWeight: 300,
    descColor: "#b0b8bc",
    dividerColor: "rgba(184,191,196,0.12)", funColor: "#858d92",
    statLabelColor: "#8b9297", statValueColor: "rgba(200,207,212,0.85)",
    statBarTrack: "rgba(255,255,255,0.04)", statBarHigh: "#d8dde0", statBarMid: "#b8bfc4", statBarLow: "#989fa4", statBarMin: "#787f84",
    badgeColor: "#b8bfc4", badgeBg: "rgba(255,255,255,0.03)", badgeBorder: "rgba(184,191,196,0.2)", badgeRadius: 2,
    imageBorder: "rgba(184,191,196,0.35)", imageInset: "inset 0 0 0 1px rgba(255,255,255,0.04)",
    cardBorder: "rgba(184,191,196,0.5)", cardOutline: "rgba(255,255,255,0.06)", cardOutlineOffset: 1, cardShadow: "none",
  },
  encyclopedia: {
    bg: "linear-gradient(180deg, #f5f0e8 0%, #ede4d8 100%)", bgHex: "#f5f0e8",
    nameColor: "#5c3d2e", nameFont: "var(--font-display), serif", nameWeight: 700,
    descColor: "#4a3728",
    dividerColor: "rgba(92,61,46,0.15)", funColor: "#6b5544",
    statLabelColor: "#7a6250", statValueColor: "rgba(92,61,46,0.85)",
    statBarTrack: "#ddd4c8", statBarHigh: "#7a5038", statBarMid: "#8c6045", statBarLow: "#a07050", statBarMin: "#6b4030",
    badgeColor: "#5c3d2e", badgeBg: "rgba(92,61,46,0.06)", badgeBorder: "rgba(92,61,46,0.2)", badgeRadius: 3,
    imageBorder: "rgba(92,61,46,0.2)", imageInset: "none",
    cardBorder: "rgba(92,61,46,0.35)", cardOutline: "rgba(92,61,46,0.08)", cardOutlineOffset: 2, cardShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
};

/* ── Sub-components ─────────────────────────────────────── */

function NumericStatBar({ stat, t, isGame }: { stat: NumericStat; t: Theme; isGame?: boolean }) {
  function barColor(score: number) {
    if (score >= 80) return t.statBarHigh; if (score >= 50) return t.statBarMid;
    if (score >= 30) return t.statBarLow; return t.statBarMin;
  }
  const pct = stat.score;
  const color = barColor(pct);
  // Pixel stepped bar for game, smooth gradient otherwise
  const fillStyle = isGame
    ? { width: `${pct}%`, background: `repeating-linear-gradient(90deg, ${color} 0px, ${color} 3px, transparent 3px, transparent 5px)` }
    : { width: `${pct}%`, background: `linear-gradient(90deg, transparent, ${color})` };
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] w-14 shrink-0" style={{ color: t.statLabelColor }}>{stat.label}</span>
      <div className="flex-1 h-[4px] overflow-hidden" style={{ background: t.statBarTrack, borderRadius: isGame ? 0 : 2 }}>
        <div className="h-full" style={fillStyle} />
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

export default function AtlasCardView({ card, onEdit, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => { setIsMobile("ontouchstart" in window || navigator.maxTouchPoints > 0); }, []);

  const preset = card.cardPreset ?? "antique";

  // Farm template delegates to its own renderer
  if (preset === "farm-template") {
    return <FarmTemplateCardView card={card} onEdit={onEdit} onClose={onClose} />;
  }

  const t = THEMES[preset];
  const showEmoji = preset === "game" || preset === "encyclopedia";
  const isLiquid = preset === "liquid-metal";
  const isGame = preset === "game";
  const catEmoji = showEmoji ? getCategoryEmoji(card.category as import("@/lib/types").CategoryId, preset) : "";

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
        {/* ── Card body ──────────────────────────────── */}
        <div ref={cardRef} style={{
          background: t.bg, borderRadius: 4, padding: 16, width: "100%", maxWidth: 360, boxSizing: "border-box",
          border: `1px solid ${t.cardBorder}`, outline: `1px solid ${t.cardOutline}`, outlineOffset: t.cardOutlineOffset,
          boxShadow: t.cardShadow, position: "relative",
        }}>
          {/* game: pixel grid overlay */}
          {isGame && (
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: 4, overflow: "hidden", opacity: 0.04,
              backgroundImage: "repeating-linear-gradient(0deg, #8bc29a, #8bc29a 1px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, #8bc29a, #8bc29a 1px, transparent 1px, transparent 4px)" }} />
          )}

          {/* liquid-metal: mirror sheen overlay */}
          {isLiquid && (
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "-30%", left: "10%", width: "80%", height: "60%", background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)", transform: "rotate(-3deg)" }} />
              <div style={{ position: "absolute", top: 6, left: 6, width: 16, height: 1, background: "rgba(200,205,210,0.2)" }} />
              <div style={{ position: "absolute", top: 6, left: 6, width: 1, height: 16, background: "rgba(200,205,210,0.2)" }} />
              <div style={{ position: "absolute", bottom: 6, right: 6, width: 16, height: 1, background: "rgba(200,205,210,0.2)" }} />
              <div style={{ position: "absolute", bottom: 6, right: 6, width: 1, height: 16, background: "rgba(200,205,210,0.2)" }} />
            </div>
          )}

          {/* 1. Image */}
          {imageSrc && (
            <div className="mb-4 rounded-sm overflow-hidden" style={{ border: `1px solid ${t.imageBorder}`, boxShadow: t.imageInset }}>
              <img src={imageSrc} alt="" className="w-full aspect-[1/1] object-cover" crossOrigin="anonymous" />
            </div>
          )}

          {/* 2. Name row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
              <h2 style={{ minWidth: 0, fontSize: 22, fontWeight: t.nameWeight, letterSpacing: isLiquid ? "0.12em" : "0.08em", lineHeight: 1.3, color: t.nameColor, fontFamily: t.nameFont }}>
                {card.fantasyName}
              </h2>
            </div>
            <span style={{
              flexShrink: 0, minWidth: "max-content", width: "auto", padding: isLiquid ? "5px 10px" : "6px 10px",
              display: "flex", alignItems: "center", gap: 4,
              lineHeight: 1, fontSize: 11, fontWeight: 500, whiteSpace: "nowrap",
              writingMode: "horizontal-tb", wordBreak: "keep-all", overflowWrap: "normal",
              color: t.badgeColor, background: t.badgeBg, border: `1px solid ${t.badgeBorder}`, borderRadius: t.badgeRadius,
            }}>
              {catEmoji && <EmojiSpan emoji={catEmoji} size={12} />}
              {isLiquid && (
                <span style={{ display: "inline-block", width: 4, height: 10, background: t.badgeColor, borderRadius: 1, marginRight: 4, opacity: 0.6 }} />
              )}
              {card.category}
            </span>
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: t.dividerColor }} />
            <div style={{ flex: 1, height: 1, background: t.dividerColor }} />
          </div>

          {/* 3. Description */}
          <p className="text-[14px] leading-relaxed mb-4" style={{ color: t.descColor }}>{card.description}</p>

          {/* 4. Stats */}
          <div className="space-y-2.5 mb-4">
            {card.stats.slice(0, 3).map((stat, i) =>
              stat.type === "numeric" ? <NumericStatBar key={i} stat={stat} t={t} isGame={isGame} /> : <TextStatBadge key={i} stat={stat} t={t} />
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
