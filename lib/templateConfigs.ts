import type { TemplateConfig } from "@/lib/cardTemplateTypes";
import type { CardPreset } from "@/lib/types";
import { farmTemplateConfig } from "@/lib/farmTemplateConfig";
import { museumTemplateConfig } from "@/lib/museumTemplateConfig";
import { rainbowTemplateConfig } from "@/lib/rainbowTemplateConfig";
import { sleekTemplateConfig } from "@/lib/sleekTemplateConfig";

export { farmTemplateConfig } from "@/lib/farmTemplateConfig";
export { museumTemplateConfig } from "@/lib/museumTemplateConfig";
export { rainbowTemplateConfig } from "@/lib/rainbowTemplateConfig";
export { sleekTemplateConfig } from "@/lib/sleekTemplateConfig";

const registry: Partial<Record<CardPreset, TemplateConfig>> = {
  "farm-template": farmTemplateConfig,
  "museum-card": museumTemplateConfig,
  "rainbow-card": rainbowTemplateConfig,
  "sleek-card": sleekTemplateConfig,
};

export function getTemplateConfig(preset: CardPreset): TemplateConfig | null {
  return registry[preset] ?? null;
}
