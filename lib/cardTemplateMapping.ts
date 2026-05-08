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

const MAX_NAME_CHARS = 7;
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
  // Always use exactly 2 facts
  const two = facts.slice(0, 2);
  const joined = two
    .map((f) => `${f.label}：${f.value}`)
    .join("　");

  if (joined.length <= MAX_INFO1_CHARS) return joined;

  // Too long: truncate each value
  const trimmed = two.map((f) => {
    const shortVal = f.value.length > 6 ? f.value.slice(0, 6) : f.value;
    return `${f.label}：${shortVal}`;
  }).join("　");

  if (trimmed.length <= MAX_INFO1_CHARS) return trimmed;

  // Still too long: hard cap
  return trimmed.slice(0, MAX_INFO1_CHARS - 1) + "…";
}

/** Units that suggest the value IS a score/rating, not a physical measurement */
const SCORE_LIKE_UNITS = new Set(["", "分", "点", "%"]);

/** Parse "400卡" → { value: 400, unit: "卡" }, "82分" → { value: 82, unit: "分" }, "85" → { value: 85 } */
function parseStatValue(raw: string | number): { value: string | number; unit?: string } {
  if (typeof raw === "number") return { value: raw };
  const m = raw.match(/^(\d+(?:\.\d+)?)\s*(\S*)$/);
  if (m) {
    const num = m[1].includes(".") ? parseFloat(m[1]) : parseInt(m[1], 10);
    const unit = m[2] || undefined;
    return { value: num, unit };
  }
  return { value: raw };
}

function clampStatItems(items: TemplateStatItem[]): TemplateStatItem[] {
  return items.slice(0, 2).map((s) => {
    const parsed = parseStatValue(s.value);
    const label = s.label.length > 5 ? s.label.slice(0, 5) : s.label;

    // Score handling
    let score = s.score;
    if (score == null && typeof parsed.value === "number") {
      const n = parsed.value as number;
      if (n >= 0 && n <= 100) score = n;
    }
    if (score == null) score = 50;
    score = Math.min(100, Math.max(0, score));

    // Value/unit: if AI put the unit in `value` (non-numeric) and the number in `score`,
    // swap them so value = score number, unit = original value string
    let displayVal: string;
    let unit: string | undefined;
    if (typeof parsed.value === "string" && !/^\d/.test(String(s.value).trim())) {
      // value is non-numeric text (e.g. "分贝", "克") → use score as display value, text as unit
      displayVal = String(score);
      unit = String(s.value).trim();
    } else {
      displayVal = String(parsed.value);
      if (displayVal.length > 8) displayVal = displayVal.slice(0, 8);
      unit = parsed.unit ?? s.unit;
    }

    return { label, value: displayVal, unit, score };
  });
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

  // mapToTemplateModel
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
    bioText: clampBio(`${data.description}\n${cleanFunFact}`),
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

  // mapAtlasCardToTemplateModel
  const statItems: TemplateStatItem[] = card.stats.map((s) => ({
    label: s.label,
    value: s.value,
    score: s.type === "numeric" ? (s.score ?? (Number(s.value) >= 0 && Number(s.value) <= 100 ? Number(s.value) : undefined)) : undefined,
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
