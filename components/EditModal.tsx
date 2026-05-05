"use client";

import { useState } from "react";

type Props = {
  isOpen: boolean;
  currentName: string;
  onClose: () => void;
  onSubmit: (newName: string) => void;
  disabled?: boolean;
};

export default function EditModal({
  isOpen,
  currentName,
  onClose,
  onSubmit,
  disabled,
}: Props) {
  const [name, setName] = useState("");

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm bg-stone-900 border border-stone-700 rounded-2xl p-6 shadow-2xl"
        style={{
          boxShadow: "0 0 40px rgba(0,0,0,0.6), 0 4px 20px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-medium text-amber-400/90 mb-1 tracking-wider">
          编辑幻想名称
        </h3>
        <p className="text-xs text-stone-500 mb-4">
          输入新的名称，AI 将基于原始物体、城市和分类重新生成整张图鉴。
        </p>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim() && !disabled) {
              onSubmit(name.trim());
            }
          }}
          placeholder={currentName}
          autoFocus
          disabled={disabled}
          className="w-full px-3 py-2.5 bg-stone-800 border border-stone-600 rounded-lg text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-600 transition-colors disabled:opacity-50"
        />

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            disabled={disabled}
            className="flex-1 py-2 rounded-lg text-xs font-medium border border-stone-600 text-stone-400 hover:border-stone-500 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={() => name.trim() && onSubmit(name.trim())}
            disabled={!name.trim() || disabled}
            className="flex-1 py-2 rounded-lg text-xs font-medium bg-amber-800/80 text-amber-100 border border-amber-700 hover:bg-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {disabled ? "生成中..." : "重新生成"}
          </button>
        </div>
      </div>
    </div>
  );
}
