import type { TemplateConfig } from "@/lib/cardTemplateTypes";

export const museumTemplateCutoutConfig: TemplateConfig = {
  id: "museum-card-cutout-v1",
  label: "古董图鉴风 · 透卡版",
  designWidth: 3000,
  designHeight: 4000,
  backgroundImage: "/templates/museum-card-v1.preview.webp",
  backgroundImagePreview: "/templates/museum-card-v1.preview.webp",
  backgroundImageExport: "/templates/museum-card-v1.png",
  templateMode: "cutoutOverlay",
  overlayImage: "/templates/NEW-museum-card-v1.webp",

  portraitUnderlay: {
    x: 220,
    y: 942,
    w: 2775,
    h: 2345,
    inset: { top: 0, right: 0, bottom: 0, left: 0 },
  },

  typography: {
    name: { fontSize: 210, lineHeight: 1.15, color: "#2c1a0e", fontWeight: 700 },
    badgeIcon: { fontSize: 290 },
    badgeText: { fontSize: 72, lineHeight: 1.2, color: "#3b2515", fontWeight: 600 },
    info1: { fontSize: 90, lineHeight: 1.25, color: "#3b2515", fontWeight: 400 },
    info2: { fontSize: 96, lineHeight: 1.25, color: "#3b2515", fontWeight: 400 },
    statBar: {
      height: 28,
      trackColor: "rgba(139,105,20,0.15)",
      highColor: "#8b6914",
      midColor: "#a07818",
      lowColor: "#b8960a",
      labelColor: "#3b2515",
      valueColor: "#2c1a0e",
    },
    bio: { fontSize: 88, lineHeight: 1.6, color: "#2c1a0e", fontWeight: 600 },
    footerIcon: { fontSize: 160 },
  },

  slots: {
    name: { x: 380, y: 410, w: 1520, h: 320, padding: { top: 0, right: 40, bottom: 0, left: 40 } },
    badge: { x: 2160, y: 320, w: 480, h: 480 },
    portrait: { x: 220, y: 942, w: 2775, h: 2345 },
    portraitInset: { top: 44, right: 44, bottom: 44, left: 44 },
    info1: { x: 280, y: 2340, w: 2400, h: 250, padding: { top: 0, right: 36, bottom: 0, left: 36 } },
    info2: { x: 280, y: 2580, w: 2400, h: 250, padding: { top: 0, right: 36, bottom: 0, left: 36 } },
    bio: { x: 320, y: 2900, w: 2390, h: 550, padding: { top: 20, right: 40, bottom: 16, left: 40 } },
    footerCircles: [
      { cx: 620, cy: 3700, diameter: 280 },
      { cx: 955, cy: 3700, diameter: 280 },
      { cx: 1286, cy: 3700, diameter: 280 },
      { cx: 1718, cy: 3700, diameter: 280 },
      { cx: 2050, cy: 3700, diameter: 280 },
      { cx: 2382, cy: 3700, diameter: 280 },
    ],
  },
};
