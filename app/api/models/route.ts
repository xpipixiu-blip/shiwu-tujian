import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const userApiKey = (body as Record<string, string>).userApiKey;
  const userBaseUrl = (body as Record<string, string>).userBaseUrl;

  const key = userApiKey || process.env.SJTU_API_KEY;
  const baseUrl = userBaseUrl || process.env.SJTU_BASE_URL || "https://models.sjtu.edu.cn/api/v1";

  if (!key) {
    return NextResponse.json(
      {
        error: "API key not configured.",
        hint: "站点默认模型暂不可用，你可以在 API 设置中填写自己的 API Key 继续使用",
      },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${res.status} ${res.statusText}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const rawList = data.data ?? data.models ?? data;
    const models = Array.isArray(rawList)
      ? rawList.map((m: { id?: string; owned_by?: string }) => ({
          id: m.id ?? "unknown",
          owned_by: m.owned_by,
        }))
      : [];

    return NextResponse.json({ models });
  } catch (e) {
    return NextResponse.json(
      { error: `Failed to fetch models: ${(e as Error).message}` },
      { status: 502 }
    );
  }
}
