export type CityProfile = {
  id: string;
  name: string;
  vibe: string;
  tone: string;
  prefixStyles: string[];
  suffixStyles: string[];
  descriptionFlavor: string;
  statModifiers: string[];
};

/** Preset cities for quick-select buttons. */
export const CITIES: CityProfile[] = [
  {
    id: "shanghai",
    name: "上海",
    vibe: "摩登·霓虹·海派",
    tone: "都会感的",
    prefixStyles: ["霓虹", "摩登", "都会", "海派", "外滩", "弄堂", "石库门", "浦江"],
    suffixStyles: ["·魔都纪", "·海上传奇", "·沪上异闻", "·不夜城录", "·霓虹志"],
    descriptionFlavor: "现代都市",
    statModifiers: ["时尚度", "摩登指数", "都市感"],
  },
  {
    id: "beijing",
    name: "北京",
    vibe: "古都·庄重·宫阙",
    tone: "庄严肃穆的",
    prefixStyles: ["紫禁", "皇城", "燕京", "京师", "城门", "宫阙", "胡同", "琉璃"],
    suffixStyles: ["·帝都遗录", "·燕京志", "·皇城秘卷", "·紫禁残章", "·京华录"],
    descriptionFlavor: "古都气质",
    statModifiers: ["历史感", "威严度", "古韵"],
  },
  {
    id: "chengdu",
    name: "成都",
    vibe: "松弛·烟火·巴蜀",
    tone: "安逸的",
    prefixStyles: ["锦城", "巴蜀", "蜀地", "蓉城", "天府", "宽窄", "锦里", "盖碗"],
    suffixStyles: ["·天府录", "·蜀中志", "·锦城谣", "·巴蜀异志", "·盖碗谈"],
    descriptionFlavor: "烟火气",
    statModifiers: ["巴适度", "烟火气", "麻辣指数"],
  },
  {
    id: "chongqing",
    name: "重庆",
    vibe: "山城·雾气·赛博",
    tone: "魔幻的",
    prefixStyles: ["山城", "雾都", "赛博", "巴渝", "洪崖", "轻轨", "桥都", "梯坎"],
    suffixStyles: ["·山城录", "·雾都志", "·赛博纪", "·巴渝异闻", "·8D魔幻志"],
    descriptionFlavor: "赛博山城气息",
    statModifiers: ["魔幻度", "赛博感", "立体指数"],
  },
  {
    id: "guangzhou",
    name: "广州",
    vibe: "市井·南洋·骑楼",
    tone: "市井的",
    prefixStyles: ["羊城", "穗城", "骑楼", "南洋", "花城", "珠江", "西关", "东山"],
    suffixStyles: ["·羊城录", "·穗城志", "·南洋遗梦", "·珠江异志", "·花城纪"],
    descriptionFlavor: "岭南市井风情",
    statModifiers: ["烟火气", "南洋感", "老广指数"],
  },
  {
    id: "hangzhou",
    name: "杭州",
    vibe: "江南·湖色·文气",
    tone: "温润的",
    prefixStyles: ["西湖", "钱塘", "临安", "余杭", "江南", "湖光", "龙井", "南宋"],
    suffixStyles: ["·临安梦华", "·西湖志", "·钱塘录", "·江南异闻", "·湖山纪"],
    descriptionFlavor: "江南文人气质",
    statModifiers: ["文气", "雅致度", "江南韵"],
  },
  {
    id: "xian",
    name: "西安",
    vibe: "长安·丝路·盛唐",
    tone: "恢宏的",
    prefixStyles: ["长安", "丝路", "盛唐", "大秦", "未央", "雁塔", "骊山", "玄武"],
    suffixStyles: ["·长安志", "·丝路遗卷", "·盛唐录", "·大秦秘藏", "·未央残简"],
    descriptionFlavor: "盛唐气象",
    statModifiers: ["历史感", "恢宏度", "古韵"],
  },
  {
    id: "shenzhen",
    name: "深圳",
    vibe: "科技·未来·创新",
    tone: "超未来的",
    prefixStyles: ["鹏城", "未来", "硅谷", "湾区", "前海", "科技", "创芯", "深港"],
    suffixStyles: ["·鹏城纪", "·未来志", "·湾区录", "·硅谷异闻", "·明日档案"],
    descriptionFlavor: "未来科技感",
    statModifiers: ["科技感", "未来度", "创新指数"],
  },
  {
    id: "nanjing",
    name: "南京",
    vibe: "金陵·民国·文脉",
    tone: "隽永的",
    prefixStyles: ["金陵", "建康", "秦淮", "石头城", "玄武", "梧桐", "民国", "应天"],
    suffixStyles: ["·金陵录", "·石头志", "·秦淮秘卷", "·建康遗梦", "·梧桐纪"],
    descriptionFlavor: "六朝文脉",
    statModifiers: ["文脉感", "民国味", "古韵"],
  },
  {
    id: "wuhan",
    name: "武汉",
    vibe: "江城·码头·楚风",
    tone: "豪爽的",
    prefixStyles: ["江城", "楚地", "晴川", "东湖", "黄鹤", "汉口", "武昌", "汉阳"],
    suffixStyles: ["·江城录", "·楚地志", "·黄鹤秘卷", "·晴川异闻", "·江汉纪"],
    descriptionFlavor: "江湖豪情",
    statModifiers: ["江湖气", "豪爽度", "楚风韵"],
  },
];

/** Common game / worldview / fictional styles — recognized by name. */
export const STYLE_PRESETS: CityProfile[] = [
  {
    id: "elden-ring",
    name: "艾尔登法环",
    vibe: "魂系史诗·废墟·黄金树",
    tone: "悲壮恢宏的",
    prefixStyles: [],
    suffixStyles: [],
    descriptionFlavor: "交界地的史诗氛围",
    statModifiers: [],
  },
  {
    id: "zelda",
    name: "塞尔达传说",
    vibe: "冒险·旷野·海拉鲁",
    tone: "悠远自由的",
    prefixStyles: [],
    suffixStyles: [],
    descriptionFlavor: "海拉鲁的冒险气息",
    statModifiers: [],
  },
  {
    id: "cyberpunk2077",
    name: "赛博朋克2077",
    vibe: "赛博·霓虹·义体",
    tone: "冷酷迷幻的",
    prefixStyles: [],
    suffixStyles: [],
    descriptionFlavor: "夜之城的赛博氛围",
    statModifiers: [],
  },
  {
    id: "genshin",
    name: "原神",
    vibe: "提瓦特·元素·七国",
    tone: "绮丽多彩的",
    prefixStyles: [],
    suffixStyles: [],
    descriptionFlavor: "提瓦特大陆的元素气息",
    statModifiers: [],
  },
  {
    id: "arknights",
    name: "明日方舟",
    vibe: "源石·罗德岛·末世",
    tone: "冷峻克制的",
    prefixStyles: [],
    suffixStyles: [],
    descriptionFlavor: "泰拉世界的冷峻氛围",
    statModifiers: [],
  },
  {
    id: "pokemon",
    name: "宝可梦",
    vibe: "冒险·收集·伙伴",
    tone: "轻松可爱的",
    prefixStyles: [],
    suffixStyles: [],
    descriptionFlavor: "宝可梦世界的冒险感",
    statModifiers: [],
  },
  {
    id: "harry-potter",
    name: "哈利波特",
    vibe: "魔法·霍格沃茨·英伦",
    tone: "神秘古典的",
    prefixStyles: [],
    suffixStyles: [],
    descriptionFlavor: "魔法世界的奇妙氛围",
    statModifiers: [],
  },
  {
    id: "dark-souls",
    name: "黑暗之魂",
    vibe: "魂系·深渊·传火",
    tone: "暗黑悲凉的",
    prefixStyles: [],
    suffixStyles: [],
    descriptionFlavor: "罗德兰的暗黑史诗感",
    statModifiers: [],
  },
  {
    id: "steampunk",
    name: "蒸汽朋克",
    vibe: "齿轮·黄铜·维多利亚",
    tone: "复古机械的",
    prefixStyles: [],
    suffixStyles: [],
    descriptionFlavor: "蒸汽朋克的机械美学",
    statModifiers: [],
  },
  {
    id: "norse",
    name: "北欧神话",
    vibe: "诸神·世界树·英灵",
    tone: "苍茫古老的",
    prefixStyles: [],
    suffixStyles: [],
    descriptionFlavor: "北欧神话的苍茫史诗感",
    statModifiers: [],
  },
  {
    id: "japanese-convenience",
    name: "日式便利店",
    vibe: "昭和·深夜·便利店",
    tone: "日常怀旧的",
    prefixStyles: [],
    suffixStyles: [],
    descriptionFlavor: "日式深夜便利店的温馨日常感",
    statModifiers: [],
  },
  {
    id: "south-france",
    name: "南法小镇",
    vibe: "薰衣草·阳光·石头城",
    tone: "慵懒明媚的",
    prefixStyles: [],
    suffixStyles: [],
    descriptionFlavor: "南法小镇的明媚慵懒感",
    statModifiers: [],
  },
];

const ALL_PRESETS = [...CITIES, ...STYLE_PRESETS];

/**
 * Resolve any input string to a CityProfile.
 * First checks preset cities, then game/worldview presets,
 * then returns a generic profile for any arbitrary input.
 * NEVER rejects — any non-empty input is valid.
 */
export function resolveStyleProfile(input: string): CityProfile {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      id: "unknown",
      name: "未知",
      vibe: "通用",
      tone: "中性的",
      prefixStyles: [],
      suffixStyles: [],
      descriptionFlavor: "通用风格",
      statModifiers: [],
    };
  }

  // Check exact match in all presets
  const preset = ALL_PRESETS.find(
    (p) => p.name === trimmed || p.id === trimmed
  );
  if (preset) return preset;

  // Generic profile for any unrecognized input
  return {
    id: trimmed,
    name: trimmed,
    vibe: trimmed,
    tone: `${trimmed}风格的`,
    prefixStyles: [trimmed],
    suffixStyles: [`·${trimmed}录`],
    descriptionFlavor: `${trimmed}风格`,
    statModifiers: [],
  };
}

/** Detect if the input is a plain/normal intro mode keyword. */
const PLAIN_KEYWORDS = [
  "普通介绍", "普通", "正常介绍", "写实介绍", "百科介绍",
  "无风格", "plain", "normal",
];

export function isPlainIntroMode(styleSource: string): boolean {
  const trimmed = styleSource.trim().toLowerCase();
  return PLAIN_KEYWORDS.some((k) => trimmed === k.toLowerCase());
}
