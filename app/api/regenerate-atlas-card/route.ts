import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { chatCompletion, extractJSON, ApiError } from "@/lib/api-helpers";
import { atlasCardContentSchema } from "@/lib/schemas";
import { isPlainIntroMode } from "@/lib/cities";
import { resolveStyleProfile } from "@/lib/style-profiles";
import type { StyleProfile } from "@/lib/style-profiles";

type ByokParams = { userApiKey?: string; userBaseUrl?: string };

async function regenerateContent(
  sp: StyleProfile, objectName: string, category: string,
  newFantasyName: string, modelId: string, plain: boolean, byok?: ByokParams
) {
  const systemPrompt = plain
    ? "你是「识物图鉴」的普通介绍执笔人。用户修改了物品名称，你根据新名称重新生成其余内容。stats 只放可打分属性（0-100），facts 放客观事实。"
    : "你是「识物图鉴」的执笔人。用户修改了卡片名称，你根据新名称重新生成其余内容。吸收设定气质，不是复读名词。stats 只放可打分属性，facts 放客观事实，二者不混淆。";

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

  const userPrompt = plain ? `请为以下物体重新生成普通介绍。
物体：${objectName} / 分类：${category} / 新名称：${newFantasyName}
推荐 stats：${examples}

返回 JSON：
{
  "fantasyName": "${newFantasyName}",
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
- fantasyName 不修改
- stats：恰好3条，2 numeric（带0-100 score）+ 1 text
- numeric stat 的 value 是纯数字字符串如"65"，不要带格/天/小时等单位
- 不要把"季节/习性/赏味/保存/周期/产地"放到stats——这些放进facts
- facts：2-3条客观事实
- 只输出 JSON`
    : `请为以下物体重新生成图鉴卡片内容。

设定氛围
- 风格方向：${sp.styleDirection}
${sp.moodKeywords.length ? `- 吸收这些气质：${sp.moodKeywords.join("、")}` : ""}
- 物体：${objectName} / 分类：${category}
- 用户新名称：${newFantasyName}
推荐 stats：${examples}

返回 JSON：
{
  "fantasyName": "${newFantasyName}",
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

要求：
- fantasyName 不修改
- description：围绕物体幻想特质，≤60字，${sp.avoidNames.length ? `严禁包含：${sp.avoidNames.join("、")}` : "严禁出现地名或专有名词"}
- stats：恰好3条，至少2条numeric + 至多1条text
  * numeric 的 label 必须是可打分属性（≤4字），从推荐列表中选
  * numeric 的 value 是纯数字字符串（如"65"），score 与 value 一致（0-100）
  * 绝不要把季节/习性/赏味/保存/周期/产地放进stats——放进facts
- funFact：≤40字，轻轻融入设定气质
- facts：2-3条客观事实维度（产地/季节/习性/质地/用途等），风格化模式下仍是真实事实
- 吸收气质，不堆名词
- 只输出 JSON`;

  const content = await chatCompletion(modelId, [
    { role: "system", content: systemPrompt }, { role: "user", content: userPrompt },
  ], { temperature: plain ? 0.4 : 0.8, maxTokens: 1024, jsonMode: true, userApiKey: byok?.userApiKey, userBaseUrl: byok?.userBaseUrl });
  return atlasCardContentSchema.parse(JSON.parse(extractJSON(content)));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  const { city, modelId, originalObjectName, category, userEditedFantasyName, userApiKey, userBaseUrl, userModelId } = body as Record<string, string | undefined>;
  const effectiveModelId = (userModelId || modelId) as string | undefined;
  if (!city || !effectiveModelId || !originalObjectName || !category || !userEditedFantasyName) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const plain = isPlainIntroMode(city);
  const sp = resolveStyleProfile(city);
  const byok: ByokParams = { userApiKey, userBaseUrl };

  try {
    const content = await regenerateContent(sp, originalObjectName, category, userEditedFantasyName, effectiveModelId, plain, byok);
    return NextResponse.json({ fantasyName: content.fantasyName, description: content.description, stats: content.stats, funFact: content.funFact, facts: content.facts });
  } catch (e) {
    if (e instanceof ApiError) return NextResponse.json({ error: e.message, details: e.details }, { status: e.status });
    if (e instanceof SyntaxError) return NextResponse.json({ error: "AI 返回了无效的 JSON", details: e.message }, { status: 502 });
    if (e instanceof ZodError) return NextResponse.json({ error: "AI 返回的数据格式不符合要求", details: e.message }, { status: 502 });
    throw e;
  }
}
