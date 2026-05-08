import type { TemplateSlot, TemplateCircleSlot } from "@/lib/cardTemplateTypes";

export type CardPixelBounds = { width: number; height: number };

export function getCardPixelBounds(cardEl: HTMLElement): CardPixelBounds {
  const rect = cardEl.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}

export function toDesignCoords(
  pixelX: number, pixelY: number,
  designW: number, designH: number,
  cardW: number, cardH: number,
): { x: number; y: number } {
  return {
    x: (pixelX / cardW) * designW,
    y: (pixelY / cardH) * designH,
  };
}

export function toDesignDelta(
  pixelDX: number, pixelDY: number,
  designW: number, designH: number,
  cardW: number, cardH: number,
): { dx: number; dy: number } {
  return {
    dx: (pixelDX / cardW) * designW,
    dy: (pixelDY / cardH) * designH,
  };
}

export function clampValue(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function clampRectSlot(
  slot: TemplateSlot,
  designW: number,
  designH: number,
  minSize = 20,
): TemplateSlot {
  return {
    x: clampValue(slot.x, 0, designW - minSize),
    y: clampValue(slot.y, 0, designH - minSize),
    w: clampValue(slot.w, minSize, designW - slot.x),
    h: clampValue(slot.h, minSize, designH - slot.y),
  };
}

export function clampCircleSlot(
  slot: TemplateCircleSlot,
  designW: number,
  designH: number,
  minDiameter = 20,
): TemplateCircleSlot {
  const r = slot.diameter / 2;
  return {
    cx: clampValue(slot.cx, r, designW - r),
    cy: clampValue(slot.cy, r, designH - r),
    diameter: clampValue(slot.diameter, minDiameter, Math.min(designW, designH)),
  };
}
