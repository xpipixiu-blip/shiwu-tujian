import { NextResponse } from "next/server";

const BASE_URL = process.env.SJTU_BASE_URL ?? "https://models.sjtu.edu.cn/api/v1";
const API_KEY = process.env.SJTU_API_KEY;

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "SJTU_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${res.status} ${res.statusText}` },
        { status: 502 }
      );
    }

    const data = await res.json();

    // Normalize: expect { data: [{ id, owned_by? }] } (OpenAI format) or { models: [...] }
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
