import type { CategoryId, CardPreset } from "./types";

export type IconMode = "emoji" | "svg" | "none";

const GAME_EMOJI: Record<string, string> = {
  fruit: "🍓", veg: "🌱", grain: "🌾",
  mushroom: "🍄", flower: "🌸", tree: "🌳", plant: "🌿", herb: "🌱", seed: "🌰",
  spice: "🌶️", beverage: "🧃", dessert: "🍰", cooked: "🍖", meat: "🍖",
  fish: "🐟", shellfish: "🐚", insect: "🐞", bird: "🪶", mammal: "🐾", reptile: "🐾", amphibian: "🐾",
  mineral: "💎", rock: "💎", metal: "⚙️", gem: "💎",
  building: "🏛️", road: "🏛️", vehicle: "🚀", furniture: "⚙️", appliance: "⚡", tool: "⚙️",
  clothing: "✦", stationery: "✦", book: "✦", toy: "✦", electronic: "⚡",
  container: "✦", daily: "✦", signage: "🏛️", art: "✦", ruins: "🏛️",
  sky: "✦", water: "🌊", other: "✦",
};

const ENCYCLOPEDIA_EMOJI: Record<string, string> = {
  fruit: "🍓", veg: "🥬", grain: "🌾",
  mushroom: "🍄", flower: "🌸", tree: "🌳", plant: "🌿", herb: "🌱", seed: "🌰",
  spice: "🌿", beverage: "💧", dessert: "🍯", cooked: "🍞", meat: "🍞",
  fish: "🐟", shellfish: "🐚", insect: "🐞", bird: "🪶", mammal: "🐾", reptile: "🐾", amphibian: "🐾",
  mineral: "🪨", rock: "🪨", metal: "◦", gem: "💎",
  building: "🏛️", road: "🏛️", vehicle: "◦", furniture: "◦", appliance: "◦", tool: "◦",
  clothing: "◦", stationery: "◦", book: "◦", toy: "◦", electronic: "◦",
  container: "◦", daily: "◦", signage: "◦", art: "◦", ruins: "🏛️",
  sky: "◦", water: "🌊", other: "✧",
};

function normalizeCategory(category: string): string {
  if (category.includes("水果")) return "fruit";
  if (category.includes("蔬菜")) return "veg";
  if (category.includes("谷物")) return "grain";
  if (category.includes("种子")) return "seed";
  if (category.includes("菌类")) return "mushroom";
  if (category.includes("花卉")) return "flower";
  if (category.includes("树木")) return "tree";
  if (category.includes("草本")) return "herb";
  if (category.includes("植物")) return "plant";
  if (category.includes("香料")) return "spice";
  if (category.includes("饮料")) return "beverage";
  if (category.includes("甜品")) return "dessert";
  if (category.includes("熟食") || category.includes("肉类")) return "cooked";
  if (category.includes("鱼类")) return "fish";
  if (category.includes("贝类")) return "shellfish";
  if (category.includes("昆虫")) return "insect";
  if (category.includes("鸟类")) return "bird";
  if (category.includes("哺乳") || category.includes("爬行") || category.includes("两栖")) return "mammal";
  if (category.includes("矿物")) return "mineral";
  if (category.includes("岩石")) return "rock";
  if (category.includes("金属")) return "metal";
  if (category.includes("宝石")) return "gem";
  if (category.includes("建筑")) return "building";
  if (category.includes("道路")) return "road";
  if (category.includes("交通")) return "vehicle";
  if (category.includes("家具") || category.includes("工具")) return "tool";
  if (category.includes("家电") || category.includes("电子")) return "electronic";
  if (category.includes("古迹")) return "ruins";
  if (category.includes("水体")) return "water";
  return "other";
}

/** Returns the icon mode for a given preset. Default: emoji for game/encyclopedia, none for antique/liquid-metal. */
export function getDefaultIconMode(preset: CardPreset): IconMode {
  if (preset === "game" || preset === "encyclopedia") return "emoji";
  return "none";
}

/** Get emoji for category+preset. Returns empty string if not applicable. */
export function getCategoryEmoji(category: CategoryId, preset: CardPreset): string {
  if (preset !== "game" && preset !== "encyclopedia") return "";
  const key = normalizeCategory(category);
  const map = preset === "game" ? GAME_EMOJI : ENCYCLOPEDIA_EMOJI;
  return map[key] ?? map.other ?? "✦";
}

/** Emoji span with fixed-size container — prevents layout shift across platforms. */
export function EmojiSpan({ emoji, size = 14, ariaLabel }: { emoji: string; size?: number; ariaLabel?: string }) {
  if (!emoji) return null;
  return (
    <span
      aria-hidden={!ariaLabel ? "true" : undefined}
      aria-label={ariaLabel}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: size + 4, height: size + 4, flexShrink: 0,
        fontSize: size, lineHeight: 1,
      }}
    >
      {emoji}
    </span>
  );
}
