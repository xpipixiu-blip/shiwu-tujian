import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { chatCompletion, extractJSON, ApiError } from "@/lib/api-helpers";
import { atlasCardContentSchema } from "@/lib/schemas";
import { resolveStyleProfile as resolveCityProfile, isPlainIntroMode } from "@/lib/cities";
import { resolveStyleProfile } from "@/lib/style-profiles";
import type { StyleProfile } from "@/lib/style-profiles";

type ByokParams = { userApiKey?: string; userBaseUrl?: string };

async function regenerateContent(
  sp: StyleProfile, objectName: string, category: string,
  newFantasyName: string, modelId: string, plain: boolean, byok?: ByokParams
) {
  const systemPrompt = plain
    ? "你是「识物图鉴」的普通介绍执笔人。用户修改了物品名称，你根据新名称重新生成其余内容。"
    : "你是「识物图鉴」的执笔人。用户修改了图鉴卡片的名称，根据新名称重新生成其余内容。";

  const userPrompt = plain ? `请为以下物体重新生成普通介绍。
物体：${objectName}
分类：${category}
用户新名称：${newFantasyName}
返回 JSON：{ "fantasyName": "${newFantasyName}", "description": "1-2句普通介绍（≤60字）", "stats": [ { "type": "numeric", "label": "属性（≤4字）", "value": "单位（≤4字）", "score": 50 }, { "type": "numeric", "label": "属性（≤4字）", "value": "单位（≤4字）", "score": 70 }, { "type": "text", "label": "属性（≤4字）", "value": "值（≤6字）" } ], "funFact": "1句真实小知识（≤40字）" }
规则 - fantasyName 不修改 - description：客观自然 - stats：恰好3条 - funFact：真实冷知识 - 只输出 JSON`
    : `请为以下物体重新生成图鉴卡片内容。
背景
- 风格方向：${sp.styleDirection}
- ${sp.moodKeywords.length ? `氛围关键词：${sp.moodKeywords.join("、")}` : ""}
- 物体：${objectName}
- 分类：${category}
- 用户新名称：${newFantasyName}
返回 JSON：{ "fantasyName": "${newFantasyName}", "description": "1-2句（≤60字）", "stats": [ { "type": "numeric", "label": "属性（≤4字）", "value": "单位（≤4字）", "score": 50 }, { "type": "numeric", "label": "属性（≤4字）", "value": "单位（≤4字）", "score": 70 }, { "type": "text", "label": "属性（≤4字）", "value": "值（≤6字）" } ], "funFact": "1句（≤40字）" }
规则
- fantasyName 不修改
- description：围绕物体幻想设定，${sp.avoidNames.length ? `禁止包含：${sp.avoidNames.join("、")}` : "禁止出现地名或专有名词"}，≤60字
- stats：恰好3条，2条numeric + 1条text
- funFact：≤40字，可以轻轻体现氛围，但克制自然
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
  if (!city || !effectiveModelId || !originalObjectName || !category || !userEditedFantasyName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const plain = isPlainIntroMode(city);
  const sp = resolveStyleProfile(city);
  const byok: ByokParams = { userApiKey, userBaseUrl };

  try {
    const content = await regenerateContent(sp, originalObjectName, category, userEditedFantasyName, effectiveModelId, plain, byok);
    return NextResponse.json({ fantasyName: content.fantasyName, description: content.description, stats: content.stats, funFact: content.funFact });
  } catch (e) {
    if (e instanceof ApiError) return NextResponse.json({ error: e.message, details: e.details }, { status: e.status });
    if (e instanceof SyntaxError) return NextResponse.json({ error: "AI 返回了无效的 JSON", details: e.message }, { status: 502 });
    if (e instanceof ZodError) return NextResponse.json({ error: "AI 返回的数据格式不符合要求", details: e.message }, { status: 502 });
    throw e;
  }
}
