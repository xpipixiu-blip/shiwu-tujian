"use client";

import { useRef, useState, useCallback } from "react";

type Props = { onImageSelect: (file: File) => void; disabled?: boolean };

export default function PhotoUploader({ onImageSelect, disabled }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    onImageSelect(file);
  }, [onImageSelect]);

  return (
    <div className="space-y-2">
      <h2 className="text-[10px] font-medium text-warm-200 uppercase tracking-[0.2em]">拍摄或上传照片</h2>
      <input ref={fileRef} type="file" accept="image/*" capture="environment"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        className="hidden" />
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded p-6 text-center transition-all cursor-pointer ${
          isDragging ? "border-gold-500/50 bg-gold-500/5" : "border-ink-600 hover:border-gold-500/30 bg-ink-800/50"
        } ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="space-y-1">
          <p className="text-sm text-warm-200">点击拍照或选择图片</p>
          <p className="text-[10px] text-warm-100">支持拖拽上传 · JPG / PNG / WebP</p>
        </div>
      </div>
    </div>
  );
}
