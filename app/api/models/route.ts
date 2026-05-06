import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function buildResponse(models: Array<{ id: string; owned_by?: string }>, defaultModelId?: string) {
  return NextResponse.json({ models, defaultModelId: defaultModelId ?? null });
}

function buildError(message: string, status = 502, hint?: string) {
  return NextResponse.json({ error: message, hint: hint ?? null }, { status });
}

async function fetchModels(baseUrl: string, apiKey: string): Promise<Array<{ id: string; owned_by?: string }>> {
  const res = await fetch(`${baseUrl}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`Upstream error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const rawList = data.data ?? data.models ?? data;
  return Array.isArray(rawList)
    ? rawList.map((m: { id?: string; owned_by?: string }) => ({
        id: m.id ?? "unknown",
        owned_by: m.owned_by,
      }))
    : [];
}

/** Site default — uses server env vars */
export async function GET() {
  const key = process.env.SJTU_API_KEY;
  const baseUrl = process.env.SJTU_BASE_URL || "https://models.sjtu.edu.cn/api/v1";
  const defaultModelId = process.env.DEFAULT_MODEL_ID || null;

  if (!key) {
    return buildError("API key not configured.", 500, "站点默认模型暂不可用，你可以在 API 设置中填写自己的 API Key");
  }

  try {
    const models = await fetchModels(baseUrl, key);
    return buildResponse(models, defaultModelId ?? undefined);
  } catch (e) {
    return buildError(
      `模型列表获取失败。你可以手动输入模型 ID 后继续使用。`,
      502,
      (e as Error).message
    );
  }
}

/** BYOK mode — user provides credentials in request body */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const userApiKey = (body as Record<string, string>).userApiKey;
  const userBaseUrl = (body as Record<string, string>).userBaseUrl;

  const key = userApiKey || process.env.SJTU_API_KEY;
  const baseUrl = userBaseUrl || process.env.SJTU_BASE_URL || "https://models.sjtu.edu.cn/api/v1";
  const defaultModelId = process.env.DEFAULT_MODEL_ID || null;

  if (!key) {
    return buildError("API key not configured.", 500, "请在 API 设置中填写 API Key");
  }

  try {
    const models = await fetchModels(baseUrl, key);
    return buildResponse(models, defaultModelId ?? undefined);
  } catch (e) {
    return buildError(
      `模型列表获取失败。你可以手动输入模型 ID 后继续使用。`,
      502,
      (e as Error).message
    );
  }
}
