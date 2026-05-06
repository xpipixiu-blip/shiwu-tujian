"use client";

import { useState, useEffect, useCallback } from "react";
import { loadModelId, saveModelId } from "@/lib/model-storage";

type ModelInfo = { id: string; owned_by?: string };

type Props = {
  value: string; onChange: (modelId: string) => void; disabled?: boolean;
  showByokOverride?: boolean; byokModelId?: string;
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
    setIsLoading(true); setError(null);
    try {
      const res = await fetch("/api/models");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? data.hint ?? "获取失败");
      setModels(data.models ?? []);
      if (data.defaultModelId) setDefaultModelId(data.defaultModelId);
    } catch (e) { setError((e as Error).message); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  useEffect(() => {
    const saved = loadModelId();
    if (saved && !value) onChange(saved);
  }, []); // eslint-disable-line

  useEffect(() => {
    if (autoSelected || models.length === 0) return;
    const saved = loadModelId();
    if (saved && models.some((m) => m.id === saved)) onChange(saved);
    else { onChange(models[0].id); saveModelId(models[0].id); }
    setAutoSelected(true);
  }, [models, autoSelected, onChange]);

  useEffect(() => {
    if (!error || value) return;
    const saved = loadModelId();
    if (saved) onChange(saved);
    else if (defaultModelId) { onChange(defaultModelId); saveModelId(defaultModelId); }
  }, [error, value, onChange, defaultModelId]);

  const handleChange = (id: string) => {
    if (id === "__manual__") { setShowManual(true); return; }
    onChange(id); saveModelId(id);
  };

  const handleManualSubmit = () => {
    if (manualId.trim()) { onChange(manualId.trim()); saveModelId(manualId.trim()); setManualId(""); setShowManual(false); }
  };

  const hasModel = value !== "";
  const selectClass = "w-full px-3 py-2 bg-ink-800 border border-ink-600 rounded text-sm text-warm-400 focus:outline-none focus:border-gold-500/30 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer";
  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%238b8076' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
    backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em", paddingRight: "2.5rem",
  };

  return (
    <div className="space-y-2">
      <h2 className="text-[10px] font-medium text-warm-200 uppercase tracking-[0.2em]">模型选择</h2>

      {showByokOverride && (
        <div className="px-3 py-2 rounded text-xs text-gold-400/70" style={{background:"rgba(185,154,91,0.06)",border:"1px solid rgba(185,154,91,0.15)"}}>
          使用自定义模型：<span className="font-medium text-gold-400">{byokModelId || "(未设置)"}</span>
          <br /><span className="text-warm-100">在 API 设置中修改</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-ink-800 border border-ink-600 rounded">
          <span className="inline-block w-3 h-3 border border-ink-600 border-t-gold-500 rounded-full animate-spin" />
          <span className="text-xs text-warm-100">获取模型列表...</span>
        </div>
      ) : models.length > 0 ? (
        <>
          <select value={hasModel ? value : ""} onChange={(e) => handleChange(e.target.value)} disabled={disabled}
            className={selectClass} style={selectStyle}>
            {!hasModel && <option value="" disabled className="bg-ink-800 text-warm-100">请选择模型...</option>}
            {models.map((m) => (
              <option key={m.id} value={m.id} className="bg-ink-800 text-warm-400">{m.id}{m.owned_by ? ` (${m.owned_by})` : ""}</option>
            ))}
            <option value="__manual__" className="bg-ink-800 text-warm-100">+ 手动输入...</option>
          </select>
        </>
      ) : error ? (
        <div className="space-y-2">
          <p className="text-xs text-gold-400/70">{error}</p>
          <div className="flex gap-2">
            <input type="text" value={manualId} onChange={(e) => setManualId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
              placeholder={value || "输入 model id"} disabled={disabled}
              className="flex-1 px-3 py-2 bg-ink-800 border border-ink-600 rounded text-sm text-warm-400 placeholder-warm-100 focus:outline-none focus:border-gold-500/30 disabled:opacity-50" />
            <button onClick={handleManualSubmit} disabled={!manualId.trim() || disabled}
              className="px-4 py-2 rounded text-xs font-medium border border-gold-500/30 text-gold-400 disabled:opacity-50"
              style={{background:"rgba(185,154,91,0.1)"}}>确认</button>
          </div>
          <button onClick={fetchModels} className="text-xs text-gold-400/70 hover:text-gold-400">重试获取</button>
        </div>
      ) : (
        <p className="text-xs text-warm-100">无可用模型</p>
      )}

      {showManual && (
        <div className="flex gap-2 mt-2">
          <input type="text" value={manualId} onChange={(e) => setManualId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
            placeholder="输入 model id" disabled={disabled}
            className="flex-1 px-2.5 py-1.5 bg-ink-800 border border-ink-600 rounded text-xs text-warm-400 placeholder-warm-100 focus:outline-none focus:border-gold-500/30 disabled:opacity-50" />
          <button onClick={handleManualSubmit} disabled={!manualId.trim() || disabled}
            className="px-3 py-1.5 rounded text-xs font-medium border border-gold-500/30 text-gold-400 disabled:opacity-50"
            style={{background:"rgba(185,154,91,0.1)"}}>确认</button>
        </div>
      )}

      {hasModel && <p className="text-[9px] text-warm-100">当前模型：{value}</p>}
    </div>
  );
}
