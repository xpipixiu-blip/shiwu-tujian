const MODEL_STORAGE_KEY = "chuunibyou-atlas-model-id";

export function loadModelId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(MODEL_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveModelId(modelId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MODEL_STORAGE_KEY, modelId);
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}
