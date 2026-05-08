"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type {
  TemplateConfig,
  TemplateSlot,
  TemplateCircleSlot,
  SlotInset,
  SlotId,
} from "@/lib/cardTemplateTypes";
import {
  toDesignDelta,
  clampRectSlot,
  clampCircleSlot,
  clampValue,
} from "@/components/cardTemplates/coordUtils";

/* ─── Coordinate helpers (same as FarmTemplateCard) ────── */

function px(x: number, dw: number) { return `${(x / dw) * 100}%`; }
function py(y: number, dh: number) { return `${(y / dh) * 100}%`; }
function pw(w: number, dw: number) { return `${(w / dw) * 100}%`; }
function ph(h: number, dh: number) { return `${(h / dh) * 100}%`; }
function fs(size: number, dw: number) { return `${((size / dw) * 100).toFixed(3)}cqi`; }

function formatCoord(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(0);
}

/* ─── Slot colors (matching DebugOverlay) ──────────────── */

const SLOT_COLORS: Record<string, string> = {
  name: "rgba(255,80,80,1)",
  badge: "rgba(255,160,40,1)",
  portrait: "rgba(70,130,255,1)",
  portraitInset: "rgba(70,200,255,0.8)",
  portraitUnderlay: "rgba(255,200,60,1)",
  info1: "rgba(70,200,120,1)",
  info2: "rgba(70,200,120,1)",
  bio: "rgba(180,100,255,1)",
};

function getSlotColor(slotId: SlotId): string {
  if (slotId.startsWith("footerCircle")) return "rgba(255,130,200,1)";
  return SLOT_COLORS[slotId] ?? "rgba(255,255,255,0.5)";
}

function getSlotLabel(slotId: SlotId): string {
  if (slotId.startsWith("footerCircle")) {
    const n = parseInt(slotId.split("_")[1] ?? "0", 10) + 1;
    return `footer_c${n}`;
  }
  return slotId;
}

/* ─── Handle positions ─────────────────────────────────── */

type HandlePos =
  | "tl" | "tc" | "tr"
  | "ml" | "mr"
  | "bl" | "bc" | "br"
  | "circle-handle";

const HANDLE_SIZE_DESIGN = 24;

/* ─── Sub-component: SlotBox (rectangle) ───────────────── */

type DragState =
  | { phase: "idle" }
  | {
      phase: "dragging";
      slotId: SlotId;
      startX: number; startY: number;
      startMouseX: number; startMouseY: number;
    }
  | {
      phase: "resizing";
      slotId: SlotId;
      handle: HandlePos;
      startSlot: TemplateSlot | TemplateCircleSlot;
      startMouseX: number; startMouseY: number;
    };

type Props = {
  config: TemplateConfig;
  selectedSlot: SlotId | null;
  onSelectSlot: (id: SlotId | null) => void;
  onUpdateConfig: (updater: (prev: TemplateConfig) => TemplateConfig) => void;
  cardElRef: React.RefObject<HTMLDivElement | null>;
};

export default function SlotEditor({
  config,
  selectedSlot,
  onSelectSlot,
  onUpdateConfig,
  cardElRef,
}: Props) {
  const { designWidth: dw, designHeight: dh, slots } = config;
  const isCutout = config.templateMode === "cutoutOverlay";
  const [dragState, setDragState] = useState<DragState>({ phase: "idle" });
  const dragRef = useRef<DragState>({ phase: "idle" });

  // Get card pixel dimensions for coord conversion
  const getCardSize = useCallback(() => {
    const el = cardElRef.current;
    if (!el) return { width: 1, height: 1 };
    const rect = el.getBoundingClientRect();
    return { width: rect.width || 1, height: rect.height || 1 };
  }, [cardElRef]);

  /* ─── Drag / resize handlers ─────────────────────── */

  const onPointerDown = useCallback(
    (e: React.PointerEvent, slotId: SlotId, handle?: HandlePos) => {
      e.stopPropagation();
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      const cardSize = getCardSize();
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      if (handle) {
        // Resize
        let startSlot: TemplateSlot | TemplateCircleSlot;
        if (slotId.startsWith("footerCircle")) {
          const idx = parseInt(slotId.split("_")[1] ?? "0", 10);
          startSlot = { ...slots.footerCircles[idx] ?? { cx: 0, cy: 0, diameter: 0 } };
        } else if (slotId === "portraitInset") {
          startSlot = { x: 0, y: 0, w: 0, h: 0 };
        } else if (slotId === "portraitUnderlay") {
          const uly = config.portraitUnderlay ?? slots.portrait;
          startSlot = { x: uly.x, y: uly.y, w: uly.w, h: uly.h };
        } else {
          const s = slots[slotId as keyof typeof slots] as TemplateSlot | undefined;
          startSlot = s ? { ...s } : { x: 0, y: 0, w: 0, h: 0 };
        }
        const ds: DragState = {
          phase: "resizing",
          slotId,
          handle,
          startSlot,
          startMouseX: mouseX,
          startMouseY: mouseY,
        };
        dragRef.current = ds;
        setDragState(ds);
      } else {
        // Drag
        onSelectSlot(slotId);
        // Get current slot center
        let sx = 0, sy = 0;
        if (slotId.startsWith("footerCircle")) {
          const idx = parseInt(slotId.split("_")[1] ?? "0", 10);
          const c = slots.footerCircles[idx];
          if (c) { sx = c.cx; sy = c.cy; }
        } else if (slotId === "portraitUnderlay") {
          const uly = config.portraitUnderlay ?? slots.portrait;
          sx = uly.x; sy = uly.y;
        } else if (slotId !== "portraitInset") {
          const s = slots[slotId as keyof typeof slots] as TemplateSlot | undefined;
          if (s) { sx = s.x; sy = s.y; }
        }
        const ds: DragState = {
          phase: "dragging",
          slotId,
          startX: sx,
          startY: sy,
          startMouseX: mouseX,
          startMouseY: mouseY,
        };
        dragRef.current = ds;
        setDragState(ds);
      }
    },
    [getCardSize, slots, config.portraitUnderlay, onSelectSlot],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const ds = dragRef.current;
      if (ds.phase === "idle") return;
      e.preventDefault();

      const cardSize = getCardSize();
      const { dx, dy } = toDesignDelta(
        e.clientX - ds.startMouseX,
        e.clientY - ds.startMouseY,
        dw, dh,
        cardSize.width, cardSize.height,
      );

      if (ds.phase === "dragging") {
        onUpdateConfig((prev) => {
          const s = { ...prev.slots };
          if (ds.slotId.startsWith("footerCircle")) {
            const idx = parseInt(ds.slotId.split("_")[1] ?? "0", 10);
            const arr = [...s.footerCircles];
            const c = { ...arr[idx] };
            c.cx = Math.round(ds.startX + dx);
            c.cy = Math.round(ds.startY + dy);
            arr[idx] = clampCircleSlot(c, dw, dh);
            return { ...prev, slots: { ...s, footerCircles: arr } };
          }
          if (ds.slotId === "portraitInset") {
            const inset = { ...s.portraitInset };
            inset.top = Math.round(clampValue(inset.top + dy, 0, s.portrait.h));
            inset.left = Math.round(clampValue(inset.left + dx, 0, s.portrait.w));
            return { ...prev, slots: { ...s, portraitInset: inset } };
          }
          if (ds.slotId === "portraitUnderlay") {
            const uly = { ...(prev.portraitUnderlay ?? s.portrait) };
            uly.x = Math.round(ds.startX + dx);
            uly.y = Math.round(ds.startY + dy);
            return { ...prev, portraitUnderlay: clampRectSlot(uly, dw, dh) };
          }
          const key = ds.slotId as keyof typeof s;
          const slot = s[key] as TemplateSlot | undefined;
          if (slot) {
            const moved: TemplateSlot = {
              x: Math.round(ds.startX + dx),
              y: Math.round(ds.startY + dy),
              w: slot.w,
              h: slot.h,
            };
            return { ...prev, slots: { ...s, [key]: clampRectSlot(moved, dw, dh) } };
          }
          return prev;
        });
      } else if (ds.phase === "resizing") {
        onUpdateConfig((prev) => {
          const s = { ...prev.slots };
          if (ds.slotId.startsWith("footerCircle")) {
            // Circle resize
            const idx = parseInt(ds.slotId.split("_")[1] ?? "0", 10);
            const arr = [...s.footerCircles];
            const start = ds.startSlot as TemplateCircleSlot;
            const d = Math.max(20, Math.round(start.diameter + dx));
            arr[idx] = clampCircleSlot({ ...arr[idx], diameter: d }, dw, dh);
            return { ...prev, slots: { ...s, footerCircles: arr } };
          }
          if (ds.slotId === "portraitInset") {
            const inset = { ...s.portraitInset };
            const h = ds.handle as string;
            if (h === "tc" || h === "tl" || h === "tr") inset.top = Math.round(clampValue(inset.top + dy, 0, s.portrait.h));
            if (h === "bc" || h === "bl" || h === "br") inset.bottom = Math.round(clampValue(inset.bottom - dy, 0, s.portrait.h));
            if (h === "ml" || h === "tl" || h === "bl") inset.left = Math.round(clampValue(inset.left + dx, 0, s.portrait.w));
            if (h === "mr" || h === "tr" || h === "br") inset.right = Math.round(clampValue(inset.right - dx, 0, s.portrait.w));
            return { ...prev, slots: { ...s, portraitInset: inset } };
          }
          // Rectangle resize
          const key = (ds.slotId === "portraitUnderlay" ? null : ds.slotId) as keyof typeof s | null;
          const start = ds.startSlot as TemplateSlot;
          let slot: TemplateSlot;
          if (ds.slotId === "portraitUnderlay") {
            slot = { ...(prev.portraitUnderlay ?? s.portrait) };
          } else if (key && s[key]) {
            slot = { ...(s[key] as TemplateSlot) };
          } else {
            return prev;
          }
          const h = ds.handle;
          if (h === "tl") { slot.x = Math.round(start.x + dx); slot.y = Math.round(start.y + dy); slot.w = Math.round(start.w - dx); slot.h = Math.round(start.h - dy); }
          else if (h === "tc") { slot.y = Math.round(start.y + dy); slot.h = Math.round(start.h - dy); }
          else if (h === "tr") { slot.y = Math.round(start.y + dy); slot.w = Math.round(start.w + dx); slot.h = Math.round(start.h - dy); }
          else if (h === "ml") { slot.x = Math.round(start.x + dx); slot.w = Math.round(start.w - dx); }
          else if (h === "mr") { slot.w = Math.round(start.w + dx); }
          else if (h === "bl") { slot.x = Math.round(start.x + dx); slot.w = Math.round(start.w - dx); slot.h = Math.round(start.h + dy); }
          else if (h === "bc") { slot.h = Math.round(start.h + dy); }
          else if (h === "br") { slot.w = Math.round(start.w + dx); slot.h = Math.round(start.h + dy); }
          const clamped = clampRectSlot(slot, dw, dh);
          if (ds.slotId === "portraitUnderlay") {
            return { ...prev, portraitUnderlay: clamped };
          }
          return { ...prev, slots: { ...s, [ds.slotId as keyof typeof s]: clamped } };
        });
      }
    };

    const onUp = () => {
      dragRef.current = { phase: "idle" };
      setDragState({ phase: "idle" });
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
  }, [dw, dh, getCardSize, onUpdateConfig]);

  /* ─── Render helpers ──────────────────────────────── */

  const isSelected = (id: SlotId) => selectedSlot === id;
  const isDragging = (id: SlotId) =>
    dragState.phase !== "idle" && dragState.slotId === id;

  function rectStyle(slot: TemplateSlot): React.CSSProperties {
    return {
      position: "absolute",
      left: px(slot.x, dw),
      top: py(slot.y, dh),
      width: pw(slot.w, dw),
      height: ph(slot.h, dh),
    };
  }

  function insetRectStyle(outer: TemplateSlot, inset: SlotInset): React.CSSProperties {
    return {
      position: "absolute",
      left: px(outer.x + inset.left, dw),
      top: py(outer.y + inset.top, dh),
      width: pw(outer.w - inset.left - inset.right, dw),
      height: ph(outer.h - inset.top - inset.bottom, dh),
    };
  }

  function circleBoundsStyle(slot: TemplateCircleSlot): React.CSSProperties {
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

  function handleStyle(
    leftPct: string, topPct: string,
  ): React.CSSProperties {
    const sizePct = pw(HANDLE_SIZE_DESIGN, dw);
    return {
      position: "absolute",
      left: `calc(${leftPct} - ${sizePct}/2)`,
      top: `calc(${topPct} - ${sizePct}/2)`,
      width: sizePct,
      height: sizePct,
      background: "#fff",
      border: "2px solid #000",
      borderRadius: "2px",
      cursor: "pointer",
      zIndex: 110,
      touchAction: "none",
    };
  }

  function renderRectSlot(
    slotId: SlotId,
    slot: TemplateSlot,
    color: string,
    label: string,
    extra?: { innerSlot?: TemplateSlot; innerLabel?: string; innerDashed?: boolean },
  ) {
    const sel = isSelected(slotId);
    const d = isDragging(slotId);
    const dims = `${formatCoord(slot.x)} ${formatCoord(slot.y)} ${formatCoord(slot.w)}×${formatCoord(slot.h)}`;

    return (
      <div key={slotId}>
        {/* Box */}
        <div
          style={{
            ...rectStyle(slot),
            border: `${sel ? 3 : 2}px solid ${color}`,
            backgroundColor: color.replace("1)", d ? "0.18)" : "0.06)"),
            pointerEvents: "auto",
            cursor: d ? "grabbing" : "grab",
            zIndex: sel ? 105 : 101,
            touchAction: "none",
          }}
          onPointerDown={(e) => onPointerDown(e, slotId)}
        >
          <span style={{
            fontSize: fs(34, dw),
            color,
            background: "rgba(0,0,0,0.75)",
            padding: "0 4px",
            lineHeight: 1.3,
            whiteSpace: "nowrap",
            borderRadius: "2px",
            pointerEvents: "none",
          }}>
            {label} {dims}
          </span>
        </div>

        {/* Inner box (padding/inset) */}
        {extra?.innerSlot && (
          <div
            style={{
              ...rectStyle(extra.innerSlot),
              border: `2px ${extra.innerDashed ? "dashed" : "solid"} ${color.replace("1)", "0.5)")}`,
              pointerEvents: "none",
              zIndex: 102,
            }}
          >
            {extra.innerLabel && (
              <span style={{
                fontSize: fs(28, dw),
                color: color.replace("1)", "0.7)"),
                background: "rgba(0,0,0,0.6)",
                padding: "0 3px",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                borderRadius: "2px",
                pointerEvents: "none",
              }}>
                {extra.innerLabel}
              </span>
            )}
          </div>
        )}

        {/* Resize handles (only when selected) */}
        {sel && (
          <>
            {(["tl","tc","tr","ml","mr","bl","bc","br"] as HandlePos[]).map((h) => {
              let leftPct = "0%", topPct = "0%";
              if (h === "tl" || h === "ml" || h === "bl") leftPct = px(slot.x, dw);
              if (h === "tc" || h === "bc") leftPct = px(slot.x + slot.w / 2, dw);
              if (h === "tr" || h === "mr" || h === "br") leftPct = px(slot.x + slot.w, dw);
              if (h === "tl" || h === "tc" || h === "tr") topPct = py(slot.y, dh);
              if (h === "ml" || h === "mr") topPct = py(slot.y + slot.h / 2, dh);
              if (h === "bl" || h === "bc" || h === "br") topPct = py(slot.y + slot.h, dh);
              return (
                <div key={h} style={handleStyle(leftPct, topPct)}
                  onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e, slotId, h); }}
                />
              );
            })}
          </>
        )}
      </div>
    );
  }

  function renderCircleSlot(
    idx: number,
    slot: TemplateCircleSlot,
    color: string,
    label: string,
  ) {
    const slotId: SlotId = `footerCircle_${idx}`;
    const sel = isSelected(slotId);
    const d = isDragging(slotId);
    const bounds = circleBoundsStyle(slot);

    return (
      <div key={slotId}>
        {/* Circle box */}
        <div
          style={{
            ...bounds,
            border: `${sel ? 3 : 2}px solid ${color}`,
            backgroundColor: color.replace("1)", d ? "0.18)" : "0.06)"),
            pointerEvents: "auto",
            cursor: d ? "grabbing" : "grab",
            zIndex: sel ? 105 : 101,
            touchAction: "none",
          }}
          onPointerDown={(e) => onPointerDown(e, slotId)}
        >
          <span style={{
            fontSize: fs(28, dw),
            color,
            background: "rgba(0,0,0,0.75)",
            padding: "0 4px",
            lineHeight: 1.3,
            whiteSpace: "nowrap",
            borderRadius: "2px",
            pointerEvents: "none",
          }}>
            {label} c({formatCoord(slot.cx)},{formatCoord(slot.cy)}) ø{formatCoord(slot.diameter)}
          </span>
        </div>
        {/* Center dot */}
        {sel && (
          <div
            style={{
              position: "absolute",
              left: px(slot.cx, dw),
              top: py(slot.cy, dh),
              width: pw(12, dw),
              height: ph(12, dh),
              borderRadius: "50%",
              backgroundColor: "#fff",
              border: "2px solid #000",
              transform: "translate(-50%, -50%)",
              zIndex: 106,
              pointerEvents: "auto",
              cursor: "grab",
              touchAction: "none",
            }}
            onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e, slotId); }}
          />
        )}
        {/* Diameter handle */}
        {sel && (
          <div
            style={handleStyle(px(slot.cx + slot.diameter / 2, dw), py(slot.cy, dh))}
            onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e, slotId, "mr"); }}
          />
        )}
      </div>
    );
  }

  /* ─── Main render ─────────────────────────────────── */

  const nameInner = {
    x: slots.name.x + slots.name.padding.left,
    y: slots.name.y + slots.name.padding.top,
    w: slots.name.w - slots.name.padding.left - slots.name.padding.right,
    h: slots.name.h - slots.name.padding.top - slots.name.padding.bottom,
  };

  const info1Inner = {
    x: slots.info1.x + slots.info1.padding.left,
    y: slots.info1.y + slots.info1.padding.top,
    w: slots.info1.w - slots.info1.padding.left - slots.info1.padding.right,
    h: slots.info1.h - slots.info1.padding.top - slots.info1.padding.bottom,
  };

  const info2Inner = {
    x: slots.info2.x + slots.info2.padding.left,
    y: slots.info2.y + slots.info2.padding.top,
    w: slots.info2.w - slots.info2.padding.left - slots.info2.padding.right,
    h: slots.info2.h - slots.info2.padding.top - slots.info2.padding.bottom,
  };

  const bioInner = {
    x: slots.bio.x + slots.bio.padding.left,
    y: slots.bio.y + slots.bio.padding.top,
    w: slots.bio.w - slots.bio.padding.left - slots.bio.padding.right,
    h: slots.bio.h - slots.bio.padding.top - slots.bio.padding.bottom,
  };

  const portraitInner = {
    x: slots.portrait.x + slots.portraitInset.left,
    y: slots.portrait.y + slots.portraitInset.top,
    w: slots.portrait.w - slots.portraitInset.left - slots.portraitInset.right,
    h: slots.portrait.h - slots.portraitInset.top - slots.portraitInset.bottom,
  };

  const uly = config.portraitUnderlay ?? slots.portrait;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      {/* Name — with padding inner box */}
      {renderRectSlot("name", slots.name, getSlotColor("name"), "name", {
        innerSlot: nameInner,
        innerLabel: "name_pad",
        innerDashed: true,
      })}

      {/* Badge */}
      {renderRectSlot("badge", slots.badge, getSlotColor("badge"), "badge")}

      {/* Portrait outer */}
      {renderRectSlot("portrait", slots.portrait, getSlotColor("portrait"), "portrait", {
        innerSlot: portraitInner,
        innerLabel: "clip",
        innerDashed: true,
      })}

      {/* Portrait inset — separate selectable */}
      {(() => {
        const sel = isSelected("portraitInset");
        const color = getSlotColor("portraitInset");
        const r = insetRectStyle(slots.portrait, slots.portraitInset);
        return (
          <div key="portraitInset">
            <div
              style={{
                ...r,
                border: `${sel ? 3 : 2}px dashed ${color}`,
                backgroundColor: color.replace("0.8)", "0.06)"),
                pointerEvents: "auto",
                cursor: sel ? "move" : "pointer",
                zIndex: sel ? 105 : 101,
                touchAction: "none",
              }}
              onPointerDown={(e) => onPointerDown(e, "portraitInset")}
            >
              <span style={{
                fontSize: fs(28, dw),
                color,
                background: "rgba(0,0,0,0.75)",
                padding: "0 4px",
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                borderRadius: "2px",
                pointerEvents: "none",
              }}>
                inset t{formatCoord(slots.portraitInset.top)} r{formatCoord(slots.portraitInset.right)} b{formatCoord(slots.portraitInset.bottom)} l{formatCoord(slots.portraitInset.left)}
              </span>
            </div>
            {/* Inset handles */}
            {sel && (
              <>
                {(["tl","tc","tr","ml","mr","bl","bc","br"] as HandlePos[]).map((h) => {
                  const outer = slots.portrait;
                  const ins = slots.portraitInset;
                  const innerX = outer.x + ins.left;
                  const innerY = outer.y + ins.top;
                  const innerW = outer.w - ins.left - ins.right;
                  const innerH = outer.h - ins.top - ins.bottom;
                  let leftPct = "0%", topPct = "0%";
                  if (h === "tl" || h === "ml" || h === "bl") leftPct = px(innerX, dw);
                  if (h === "tc" || h === "bc") leftPct = px(innerX + innerW / 2, dw);
                  if (h === "tr" || h === "mr" || h === "br") leftPct = px(innerX + innerW, dw);
                  if (h === "tl" || h === "tc" || h === "tr") topPct = py(innerY, dh);
                  if (h === "ml" || h === "mr") topPct = py(innerY + innerH / 2, dh);
                  if (h === "bl" || h === "bc" || h === "br") topPct = py(innerY + innerH, dh);
                  return (
                    <div key={"inset-" + h} style={handleStyle(leftPct, topPct)}
                      onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e, "portraitInset", h); }}
                    />
                  );
                })}
              </>
            )}
          </div>
        );
      })()}

      {/* Portrait underlay (cutout mode only) */}
      {isCutout && renderRectSlot("portraitUnderlay", uly, getSlotColor("portraitUnderlay"), "underlay")}

      {/* Info1 */}
      {renderRectSlot("info1", slots.info1, getSlotColor("info1"), "info1", {
        innerSlot: info1Inner,
        innerLabel: "info1_pad",
        innerDashed: true,
      })}

      {/* Info2 */}
      {renderRectSlot("info2", slots.info2, getSlotColor("info2"), "info2", {
        innerSlot: info2Inner,
        innerLabel: "info2_pad",
        innerDashed: true,
      })}

      {/* Bio */}
      {renderRectSlot("bio", slots.bio, getSlotColor("bio"), "bio", {
        innerSlot: bioInner,
        innerLabel: "bio_pad",
        innerDashed: true,
      })}

      {/* Footer circles */}
      {slots.footerCircles.map((c, i) =>
        renderCircleSlot(i, c, getSlotColor(`footerCircle_${i}`), `c${i + 1}`),
      )}

      {/* Click on empty space to deselect */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 99,
          pointerEvents: "auto",
        }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) onSelectSlot(null);
        }}
      />
    </div>
  );
}
