import type { AtlasCard, NumericStat, TextStat, CategoryId } from "./types";
import type { CityProfile } from "./cities";
import { CITIES } from "./cities";

let idCounter = 0;

function uid(): string {
  idCounter += 1;
  return `card-${Date.now()}-${idCounter}`;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Name generation ────────────────────────────────────────

// Descriptor pools — no city references
const PREFIX_A: Record<string, string[]> = {
  food: ["赤根", "翠衣", "金粒", "白脂", "紫袍", "甘液", "辛香", "酸影", "鲜味", "脆壳", "蜜髓", "霜糖"],
  mineral: ["星陨", "地脉", "太古", "深渊", "虹光", "暗晶", "熔核", "月辉", "雷纹", "虚空", "时砂", "极光"],
  animal: ["银鳞", "暗羽", "幽瞳", "云隐", "霜牙", "烈爪", "静翼", "鸣骨", "浮游", "深潜", "缭影", "缠丝"],
  plant: ["风语", "月照", "千年", "微光", "晨露", "暮霭", "幽兰", "枯荣", "春痕", "雪芽", "炎叶", "雾枝"],
  building: ["旧世", "石语", "时光", "锈骨", "残响", "铁魄", "巍影", "静矗", "尘封", "裂痕", "默碑", "废都"],
  object: ["逆刃", "碎星", "虚界", "秘藏", "苍穹", "炽焰", "寒霜", "雷霆", "幻影", "幽梦", "时隙", "灵装"],
  water: ["镜湖", "深渊", "碧落", "沧浪", "静流", "怒涛", "沉渊", "浮光", "暗潮", "冰心", "雾海", "雨魄"],
  sky: ["残阳", "破晓", "永夜", "极昼", "流星", "裂空", "霞染", "云葬", "雷殛", "虹桥", "月蚀", "日冕"],
};

const SUFFIX_B: Record<string, string[]> = {
  food: ["小魔杖", "秘核", "之源", "灵膏", "术士", "凝晶", "咒印", "使徒", "守护者", "之种", "轻语", "馈赠"],
  mineral: ["碎片", "结晶", "矿石", "核心", "遗物", "碑文", "棱镜", "锻锤", "圣杯", "勋章", "枷锁", "王座"],
  animal: ["游灵", "旅者", "猎手", "歌者", "哨兵", "隐士", "舞者", "学者", "浪人", "骑士", "祭司", "先知"],
  plant: ["低语", "轻吟", "藤蔓", "花冠", "根须", "叶刃", "孢子", "粉雪", "眠铃", "灯盏", "帷幔", "浮标"],
  building: ["残影", "框架", "穹顶", "柱廊", "拱门", "尖塔", "地基", "回廊", "庭园", "祭坛", "工坊", "钟楼"],
  object: ["遗器", "残响", "投影", "容器", "透镜", "量尺", "罗盘", "琴键", "棋局", "面具", "怀表", "钥匙"],
  water: ["水滴", "漩涡", "涟漪", "瀑布", "深渊", "镜面", "暗流", "潮汐", "涌泉", "泡沫", "冰川", "泪珠"],
  sky: ["残响", "轨迹", "帷幕", "信标", "神谕", "兆候", "余烬", "裂隙", "光环", "星图", "极光", "幻日"],
};

function getCategoryGroup(category: CategoryId): string {
  const food: CategoryId[] = ["蔬菜", "水果", "谷物", "菌类", "香料", "饮料", "甜品", "熟食", "肉类"];
  const mineral: CategoryId[] = ["矿物", "岩石", "金属", "宝石"];
  const animal: CategoryId[] = ["鱼类", "贝类", "昆虫", "鸟类", "哺乳动物", "爬行动物", "两栖动物"];
  const plant: CategoryId[] = ["花卉", "树木", "草本植物", "种子"];
  const building: CategoryId[] = ["建筑物", "道路设施", "古迹遗迹", "广告招牌"];
  const water: CategoryId[] = ["水体"];
  const sky: CategoryId[] = ["天象景观"];

  if (food.includes(category)) return "food";
  if (mineral.includes(category)) return "mineral";
  if (animal.includes(category)) return "animal";
  if (plant.includes(category)) return "plant";
  if (building.includes(category)) return "building";
  if (water.includes(category)) return "water";
  if (sky.includes(category)) return "sky";
  return "object";
}

function generateFantasyName(_city: CityProfile, _objectName: string, category: CategoryId): string {
  const group = getCategoryGroup(category);
  const prefix = pick(PREFIX_A[group] ?? PREFIX_A.object);
  const suffix = pick(SUFFIX_B[group] ?? SUFFIX_B.object);

  // 60% prefix+suffix, 25% prefix only, 15% suffix only
  const r = Math.random();
  if (r < 0.6) return `${prefix}${suffix}`;
  if (r < 0.85) return prefix;
  return suffix;
}

// ─── Description generation ─────────────────────────────────

const DESC_TEMPLATES: Record<string, string[]> = {
  food: [
    "一种看似普通却暗藏{p1}的{type}型素材。新手冒险者常将其误认为低阶道具，老手却会在关键时刻往背包里塞上一个。",
    "散发着{p1}气息的{type}类秘宝。据说正确的处理方式能让其效果翻倍，而处理失败的后果……不太好吃。",
    "在{type}图鉴中被标注为「建议优先收集」的常见好物。携带时{p1}会缓慢上升，虽然没人能解释原理。",
    "传说级{type}素材的……平价替代版。虽然收藏家们嗤之以鼻，但务实派冒险者人手一个。",
  ],
  mineral: [
    "深埋地底{p2}年的{type}结晶体，内部隐约可见{p1}的光芒。敲击时会发出令人意外的清脆回响。",
    "一块来历不明的{type}，表面布满{p1}纹理。地质学家认为它不属于任何已知地层。",
    "散发着{p1}的{type}碎片，在月光下会浮现出{p2}道环形纹路，仿佛记录了某种周期。",
    "被矿工称为「{type}中的异类」的稀有样本。硬度测试机在它面前碎过三台。",
  ],
  animal: [
    "{size}型{type}生灵，拥有{p1}的奇特能力。通常出没于{habitat}，但似乎也偶尔出现在意想不到的地方。",
    "以{p1}著称的{type}种。行为学家至今无法解释它为什么会在{p2}时做出标志性动作。",
    "一种{type}目下的神秘物种，第一次被发现时正在{p1}。目前整个学科对它的了解约等于零。",
    "拥有{p1}天赋的{size}型{type}。有报告称它在受惊时会{p2}，但没有人拍到过证据。",
  ],
  plant: [
    "{season}生长的{type}类植株，{part}在{p1}时会散发出{p2}的微光。据说可用于炼制基础恢复药水。",
    "一株看起来{p1}的{type}，但百科全书上写着「请勿在室内种植」。原因那页被撕掉了。",
    "拥有{p1}特性的{type}科植物。{part}的纹路在显微镜下会组成令人不安的规整图案。",
    "在{habitat}被首次记录的{type}。当地向导会提醒新人：「闻可以，别吃。」",
  ],
  building: [
    "一座{p1}风格的{type}构体，表面{p2}的痕迹似乎不是自然形成的。结构力学分析结果被标记为「待复核」。",
    "来历不明的{type}，{p1}的轮廓在特定光线下会投出与实物不符的阴影。建筑系学生视其为期末作业的灵感来源。",
    "被当地人称为「那个{type}」的{p1}建物。关于它的建造者，至少有{p2}个互相矛盾的民间版本。",
    "外观{p1}的{type}型构造物。测绘数据与卫星图有{p2}厘米的偏差，测绘员表示不想讨论这件事。",
  ],
  object: [
    "一个{p1}的{type}，表面刻有{p2}道难以辨认的纹路。语言学家认为可能是一种已经灭绝的文字，或者只是划痕。",
    "散发着{p1}气场的{type}。握住时会有微弱的{p2}感，但所有仪器都检测不到任何异常。",
    "用途不明的{type}型物件。在二手市场上被标为「收藏品」，识货的人会默默下单然后不告诉任何人。",
    "外观{p1}的{type}，内部似乎有什么东西在{p2}。拆开看过的人都不愿讨论里面的内容。",
  ],
  water: [
    "一汪{p1}的{type}，水质检测显示含有{p2}种无法识别的微量元素。附近的{p3}似乎长得比别处更茂盛。",
    "被{p1}环绕的{type}，水面在无风时偶尔会泛起规律性的波纹。水文站对此没有官方解释。",
    "源头上游的{type}，水中{p1}含量异常。有研究员提出这可能解释了为什么附近的{p2}行为出现变化。",
  ],
  sky: [
    "一种罕见的{type}现象，出现时{p1}会发生{p2}的变化。目击报告通常伴随着{p3}的传闻。",
    "被称为「{type}」的大气奇观。气象学可以解释其中{p1}的部分，但剩下的{p2}目前只能归类为「待研究」。",
    "观测记录{p2}次的{type}，每次都恰好有{p1}在场。统计学家对此的合作意愿出奇地低。",
  ],
};

function fillTemplate(template: string, category: CategoryId): string {
  const foodTraits = ["微甜", "辛香", "醇厚", "清爽", "浓郁", "酥脆", "绵密", "甘美", "酸冽", "鲜润"];
  const mineralTraits = ["幽蓝", "暗金", "银白", "虹彩", "哑光", "半透明", "金属质", "流纹"];
  const animalBehaviors = ["高速移动", "精准跳跃", "拟态伪装", "群体协作", "夜行", "掘地", "滑翔", "回声定位"];
  const plantTraits = ["摇曳", "蔓延", "含苞", "盛放", "垂落", "缠绕", "挺立", "匍匐"];
  const seasons = ["春末", "夏夜", "秋分", "冬初", "雨季", "旱季", "雾季", "花期"];
  const habitats = ["林间空地", "岩缝深处", "旧建筑的角落", "水边", "高地", "盆地的背阴面", "通风的过道", "安静的屋顶"];
  const sizes = ["小", "中", "大型", "微型", "标准"];
  const parts = ["叶片", "花瓣", "根茎", "果实", "种子", "枝干", "芽尖", "藤蔓"];

  let result = template;
  result = result.replace(/\{p1\}/g, () => pick([...foodTraits, ...mineralTraits, ...plantTraits]));
  result = result.replace(/\{p2\}/g, () => String(randInt(3, 99)));
  result = result.replace(/\{p3\}/g, () => pick([...animalBehaviors, ...plantTraits]));
  result = result.replace(/\{type\}/g, () => category);
  result = result.replace(/\{size\}/g, () => pick(sizes));
  result = result.replace(/\{season\}/g, () => pick(seasons));
  result = result.replace(/\{habitat\}/g, () => pick(habitats));
  result = result.replace(/\{part\}/g, () => pick(parts));

  return result;
}

function generateDescription(
  _city: CityProfile,
  _objectName: string,
  category: CategoryId,
  _fantasyName: string
): string {
  const group = getCategoryGroup(category);
  const templates = DESC_TEMPLATES[group] ?? DESC_TEMPLATES.object!;
  const template = pick(templates);
  return fillTemplate(template, category);
}

// ─── Stats generation ───────────────────────────────────────

type StatTemplate = {
  numerics: Array<{ label: string; value: string }>;
  texts: Array<{ label: string; values: string[] }>;
};

const FOOD_STATS: StatTemplate = {
  numerics: [
    { label: "能量值", value: "kcal" },
    { label: "蛋白质", value: "g" },
    { label: "甜度", value: "Brix" },
    { label: "鲜度", value: "级" },
    { label: "纤维", value: "g" },
  ],
  texts: [
    { label: "口感", values: ["酥脆", "绵软", "Q弹", "沙糯", "爽滑", "醇厚", "轻盈", "扎实"] },
    { label: "风味", values: ["清甜", "浓郁", "辛香", "酸甜", "鲜咸", "微苦回甘", "果香", "奶香"] },
  ],
};

const MINERAL_STATS: StatTemplate = {
  numerics: [
    { label: "硬度", value: "Mohs" },
    { label: "密度", value: "g/cm³" },
    { label: "年代", value: "百万年" },
    { label: "折射率", value: "n" },
    { label: "熔点", value: "°C" },
  ],
  texts: [
    { label: "光泽", values: ["金属光泽", "玻璃光泽", "珍珠光泽", "油脂光泽", "丝绢光泽", "金刚光泽"] },
    { label: "晶系", values: ["立方", "六方", "单斜", "三方", "斜方", "非晶质"] },
  ],
};

const ANIMAL_STATS: StatTemplate = {
  numerics: [
    { label: "体型指数", value: "/100" },
    { label: "敏捷", value: "/100" },
    { label: "寿命", value: "年" },
    { label: "感知", value: "/100" },
    { label: "环境适应", value: "/100" },
  ],
  texts: [
    { label: "稀有度", values: ["常见", "少见", "稀有", "极危", "传说级", "仅存于文献"] },
    { label: "栖息地", values: ["热带雨林", "深海", "高山草甸", "城市缝隙", "沙漠腹地", "湿地", "洞穴深处", "温带阔叶林"] },
  ],
};

const BUILDING_STATS: StatTemplate = {
  numerics: [
    { label: "年代", value: "年" },
    { label: "高度", value: "m" },
    { label: "结构强度", value: "/100" },
    { label: "历史价值", value: "/100" },
  ],
  texts: [
    { label: "风格", values: ["哥特", "巴洛克", "现代主义", "古典中式", "和风", "赛博朋克", "粗野主义", "装饰艺术"] },
    { label: "材质", values: ["花岗岩", "钢筋混凝土", "木结构", "玻璃幕墙", "红砖", "夯土", "大理石", "青铜"] },
  ],
};

const PLANT_STATS: StatTemplate = {
  numerics: [
    { label: "生长周期", value: "天" },
    { label: "株高", value: "cm" },
    { label: "耐寒度", value: "/10" },
    { label: "药用价值", value: "/100" },
  ],
  texts: [
    { label: "花期", values: ["春季", "夏季", "秋季", "冬季", "四季常开", "仅在满月"] },
    { label: "原产地", values: ["东亚", "南美", "非洲草原", "地中海", "喜马拉雅", "亚马逊", "极地苔原"] },
  ],
};

const OBJECT_STATS: StatTemplate = {
  numerics: [
    { label: "耐久度", value: "/100" },
    { label: "重量", value: "kg" },
    { label: "复杂度", value: "/100" },
    { label: "稀有度", value: "/100" },
  ],
  texts: [
    { label: "材质", values: ["金属", "塑料", "木质", "陶瓷", "玻璃", "碳纤维", "皮革", "丝绸"] },
    { label: "年代感", values: ["复古", "现代", "未来感", "永恒经典", "蒸汽朋克", "昭和风"] },
  ],
};

const WATER_STATS: StatTemplate = {
  numerics: [
    { label: "深度", value: "m" },
    { label: "透明度", value: "/100" },
    { label: "流速", value: "m/s" },
    { label: "蓄水量", value: "万m³" },
  ],
  texts: [
    { label: "水质", values: ["清澈见底", "碧绿如玉", "深邃幽蓝", "镜面般平静", "富含矿物质"] },
    { label: "生态特征", values: ["富营养", "贫营养", "温泉地热", "冰川融水", "喀斯特溶蚀"] },
  ],
};

const SKY_STATS: StatTemplate = {
  numerics: [
    { label: "可见度", value: "/100" },
    { label: "持续时间", value: "秒" },
    { label: "能量级", value: "/100" },
  ],
  texts: [
    { label: "类型", values: ["日晕", "极光", "积雨云", "闪电", "彩虹", "晚霞", "流星", "日食"] },
    { label: "预兆", values: ["吉兆", "凶兆", "变革之兆", "轮回之始", "无意义之美"] },
  ],
};

function getStatTemplate(category: CategoryId): StatTemplate {
  const group = getCategoryGroup(category);
  const map: Record<string, StatTemplate> = {
    food: FOOD_STATS,
    mineral: MINERAL_STATS,
    animal: ANIMAL_STATS,
    plant: PLANT_STATS,
    building: BUILDING_STATS,
    water: WATER_STATS,
    sky: SKY_STATS,
    object: OBJECT_STATS,
  };
  return map[group] ?? OBJECT_STATS;
}

function generateStats(category: CategoryId): Array<NumericStat | TextStat> {
  const template = getStatTemplate(category);
  const stats: Array<NumericStat | TextStat> = [];

  const numCount = 2; // fixed at 2 numeric + 1 text = 3 total
  const shuffledNums = [...template.numerics].sort(() => Math.random() - 0.5);
  for (let i = 0; i < numCount; i++) {
    const t = shuffledNums[i]!;
    stats.push({
      type: "numeric",
      label: t.label,
      value: t.value,
      score: randInt(10, 100),
    });
  }

  const textT = pick(template.texts);
  stats.push({
    type: "text",
    label: textT.label,
    value: pick(textT.values),
  });

  return stats;
}

// ─── Fun fact — city flavor goes HERE ───────────────────────

const CITY_FUN_FACTS: Record<string, string[]> = {
  shanghai: [
    "便利店灯光下它总像加了一层滤镜，原因不明。",
    "带它过地铁闸机时，闸机偶尔会慢半拍。",
    "弄堂晾衣杆下的光泽和别处不一样。",
    "据说放进外卖箱里，送达准时率会微妙上升。",
  ],
  beijing: [
    "胡同猫对它格外感兴趣，已有多起目击报告。",
    "景山夕阳下它的颜色会偏向宫墙红。",
    "出租车司机普遍认为车里放它能改善早高峰运气。",
    "有人声称在国子监附近捡到过类似品，后被证实是槐树籽。",
  ],
  chengdu: [
    "茶馆里提起它，必有人凑过来说一段真假难辨的见闻。",
    "菜市场嬢嬢能一眼认出它的品质等级，标准从未书面化。",
    "据说麻将桌旁拥有它的人手气不会太差。",
    "鹤鸣茶社旁放半小时，会有路人主动来讨论它。",
  ],
  chongqing: [
    "带着它坐三号线据说能看到额外的风景。",
    "洪崖洞某层楼梯间有它留下的痕，至今未消。",
    "火锅店老板不承认也不否认它和特辣锅底的关系。",
    "40度夏天它是少数不会变软的东西之一。",
  ],
  guangzhou: [
    "凉茶铺阿伯说它和廿四味之间有种老广才懂的默契。",
    "珠城玻璃幕墙映射下它的影子形状会变。",
    "回南天里所有东西都湿了——除了它。",
    "放阳台一晚，第二天花盆里植物似乎精神了点。",
  ],
  hangzhou: [
    "西湖边的长椅上看它，据说能感到微妙的宁静。",
    "茶园里偶尔会发现它，被归为今年的新现象。",
    "梅雨季里它是少数不长霉的东西。",
    "灵隐寺附近用它许愿的人说效果很好。",
  ],
  xian: [
    "夜市摊主认为它和肉夹馍之间有古老的呼应。",
    "城墙上骑行带着它，每圈感觉都不同。",
    "兵马俑博物馆里有人指着一个俑说它本应握在手里。",
    "古玩市场把它当现代工艺品卖，标签就是这么写的。",
  ],
  shenzhen: [
    "放在电脑旁编译通过率会提高，暂无对照实验。",
    "地铁站曾被误认为新型智能硬件，保安表示常有。",
    "无人机灯光秀期间它的颜色和天空有奇妙呼应。",
    "有传闻腾讯滨海大厦便利店出过它的联名款。",
  ],
  nanjing: [
    "梧桐树下是观察它的最佳地点，大学生们说的。",
    "秦淮河旧书摊的老书里夹着关于它的手写笔记。",
    "鸭子店老板说它和盐水鸭没关系，但说时眨了眨眼。",
    "紫金山晨雾中遇见它是件值得发朋友圈的事。",
  ],
  wuhan: [
    "在热干面旁边它会格外有精神，可能是芝麻酱对比。",
    "东湖绿道带着它骑行，上坡会轻松一些。",
    "轮渡上它和江风有种说不清的互动。",
    "司机说深夜载过携带它的乘客后计价器不那么焦虑。",
  ],
};

// Fallback fun facts for non-city style sources (games, worlds, etc.)
const GENERIC_FUN_FACTS: string[] = [
  "携带它冒险时触发隐藏事件的概率据说会微妙上升。",
  "二手市场上见过它的仿品，气味不对，真品辨认法保密。",
  "在特定光线下它会发出微弱回应，观测者称那天天色不错。",
  "冒险者公会地下室有份笔记提到了它，开头是我敢肯定。",
  "放进背包后在检查点之间移动的速度提了约0.3%。",
  "某次更新日志含糊提到了与它相关的异常行为修复。",
  "地图加载慢的地方偶尔能看见它的轮廓先于其他物体。",
  "停服论坛里有个47回复的帖子专门讨论它的最佳携带时机。",
  "大城市便利店难觅踪迹，小镇杂货铺偶尔会进货。",
  "雨晴阴三种天气下分别观察它，结论是确实不一样。",
];

function generateFunFact(
  city: CityProfile,
  _objectName: string,
  _category: CategoryId,
  _fantasyName: string
): string {
  // Use city-specific facts if available
  const cityFacts = CITY_FUN_FACTS[city.id];
  if (cityFacts) return pick(cityFacts);

  // For any other style source, use generic fun facts
  return pick(GENERIC_FUN_FACTS);
}

// ─── Public API ─────────────────────────────────────────────

export function generateMockCard(
  city: CityProfile,
  objectName: string,
  category: CategoryId,
  imageUrl: string
): AtlasCard {
  const fantasyName = generateFantasyName(city, objectName, category);

  return {
    id: uid(),
    city: city.name,
    originalObjectName: objectName,
    category,
    fantasyName,
    description: generateDescription(city, objectName, category, fantasyName),
    stats: generateStats(category),
    funFact: generateFunFact(city, objectName, category, fantasyName),
    imageUrl,
    createdAt: new Date().toISOString(),
  };
}

export function regenerateMockCard(original: AtlasCard, newFantasyName: string): AtlasCard {
  const city = CITIES.find((c) => c.name === original.city) ?? CITIES[0]!;
  const fantasyName = newFantasyName.trim() || original.fantasyName;

  return {
    ...original,
    id: uid(),
    fantasyName,
    description: generateDescription(city, original.originalObjectName, original.category as CategoryId, fantasyName),
    stats: generateStats(original.category as CategoryId),
    funFact: generateFunFact(city, original.originalObjectName, original.category as CategoryId, fantasyName),
    createdAt: new Date().toISOString(),
  };
}
