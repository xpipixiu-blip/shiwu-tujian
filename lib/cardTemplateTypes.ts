export type TemplateSlot = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type TemplateCircleSlot = {
  cx: number;
  cy: number;
  diameter: number;
};

export type SlotInset = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type SlotTypography = {
  fontSize: number;
  lineHeight: number;
  color: string;
  fontWeight?: number | string;
};

export type TemplateStatItem = {
  label: string;
  value: string | number;
  unit?: string;
  score?: number; // 0-100，进度条百分比
};

export type TemplateRenderModel = {
  nameText: string;
  badgeText: string;
  badgeIcon?: string;
  portraitImageUrl: string;
  infoLine1: string;
  statItems: TemplateStatItem[];
  bioText: string;
  footerIcons: Array<{ icon: string }>;
};

export type DebugMode = "full" | "slots-only";

export type TemplateConfig = {
  id: string;
  label: string;
  designWidth: number;
  designHeight: number;
  backgroundImage: string;
  backgroundImagePreview?: string;
  backgroundImageExport?: string;

  typography: {
    name: SlotTypography;
    badgeIcon: { fontSize: number };
    badgeText: SlotTypography;
    info1: SlotTypography;
    info2: SlotTypography;
    statBar: {
      height: number;
      trackColor: string;
      highColor: string;
      midColor: string;
      lowColor: string;
      labelColor: string;
      valueColor: string;
    };
    bio: SlotTypography;
    footerIcon: { fontSize: number };
  };

  slots: {
    name: TemplateSlot & { padding: SlotInset };
    badge: TemplateSlot;
    portrait: TemplateSlot;
    portraitInset: SlotInset;
    info1: TemplateSlot & { padding: SlotInset };
    info2: TemplateSlot & { padding: SlotInset };
    bio: TemplateSlot & { padding: SlotInset };
    footerCircles: TemplateCircleSlot[];
  };
};
