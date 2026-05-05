export type NumericStat = {
  type: "numeric";
  label: string;
  value: string;
  score: number;
};

export type TextStat = {
  type: "text";
  label: string;
  value: string;
};

export type AtlasCard = {
  id: string;
  city: string;
  originalObjectName: string;
  category: string;
  fantasyName: string;
  description: string;
  stats: Array<NumericStat | TextStat>;
  funFact: string;
  imageUrl: string;
  croppedImageUrl?: string;
  createdAt: string;
};

export type CategoryId =
  | "蔬菜"
  | "水果"
  | "谷物"
  | "菌类"
  | "花卉"
  | "树木"
  | "草本植物"
  | "种子"
  | "香料"
  | "饮料"
  | "甜品"
  | "熟食"
  | "肉类"
  | "鱼类"
  | "贝类"
  | "昆虫"
  | "鸟类"
  | "哺乳动物"
  | "爬行动物"
  | "两栖动物"
  | "矿物"
  | "岩石"
  | "金属"
  | "宝石"
  | "建筑物"
  | "道路设施"
  | "交通工具"
  | "家具"
  | "家电"
  | "工具"
  | "服饰"
  | "文具"
  | "书籍纸张"
  | "玩具"
  | "电子设备"
  | "容器器皿"
  | "日用品"
  | "广告招牌"
  | "艺术雕塑"
  | "古迹遗迹"
  | "天象景观"
  | "水体"
  | "其他";
