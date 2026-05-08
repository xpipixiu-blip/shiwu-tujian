import type { TemplateConfig } from "@/lib/cardTemplateTypes";
import type { CardPreset } from "@/lib/types";
import { farmTemplateConfig } from "@/lib/farmTemplateConfig";
import { museumTemplateConfig } from "@/lib/museumTemplateConfig";
import { rainbowTemplateConfig } from "@/lib/rainbowTemplateConfig";
import { sleekTemplateConfig } from "@/lib/sleekTemplateConfig";
import { farmTemplateCutoutConfig } from "@/lib/farmTemplateCutoutConfig";
import { museumTemplateCutoutConfig } from "@/lib/museumTemplateCutoutConfig";
import { rainbowTemplateCutoutConfig } from "@/lib/rainbowTemplateCutoutConfig";
import { sleekTemplateCutoutConfig } from "@/lib/sleekTemplateCutoutConfig";

export { farmTemplateConfig } from "@/lib/farmTemplateConfig";
export { museumTemplateConfig } from "@/lib/museumTemplateConfig";
export { rainbowTemplateConfig } from "@/lib/rainbowTemplateConfig";
export { sleekTemplateConfig } from "@/lib/sleekTemplateConfig";
export { farmTemplateCutoutConfig } from "@/lib/farmTemplateCutoutConfig";
export { museumTemplateCutoutConfig } from "@/lib/museumTemplateCutoutConfig";
export { rainbowTemplateCutoutConfig } from "@/lib/rainbowTemplateCutoutConfig";
export { sleekTemplateCutoutConfig } from "@/lib/sleekTemplateCutoutConfig";

const registry: Partial<Record<CardPreset, TemplateConfig>> = {
  "farm-template": farmTemplateConfig,
  "museum-card": museumTemplateConfig,
  "rainbow-card": rainbowTemplateConfig,
  "sleek-card": sleekTemplateConfig,
  "farm-template-cutout": farmTemplateCutoutConfig,
  "museum-template-cutout": museumTemplateCutoutConfig,
  "rainbow-template-cutout": rainbowTemplateCutoutConfig,
  "sleek-template-cutout": sleekTemplateCutoutConfig,
};

export function getTemplateConfig(preset: CardPreset): TemplateConfig | null {
  return registry[preset] ?? null;
}
