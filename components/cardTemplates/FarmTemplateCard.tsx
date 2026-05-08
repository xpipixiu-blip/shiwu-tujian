"use client";

import React, { forwardRef } from "react";
import type {
  TemplateRenderModel,
  TemplateConfig,
  TemplateSlot,
  TemplateCircleSlot,
  SlotInset,
  DebugMode,
  TemplateStatItem,
  PortraitUnderlayConfig,
  SlotId,
} from "@/lib/cardTemplateTypes";
import SlotEditor from "@/components/cardTemplates/SlotEditor";

/* ─── Coordinate helpers ──────────────────────────────── */

const FONT_FAMILY =
  '"Noto Serif SC", "Songti SC", "STSong", "SimSun", serif';

function px(x: number, dw: number) {
  return `${(x / dw) * 100}%`;
}
function py(y: number, dh: number) {
  return `${(y / dh) * 100}%`;
}
function pw(w: number, dw: number) {
  return `${(w / dw) * 100}%`;
}
function ph(h: number, dh: number) {
  return `${(h / dh) * 100}%`;
}
function fs(size: number, dw: number) {
  return `${((size / dw) * 100).toFixed(3)}cqi`;
}

function rectStyle(
  slot: TemplateSlot,
  dw: number,
  dh: number,
): React.CSSProperties {
  return {
    position: "absolute",
    left: px(slot.x, dw),
    top: py(slot.y, dh),
    width: pw(slot.w, dw),
    height: ph(slot.h, dh),
  };
}

function insetRectStyle(
  outer: TemplateSlot,
  inset: SlotInset,
  dw: number,
  dh: number,
): React.CSSProperties {
  return {
    position: "absolute",
    left: px(outer.x + inset.left, dw),
    top: py(outer.y + inset.top, dh),
    width: pw(outer.w - inset.left - inset.right, dw),
    height: ph(outer.h - inset.top - inset.bottom, dh),
  };
}

function circleBoundsStyle(
  slot: TemplateCircleSlot,
  dw: number,
  dh: number,
): React.CSSProperties {
  const r = slot.diameter / 2;
  return {
    position: "absolute",
    left: px(slot.cx - r, dw),
    top: py(slot.cy - r, dh),
    width: pw(slot.diameter, dw),
    height: ph(slot.diameter, dh),
    borderRadius: "50%",
  };
}

function circleCenterStyle(
  slot: TemplateCircleSlot,
  dw: number,
  dh: number,
): React.CSSProperties {
  return {
    position: "absolute",
    left: px(slot.cx, dw),
    top: py(slot.cy, dh),
    width: "0",
    height: "0",
  };
}

/* ─── Debug overlay ───────────────────────────────────── */

function formatCoord(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(0);
}

function DebugOverlay({
  config,
  mode,
}: {
  config: TemplateConfig;
  mode: DebugMode;
}) {
  const { designWidth: dw, designHeight: dh, slots } = config;
  const isCutout = config.templateMode === "cutoutOverlay";

  const labelStyle = (color: string): React.CSSProperties => ({
    fontSize: fs(34, dw),
    color,
    background: "rgba(0,0,0,0.75)",
    padding: "0 4px",
    lineHeight: 1.3,
    whiteSpace: "nowrap",
    borderRadius: "2px",
    pointerEvents: "none",
  });

  const dimBox = (
    s: TemplateSlot,
    label: string,
    color: string,
  ) => {
    const dims = `${formatCoord(s.x)} ${formatCoord(s.y)} ${formatCoord(s.w)} × ${formatCoord(s.h)}`;
    return (
      <div
        style={{
          ...rectStyle(s, dw, dh),
          border: `2px solid ${color}`,
          backgroundColor: color.replace("1)", "0.06)"),
          pointerEvents: "none",
        }}
      >
        <span style={labelStyle(color)}>
          {label} &nbsp;{dims}
        </span>
      </div>
    );
  };

  const dimCircle = (s: TemplateCircleSlot, label: string, color: string) => (
    <div
      style={{
        ...circleBoundsStyle(s, dw, dh),
        border: `2px solid ${color}`,
        backgroundColor: color.replace("1)", "0.06)"),
        pointerEvents: "none",
      }}
    >
      <span style={labelStyle(color)}>
        {label} &nbsp;c({formatCoord(s.cx)},{formatCoord(s.cy)}) ø{formatCoord(s.diameter)}
      </span>
    </div>
  );

  const showAll = mode === "full" || mode === "slots-only";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      {showAll && dimBox(slots.name, "name_box", "rgba(255,80,80,1)")}
      {showAll && dimBox(slots.badge, "badge_box", "rgba(255,160,40,1)")}

      {/* portrait: outer + inner clip */}
      {showAll &&
        dimBox(slots.portrait, "portrait_box", "rgba(70,130,255,1)")}
      {showAll && (() => {
        const inner = insetRectStyle(slots.portrait, slots.portraitInset, dw, dh);
        return (
          <div
            style={{
              ...inner,
              border: "2px dashed rgba(70,200,255,0.8)",
              backgroundColor: "rgba(70,200,255,0.06)",
              pointerEvents: "none",
            }}
          >
            <span style={labelStyle("rgba(70,200,255,0.9)")}>
              portrait_image_clip
            </span>
          </div>
        );
      })()}

      {/* cutout underlay debug */}
      {isCutout && showAll && (() => {
        const uly = config.portraitUnderlay ?? slots.portrait;
        return dimBox(
          { x: uly.x, y: uly.y, w: uly.w, h: uly.h },
          "portrait_underlay",
          "rgba(255,200,60,1)",
        );
      })()}

      {showAll && dimBox(slots.info1, "info_box_1", "rgba(70,200,120,1)")}
      {showAll && dimBox(slots.info2, "info_box_2", "rgba(70,200,120,1)")}
      {showAll && dimBox(slots.bio, "bio_box", "rgba(180,100,255,1)")}

      {showAll &&
        slots.footerCircles.map((c, i) => (
          <React.Fragment key={`f${i}`}>
            {dimCircle(c, `footer_c${i + 1}`, "rgba(255,130,200,1)")}
            {/* center dot */}
            <div
              style={{
                ...circleCenterStyle(c, dw, dh),
                transform: "translate(-50%, -50%)",
                width: pw(12, dw),
                height: ph(12, dh),
                borderRadius: "50%",
                backgroundColor: "rgba(255,130,200,0.9)",
                pointerEvents: "none",
              }}
            />
          </React.Fragment>
        ))}
    </div>
  );
}

/* ─── Mini stat bar ─────────────────────────────────── */

function barColor(score: number, cfg: TemplateConfig["typography"]["statBar"]) {
  if (score >= 75) return cfg.highColor;
  if (score >= 45) return cfg.midColor;
  return cfg.lowColor;
}

const MiniStatBar = React.memo(function MiniStatBar({
  stat,
  config,
}: {
  stat: TemplateStatItem;
  config: TemplateConfig;
}) {
  const { designWidth: dw } = config;
  const barCfg = config.typography.statBar;
  const hasScore = stat.score != null;
  const pct = hasScore ? Math.min(100, Math.max(0, stat.score!)) : 0;

  const displayValue = stat.unit
    ? `${stat.value}${stat.unit}`
    : String(stat.value);

  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: `${(12 / dw) * 100}cqi`,
        flex: "1 1 0",
        minWidth: 0,
      }}
    >
      {/* Label + value — always visible */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "baseline",
          gap: `${(24 / dw) * 100}cqi`,
          width: "100%",
        }}
      >
        <span
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: fs(66, dw),
            color: barCfg.labelColor,
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          {stat.label}
        </span>
        <span
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: fs(66, dw),
            color: barCfg.valueColor,
            fontWeight: 600,
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          {displayValue}
        </span>
      </span>

      {/* Progress bar — only when score exists */}
      {hasScore ? (
        <span
          style={{
            display: "block",
            width: "100%",
            height: fs(barCfg.height, dw),
            background: barCfg.trackColor,
            borderRadius: `${(4 / dw) * 100}cqi`,
            overflow: "hidden",
          }}
        >
          <span
            style={{
              display: "block",
              width: `${pct}%`,
              height: "100%",
              background: barColor(pct, barCfg),
              borderRadius: `${(4 / dw) * 100}cqi`,
            }}
          />
        </span>
      ) : (
        /* No score: invisible spacer to keep alignment */
        <span
          style={{
            display: "block",
            width: "100%",
            height: fs(barCfg.height, dw),
            background: "transparent",
          }}
        />
      )}
    </span>
  );
});

/* ─── Portrait sub-components ────────────────────────── */

function PortraitImage({ src, dw }: { src: string; dw: number }) {
  const [errored, setErrored] = React.useState(false);

  if (errored) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Template] portrait image failed to load, src prefix:", src.slice(0, 80));
    }
    return <PortraitPlaceholder dw={dw} />;
  }

  return (
    <img
      src={src}
      alt=""
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center",
        display: "block",
      }}
      draggable={false}
      onError={() => setErrored(true)}
    />
  );
}

function PortraitPlaceholder({ dw }: { dw: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background:
          "linear-gradient(135deg, rgba(139,107,90,0.15), rgba(139,107,90,0.05))",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: `${(20 / dw) * 100}cqi`,
      }}
    >
      <span style={{ fontSize: fs(100, dw), opacity: 0.2 }}>🖼</span>
      <span
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: fs(48, dw),
          color: "rgba(139,107,90,0.5)",
        }}
      >
        暂无裁切图片
      </span>
    </div>
  );
}

/* ─── Card component ──────────────────────────────────── */

type Props = {
  model: TemplateRenderModel;
  config: TemplateConfig;
  debugMode?: DebugMode;
  interactive?: boolean;
  interactiveConfig?: TemplateConfig;
  selectedSlot?: SlotId | null;
  onSelectSlot?: (id: SlotId | null) => void;
  onUpdateConfig?: (updater: (prev: TemplateConfig) => TemplateConfig) => void;
  cardElRef?: React.RefObject<HTMLDivElement | null>;
  hideOverlay?: boolean;
};

const FarmTemplateCard = forwardRef<HTMLDivElement, Props>(
  ({ model, config, debugMode, interactive, interactiveConfig, selectedSlot, onSelectSlot, onUpdateConfig, cardElRef, hideOverlay }, ref) => {
    const { designWidth: dw, designHeight: dh, slots, typography: t } = config;
    const hideContent = debugMode === "slots-only";
    const mountTime = React.useRef(0);

    // Log first-render timing
    if (typeof window !== "undefined" && mountTime.current === 0) {
      mountTime.current = performance.now();
      requestAnimationFrame(() => {
        if (process.env.NODE_ENV === "development") {
          console.log("[Template Perf] FarmTemplateCard first paint:", (performance.now() - mountTime.current).toFixed(1) + "ms");
        }
      });
    }

    const bgSrc = config.backgroundImagePreview || config.backgroundImage;
    const isCutout = config.templateMode === "cutoutOverlay";
    const overlaySrc = config.overlayImage ?? "";

    // Underlay position: use portraitUnderlay config, fall back to portrait slot
    const underlayCfg: PortraitUnderlayConfig = config.portraitUnderlay ?? {
      x: slots.portrait.x,
      y: slots.portrait.y,
      w: slots.portrait.w,
      h: slots.portrait.h,
    };
    const underlayInset = underlayCfg.inset ?? { top: 0, right: 0, bottom: 0, left: 0 };

    return (
      <div
        ref={ref}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "3 / 4",
          containerType: "inline-size",
          overflow: "hidden",
        }}
      >
        {/* ── CUTOUT MODE: Layer 0 — Portrait underlay ── */}
        {isCutout && (
          <div
            data-portrait-underlay="true"
            style={{
              position: "absolute",
              left: px(underlayCfg.x + underlayInset.left, dw),
              top: py(underlayCfg.y + underlayInset.top, dh),
              width: pw(underlayCfg.w - underlayInset.left - underlayInset.right, dw),
              height: ph(underlayCfg.h - underlayInset.top - underlayInset.bottom, dh),
              overflow: "hidden",
              zIndex: 0,
            }}
          >
            {model.portraitImageUrl ? (
              <img
                data-portrait-underlay-img="true"
                src={model.portraitImageUrl}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                  display: "block",
                }}
                draggable={false}
              />
            ) : null}
          </div>
        )}

        {/* ── Layer 1: Template overlay (cutout) or Background (old) */}
        {isCutout ? (
          <img
            data-template-overlay="true"
            src={overlaySrc}
            alt=""
            crossOrigin="anonymous"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "fill",
              zIndex: 1,
              pointerEvents: "none",
            }}
            draggable={false}
          />
        ) : (
          /* ── Layer 0: Background (old mode) ──────── */
          <img
            data-template-bg="true"
            src={bgSrc}
            alt=""
            crossOrigin="anonymous"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "fill",
            }}
            draggable={false}
            onLoad={() => {
              if (process.env.NODE_ENV === "development") {
                console.log("[Template Perf] background image loaded");
              }
            }}
            onError={(e) => {
              const el = e.currentTarget;
              el.style.display = "none";
              const parent = el.parentElement;
              if (parent && !parent.querySelector(".template-missing-notice")) {
                const notice = document.createElement("div");
                notice.className = "template-missing-notice";
                notice.style.cssText =
                  "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#2a2018;color:#c8b88a;font-family:var(--font-display);font-size:14px;text-align:center;padding:20px;z-index:200;";
                notice.textContent =
                  "请将模板图片放到 public/templates/farm-card-v1.png";
                parent.appendChild(notice);
              }
            }}
          />
        )}

        {/* ── Layer 1b: Portrait (old mode only; cutout uses underlay) ── */}
        {!isCutout && !hideContent && (
          <>
            <div style={rectStyle(slots.portrait, dw, dh)}>
              <div
                style={{
                  position: "absolute",
                  left: px(slots.portraitInset.left, dw),
                  top: py(slots.portraitInset.top, dh),
                  width: pw(
                    slots.portrait.w -
                      slots.portraitInset.left -
                      slots.portraitInset.right,
                    dw,
                  ),
                  height: ph(
                    slots.portrait.h -
                      slots.portraitInset.top -
                      slots.portraitInset.bottom,
                    dh,
                  ),
                  overflow: "hidden",
                  borderRadius: fs(36, dw),
                }}
              >
                {model.portraitImageUrl ? (
                  <PortraitImage src={model.portraitImageUrl} dw={dw} />
                ) : (
                  <PortraitPlaceholder dw={dw} />
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Layer 2: Name ───────────────────────────── */}
        {!hideContent && (
          <div
            style={{
              ...rectStyle(slots.name, dw, dh),
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              paddingLeft: pw(slots.name.padding.left, dw),
              paddingRight: pw(slots.name.padding.right, dw),
              paddingTop: ph(slots.name.padding.top, dh),
              paddingBottom: ph(slots.name.padding.bottom, dh),
            }}
          >
            <span
              style={{
                fontFamily: FONT_FAMILY,
                fontSize: fs(t.name.fontSize, dw),
                fontWeight: t.name.fontWeight ?? 700,
                color: t.name.color,
                lineHeight: t.name.lineHeight,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
              }}
            >
              {model.nameText}
            </span>
          </div>
        )}

        {/* ── Layer 3: Badge (circle) ─────────────────── */}
        {!hideContent && (
          <div
            style={{
              ...rectStyle(slots.badge, dw, dh),
              zIndex: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              borderRadius: "50%",
            }}
          >
            {model.badgeIcon && (
              <span
                style={{
                  fontSize: fs(t.badgeIcon.fontSize, dw),
                  lineHeight: 1,
                }}
              >
                {model.badgeIcon}
              </span>
            )}
            <span
              style={{
                fontFamily: FONT_FAMILY,
                fontSize: fs(t.badgeText.fontSize, dw),
                color: t.badgeText.color,
                lineHeight: t.badgeText.lineHeight,
                fontWeight: t.badgeText.fontWeight ?? 600,
                whiteSpace: "nowrap",
              }}
            >
              {model.badgeText}
            </span>
          </div>
        )}

        {/* ── Layer 4: Info line 1 ────────────────────── */}
        {!hideContent && (
          <div
            style={{
              ...rectStyle(slots.info1, dw, dh),
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              paddingLeft: pw(slots.info1.padding.left, dw),
              paddingRight: pw(slots.info1.padding.right, dw),
            }}
          >
            <span
              style={{
                fontFamily: FONT_FAMILY,
                fontSize: fs(t.info1.fontSize, dw),
                color: t.info1.color,
                lineHeight: t.info1.lineHeight,
                fontWeight: t.info1.fontWeight,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
              }}
            >
              {model.infoLine1}
            </span>
          </div>
        )}

        {/* ── Layer 5: Stat bars ──────────────────────── */}
        {!hideContent && (
          <div
            style={{
              ...rectStyle(slots.info2, dw, dh),
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-evenly",
              overflow: "hidden",
              gap: `${(50 / dw) * 100}cqi`,
              paddingLeft: pw(slots.info2.padding.left, dw),
              paddingRight: pw(slots.info2.padding.right, dw),
            }}
          >
            {model.statItems.map((stat, i) => (
              <MiniStatBar key={i} stat={stat} config={config} />
            ))}
          </div>
        )}

        {/* ── Layer 6: Bio ────────────────────────────── */}
        {!hideContent && (
          <div
            style={{
              ...rectStyle(slots.bio, dw, dh),
              zIndex: 2,
              overflow: "hidden",
              paddingLeft: pw(slots.bio.padding.left, dw),
              paddingRight: pw(slots.bio.padding.right, dw),
              paddingTop: ph(slots.bio.padding.top, dh),
              paddingBottom: ph(slots.bio.padding.bottom, dh),
            }}
          >
            <span
              style={{
                fontFamily: FONT_FAMILY,
                fontSize: fs(t.bio.fontSize, dw),
                color: t.bio.color,
                lineHeight: t.bio.lineHeight,
                fontWeight: t.bio.fontWeight,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 5,
                WebkitBoxOrient: "vertical",
                wordBreak: "break-word",
                whiteSpace: "pre-line",
              }}
            >
              {model.bioText}
            </span>
          </div>
        )}

        {/* ── Layer 7: Footer circle icons ────────────── */}
        {!hideContent &&
          slots.footerCircles.map((circle, i) => (
            <div
              key={i}
              style={{
                ...circleBoundsStyle(circle, dw, dh),
                zIndex: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  fontSize: fs(t.footerIcon.fontSize, dw),
                  lineHeight: 1,
                }}
              >
                {model.footerIcons[i]?.icon ?? ""}
              </span>
            </div>
          ))}

        {/* ── Debug overlay ───────────────────────────── */}
        {!interactive && debugMode && <DebugOverlay config={config} mode={debugMode} />}

        {/* ── Interactive slot editor ──────────────────── */}
        {interactive && !hideOverlay && interactiveConfig && onSelectSlot && onUpdateConfig && (
          <SlotEditor
            config={interactiveConfig}
            selectedSlot={selectedSlot ?? null}
            onSelectSlot={onSelectSlot}
            onUpdateConfig={onUpdateConfig}
            cardElRef={cardElRef ?? { current: null }}
          />
        )}
      </div>
    );
  },
);

FarmTemplateCard.displayName = "FarmTemplateCard";

export default React.memo(FarmTemplateCard);
