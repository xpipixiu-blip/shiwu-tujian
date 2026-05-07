"use client";

import React, { forwardRef } from "react";
import type {
  TemplateRenderModel,
  TemplateConfig,
  TemplateSlot,
  TemplateCircleSlot,
  SlotInset,
  DebugMode,
} from "@/lib/cardTemplateTypes";

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

/* ─── Card component ──────────────────────────────────── */

type Props = {
  model: TemplateRenderModel;
  config: TemplateConfig;
  debugMode?: DebugMode;
};

const FarmTemplateCard = forwardRef<HTMLDivElement, Props>(
  ({ model, config, debugMode }, ref) => {
    const { designWidth: dw, designHeight: dh, slots, typography: t } = config;
    const hideContent = debugMode === "slots-only";

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
        {/* ── Layer 0: Background ─────────────────────── */}
        <img
          src={config.backgroundImage}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "fill",
          }}
          draggable={false}
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

        {/* ── Layer 1: Portrait ───────────────────────── */}
        {!hideContent && (
          <>
            {/* Outer portrait slot (invisible, just structural) */}
            <div style={rectStyle(slots.portrait, dw, dh)}>
              {/* Inner clip container */}
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
                  <img
                    src={model.portraitImageUrl}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center",
                    }}
                    draggable={false}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background:
                        "linear-gradient(135deg, rgba(139,107,90,0.15), rgba(139,107,90,0.05))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: fs(100, dw),
                        opacity: 0.2,
                      }}
                    >
                      🖼
                    </span>
                  </div>
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

        {/* ── Layer 5: Info line 2 ────────────────────── */}
        {!hideContent && (
          <div
            style={{
              ...rectStyle(slots.info2, dw, dh),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              paddingLeft: pw(slots.info2.padding.left, dw),
              paddingRight: pw(slots.info2.padding.right, dw),
            }}
          >
            <span
              style={{
                fontFamily: FONT_FAMILY,
                fontSize: fs(t.info2.fontSize, dw),
                color: t.info2.color,
                lineHeight: t.info2.lineHeight,
                fontWeight: t.info2.fontWeight,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
              }}
            >
              {model.infoLine2}
            </span>
          </div>
        )}

        {/* ── Layer 6: Bio ────────────────────────────── */}
        {!hideContent && (
          <div
            style={{
              ...rectStyle(slots.bio, dw, dh),
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
        {debugMode && <DebugOverlay config={config} mode={debugMode} />}
      </div>
    );
  },
);

FarmTemplateCard.displayName = "FarmTemplateCard";

export default FarmTemplateCard;
