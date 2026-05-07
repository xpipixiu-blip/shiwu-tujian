import type { TemplateConfig } from "@/lib/cardTemplateTypes";

export const farmTemplateConfig: TemplateConfig = {
  id: "farm-card-v1",
  label: "像素农场风卡面",
  designWidth: 3000,
  designHeight: 4000,
  backgroundImage: "/templates/farm-card-v1.png",

  /* ═══════════════════════════════════════════════════════
     Typography — all font sizes in design coordinates.
     Rendered as (fontSize / designWidth * 100) cqi.
     ═══════════════════════════════════════════════════════ */
  typography: {
    name: {
      fontSize: 210,
      lineHeight: 1.15,
      color: "#3b2a1a",
      fontWeight: 700,
    },
    badgeIcon: {
      fontSize: 290,
    },
    badgeText: {
      fontSize: 102,
      lineHeight: 1.2,
      color: "#4a3020",
      fontWeight: 600,
    },
    info1: {
      fontSize: 96,
      lineHeight: 1.25,
      color: "#4a3020",
      fontWeight: 400,
    },
    info2: {
      fontSize: 90,
      lineHeight: 1.25,
      color: "#4a3020",
      fontWeight: 400,
    },
    bio: {
      fontSize: 88,
      lineHeight: 1.6,
      color: "#3b2a1a",
      fontWeight: 600,
    },
    footerIcon: {
      fontSize: 160,
    },
  },

  /* ═══════════════════════════════════════════════════════
     Slots — recalibrated against the actual template image.
     All values in design coordinates (3000 × 4000).
     ═══════════════════════════════════════════════════════ */
  slots: {
    /* ── name_box ────────────────────────────────────────
       Moved down and taller vs v1 to fix upward shift.
       Padding keeps text off the box edges.
       Displays ONLY fantasyName (single line, centered).
    */
    name: {
      x: 380,
      y: 460,
      w: 1520,
      h: 320,
      padding: { top: 0, right: 40, bottom: 0, left: 40 },
    },

    /* ── badge_circle ───────────────────────────────────
       Slightly tightened from v1.
    */
    badge: {
      x: 2160,
      y: 320,
      w: 440,
      h: 440,
    },

    /* ── portrait_box ───────────────────────────────────
       Tightened to match the template's actual image well.
       portraitInset defines the inner clip container
       where user photos will be placed.
    */
    portrait: {
      x: 260,
      y: 975,
      w: 2500,
      h: 1400,
    },
    portraitInset: {
      top: 44,
      right: 44,
      bottom: 44,
      left: 44,
    },

    /* ── info_box_1 ─────────────────────────────────────
       Category / prototype / style — single line.
    */
    info1: {
      x: 280,
      y: 2420,
      w: 2400,
      h: 250,
      padding: { top: 0, right: 36, bottom: 0, left: 36 },
    },

    /* ── info_box_2 ─────────────────────────────────────
       Stats — single line.
    */
    info2: {
      x: 280,
      y: 2650,
      w: 2400,
      h: 250,
      padding: { top: 0, right: 36, bottom: 0, left: 36 },
    },

    /* ── bio_box ────────────────────────────────────────
       Description + funFact. Multi-line body text.
       Narrower than v1 to stay inside template borders.
       Larger font, comfortable line-height.
    */
    bio: {
      x: 340,
      y: 3000,
      w: 2320,
      h: 450,
      padding: { top: 20, right: 40, bottom: 16, left: 40 },
    },

    /* ── footer circles ─────────────────────────────────
       Six decorative icon circles at the card bottom.
       Recalibrated: moved up, larger, spread wider apart
       to fix "too low / too close to center axis".
    */
    footerCircles: [
      { cx: 530, cy: 3730, diameter:280 },
      { cx: 857, cy: 3730, diameter: 280 },
      { cx: 1190, cy: 3730, diameter: 280 },
      { cx: 1700, cy: 3730, diameter: 280 },
      { cx: 2030, cy: 3730, diameter: 280 },
      { cx: 2362, cy: 3730, diameter: 280 },
    ],
  },
};
