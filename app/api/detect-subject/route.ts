import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { z } from "zod";
import { chatCompletion, extractJSON, ApiError } from "@/lib/api-helpers";

const subjectBoxSchema = z.object({
  centerX: z.number().min(0).max(1000),
  centerY: z.number().min(0).max(1000),
  width: z.number().min(10).max(1000),
  height: z.number().min(10).max(1000),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { image, modelId, userApiKey, userBaseUrl, userModelId } = body as {
    image?: string; modelId?: string;
    userApiKey?: string; userBaseUrl?: string; userModelId?: string;
  };

  const effectiveModelId = userModelId || modelId;
  if (!image || !effectiveModelId) {
    return NextResponse.json({ error: "Missing required fields: image, modelId" }, { status: 400 });
  }

  try {
    const systemPrompt = `你是一个精准的主体检测器。识别照片中最主要的物体，返回它的包围盒坐标。使用 1000x1000 坐标系统。`;
    const userPrompt = `请识别这张照片中最主要的主体物体。
使用 1000x1000 坐标系统返回包围盒信息。
返回 JSON：{ "centerX": 500, "centerY": 450, "width": 300, "height": 350 }
- 包围盒要紧贴主体边缘
- 不要包含过多背景
- 只返回 JSON`;

    const content = await chatCompletion(effectiveModelId, [
      { role: "system", content: systemPrompt },
      { role: "user", content: [
        { type: "text", text: userPrompt },
        { type: "image_url", image_url: { url: image, detail: "auto" } },
      ]},
    ], { temperature: 0.2, maxTokens: 256, jsonMode: true, userApiKey, userBaseUrl });

    const json = JSON.parse(extractJSON(content));
    const box = subjectBoxSchema.parse(json);
    return NextResponse.json({ subjectBox: box });
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message, details: e.details }, { status: e.status });
    }
    if (e instanceof SyntaxError) {
      return NextResponse.json({ error: "AI 返回了无效 JSON，请重试" }, { status: 502 });
    }
    if (e instanceof ZodError) {
      return NextResponse.json({ error: "AI 返回的坐标格式不正确，请重试", details: e.message }, { status: 502 });
    }
    throw e;
  }
}
