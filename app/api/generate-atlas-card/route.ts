import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { chatCompletion, extractJSON, ApiError } from "@/lib/api-helpers";
import { atlasCardContentSchema, analysisResultSchema } from "@/lib/schemas";
import { CATEGORIES } from "@/lib/categories";
import { resolveStyleProfile as resolveCityProfile, isPlainIntroMode } from "@/lib/cities";
import { resolveStyleProfile } from "@/lib/style-profiles";
import type { StyleProfile } from "@/lib/style-profiles";
import type { AtlasCard } from "@/lib/types";

const CATEGORY_LIST = CATEGORIES.join("、");
let idCounter = 0;
function uid(): string { idCounter += 1; return `card-${Date.now()}-${idCounter}`; }
type ByokParams = { userApiKey?: string; userBaseUrl?: string };

async function analyzeObject(imageBase64: string, modelId: string, byok?: ByokParams) {
  const content = await chatCompletion(modelId, [
    { role: "system", content: "精准识别照片中最主要的现实物体，从固定分类中选择最合适的一个。" },
    { role: "user", content: [{ type: "text", text: `识别这张照片中最主要的现实物体。返回 JSON：{ "objectName": "具体名称", "category": "分类" }。可选分类：${CATEGORY_LIST}。只返回 JSON。` }, { type: "image_url", image_url: { url: imageBase64, detail: "auto" } }] },
  ], { temperature: 0.3, maxTokens: 256, jsonMode: true, userApiKey: byok?.userApiKey, userBaseUrl: byok?.userBaseUrl });
  const parsed = analysisResultSchema.parse(JSON.parse(extractJSON(content)));
  if (!CATEGORIES.includes(parsed.category as typeof CATEGORIES[number])) {
    const m = CATEGORIES.find(c => c === parsed.category || c.includes(parsed.category) || parsed.category.includes(c));
    if (m) parsed.category = m;
  }
  return parsed;
}

async function generateCardContent(
  sp: StyleProfile, objectName: string, category: string,
  modelId: string, plain: boolean, byok?: ByokParams
) {
  const systemPrompt = plain
    ? "你是「识物图鉴」的普通介绍执笔人。你为现实物体撰写客观、准确的介绍。stats 只放可打分属性（0-100），facts 放客观事实。"
    : `你是「识物图鉴」的执笔人。你要做的是：吸收一个设定世界的气质，然后用这种气质去描述一个现实物体。不是把设定名词贴在物品上，而是让物品像从那个世界里自然生长出来的。

核心原则：
1. 先理解设定氛围，再结合物体本身
2. 不要直接把设定来源名粘到物品名前面
3. 如果去掉设定名词后描述仍然成立→氛围融合太弱，要改写
4. 如果全靠地名/专有名词撑起描述→融合太硬，要改写
5. 最终的卡片应该像"这个设定世界里自然存在的物品说明"，不是"普通物品+设定标签"

重要——stats 和 facts 的区别：
- stats：只有可打分的属性，如甜度/酸爽度/多汁度/酥脆度/耐用度/光泽度/收藏感。value 是纯数字字符串如"65"，score 是 0-100 评分
- facts：客观事实信息，如成熟季节/生长习性/最佳赏味/保存方式/产地/核心质地/材质/用途
- 绝不要把事实类信息放进 stats`;

  const statExamples: Record<string, string> = {
    "水果": "甜度、酸爽度、多汁度、香气、新鲜度",
    "蔬菜": "鲜嫩度、脆爽度、甜度、多汁度",
    "谷物": "饱满度、香气、口感细腻度",
    "菌类": "鲜味度、嫩滑度、香气",
    "花卉": "观赏度、花期持久度、香气浓度",
    "树木": "生命力、荫蔽度、木质硬度",
    "香料": "辛香度、纯度、温润度",
    "饮料": "醇厚度、回甘度、清爽度",
    "甜品": "甜度、绵密度、香气",
    "熟食": "酥脆度、油香度、松软度",
    "肉类": "鲜嫩度、肉香度、多汁度",
    "鱼类": "鲜度、肉质弹性、油脂度",
    "矿物": "光泽度、硬度感、纹理清晰度、收藏感",
    "岩石": "硬度感、纹理度、质感",
    "金属": "光泽度、硬度感、纯净度",
    "宝石": "光泽度、净度、稀有度、收藏感",
    "建筑物": "宏伟度、结构精巧度、历史厚重感",
    "家具": "实用度、舒适度、精巧度",
    "家电": "实用度、耐用度、精巧度",
    "工具": "实用度、耐用度、便携度",
    "服饰": "美观度、舒适度、耐用度",
    "文具": "实用度、精巧度、书写流畅度",
    "玩具": "趣味度、精巧度、收藏感",
    "电子设备": "性能感、便携度、耐用度",
    "日用品": "实用度、耐用度、便携度、精巧度",
  };
  const examples = statExamples[category] ?? "属性值请用 0-100 评分";

  const userPrompt = plain ? `请为以下物体撰写普通介绍。
物体：${objectName}
分类：${category}
推荐 stats：${examples}

返回 JSON：
{
  "fantasyName": "${objectName}",
  "description": "1-2句普通介绍（≤60字）",
  "stats": [
    { "type": "numeric", "label": "甜度", "value": "65", "score": 65 },
    { "type": "numeric", "label": "酸爽度", "value": "45", "score": 45 },
    { "type": "text", "label": "口感", "value": "清脆爽口" }
  ],
  "funFact": "1句真实小知识（≤40字）",
  "facts": [
    { "label": "成熟季节", "value": "春末夏初" },
    { "label": "最佳赏味", "value": "采摘后3天内" }
  ]
}

规则：
- stats：恰好3条，其中至少2条numeric（带0-100的score）+ 至多1条text（纯文字描述）
- numeric stat 的 value 是纯数字字符串如"65"，不要带格/天/小时等单位
- 不要把"季节/习性/赏味/保存/周期/产地/栖息地"放到 stats——这些放进 facts
- facts：2-3条客观事实维度，根据分类选择合适的（产地/季节/习性/质地/用途/材质/风味/营养等）
- 只输出 JSON`
    : `请为以下物体撰写图鉴卡片。

设定氛围
- 风格方向：${sp.styleDirection}
${sp.moodKeywords.length ? `- 吸收这些气质：${sp.moodKeywords.join("、")}` : ""}
- 物体：${objectName} / 分类：${category}
推荐 stats：${examples}

返回 JSON：
{
  "fantasyName": "幻想名（4-8字优先）",
  "description": "1-2句（≤60字）",
  "stats": [
    { "type": "numeric", "label": "甜度", "value": "65", "score": 65 },
    { "type": "numeric", "label": "酸爽度", "value": "45", "score": 45 },
    { "type": "text", "label": "口感", "value": "清脆爽口" }
  ],
  "funFact": "1句（≤40字）",
  "facts": [
    { "label": "成熟季节", "value": "春末夏初" },
    { "label": "最佳赏味", "value": "采摘后3天内" }
  ]
}

写作要求：
- fantasyName：有创意，4-8字优先。${sp.avoidNames.length ? `严禁包含：${sp.avoidNames.join("、")}` : "严禁包含风格来源名或地标名"}
- description：围绕物体本身的幻想特质，禁止出现任何地名或专有名词，≤60字
- stats：恰好3条，至少2条numeric + 至多1条text
  * numeric 的 label 必须是可打分属性（≤4字），从推荐列表中选最合适的
  * numeric 的 value 是纯数字字符串（如"65"），score 与 value 一致（0-100）
  * 绝不要把成熟季节/生长习性/最佳赏味/保存方式/周期/产地放进stats——这些是facts
  * text stat 用于无法打分但值得一提的属性，value ≤6字
- funFact：≤40字，轻轻融入设定气质，克制自然
- facts：2-3条该物品的客观事实维度（产地/季节/生长习性/最佳赏味/核心质地/保存方式/用途/材质等），风格化模式下仍是真实事实

自检（心里做，不输出）：
1. stats 里有没有"季节/习性/赏味/周期/产地"？有→移到 facts
2. numeric stat 的 value 是纯数字吗？带格/天/小时后缀了吗？→只能纯数字
3. 把设定名词全部去掉，描述还成立吗？成立→氛围太弱

只输出 JSON`;

  const content = await chatCompletion(modelId, [
    { role: "system", content: systemPrompt }, { role: "user", content: userPrompt },
  ], { temperature: plain ? 0.4 : 0.8, maxTokens: 1024, jsonMode: true, userApiKey: byok?.userApiKey, userBaseUrl: byok?.userBaseUrl });
  return atlasCardContentSchema.parse(JSON.parse(extractJSON(content)));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  const { image, city, modelId, userApiKey, userBaseUrl, userModelId } = body as Record<string, string | undefined>;
  const effectiveModelId = (userModelId || modelId) as string | undefined;
  if (!image || !city || !effectiveModelId) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const cityProfile = resolveCityProfile(city);
  const plain = isPlainIntroMode(city!);
  const byok: ByokParams = { userApiKey, userBaseUrl };
  const sp = resolveStyleProfile(city!);

  try {
    const analysis = await analyzeObject(image, effectiveModelId, byok);
    const content = await generateCardContent(sp, analysis.objectName, analysis.category, effectiveModelId, plain, byok);
    const card: AtlasCard = { id: uid(), city: cityProfile.name, originalObjectName: analysis.objectName, category: analysis.category, fantasyName: content.fantasyName, description: content.description, stats: content.stats, funFact: content.funFact, facts: content.facts, imageUrl: image, createdAt: new Date().toISOString() };
    return NextResponse.json({ card });
  } catch (e) {
    if (e instanceof ApiError) return NextResponse.json({ error: e.message, details: e.details }, { status: e.status });
    if (e instanceof SyntaxError) return NextResponse.json({ error: "AI 返回了无效的 JSON", details: e.message }, { status: 502 });
    if (e instanceof ZodError) return NextResponse.json({ error: "AI 返回的数据格式不符合要求", details: e.message }, { status: 502 });
    throw e;
  }
}
