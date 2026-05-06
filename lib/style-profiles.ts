export type StyleProfile = {
  source: string;
  moodKeywords: string[];
  styleDirection: string;
  avoidNames: string[];
};

const PRESETS: StyleProfile[] = [
  {
    source: "上海",
    moodKeywords: ["摩登", "市井", "快节奏", "精致", "霓虹感", "弄堂日常"],
    styleDirection: "像便利店收据背面随手写的一句话，都市烟火气轻巧自然",
    avoidNames: ["上海", "外滩", "陆家嘴", "浦江", "魔都"],
  },
  {
    source: "北京",
    moodKeywords: ["古都", "庄重", "胡同", "四季分明", "京味", "慢而稳"],
    styleDirection: "像旧书摊上夹着的一张老书签，平静而悠长",
    avoidNames: ["北京", "紫禁城", "故宫", "长安街", "皇城"],
  },
  {
    source: "成都",
    moodKeywords: ["松弛", "烟火气", "茶馆", "巴蜀", "安逸", "慢生活"],
    styleDirection: "像盖碗茶旁边随手记录的便签，带着懒洋洋的温和",
    avoidNames: ["成都", "锦里", "宽窄巷子", "天府"],
  },
  {
    source: "重庆",
    moodKeywords: ["山城", "雾气", "立体", "热辣", "魔幻", "江湖气"],
    styleDirection: "像8D地形里迷路时捡到的一张小标签，魔幻而真实",
    avoidNames: ["重庆", "洪崖洞", "李子坝", "解放碑"],
  },
  {
    source: "星露谷",
    moodKeywords: ["田园", "慢生活", "季节感", "手作", "小镇日常", "温暖", "轻冒险", "收集感"],
    styleDirection: "像一个农场木箱上的手写标签，朴素温暖带一点轻松幽默",
    avoidNames: ["星露谷", "鹈鹕镇", "星露"],
  },
  {
    source: "艾尔登法环",
    moodKeywords: ["幽暗", "残破", "古老", "宿命感", "碎片化", "恢宏但克制"],
    styleDirection: "像一片褪色的羊皮纸残章，语言克制、留白多、氛围沉郁",
    avoidNames: ["艾尔登法环", "黄金树", "交界地", "褪色者", "艾尔登"],
  },
  {
    source: "塞尔达传说",
    moodKeywords: ["旷野", "冒险", "自由", "静谧", "废墟", "温暖", "风的感觉"],
    styleDirection: "像旅途中篝火旁的一页笔记，悠远自由、带一点野趣",
    avoidNames: ["塞尔达", "海拉鲁", "海拉尔", "林克"],
  },
  {
    source: "赛博朋克2077",
    moodKeywords: ["霓虹", "义体", "高科技低生活", "冷感", "都市丛林", "光污染"],
    styleDirection: "像一块被遗忘在数据终端旁的电子标签，冷感、利落、略带疏离",
    avoidNames: ["赛博朋克", "夜之城", "赛博"],
  },
  {
    source: "原神",
    moodKeywords: ["元素", "七国", "冒险", "绮丽", "自然", "童话感"],
    styleDirection: "像旅行者在某个偏远村落收集到的一张手绘标签，色泽温暖、细节丰富",
    avoidNames: ["原神", "提瓦特", "元素", "神之眼"],
  },
  {
    source: "宝可梦",
    moodKeywords: ["冒险", "收集", "伙伴", "轻松", "自然", "竞技感"],
    styleDirection: "像训练家手册里的一页小笔记，活泼轻松、对世界充满好奇",
    avoidNames: ["宝可梦", "精灵球", "图鉴", "训练家"],
  },
  {
    source: "哈利波特",
    moodKeywords: ["魔法", "英伦", "古堡", "神秘", "学院", "古典"],
    styleDirection: "像霍格沃茨图书馆里一张夹在书中的手写便条，古典带一丝俏皮",
    avoidNames: ["哈利波特", "霍格沃茨", "魔法", "巫师"],
  },
  {
    source: "黑暗之魂",
    moodKeywords: ["暗黑", "深渊", "轮回", "孤独", "锈蚀", "沉重"],
    styleDirection: "像一块锈迹斑斑的金属牌，字迹模糊但依然能辨，冷冽而克制",
    avoidNames: ["黑暗之魂", "传火", "罗德兰", "不死人"],
  },
  {
    source: "马德里",
    moodKeywords: ["阳光", "热烈", "午后", "街头", "tapas", "古典与现代交织"],
    styleDirection: "像马德里老城区一间店铺橱窗里的小卡片，阳光感、松弛而精致",
    avoidNames: ["马德里", "Madrid", "皇宫", "普拉多"],
  },
  {
    source: "普通介绍",
    moodKeywords: ["客观", "准确", "科普", "清晰", "自然"],
    styleDirection: "像百科词条第一段的简介，自然清楚",
    avoidNames: [],
  },
  {
    source: "百科介绍",
    moodKeywords: ["客观", "准确", "科普", "清晰", "自然"],
    styleDirection: "像百科词条第一段的简介，自然清楚",
    avoidNames: [],
  },
  {
    source: "里斯本",
    moodKeywords: ["瓷砖", "海岸", "怀旧", "阳光", "法多", "石板路"],
    styleDirection: "像里斯本街角瓷砖墙边的小标签，怀旧而明媚",
    avoidNames: ["里斯本", "Lisbon", "Lisboa"],
  },
  {
    source: "墨西哥城",
    moodKeywords: ["热烈", "色彩", "龙舌兰", "古老文明", "市场", "生命力"],
    styleDirection: "像市集手工艺品摊上的一张手写说明，浓烈而有生机",
    avoidNames: ["墨西哥城", "Mexico", "墨城"],
  },
  {
    source: "蒸汽朋克",
    moodKeywords: ["齿轮", "黄铜", "维多利亚", "机械", "复古未来", "精密"],
    styleDirection: "像一张黄铜齿轮压印的出厂铭牌，精密、复古、略带蒸汽时代的浪漫",
    avoidNames: ["蒸汽朋克", "steampunk"],
  },
  {
    source: "北欧神话",
    moodKeywords: ["苍茫", "古老", "冰雪", "世界树", "符文", "史诗感"],
    styleDirection: "像一块被冰雪覆盖的古老石碑上的铭文，苍茫而庄严",
    avoidNames: ["北欧", "奥丁", "雷神", "诸神黄昏"],
  },
  {
    source: "日式便利店",
    moodKeywords: ["深夜", "昭和", "便利店", "日常", "温馨", "独处感"],
    styleDirection: "像便利店深夜收银台旁随手写下的便条，安静、日常、带一点寂寞的温柔",
    avoidNames: ["日式便利店", "日本", "东京"],
  },
  {
    source: "南法小镇",
    moodKeywords: ["薰衣草", "阳光", "石头城", "慵懒", "明媚", "田园"],
    styleDirection: "像南法小镇面包店门口的手写小黑板，慵懒明媚、充满生活感",
    avoidNames: ["南法", "普罗旺斯", "法国"],
  },
];

const cache = new Map<string, StyleProfile>();

export function resolveStyleProfile(source: string): StyleProfile {
  const trimmed = source.trim();
  if (!trimmed) {
    return { source: "", moodKeywords: [], styleDirection: "通用风格", avoidNames: [] };
  }

  if (cache.has(trimmed)) return cache.get(trimmed)!;

  // Exact match preset
  const preset = PRESETS.find((p) => p.source === trimmed);
  if (preset) { cache.set(trimmed, preset); return preset; }

  // Fuzzy match: contains
  const fuzzy = PRESETS.find((p) => trimmed.includes(p.source) || p.source.includes(trimmed));
  if (fuzzy) { cache.set(trimmed, fuzzy); return fuzzy; }

  // Generic fallback: ask AI to infer style from the name itself
  const generic: StyleProfile = {
    source: trimmed,
    moodKeywords: [],
    styleDirection: `根据"${trimmed}"这个名字的字面气质来写。`,
    avoidNames: [trimmed],
  };
  cache.set(trimmed, generic);
  return generic;
}
