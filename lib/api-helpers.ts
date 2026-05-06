const DEFAULT_BASE_URL =
  process.env.SJTU_BASE_URL ?? "https://models.sjtu.edu.cn/api/v1";

const DEFAULT_API_KEY = process.env.SJTU_API_KEY;

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

export type ChatOpts = {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  /** User-provided API key (BYOK mode) */
  userApiKey?: string;
  /** User-provided base URL (BYOK mode) */
  userBaseUrl?: string;
};

export async function chatCompletion(
  modelId: string,
  messages: ChatMessage[],
  opts?: ChatOpts
): Promise<string> {
  const key = opts?.userApiKey || DEFAULT_API_KEY;
  const baseUrl = opts?.userBaseUrl || DEFAULT_BASE_URL;

  if (!key) {
    throw new ApiError(
      "API key is not configured. Please set SJTU_API_KEY in server environment or provide your own key in API Settings.",
      500
    );
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

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
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
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch?.[1]) return fenceMatch[1].trim();

  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) return objMatch[0].trim();

  return text.trim();
}

/** Mask an API key for safe logging: show first 6 + last 4 chars. */
export function maskKey(key: string): string {
  if (key.length <= 10) return "***";
  return key.slice(0, 6) + "..." + key.slice(-4);
}
