"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { toBlob, toPng } from "html-to-image";
import type { AtlasCard as AtlasCardType, NumericStat, TextStat } from "@/lib/types";

type Props = {
  card: AtlasCardType;
  onEdit: () => void;
  onClose?: () => void;
};

function NumericStatBar({ stat }: { stat: NumericStat }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[11px]">
        <span className="text-stone-400">{stat.label}</span>
        <span className="text-amber-400/80 tabular-nums">
          {stat.score}
          <span className="text-stone-500 ml-0.5">{stat.value}</span>
        </span>
      </div>
      <div className="h-1 bg-stone-800 rounded-full overflow-hidden border border-stone-700/30">
        <div
          className="h-full rounded-full"
          style={{
            width: `${stat.score}%`,
            background: `linear-gradient(90deg, #92400e, ${scoreColor(stat.score)})`,
          }}
        />
      </div>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return "#f59e0b";
  if (score >= 50) return "#d97706";
  if (score >= 30) return "#b45309";
  return "#78350f";
}

function TextStatBadge({ stat }: { stat: TextStat }) {
  return (
    <div className="flex items-center justify-between gap-2 px-2.5 py-1 bg-stone-800/60 border border-stone-700/30 rounded">
      <span className="text-[10px] text-stone-500">{stat.label}</span>
      <span className="text-[11px] text-amber-300/80 font-medium">{stat.value}</span>
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

  const handleSave = useCallback(async () => {
    if (!cardRef.current) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const blob = await toBlob(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#1c1917",
      });
      if (!blob) throw new Error("生成图片失败");

      const file = new File([blob], filename, { type: "image/png" });

      // Tier 1: Web Share API (mobile)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
        setIsSaving(false);
        return;
      }

      // Tier 2: Desktop download
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
      // Share cancelled by user — not an error
      if (e instanceof DOMException && e.name === "AbortError") {
        setIsSaving(false);
        return;
      }

      // Tier 3: Preview fallback
      try {
        const dataUrl = await toPng(cardRef.current, {
          pixelRatio: 2,
          backgroundColor: "#1c1917",
        });
        const w = window.open("");
        if (w) {
          w.document.write(
            `<html><body style="margin:0;background:#111;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100dvh;">` +
              `<img src="${dataUrl}" style="max-width:100%;max-height:90dvh;border-radius:12px;" />` +
              `<p style="color:#888;font-size:14px;font-family:sans-serif;margin-top:12px;">长按图片保存到相册</p>` +
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
        {/* Card — captured for export */}
        <div
          ref={cardRef}
          className="relative rounded-2xl"
          style={{
            padding: "3px",
            background: `
              linear-gradient(135deg, #78716c 0%, #44403c 20%, #57534e 50%, #78716c 80%, #44403c 100%)
            `,
            boxShadow: `
              0 0 30px rgba(0,0,0,0.5),
              inset 0 0 10px rgba(0,0,0,0.3),
              0 4px 20px rgba(0,0,0,0.4)
            `,
          }}
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: `
                radial-gradient(ellipse at 20% 10%, #57534e22 0%, transparent 50%),
                radial-gradient(ellipse at 80% 90%, #29252433 0%, transparent 50%),
                linear-gradient(180deg, #3a3632 0%, #2d2926 30%, #332f2b 60%, #2a2623 100%)
              `,
              boxShadow: "inset 0 0 60px rgba(0,0,0,0.5)",
            }}
          >
            {/* 1. Cropped image — top, ~40% of card */}
            {(card.croppedImageUrl || card.imageUrl) && (
              <div className="mx-4 mt-4 rounded-lg overflow-hidden border border-stone-700/30">
                <img
                  src={card.croppedImageUrl || card.imageUrl}
                  alt={card.fantasyName}
                  className="w-full aspect-square object-cover"
                  crossOrigin="anonymous"
                />
              </div>
            )}

            {/* 2. Fantasy name */}
            <div className="px-5 mt-3 text-center">
              <h2
                className="text-lg font-bold tracking-wider"
                style={{
                  color: "#d4a853",
                  textShadow: "0 1px 0 #000, 0 2px 4px rgba(0,0,0,0.6)",
                  fontFamily: "var(--font-display), serif",
                }}
              >
                {card.fantasyName}
              </h2>
            </div>

            {/* 3. Category badge */}
            <div className="px-5 mt-1.5 flex justify-center">
              <span className="inline-block px-2 py-0.5 bg-amber-900/50 border border-amber-800/30 rounded text-[10px] text-amber-400/80 font-medium">
                {card.category}
              </span>
            </div>

            {/* Stone divider */}
            <div className="px-5 mt-2">
              <div
                className="h-px w-12 mx-auto"
                style={{
                  background: "linear-gradient(90deg, transparent, #78716c88, transparent)",
                }}
              />
            </div>

            {/* 4. Description */}
            <div className="px-5 mt-2">
              <p
                className="text-[11px] leading-relaxed text-center px-2"
                style={{ color: "#b8a99a", fontStyle: "italic" }}
              >
                {card.description}
              </p>
            </div>

            {/* 5. Stats — fixed 3, compact */}
            <div className="px-5 mt-3 space-y-2">
              {card.stats.slice(0, 3).map((stat, i) =>
                stat.type === "numeric" ? (
                  <NumericStatBar key={i} stat={stat} />
                ) : (
                  <TextStatBadge key={i} stat={stat} />
                )
              )}
            </div>

            {/* 6. Fun fact — footer note */}
            <div className="px-5 mt-3 pb-4">
              <div
                className="h-px w-full mb-2"
                style={{
                  background: "linear-gradient(90deg, transparent, #78716c44 20%, #78716c44 80%, transparent)",
                }}
              />
              <p className="text-[10px] leading-relaxed text-center px-1" style={{ color: "#9d8b78" }}>
                {card.funFact}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons — outside captured area */}
        <div className="flex gap-2 mt-3">
          {onClose && (
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-2 rounded-lg text-xs font-medium border border-stone-600 text-stone-400 hover:border-stone-500 hover:text-stone-300 transition-colors disabled:opacity-50"
            >
              关闭
            </button>
          )}
          <button
            onClick={onEdit}
            disabled={isSaving}
            className="flex-1 py-2 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50"
            style={{
              background: "rgba(146,64,14,0.3)",
              borderColor: "rgba(180,83,9,0.5)",
              color: "#d4a853",
            }}
          >
            ✎ 编辑名称
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2 rounded-lg text-xs font-medium border border-stone-600 text-stone-300 hover:border-amber-700/50 hover:text-amber-300 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-1">
                <span className="inline-block w-3 h-3 border border-stone-500 border-t-amber-500 rounded-full animate-spin" />
                处理中
              </span>
            ) : isMobile ? (
              "📤 保存/分享"
            ) : (
              "⬇ 下载 PNG"
            )}
          </button>
        </div>

        {saveError && (
          <p className="text-center text-xs text-red-400/80 mt-2">{saveError}</p>
        )}
      </div>
    </div>
  );
}
