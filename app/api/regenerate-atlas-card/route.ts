import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { chatCompletion, extractJSON, ApiError } from "@/lib/api-helpers";
import { atlasCardContentSchema } from "@/lib/schemas";
import { resolveStyleProfile } from "@/lib/cities";
import type { CityProfile } from "@/lib/cities";

let idCounter = 0;
function uid(): string {
  idCounter += 1;
  return `card-${Date.now()}-${idCounter}`;
}

function buildStylePrompt(profile: CityProfile): string {
  if (profile.vibe && profile.vibe !== profile.name) {
    return `${profile.name}（${profile.vibe}）`;
  }
  return profile.name;
}

async function regenerateContent(
  styleProfile: CityProfile,
  objectName: string,
  category: string,
  newFantasyName: string,
  modelId: string
) {
  const styleDesc = buildStylePrompt(styleProfile);

  const systemPrompt = `你是「识物图鉴」的执笔人。用户修改了图鉴卡片的名称，根据新名称重新生成其余内容。`;

  const userPrompt = `请为以下物体重新生成图鉴卡片内容。

背景
- 风格来源：${styleDesc}
- 物体：${objectName}
- 分类：${category}
- 用户新名称：${newFantasyName}

返回 JSON：
{
  "fantasyName": "${newFantasyName}",
  "description": "1-2句（≤60字）",
  "stats": [
    { "type": "numeric", "label": "属性（≤4字）", "value": "单位（≤4字）", "score": 50 },
    { "type": "numeric", "label": "属性（≤4字）", "value": "单位（≤4字）", "score": 70 },
    { "type": "text", "label": "属性（≤4字）", "value": "值（≤6字）" }
  ],
  "funFact": "1句（≤40字）"
}

规则
- fantasyName 使用上面指定的名称，不修改
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

  const { city, modelId, originalObjectName, category, userEditedFantasyName } = body as {
    city?: string;
    modelId?: string;
    originalObjectName?: string;
    category?: string;
    userEditedFantasyName?: string;
  };

  if (!city || !modelId || !originalObjectName || !category || !userEditedFantasyName) {
    return NextResponse.json(
      { error: "Missing required fields: city, modelId, originalObjectName, category, userEditedFantasyName" },
      { status: 400 }
    );
  }

  // Accept ANY non-empty style source
  const styleProfile = resolveStyleProfile(city);

  try {
    const content = await regenerateContent(
      styleProfile,
      originalObjectName,
      category,
      userEditedFantasyName,
      modelId
    );

    return NextResponse.json({
      fantasyName: content.fantasyName,
      description: content.description,
      stats: content.stats,
      funFact: content.funFact,
    });
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
