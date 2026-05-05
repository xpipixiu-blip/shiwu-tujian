"use client";

import { useState, useEffect, useCallback } from "react";
import { loadModelId, saveModelId } from "@/lib/model-storage";

type ModelInfo = { id: string; owned_by?: string };

type Props = {
  value: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
};

export default function ModelSelector({ value, onChange, disabled }: Props) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualId, setManualId] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [autoSelected, setAutoSelected] = useState(false);

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/models");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch");
      setModels(data.models ?? []);
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

  // Show current model even without auto-select
  const hasModel = value !== "";

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-stone-400 uppercase tracking-widest">
        模型选择
      </h2>

      {isLoading ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-stone-800/80 border border-stone-700 rounded-lg">
          <span className="inline-block w-3 h-3 border border-stone-600 border-t-amber-500 rounded-full animate-spin" />
          <span className="text-xs text-stone-500">获取模型列表...</span>
        </div>
      ) : error ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-400/80 flex-1">获取失败</span>
            <button
              onClick={fetchModels}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              重试
            </button>
          </div>
          {!showManual ? (
            <button
              onClick={() => setShowManual(true)}
              disabled={disabled}
              className="text-xs text-stone-500 hover:text-amber-400 transition-colors disabled:opacity-50"
            >
              手动输入 model ID...
            </button>
          ) : (
            <div className="flex gap-2">
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
    </div>
  );
}
