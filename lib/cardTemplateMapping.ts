import type { TemplateRenderModel } from "@/lib/cardTemplateTypes";

export type MockAtlasData = {
  fantasyName: string;
  realName: string;
  category: string;
  categoryIcon: string;
  styleSource: string;
  croppedImageUrl: string;
  infoFacts: Array<{ label: string; value: string }>;
  stats: Array<{ label: string; value: string }>;
  description: string;
  funFact: string;
};

function stripFunFactPrefix(text: string): string {
  const prefixes = ["小知识：", "小知识:", "小知识 "];
  for (const p of prefixes) {
    if (text.startsWith(p)) return text.slice(p.length);
  }
  return text;
}

export function mapToTemplateModel(data: MockAtlasData): TemplateRenderModel {
  const cleanFunFact = stripFunFactPrefix(data.funFact);

  return {
    nameText: data.fantasyName,
    badgeText: data.category,
    badgeIcon: data.categoryIcon || undefined,
    portraitImageUrl: data.croppedImageUrl,
    infoLine1: data.infoFacts
      .map((f) => `${f.label}：${f.value}`)
      .join("　"),
    infoLine2: data.stats
      .map((s) => `${s.label} ${s.value}`)
      .join("　"),
    bioText: `${data.description}\n小知识：${cleanFunFact}`,
    footerIcons: [
      { icon: "🍓" },
      { icon: "🌱" },
      { icon: "☀️" },
      { icon: "💧" },
      { icon: "⭐" },
      { icon: "🧺" },
    ],
  };
}
