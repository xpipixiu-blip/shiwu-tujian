"use client";

import { useState } from "react";

type Props = {
  isOpen: boolean; currentName: string;
  onClose: () => void; onSubmit: (newName: string) => void; disabled?: boolean;
};

export default function EditModal({ isOpen, currentName, onClose, onSubmit, disabled }: Props) {
  const [name, setName] = useState("");
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0" style={{background:"rgba(0,0,0,0.7)"}} />
      <div className="relative w-full max-w-sm bg-ink-800 border border-ink-600 rounded p-5" style={{boxShadow:"0 0 40px rgba(0,0,0,0.6)"}}
        onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-medium text-gold-400 mb-1">编辑名称</h3>
        <p className="text-[10px] text-warm-100 mb-4">输入新名称后 AI 将重新生成整张图鉴。</p>
        <input type="text" value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim() && !disabled) onSubmit(name.trim()); }}
          placeholder={currentName} autoFocus disabled={disabled}
          className="w-full px-3 py-2.5 bg-ink-700 border border-ink-600 rounded text-sm text-warm-400 placeholder-warm-100 focus:outline-none focus:border-gold-500/30 disabled:opacity-50" />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} disabled={disabled}
            className="flex-1 py-2 rounded text-xs font-medium border border-ink-600 text-warm-200 hover:border-gold-500/30 transition-colors disabled:opacity-50">取消</button>
          <button onClick={() => name.trim() && onSubmit(name.trim())}
            disabled={!name.trim() || disabled}
            className="flex-1 py-2 rounded text-xs font-medium border border-gold-500/30 text-gold-400 transition-colors disabled:opacity-50"
            style={{background:"rgba(185,154,91,0.1)"}}>
            {disabled ? "生成中..." : "重新生成"}
          </button>
        </div>
      </div>
    </div>
  );
}
