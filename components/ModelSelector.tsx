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

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/models");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch");
      setModels(data.models ?? []);
      // Auto-select first if no saved value
      if (!value && data.models?.length > 0) {
        onChange(data.models[0].id);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [value, onChange]);

  // Fetch once on mount
  useEffect(() => {
    fetchModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore saved modelId on mount
  useEffect(() => {
    const saved = loadModelId();
    if (saved && !value) {
      onChange(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (id: string) => {
    onChange(id);
    saveModelId(id);
  };

  const handleManualSubmit = () => {
    if (manualId.trim()) {
      handleChange(manualId.trim());
      setManualId("");
      setShowManual(false);
    }
  };

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
          {/* Fallback: manual input */}
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
        <select
          value={value}
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
      ) : (
        <p className="text-xs text-stone-600">无可用模型</p>
      )}

      {/* Handle "manual input" selection from dropdown */}
      {value === "__manual__" && (
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
