import type { TemplateConfig } from "@/lib/cardTemplateTypes";

export const sleekTemplateConfig: TemplateConfig = {
  id: "sleek-card-v1",
  label: "拉丝金属风",
  designWidth: 3000,
  designHeight: 4000,
  backgroundImage: "/templates/sleek-card-v1.preview.webp",
  backgroundImagePreview: "/templates/sleek-card-v1.preview.webp",
  backgroundImageExport: "/templates/sleek-card-v1.png",

  typography: {
    name: { fontSize: 210, lineHeight: 1.15, color: "#14161a", fontWeight: 700 },
    badgeIcon: { fontSize: 290 },
    badgeText: { fontSize: 72, lineHeight: 1.2, color: "#1e2228", fontWeight: 600 },
    info1: { fontSize: 90, lineHeight: 1.25, color: "#1e2228", fontWeight: 400 },
    info2: { fontSize: 96, lineHeight: 1.25, color: "#1e2228", fontWeight: 400 },
    statBar: {
      height: 28,
      trackColor: "rgba(64,128,192,0.12)",
      highColor: "#4080c0",
      midColor: "#5090d0",
      lowColor: "#60a0e0",
      labelColor: "#1e2228",
      valueColor: "#14161a",
    },
    bio: { fontSize: 78, lineHeight: 1.6, color: "#14161a", fontWeight: 600 },
    footerIcon: { fontSize: 160 },
  },

  slots: {
    name: { x: 380, y: 380, w: 1520, h: 320, padding: { top: 0, right: 40, bottom: 0, left: 40 } },
    badge: { x: 2160, y: 320, w: 480, h: 480 },
    portrait: { x: 220, y: 858, w: 2775, h: 2480 },
    portraitInset: { top: 44, right: 44, bottom: 44, left: 44 },
    info1: { x: 280, y: 2440, w: 2400, h: 250, padding: { top: 0, right: 36, bottom: 0, left: 36 } },
    info2: { x: 320, y: 2750, w: 2400, h: 250, padding: { top: 0, right: 36, bottom: 0, left: 36 } },
    bio: { x: 300, y: 3022, w: 2400, h: 550, padding: { top: 20, right: 40, bottom: 16, left: 40 } },
    footerCircles: [
      { cx: 570, cy: 3730, diameter: 235 },
      { cx: 920, cy: 3730, diameter: 235 },
      { cx: 1260, cy: 3730, diameter: 235 },
      { cx: 1722, cy: 3730, diameter: 235 },
      { cx: 2070, cy: 3730, diameter: 235 },
      { cx: 2415, cy: 3730, diameter: 235 },
    ],
  },
};
