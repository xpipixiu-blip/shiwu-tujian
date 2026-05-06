"use client";

import { useState, useCallback } from "react";
import type { ByokConfig } from "@/lib/byok-storage";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ByokConfig, remember: boolean) => void;
  onClear: () => void;
  initialConfig: ByokConfig | null;
};

export default function ApiSettingsPanel({
  isOpen,
  onClose,
  onSave,
  onClear,
  initialConfig,
}: Props) {
  const [mode, setMode] = useState<"default" | "byok">(
    initialConfig?.enabled ? "byok" : "default"
  );
  const [baseUrl, setBaseUrl] = useState(
    initialConfig?.baseUrl ?? "https://models.sjtu.edu.cn/api/v1"
  );
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey ?? "");
  const [modelId, setModelId] = useState(initialConfig?.modelId ?? "");
  const [remember, setRemember] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);

  const handleTest = useCallback(async () => {
    if (!apiKey.trim() || !modelId.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/test-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userApiKey: apiKey.trim(),
          userBaseUrl: baseUrl.trim(),
          userModelId: modelId.trim(),
        }),
      });
      const data = await res.json();
      setTestResult({
        ok: data.success,
        msg: data.success ? "连接成功" : data.message ?? "连接失败",
      });
    } catch {
      setTestResult({ ok: false, msg: "网络错误，无法连接到服务" });
    } finally {
      setTesting(false);
    }
  }, [apiKey, baseUrl, modelId]);

  const handleSave = useCallback(() => {
    if (mode === "default") {
      onClear();
      onClose();
      return;
    }
    onSave(
      {
        enabled: true,
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim(),
        modelId: modelId.trim(),
      },
      remember
    );
    onClose();
  }, [mode, baseUrl, apiKey, modelId, remember, onSave, onClear, onClose]);

  const handleClear = useCallback(() => {
    setApiKey("");
    setModelId("");
    setBaseUrl("https://models.sjtu.edu.cn/api/v1");
    setTestResult(null);
    onClear();
    onClose();
  }, [onClear, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-md max-h-[85dvh] overflow-y-auto bg-stone-900 border border-stone-700 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl"
        style={{ boxShadow: "0 0 40px rgba(0,0,0,0.6)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-amber-400/90 tracking-wider mb-4">
          ⚙ API 设置
        </h3>

        {/* Mode toggle */}
        <div className="space-y-2 mb-4">
          <label className="flex items-center gap-2 text-sm text-stone-300 cursor-pointer">
            <input
              type="radio"
              checked={mode === "default"}
              onChange={() => setMode("default")}
              className="accent-amber-600"
            />
            使用站点默认配置
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-300 cursor-pointer">
            <input
              type="radio"
              checked={mode === "byok"}
              onChange={() => setMode("byok")}
              className="accent-amber-600"
            />
            使用我自己的 API Key
          </label>
        </div>

        {/* BYOK fields */}
        {mode === "byok" && (
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-[11px] text-stone-400 block mb-1">API Base URL</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://models.sjtu.edu.cn/api/v1"
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="text-[11px] text-stone-400 block mb-1">API Key</label>
              <div className="flex gap-2">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="flex-1 px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-600"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="px-3 py-2 text-xs text-stone-400 border border-stone-700 rounded-lg hover:text-stone-300"
                >
                  {showKey ? "隐藏" : "显示"}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-stone-400 block mb-1">Model ID</label>
              <input
                type="text"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                placeholder="输入 model id"
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-600"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-stone-400 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="accent-amber-600"
              />
              记住我的 Key（保存到本设备）
            </label>
          </div>
        )}

        {/* Test result */}
        {testResult && (
          <div
            className={`mb-4 px-3 py-2 rounded-lg text-xs ${
              testResult.ok
                ? "bg-emerald-900/30 border border-emerald-800/50 text-emerald-400"
                : "bg-red-900/30 border border-red-800/50 text-red-400"
            }`}
          >
            {testResult.msg}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {mode === "byok" && (
            <button
              onClick={handleTest}
              disabled={testing || !apiKey.trim() || !modelId.trim()}
              className="w-full py-2.5 rounded-lg text-sm font-medium border border-stone-600 text-stone-300 hover:border-amber-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-3 h-3 border border-stone-500 border-t-amber-500 rounded-full animate-spin" />
                  测试中...
                </span>
              ) : (
                "🔌 测试连接"
              )}
            </button>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-amber-800/80 text-amber-100 border border-amber-700 transition-colors hover:bg-amber-800"
            >
              保存设置
            </button>
            <button
              onClick={handleClear}
              className="py-2.5 px-4 rounded-lg text-sm font-medium border border-red-900/50 text-red-400/80 hover:bg-red-900/20 transition-colors"
            >
              清除
            </button>
          </div>
        </div>

        {/* Note */}
        <p className="text-[10px] text-stone-600 mt-3 text-center">
          默认不保存 Key。勾选"记住"后保存到本设备 localStorage。
        </p>
      </div>
    </div>
  );
}
