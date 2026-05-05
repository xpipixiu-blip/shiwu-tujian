const BASE_URL =
  process.env.SJTU_BASE_URL ?? "https://models.sjtu.edu.cn/api/v1";

const API_KEY = process.env.SJTU_API_KEY;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string; detail?: string } }>;
};

export async function chatCompletion(
  modelId: string,
  messages: ChatMessage[],
  opts?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
): Promise<string> {
  if (!API_KEY) {
    throw new ApiError("SJTU_API_KEY is not configured on the server.", 500);
  }

  const body: Record<string, unknown> = {
    model: modelId,
    messages,
    temperature: opts?.temperature ?? 0.7,
    max_tokens: opts?.maxTokens ?? 1024,
  };

  if (opts?.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(
      `API error: ${res.status} ${res.statusText}`,
      res.status,
      text.slice(0, 500)
    );
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content || typeof content !== "string") {
    throw new ApiError("Empty or unexpected API response", 502, JSON.stringify(data).slice(0, 500));
  }

  return content;
}

/** Extract JSON from an AI response that may have markdown fences or surrounding text. */
export function extractJSON(text: string): string {
  // Try to find JSON inside ```json ... ``` fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch?.[1]) return fenceMatch[1].trim();

  // Try to find a JSON object directly
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) return objMatch[0].trim();

  return text.trim();
}
