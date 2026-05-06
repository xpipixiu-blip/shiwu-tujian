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
    ? "你是「识物图鉴」的普通介绍执笔人。你为现实物体撰写客观、准确的介绍。"
    : "你是「识物图鉴」的执笔人。你为现实物体撰写幻想风格的图鉴卡片。";

  const userPrompt = plain ? `请为以下物体撰写普通介绍。
物体：${objectName}
分类：${category}
返回 JSON：{ "fantasyName": "${objectName}", "description": "1-2句普通介绍（≤60字）", "stats": [ { "type": "numeric", "label": "属性（≤4字）", "value": "单位（≤4字）", "score": 50 }, { "type": "numeric", "label": "属性（≤4字）", "value": "单位（≤4字）", "score": 70 }, { "type": "text", "label": "属性（≤4字）", "value": "值（≤6字）" } ], "funFact": "1句真实小知识（≤40字）" }
规则 - fantasyName：使用真实物品名称 - description：客观自然清楚 - stats：恰好3条，2+1 - funFact：真实冷知识 - 只输出 JSON`
    : `请为以下物体撰写一张图鉴卡片。
背景
- 风格方向：${sp.styleDirection}
${sp.moodKeywords.length ? `- 氛围关键词：${sp.moodKeywords.join("、")}` : ""}
- 物体：${objectName}
- 分类：${category}
返回 JSON：{ "fantasyName": "幻想名（4-8字优先，最多12字）", "description": "1-2句（≤60字）", "stats": [ { "type": "numeric", "label": "属性（≤4字）", "value": "单位（≤4字）", "score": 50 }, { "type": "numeric", "label": "属性（≤4字）", "value": "单位（≤4字）", "score": 70 }, { "type": "text", "label": "属性（≤4字）", "value": "值（≤6字）" } ], "funFact": "1句（≤40字）" }
规则
- fantasyName：有创意，4-8字优先。${sp.avoidNames.length ? `禁止包含：${sp.avoidNames.join("、")}` : "禁止包含风格来源名或地标名"}
- description：围绕物体本身的幻想设定，禁止出现地名或专有名词，≤60字
- stats：恰好3条，2条numeric + 1条text，label ≤4字
- funFact：≤40字，可以轻轻体现风格方向的氛围，克制自然，不堆专有名词
- 只输出 JSON`;

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
    const card: AtlasCard = { id: uid(), city: cityProfile.name, originalObjectName: analysis.objectName, category: analysis.category, fantasyName: content.fantasyName, description: content.description, stats: content.stats, funFact: content.funFact, imageUrl: image, createdAt: new Date().toISOString() };
    return NextResponse.json({ card });
  } catch (e) {
    if (e instanceof ApiError) return NextResponse.json({ error: e.message, details: e.details }, { status: e.status });
    if (e instanceof SyntaxError) return NextResponse.json({ error: "AI 返回了无效的 JSON", details: e.message }, { status: 502 });
    if (e instanceof ZodError) return NextResponse.json({ error: "AI 返回的数据格式不符合要求", details: e.message }, { status: 502 });
    throw e;
  }
}
