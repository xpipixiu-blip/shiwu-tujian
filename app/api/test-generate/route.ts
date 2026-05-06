import { NextResponse } from "next/server";
import { chatCompletion, ApiError, maskKey } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { userApiKey, userBaseUrl, userModelId } = body as {
    userApiKey?: string;
    userBaseUrl?: string;
    userModelId?: string;
  };

  const modelId = userModelId || "default";
  const key = userApiKey || process.env.SJTU_API_KEY;

  if (!key) {
    return NextResponse.json(
      { error: "API key not configured." },
      { status: 500 }
    );
  }

  try {
    const content = await chatCompletion(
      modelId,
      [
        { role: "user", content: "Reply with exactly one word: ok" },
      ],
      {
        temperature: 0,
        maxTokens: 16,
        userApiKey,
        userBaseUrl,
      }
    );

    const ok = content.trim().toLowerCase().includes("ok");
    return NextResponse.json({
      success: ok,
      message: ok ? "连接成功" : `Unexpected response: ${content.slice(0, 50)}`,
    });
  } catch (e) {
    if (e instanceof ApiError) {
      let message = e.message;
      if (e.status === 401 || e.status === 403) {
        message = "API Key 无效或被拒绝访问";
      } else if (e.status === 404) {
        message = "Base URL 无法访问或 Model ID 无效";
      } else if (e.status >= 500) {
        message = "上游接口报错，请检查 Base URL 和 API Key";
      }
      return NextResponse.json(
        { success: false, message, details: e.details },
        { status: e.status }
      );
    }
    return NextResponse.json(
      { success: false, message: `请求超时或网络错误: ${(e as Error).message}` },
      { status: 502 }
    );
  }
}
