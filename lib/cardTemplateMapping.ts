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

/** Fact-like keywords that should NEVER appear in stat labels */
const FACT_LIKE_PATTERNS = [
  "季节", "成熟", "习性", "赏味", "保存", "周期", "产地", "栖息地", "生长",
  "来源", "分布", "原产", "栽培", "种植", "收获", "采摘",
];

/** Bad units that should be replaced with "分" */
const BAD_UNITS = new Set(["格", "天", "小时", "分钟", "秒", "级", "℃", "cm", "m", "kg", "g", "mm", "kcal", "卡"]);

/** Labels that should get "度" suffix */
const LABELS_NEED_DU = new Set([
  "甜", "酸", "辣", "苦", "咸", "鲜", "香", "脆", "软", "硬", "嫩", "滑",
  "酥", "糯", "弹", "稠", "稀", "浓", "淡", "热", "冷", "凉", "温", "湿", "干",
  "轻", "重", "亮", "暗", "新", "旧", "美", "精", "纯", "净", "透",
  "实用", "耐用", "便携", "精巧", "舒适", "美观", "稀有", "饱满",
  "新鲜", "多汁", "松软", "酥脆", "油香", "醇厚", "清爽", "绵密",
  "细腻", "柔韧", "清脆", "爽口", "鲜嫩", "辛香", "温润", "浓郁",
]);

function fixStatLabel(label: string): string {
  if (label.endsWith("度") || label.endsWith("感") || label.endsWith("力")) return label;
  if (LABELS_NEED_DU.has(label)) return label + "度";
  return label;
}

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

/**
 * Normalize stats from AI output: filter fact-like entries, fix units,
 * fix labels, ensure scores. Runs BEFORE clampStatItems.
 */
function normalizeStats(
  stats: Array<{ label: string; value: string | number; score?: number }>,
): Array<{ label: string; value: string | number; score?: number }> {
  // 1. Filter out fact-like stats
  const filtered = stats.filter((s) => {
    const lower = s.label.toLowerCase();
    return !FACT_LIKE_PATTERNS.some((p) => lower.includes(p));
  });

  if (filtered.length === 0) return [];

  // 2. Normalize each stat
  const normalized = filtered.map((s) => {
    let label = fixStatLabel(s.label);
    let value = s.value;
    let score = s.score;

    const parsed = parseStatValue(value);

    // Fix bad units: strip the unit suffix, use bare number
    if (typeof parsed.value === "number" && parsed.unit && BAD_UNITS.has(parsed.unit)) {
      value = String(parsed.value);
      // If score is missing, derive from value (only if 0-100)
      if (score == null && parsed.value >= 0 && parsed.value <= 100) {
        score = parsed.value;
      }
    }

    // If value is a bare number 0-100 and no score, use as score
    if (score == null && typeof parsed.value === "number" && parsed.value >= 0 && parsed.value <= 100) {
      score = parsed.value;
    }
    if (score == null) score = 50;

    return { label, value, score };
  });

  // 3. Take at most 2 numeric + 1 text (this assumes all are numeric here;
  //    the actual numeric/text split happens in the schema, but for rendering
  //    we just take first 2 for the progress bars)
  return normalized;
}

function clampStatItems(items: TemplateStatItem[]): TemplateStatItem[] {
  // First apply normalizeStats to the raw items
  const rawItems = items.map((s) => ({ label: s.label, value: s.value, score: s.score }));
  const normalized = normalizeStats(rawItems);

  return normalized.slice(0, 2).map((s) => {
    const parsed = parseStatValue(s.value);
    const label = s.label.length > 5 ? s.label.slice(0, 5) : s.label;

    let score = s.score;
    if (score == null && typeof parsed.value === "number") {
      const n = parsed.value as number;
      if (n >= 0 && n <= 100) score = n;
    }
    if (score == null) score = 50;
    score = Math.min(100, Math.max(0, score));

    let displayVal: string;
    let unit: string | undefined;
    if (typeof parsed.value === "string" && !/^\d/.test(String(s.value).trim())) {
      displayVal = String(score);
      unit = String(s.value).trim();
    } else {
      displayVal = String(parsed.value);
      if (displayVal.length > 8) displayVal = displayVal.slice(0, 8);
      unit = parsed.unit;
    }

    // Default unit to "分" for numeric stats with a score
    if (!unit || BAD_UNITS.has(unit)) unit = "分";

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
    portraitImageUrl: card.templatePortraitUrl || card.croppedImageUrl || card.imageUrl || "",
    infoLine1: clampInfoLine1(facts),
    statItems: clampStatItems(statItems),
    bioText: clampBio(`${card.description}\n小知识：${cleanFunFact}`),
    footerIcons: footerIcons.map((icon) => ({ icon })),
  };
}
