import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { chatCompletion, extractJSON, ApiError } from "@/lib/api-helpers";
import { atlasCardContentSchema, analysisResultSchema } from "@/lib/schemas";
import { CATEGORIES } from "@/lib/categories";
import { resolveStyleProfile } from "@/lib/cities";
import type { CityProfile } from "@/lib/cities";
import type { AtlasCard } from "@/lib/types";

const CATEGORY_LIST = CATEGORIES.join("、");

let idCounter = 0;
function uid(): string {
  idCounter += 1;
  return `card-${Date.now()}-${idCounter}`;
}

// ── Vision: identify object + category ──────────────────────

async function analyzeObject(
  imageBase64: string,
  modelId: string
): Promise<{ objectName: string; category: string }> {
  const systemPrompt = `你是一个精准的物体识别器。识别照片中最主要的现实物体，并从固定分类中选择最合适的一个。`;

  const userPrompt = `请识别这张照片中最主要的现实物体。

返回 JSON：
{
  "objectName": "物体的具体名称（口语化，如"胡萝卜"、"橘猫"、"红绿灯"）",
  "category": "分类（从以下列表中选择一个）"
}

可选分类：${CATEGORY_LIST}

只返回 JSON，不要任何额外文字。`;

  const content = await chatCompletion(modelId, [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: [
        { type: "text", text: userPrompt },
        {
          type: "image_url",
          image_url: { url: imageBase64, detail: "auto" },
        },
      ],
    },
  ], { temperature: 0.3, maxTokens: 256, jsonMode: true });

  const json = JSON.parse(extractJSON(content));
  const parsed = analysisResultSchema.parse(json);

  // Validate category is in our enum
  if (!CATEGORIES.includes(parsed.category as typeof CATEGORIES[number])) {
    const match = CATEGORIES.find(
      (c) => c === parsed.category || c.includes(parsed.category) || parsed.category.includes(c)
    );
    if (match) {
      parsed.category = match;
    }
  }

  return parsed;
}

// ── Generate card content ────────────────────────────────────

function buildStylePrompt(profile: CityProfile): string {
  // For preset cities/games, use their vibe and tone
  if (profile.vibe && profile.vibe !== profile.name) {
    return `${profile.name}（${profile.vibe}）`;
  }
  return profile.name;
}

async function generateCardContent(
  styleProfile: CityProfile,
  objectName: string,
  category: string,
  modelId: string
): Promise<{
  fantasyName: string;
  description: string;
  stats: Array<{ type: "numeric"; label: string; value: string; score: number } | { type: "text"; label: string; value: string }>;
  funFact: string;
}> {
  const styleDesc = buildStylePrompt(styleProfile);

  const systemPrompt = `你是「识物图鉴」的执笔人。你为现实物体撰写幻想风格的图鉴卡片。`;

  const userPrompt = `请为以下物体撰写一张图鉴卡片。

背景
- 风格来源：${styleDesc}
- 物体：${objectName}
- 分类：${category}

返回 JSON：
{
  "fantasyName": "幻想名（4-8字优先，最多12字）",
  "description": "1-2句（≤60字）",
  "stats": [
    { "type": "numeric", "label": "属性（≤4字）", "value": "单位（≤4字）", "score": 50 },
    { "type": "numeric", "label": "属性（≤4字）", "value": "单位（≤4字）", "score": 70 },
    { "type": "text", "label": "属性（≤4字）", "value": "值（≤6字）" }
  ],
  "funFact": "1句（≤40字）"
}

规则
- fantasyName：有创意，不含风格来源名或地标名，4-8字优先
- description：围绕物体本身的幻想设定，不含风格来源名，≤60字
- stats：恰好3条，2条numeric + 1条text
  - 根据分类选属性（食物用能量/甜度/口感，矿物用硬度/光泽，动物用体型/敏捷/稀有度等）
  - label ≤4字，value/单位 ≤6字
- funFact：≤40字，唯一可以融入风格来源氛围的位置
  - 真实城市→生活感/天气/饮食节奏
  - 游戏/虚构世界→冒险感/世界观氛围
  - 克制自然，不堆关键词，不直接抄版权文本
- 整体：幻想+轻微幽默+克制自然
- 只输出 JSON，不要 Markdown，不要额外文字`;

  const content = await chatCompletion(modelId, [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ], { temperature: 0.8, maxTokens: 1024, jsonMode: true });

  const json = JSON.parse(extractJSON(content));
  return atlasCardContentSchema.parse(json);
}

// ── Route handler ────────────────────────────────────────────

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { image, city, modelId } = body as {
    image?: string;
    city?: string;
    modelId?: string;
  };

  if (!image || !city || !modelId) {
    return NextResponse.json(
      { error: "Missing required fields: image, city, modelId" },
      { status: 400 }
    );
  }

  // Accept ANY non-empty input — resolve to a profile (preset or generic)
  const styleProfile = resolveStyleProfile(city);

  try {
    const analysis = await analyzeObject(image, modelId);
    const content = await generateCardContent(styleProfile, analysis.objectName, analysis.category, modelId);

    const card: AtlasCard = {
      id: uid(),
      city: styleProfile.name,
      originalObjectName: analysis.objectName,
      category: analysis.category,
      fantasyName: content.fantasyName,
      description: content.description,
      stats: content.stats,
      funFact: content.funFact,
      imageUrl: image,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ card });
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json(
        { error: e.message, details: e.details },
        { status: e.status }
      );
    }
    if (e instanceof SyntaxError) {
      return NextResponse.json(
        { error: "AI 返回了无效的 JSON，请重试", details: e.message },
        { status: 502 }
      );
    }
    if (e instanceof ZodError) {
      return NextResponse.json(
        { error: "AI 返回的数据格式不符合要求，请重试", details: e.message },
        { status: 502 }
      );
    }
    throw e;
  }
}
