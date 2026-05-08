import type { TemplateConfig } from "@/lib/cardTemplateTypes";

export const rainbowTemplateCutoutConfig: TemplateConfig = {
  id: "rainbow-card-cutout-v1",
  label: "彩虹稀有风 · 透卡版",
  designWidth: 3000,
  designHeight: 4000,
  backgroundImage: "/templates/rainbow-card-v1.preview.webp",
  backgroundImagePreview: "/templates/rainbow-card-v1.preview.webp",
  backgroundImageExport: "/templates/rainbow-card-v1.png",
  templateMode: "cutoutOverlay",
  overlayImage: "/templates/NEW-rainbow-card-v1.webp",

  portraitUnderlay: {
    x: 220,
    y: 825,
    w: 2755,
    h: 2580,
    inset: { top: 0, right: 0, bottom: 0, left: 0 },
  },

  typography: {
    name: { fontSize: 210, lineHeight: 1.15, color: "#1e1228", fontWeight: 700 },
    badgeIcon: { fontSize: 290 },
    badgeText: { fontSize: 72, lineHeight: 1.2, color: "#2a1a3a", fontWeight: 600 },
    info1: { fontSize: 90, lineHeight: 1.25, color: "#2a1a3a", fontWeight: 400 },
    info2: { fontSize: 96, lineHeight: 1.25, color: "#2a1a3a", fontWeight: 400 },
    statBar: {
      height: 28,
      trackColor: "rgba(180,130,60,0.12)",
      highColor: "#c8a050",
      midColor: "#c06090",
      lowColor: "#6090c0",
      labelColor: "#2a1a3a",
      valueColor: "#1e1228",
    },
    bio: { fontSize: 78, lineHeight: 1.6, color: "#1e1228", fontWeight: 600 },
    footerIcon: { fontSize: 160 },
  },

  slots: {
    name: { x: 380, y: 360, w: 1520, h: 320, padding: { top: 0, right: 40, bottom: 0, left: 40 } },
    badge: { x: 2310, y: 320, w: 480, h: 480 },
    portrait: { x: 220, y: 825, w: 2755, h: 2580 },
    portraitInset: { top: 44, right: 44, bottom: 44, left: 44 },
    info1: { x: 280, y: 2490, w: 2400, h: 250, padding: { top: 0, right: 36, bottom: 0, left: 36 } },
    info2: { x: 350, y: 2720, w: 2320, h: 250, padding: { top: 0, right: 36, bottom: 0, left: 36 } },
    bio: { x: 340, y: 3050, w: 2320, h: 550, padding: { top: 20, right: 40, bottom: 16, left: 40 } },
    footerCircles: [
      { cx: 465, cy: 3785, diameter: 220 },
      { cx: 775, cy: 3785, diameter: 220 },
      { cx: 1085, cy: 3785, diameter: 220 },
      { cx: 1920, cy: 3785, diameter: 220 },
      { cx: 2230, cy: 3785, diameter: 220 },
      { cx: 2532, cy: 3785, diameter: 220 },
    ],
  },
};
