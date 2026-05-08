import type { TemplateConfig } from "@/lib/cardTemplateTypes";

export const farmTemplateCutoutConfig: TemplateConfig = {
  id: "farm-card-cutout-v1",
  label: "像素农场风 · 透卡版",
  designWidth: 3000,
  designHeight: 4000,
  backgroundImage: "/templates/farm-card-v1.preview.webp",
  backgroundImagePreview: "/templates/farm-card-v1.preview.webp",
  backgroundImageExport: "/templates/farm-card-v1.png",
  templateMode: "cutoutOverlay",
  overlayImage: "/templates/NEW-farm-card-v1.webp",

  portraitUnderlay: {
    x: 220,
    y: 958,
    w: 2775,
    h: 2400,
    inset: { top: 0, right: 0, bottom: 0, left: 0 },
  },

  typography: {
    name: { fontSize: 210, lineHeight: 1.15, color: "#3b2a1a", fontWeight: 700 },
    badgeIcon: { fontSize: 290 },
    badgeText: { fontSize: 72, lineHeight: 1.2, color: "#4a3020", fontWeight: 600 },
    info1: { fontSize: 90, lineHeight: 1.25, color: "#4a3020", fontWeight: 400 },
    info2: { fontSize: 96, lineHeight: 1.25, color: "#4a3020", fontWeight: 400 },
    statBar: {
      height: 28,
      trackColor: "rgba(139,107,90,0.18)",
      highColor: "#7a5038",
      midColor: "#8c6045",
      lowColor: "#a07050",
      labelColor: "#4a3020",
      valueColor: "#3b2a1a",
    },
    bio: { fontSize: 88, lineHeight: 1.6, color: "#3b2a1a", fontWeight: 600 },
    footerIcon: { fontSize: 160 },
  },

  slots: {
    name: { x: 380, y: 460, w: 1520, h: 320, padding: { top: 0, right: 40, bottom: 0, left: 40 } },
    badge: { x: 2160, y: 320, w: 440, h: 440 },
    portrait: { x: 220, y: 958, w: 2775, h: 2400 },
    portraitInset: { top: 44, right: 44, bottom: 44, left: 44 },
    info1: { x: 280, y: 2420, w: 2400, h: 250, padding: { top: 0, right: 36, bottom: 0, left: 36 } },
    info2: { x: 420, y: 2650, w: 2300, h: 250, padding: { top: 0, right: 36, bottom: 0, left: 36 } },
    bio: { x: 340, y: 2950, w: 2320, h: 550, padding: { top: 20, right: 40, bottom: 16, left: 40 } },
    footerCircles: [
      { cx: 530, cy: 3730, diameter: 280 },
      { cx: 857, cy: 3730, diameter: 280 },
      { cx: 1190, cy: 3730, diameter: 280 },
      { cx: 1700, cy: 3730, diameter: 280 },
      { cx: 2030, cy: 3730, diameter: 280 },
      { cx: 2362, cy: 3730, diameter: 280 },
    ],
  },
};
