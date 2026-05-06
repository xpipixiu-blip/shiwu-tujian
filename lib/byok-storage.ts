export type ByokConfig = {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  modelId: string;
};

const LOCAL_KEY = "byok-config";
const SESSION_KEY = "byok-session";

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadByokConfig(): ByokConfig | null {
  if (!isBrowser()) return null;
  try {
    // localStorage takes priority (user checked "remember")
    const local = localStorage.getItem(LOCAL_KEY);
    if (local) return JSON.parse(local) as ByokConfig;
    const session = sessionStorage.getItem(SESSION_KEY);
    if (session) return JSON.parse(session) as ByokConfig;
  } catch { /* storage unavailable */ }
  return null;
}

export function saveByokConfig(config: ByokConfig, remember: boolean): void {
  if (!isBrowser()) return;
  try {
    const json = JSON.stringify(config);
    if (remember) {
      localStorage.setItem(LOCAL_KEY, json);
    } else {
      sessionStorage.setItem(SESSION_KEY, json);
      // Clear any previously remembered config
      localStorage.removeItem(LOCAL_KEY);
    }
  } catch { /* storage full */ }
}

export function clearByokConfig(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(LOCAL_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch { /* ignore */ }
}
