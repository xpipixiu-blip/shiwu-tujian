import type { CategoryId, CardPreset } from "./types";

type IconDef = { path: string; viewBox?: string };

const GAME_ICONS: Record<string, IconDef> = {
  fruit:    { path: '<circle cx="8" cy="10" r="4" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M8 6 Q8 3 10 2" fill="none" stroke="currentColor" stroke-width="1"/>' },
  veg:      { path: '<path d="M4 10 Q8 3 12 10 Q8 8 4 10" fill="none" stroke="currentColor" stroke-width="1.2"/>', viewBox: "0 0 16 16" },
  grain:    { path: '<path d="M8 2 L10 6 L14 7 L11 10 L12 14 L8 12 L4 14 L5 10 L2 7 L6 6 Z" fill="none" stroke="currentColor" stroke-width="1"/>', viewBox: "0 0 16 16" },
  mineral:  { path: '<polygon points="8,1 13,5 13,11 8,15 3,11 3,5" fill="none" stroke="currentColor" stroke-width="1.2"/>' },
  plant:    { path: '<path d="M8 14 L8 4 M8 4 Q5 2 5 6 M8 4 Q11 2 11 6 M8 7 Q5 5 5 9" fill="none" stroke="currentColor" stroke-width="1"/>' },
  animal:   { path: '<path d="M12 5 Q10 2 7 4 Q5 7 6 11 Q8 8 10 10 Q11 8 12 5" fill="none" stroke="currentColor" stroke-width="1.1"/>' },
  building: { path: '<path d="M3 14 L3 7 L8 3 L13 7 L13 14" fill="none" stroke="currentColor" stroke-width="1.1"/>' },
  tool:     { path: '<circle cx="8" cy="4" r="2.5" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="7" y="6" width="2" height="6" rx="0.5" fill="currentColor" opacity="0.6"/>' },
  food:     { path: '<path d="M3 7 L4 13 L12 13 L13 7 Z" fill="none" stroke="currentColor" stroke-width="1"/><path d="M5 7 L5 4 Q8 2 11 4 L11 7" fill="none" stroke="currentColor" stroke-width="1"/>' },
  default:  { path: '<polygon points="8,1 10,6 15,6 11,9 13,14 8,11 3,14 5,9 1,6 6,6" fill="none" stroke="currentColor" stroke-width="1"/>' },
};

const ENCYCLOPEDIA_ICONS: Record<string, IconDef> = {
  fruit:    { path: '<circle cx="8" cy="9" r="4" fill="none" stroke="currentColor" stroke-width="1.1"/><ellipse cx="7" cy="7" rx="1" ry="0.5" fill="currentColor" opacity="0.4"/>' },
  veg:      { path: '<path d="M5 9 Q8 3 11 9 Q9 7 8 8 Q7 7 5 9" fill="none" stroke="currentColor" stroke-width="1"/>' },
  grain:    { path: '<ellipse cx="8" cy="8" rx="2.5" ry="4" fill="none" stroke="currentColor" stroke-width="1"/><path d="M8 4 L8 2 M8 12 L8 14" stroke="currentColor" stroke-width="0.6" fill="none"/>' },
  mineral:  { path: '<ellipse cx="8" cy="8" rx="4" ry="3.5" fill="none" stroke="currentColor" stroke-width="1"/><path d="M5 6 Q8 4 11 6" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.6"/>' },
  plant:    { path: '<path d="M8 14 L8 6 Q8 2 5 2 Q8 3 8 6 Q8 3 11 2 Q8 2 8 6" fill="none" stroke="currentColor" stroke-width="1"/>' },
  animal:   { path: '<path d="M6 12 Q4 6 8 3 Q12 6 10 12" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="6.5" cy="5.5" r="0.8" fill="none" stroke="currentColor" stroke-width="0.6"/>' },
  building: { path: '<rect x="3" y="5" width="10" height="9" fill="none" stroke="currentColor" stroke-width="1"/><rect x="6" y="9" width="4" height="5" fill="none" stroke="currentColor" stroke-width="0.8"/>' },
  water:    { path: '<path d="M5 11 Q7 9 9 11 Q11 9 11 11" fill="none" stroke="currentColor" stroke-width="1"/><path d="M4 8 Q6.5 5.5 9 8 Q11.5 5.5 12 8" fill="none" stroke="currentColor" stroke-width="0.6"/>' },
  default:  { path: '<circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="8" cy="8" r="1.5" fill="currentColor" opacity="0.3"/>' },
};

function mapCategoryToIcon(category: CategoryId): string {
  const map: Record<string, string> = {
    水果: "fruit", 蔬菜: "veg", 谷物: "grain", 种子: "grain",
    矿物: "mineral", 岩石: "mineral", 金属: "mineral", 宝石: "mineral",
    花卉: "plant", 树木: "plant", 草本植物: "plant",
    香料: "food", 饮料: "food", 甜品: "food", 熟食: "food", 肉类: "food",
    鱼类: "animal", 贝类: "animal", 昆虫: "animal", 鸟类: "animal", 哺乳动物: "animal", 爬行动物: "animal", 两栖动物: "animal",
    建筑物: "building", 古迹遗迹: "building", 道路设施: "building", 广告招牌: "building",
    水体: "water", 天象景观: "water",
    交通工具: "tool", 家具: "tool", 家电: "tool", 工具: "tool", 服饰: "tool",
    文具: "tool", 电子设备: "tool", 容器器皿: "tool", 日用品: "tool", 玩具: "tool",
    书籍纸张: "default", 艺术雕塑: "default",
  };
  return map[category] ?? "default";
}

export function CategoryIcon({ category, preset }: { category: CategoryId; preset: CardPreset }) {
  if (preset !== "game" && preset !== "encyclopedia") return null;
  const key = mapCategoryToIcon(category);
  const icons = preset === "game" ? GAME_ICONS : ENCYCLOPEDIA_ICONS;
  const def = icons[key] ?? icons.default!;
  return (
    <svg
      width="14" height="14" viewBox={def.viewBox ?? "0 0 16 16"}
      fill="none" style={{ flexShrink: 0, opacity: 0.7 }}
    >
      <g dangerouslySetInnerHTML={{ __html: def.path }} />
    </svg>
  );
}

/** Tiny game preset decorator: star ◆ at left of title */
export function GameStar() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.5, flexShrink: 0 }}>
      <polygon points="8,1 10,6 15,6 11,9 13,14 8,11 3,14 5,9 1,6 6,6" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/** Tiny encyclopedia decorator: leaf at left of title */
export function EncycLeaf() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.5, flexShrink: 0 }}>
      <path d="M8 14 L8 5 Q8 1 4 2 Q7 3 8 5 Q9 3 12 2 Q8 1 8 5" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/** Encyclopedia divider decorator: tiny flower */
export function EncycFlower() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.35, flexShrink: 0 }}>
      <circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <ellipse cx="8" cy="5" rx="1" ry="1.2" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <ellipse cx="8" cy="11" rx="1" ry="1.2" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <ellipse cx="5" cy="8" rx="1.2" ry="1" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <ellipse cx="11" cy="8" rx="1.2" ry="1" fill="none" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  );
}
