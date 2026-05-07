import type { TemplateRenderModel, TemplateStatItem } from "@/lib/cardTemplateTypes";
import type { AtlasCard, CategoryId } from "@/lib/types";
import { getCategoryEmoji } from "@/lib/emoji-icons";

export type MockAtlasData = {
  fantasyName: string;
  realName: string;
  category: string;
  categoryIcon: string;
  styleSource: string;
  croppedImageUrl: string;
  infoFacts: Array<{ label: string; value: string }>;
  stats: Array<{ label: string; value: string; score?: number }>;
  description: string;
  funFact: string;
};

/* ─── Content length guards ───────────────────────────── */

const MAX_NAME_CHARS = 12;
const MAX_BIO_CHARS = 130;
const MAX_INFO1_CHARS = 28;

function clampName(text: string): string {
  if (text.length <= MAX_NAME_CHARS) return text;
  return text.slice(0, MAX_NAME_CHARS);
}

function clampBio(text: string): string {
  if (text.length <= MAX_BIO_CHARS) return text;
  return text.slice(0, MAX_BIO_CHARS - 1) + "…";
}

function clampInfoLine1(facts: Array<{ label: string; value: string }>): string {
  // Try with all facts
  const all = facts
    .map((f) => `${f.label}：${f.value}`)
    .join("　");

  if (all.length <= MAX_INFO1_CHARS) return all;

  // Retry with 2 facts
  const two = facts.slice(0, 2)
    .map((f) => `${f.label}：${f.value}`)
    .join("　");

  if (two.length <= MAX_INFO1_CHARS) return two;

  // Still too long: truncate each value
  const trimmed = facts.slice(0, 2).map((f) => {
    const shortVal = f.value.length > 6 ? f.value.slice(0, 6) : f.value;
    return `${f.label}：${shortVal}`;
  }).join("　");

  if (trimmed.length <= MAX_INFO1_CHARS) return trimmed;

  // Last resort: just 1 fact
  const one = `${facts[0].label}：${facts[0].value.slice(0, 6)}`;
  return one.length <= MAX_INFO1_CHARS ? one : one.slice(0, MAX_INFO1_CHARS - 1) + "…";
}

function clampStatItems(items: TemplateStatItem[]): TemplateStatItem[] {
  return items.slice(0, 2).map((s) => ({
    label: s.label.length > 5 ? s.label.slice(0, 5) : s.label,
    value: s.value.length > 8 ? s.value.slice(0, 8) : s.value,
    score: s.score != null ? Math.min(100, Math.max(0, s.score)) : undefined,
  }));
}

/* ─── Helpers ─────────────────────────────────────────── */

function stripFunFactPrefix(text: string): string {
  const prefixes = ["小知识：", "小知识:", "小知识 "];
  for (const p of prefixes) {
    if (text.startsWith(p)) return text.slice(p.length);
  }
  return text;
}

export function mapToTemplateModel(data: MockAtlasData): TemplateRenderModel {
  const cleanFunFact = stripFunFactPrefix(data.funFact);

  const statItems: TemplateStatItem[] = data.stats.map((s) => ({
    label: s.label,
    value: s.value,
    score: s.score,
  }));

  return {
    nameText: clampName(data.fantasyName),
    badgeText: data.category,
    badgeIcon: data.categoryIcon || undefined,
    portraitImageUrl: data.croppedImageUrl,
    infoLine1: clampInfoLine1(data.infoFacts),
    statItems: clampStatItems(statItems),
    bioText: clampBio(`${data.description}\n小知识：${cleanFunFact}`),
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

/* ─── AtlasCard → TemplateRenderModel ─────────────────── */

function generateFallbackFacts(
  category: string,
  realName: string,
  stats: AtlasCard["stats"],
): Array<{ label: string; value: string }> {
  const textStat = stats.find((s) => s.type === "text");
  const fallback: Array<{ label: string; value: string }> = [];

  if (realName) {
    fallback.push({ label: "品类", value: realName.length <= 6 ? realName : realName.slice(0, 6) });
  }
  if (category) {
    fallback.push({ label: "类别", value: category.length <= 6 ? category : category.slice(0, 6) });
  }
  if (textStat) {
    fallback.push({ label: textStat.label, value: textStat.value.length <= 8 ? textStat.value : textStat.value.slice(0, 8) });
  }

  if (fallback.length < 2 && stats.length > 0) {
    const firstNum = stats.find((s) => s.type === "numeric");
    if (firstNum) {
      fallback.push({ label: firstNum.label, value: firstNum.value });
    }
  }

  return fallback.slice(0, 3);
}

const FOOTER_ICON_SETS: Record<string, string[]> = {
  _default: ["🍓", "🌱", "☀️", "💧", "⭐", "🧺"],
  水果: ["🍓", "🍎", "🍊", "🍇", "🍑", "🍒"],
  蔬菜: ["🥬", "🥕", "🌽", "🍅", "🧅", "🥒"],
  矿物: ["💎", "⛏", "🪨", "✨", "🔮", "⚡"],
  宝石: ["💎", "✨", "🔮", "👑", "⭐", "💍"],
  岩石: ["🪨", "⛰", "🏔", "⚒", "🔨", "💪"],
  金属: ["⚙", "🔩", "🪙", "⚡", "🔧", "🏭"],
  鱼类: ["🐟", "🌊", "🐠", "🎣", "💧", "🫧"],
  鸟类: ["🐦", "🪶", "🌿", "☀️", "🪽", "🪹"],
  树木: ["🌳", "🍃", "🪵", "🌿", "☀️", "💧"],
  花卉: ["🌸", "🌺", "🌼", "🌻", "💐", "🌿"],
  建筑物: ["🏛", "🧱", "🪨", "📐", "🏗", "🪟"],
  昆虫: ["🐛", "🦋", "🍃", "🌿", "🌱", "✨"],
  服饰: ["👗", "🧵", "🪡", "✂", "🎀", "👒"],
  工具: ["🔧", "🔨", "🪛", "⚒", "🧰", "🛠"],
};

function pickFooterIcons(category: string): string[] {
  return FOOTER_ICON_SETS[category] ?? FOOTER_ICON_SETS._default;
}

export function mapAtlasCardToTemplateModel(
  card: AtlasCard,
): TemplateRenderModel {
  const facts = card.facts && card.facts.length >= 2
    ? card.facts
    : generateFallbackFacts(card.category, card.originalObjectName, card.stats);

  const cleanFunFact = stripFunFactPrefix(card.funFact);
  const catEmoji = getCategoryEmoji(card.category as CategoryId, "game");
  const footerIcons = pickFooterIcons(card.category);

  const statItems: TemplateStatItem[] = card.stats.map((s) => ({
    label: s.label,
    value: s.value,
    score: s.type === "numeric" ? s.score : undefined,
  }));

  return {
    nameText: clampName(card.fantasyName),
    badgeText: card.category,
    badgeIcon: catEmoji || undefined,
    portraitImageUrl: card.croppedImageUrl || card.imageUrl || "",
    infoLine1: clampInfoLine1(facts),
    statItems: clampStatItems(statItems),
    bioText: clampBio(`${card.description}\n小知识：${cleanFunFact}`),
    footerIcons: footerIcons.map((icon) => ({ icon })),
  };
}
