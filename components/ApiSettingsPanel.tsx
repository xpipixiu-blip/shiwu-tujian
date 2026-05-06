"use client";

import { useState, useCallback } from "react";
import type { ByokConfig } from "@/lib/byok-storage";

type ModelInfo = { id: string; owned_by?: string };

type Props = {
  isOpen: boolean; onClose: () => void;
  onSave: (config: ByokConfig, remember: boolean) => void;
  onClear: () => void; initialConfig: ByokConfig | null;
};

const inputClass = "w-full px-3 py-2 bg-ink-700 border border-ink-600 rounded text-sm text-warm-400 placeholder-warm-100 focus:outline-none focus:border-gold-500/30";
const btnClass = "w-full py-2.5 rounded text-sm font-medium border border-ink-600 text-warm-200 hover:border-gold-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export default function ApiSettingsPanel({ isOpen, onClose, onSave, onClear, initialConfig }: Props) {
  const [mode, setMode] = useState<"default" | "byok">(initialConfig?.enabled ? "byok" : "default");
  const [baseUrl, setBaseUrl] = useState(initialConfig?.baseUrl ?? "https://models.sjtu.edu.cn/api/v1");
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey ?? "");
  const [modelId, setModelId] = useState(initialConfig?.modelId ?? "");
  const [remember, setRemember] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [byokModels, setByokModels] = useState<ModelInfo[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const handleFetchModels = useCallback(async () => {
    if (!apiKey.trim()) return;
    setFetchingModels(true); setFetchError(null); setByokModels([]);
    try {
      const res = await fetch("/api/models", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userApiKey: apiKey.trim(), userBaseUrl: baseUrl.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? data.hint ?? "获取失败");
      setByokModels(data.models ?? []);
      if (data.models?.length > 0 && !modelId) setModelId(data.models[0].id);
    } catch (e) { setFetchError((e as Error).message); }
    finally { setFetchingModels(false); }
  }, [apiKey, baseUrl, modelId]);

  const handleTest = useCallback(async () => {
    if (!apiKey.trim() || !modelId.trim()) return;
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch("/api/test-generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userApiKey: apiKey.trim(), userBaseUrl: baseUrl.trim(), userModelId: modelId.trim() }) });
      const data = await res.json();
      setTestResult({ ok: data.success, msg: data.success ? "连接成功" : data.message ?? "连接失败" });
    } catch { setTestResult({ ok: false, msg: "网络错误" }); }
    finally { setTesting(false); }
  }, [apiKey, baseUrl, modelId]);

  const handleSave = useCallback(() => {
    if (mode === "default") { onClear(); onClose(); return; }
    onSave({ enabled: true, baseUrl: baseUrl.trim(), apiKey: apiKey.trim(), modelId: modelId.trim() }, remember);
    onClose();
  }, [mode, baseUrl, apiKey, modelId, remember, onSave, onClear, onClose]);

  const handleClear = useCallback(() => {
    setApiKey(""); setModelId(""); setBaseUrl("https://models.sjtu.edu.cn/api/v1");
    setTestResult(null); setByokModels([]); setFetchError(null);
    onClear(); onClose();
  }, [onClear, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="absolute inset-0" style={{background:"rgba(0,0,0,0.75)"}} />
      <div className="relative w-full sm:max-w-md max-h-[85dvh] overflow-y-auto bg-ink-800 border border-ink-600 rounded-t sm:rounded p-5" style={{boxShadow:"0 0 40px rgba(0,0,0,0.6)"}} onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-bold text-gold-400 mb-4">API 设置</h3>

        <div className="space-y-2 mb-4">
          <label className="flex items-center gap-2 text-sm text-warm-300 cursor-pointer"><input type="radio" checked={mode === "default"} onChange={() => setMode("default")} className="accent-gold-500" />使用站点默认配置</label>
          <label className="flex items-center gap-2 text-sm text-warm-300 cursor-pointer"><input type="radio" checked={mode === "byok"} onChange={() => setMode("byok")} className="accent-gold-500" />使用我自己的 API Key</label>
        </div>

        {mode === "byok" && (
          <div className="space-y-3 mb-4">
            <div><label className="text-[11px] text-warm-200 block mb-1">API Base URL</label><input type="text" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://models.sjtu.edu.cn/api/v1" className={inputClass} /></div>
            <div><label className="text-[11px] text-warm-200 block mb-1">API Key</label>
              <div className="flex gap-2"><input type={showKey ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." className={`${inputClass} flex-1`} /><button onClick={() => setShowKey(!showKey)} className="px-3 py-2 text-xs text-warm-200 border border-ink-600 rounded hover:text-warm-300">{showKey ? "隐藏" : "显示"}</button></div></div>
            <button onClick={handleFetchModels} disabled={fetchingModels || !apiKey.trim()} className={btnClass}>
              {fetchingModels ? <span className="flex items-center justify-center gap-2"><span className="inline-block w-3 h-3 border border-ink-600 border-t-gold-500 rounded-full animate-spin" />获取中...</span> : "拉取模型列表"}
            </button>
            {byokModels.length > 0 && (
              <div><label className="text-[11px] text-warm-200 block mb-1">Model ID</label>
                <select value={modelId} onChange={(e) => setModelId(e.target.value)} className={`${inputClass} appearance-none cursor-pointer`}
                  style={{backgroundImage:`url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%238b8076' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,backgroundPosition:"right 0.5rem center",backgroundRepeat:"no-repeat",backgroundSize:"1.5em 1.5em",paddingRight:"2.5rem"}}>
                  {byokModels.map((m) => <option key={m.id} value={m.id} className="bg-ink-800 text-warm-400">{m.id}{m.owned_by ? ` (${m.owned_by})` : ""}</option>)}
                </select></div>)}
            {fetchError && <p className="text-xs text-gold-400/70">{fetchError}</p>}
            {!byokModels.length && !fetchingModels && (
              <div><label className="text-[11px] text-warm-200 block mb-1">Model ID（手动输入）</label><input type="text" value={modelId} onChange={(e) => setModelId(e.target.value)} placeholder="输入 model id" className={inputClass} /></div>)}
            <label className="flex items-center gap-2 text-xs text-warm-200 cursor-pointer"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-gold-500" />记住我的 Key（保存到本设备）</label>
          </div>
        )}

        {testResult && (
          <div className={`mb-4 px-3 py-2 rounded text-xs ${testResult.ok ? "border" : "border"}`}
            style={testResult.ok ? {background:"rgba(107,139,94,0.1)",borderColor:"rgba(107,139,94,0.2)",color:"#8db88a"} : {background:"rgba(139,94,94,0.1)",borderColor:"rgba(139,94,94,0.2)",color:"#c48b8b"}}>
            {testResult.msg}</div>)}

        <div className="space-y-2">
          {mode === "byok" && <button onClick={handleTest} disabled={testing || !apiKey.trim() || !modelId.trim()} className={btnClass}>{testing ? <span className="flex items-center justify-center gap-2"><span className="inline-block w-3 h-3 border border-ink-600 border-t-gold-500 rounded-full animate-spin" />测试中...</span> : "测试连接"}</button>}
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex-1 py-2.5 rounded text-sm font-medium border border-gold-500/30 text-gold-400 transition-colors" style={{background:"rgba(185,154,91,0.1)"}}>保存设置</button>
            <button onClick={handleClear} className="py-2.5 px-4 rounded text-sm font-medium border border-ink-600 text-warm-200 hover:border-gold-500/30 transition-colors">清除</button>
          </div>
        </div>
        <p className="text-[10px] text-warm-100 mt-3 text-center">默认不保存 Key。勾选"记住"后保存到本设备 localStorage。</p>
      </div>
    </div>
  );
}
