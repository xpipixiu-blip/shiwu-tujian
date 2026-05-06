"use client";

import { useState, useEffect, useCallback } from "react";
import { loadModelId, saveModelId } from "@/lib/model-storage";

type ModelInfo = { id: string; owned_by?: string };

type Props = {
  value: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
  showByokOverride?: boolean;
  byokModelId?: string;
};

export default function ModelSelector({ value, onChange, disabled, showByokOverride, byokModelId }: Props) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualId, setManualId] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [autoSelected, setAutoSelected] = useState(false);
  const [defaultModelId, setDefaultModelId] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/models");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? data.hint ?? "获取失败");
      setModels(data.models ?? []);
      if (data.defaultModelId) {
        setDefaultModelId(data.defaultModelId);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch once on mount
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Restore saved modelId on mount — always, regardless of fetch success
  useEffect(() => {
    const saved = loadModelId();
    if (saved && !value) {
      onChange(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-select model once list is loaded
  useEffect(() => {
    if (autoSelected || models.length === 0) return;
    const saved = loadModelId();
    if (saved && models.some((m) => m.id === saved)) {
      onChange(saved);
    } else {
      onChange(models[0].id);
      saveModelId(models[0].id);
    }
    setAutoSelected(true);
  }, [models, autoSelected, onChange]);

  // When models fail to load but we have a saved or default modelId, use it
  useEffect(() => {
    if (!error || value) return; // already have a modelId
    const saved = loadModelId();
    if (saved) {
      onChange(saved);
    } else if (defaultModelId) {
      onChange(defaultModelId);
      saveModelId(defaultModelId);
    }
  }, [error, value, onChange, defaultModelId]);

  const handleChange = (id: string) => {
    if (id === "__manual__") {
      setShowManual(true);
      return;
    }
    onChange(id);
    saveModelId(id);
  };

  const handleManualSubmit = () => {
    if (manualId.trim()) {
      onChange(manualId.trim());
      saveModelId(manualId.trim());
      setManualId("");
      setShowManual(false);
    }
  };

  const hasModel = value !== "";

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-stone-400 uppercase tracking-widest">
        模型选择
      </h2>

      {showByokOverride && (
        <div className="px-3 py-2 bg-emerald-900/20 border border-emerald-800/40 rounded-lg text-xs text-emerald-400/80">
          使用自定义模型：<span className="font-medium text-emerald-300">{byokModelId || "(未设置)"}</span>
          <br />
          <span className="text-stone-500">在 ⚙ API 设置中修改</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-stone-800/80 border border-stone-700 rounded-lg">
          <span className="inline-block w-3 h-3 border border-stone-600 border-t-amber-500 rounded-full animate-spin" />
          <span className="text-xs text-stone-500">获取模型列表...</span>
        </div>
      ) : models.length > 0 ? (
        <>
          <select
            value={hasModel ? value : ""}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 bg-stone-800/80 border border-stone-700 rounded-lg text-sm text-stone-200 focus:outline-none focus:border-amber-600 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2378716c' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: "right 0.5rem center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "1.5em 1.5em",
              paddingRight: "2.5rem",
            }}
          >
            {!hasModel && (
              <option value="" disabled className="bg-stone-900 text-stone-500">
                请选择模型...
              </option>
            )}
            {models.map((m) => (
              <option key={m.id} value={m.id} className="bg-stone-900 text-stone-200">
                {m.id}
                {m.owned_by ? ` (${m.owned_by})` : ""}
              </option>
            ))}
            <option value="__manual__" className="bg-stone-900 text-stone-400">
              + 手动输入...
            </option>
          </select>
          {!hasModel && (
            <p className="text-[10px] text-amber-500/80">请在下拉框中选择一个模型</p>
          )}
        </>
      ) : error ? (
        <div className="space-y-2">
          <p className="text-xs text-amber-400/80">{error}</p>
          <p className="text-[10px] text-stone-500">
            你可以手动输入模型 ID 后继续使用
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
              placeholder={value || "输入 model id"}
              disabled={disabled}
              className="flex-1 px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-600 disabled:opacity-50"
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualId.trim() || disabled}
              className="px-4 py-2 bg-amber-800/80 text-amber-100 rounded-lg text-sm font-medium border border-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认
            </button>
          </div>
          <button
            onClick={fetchModels}
            className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            重试获取模型列表
          </button>
        </div>
      ) : (
        <p className="text-xs text-stone-600">无可用模型</p>
      )}

      {/* Handle "manual input" selection from dropdown */}
      {showManual && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
            placeholder="输入 model id"
            disabled={disabled}
            className="flex-1 px-2.5 py-1.5 bg-stone-800 border border-stone-700 rounded text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-600 disabled:opacity-50"
          />
          <button
            onClick={handleManualSubmit}
            disabled={!manualId.trim() || disabled}
            className="px-3 py-1.5 bg-amber-800/80 text-amber-100 rounded text-xs font-medium border border-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认
          </button>
        </div>
      )}

      {hasModel && (
        <p className="text-[10px] text-stone-600">
          当前模型：{value}
        </p>
      )}
    </div>
  );
}
