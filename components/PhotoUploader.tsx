"use client";

import { useRef, useState, useCallback } from "react";

type Props = {
  onImageSelect: (file: File) => void;
  disabled?: boolean;
};

export default function PhotoUploader({ onImageSelect, disabled }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      onImageSelect(file);
    },
    [onImageSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-stone-400 uppercase tracking-widest">
        拍摄或上传照片
      </h2>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          // Reset so same file can be re-selected
          e.target.value = "";
        }}
        className="hidden"
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
          ${isDragging
            ? "border-amber-500 bg-amber-900/20"
            : "border-stone-700 hover:border-amber-700/50 bg-stone-900/50"
          }
          ${disabled ? "opacity-50 pointer-events-none" : ""}
        `}
        onClick={() => fileRef.current?.click()}
      >
        <div className="space-y-2">
          <div className="text-4xl select-none">📷</div>
          <p className="text-sm text-stone-400">
            点击拍照或选择图片
          </p>
          <p className="text-xs text-stone-500">
            支持拖拽上传 · JPG/PNG/WebP
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            fileRef.current?.click();
          }}
          className="flex-1 px-4 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-300 hover:border-amber-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📁 选择文件
        </button>
        <button
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            // On mobile, capture attribute on input handles camera
            // For desktop, just open file picker
            fileRef.current?.click();
          }}
          className="flex-1 px-4 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-300 hover:border-amber-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📸 拍照
        </button>
      </div>
    </div>
  );
}
