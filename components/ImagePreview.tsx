"use client";

import { useEffect, useRef } from "react";

type Props = { file: File | null };

export default function ImagePreview({ file }: Props) {
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (file) urlRef.current = URL.createObjectURL(file);
    return () => {
      if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
    };
  }, [file]);

  if (!file || !urlRef.current) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-[10px] font-medium text-warm-200 uppercase tracking-[0.2em]">图片预览</h2>
      <div className="rounded-sm overflow-hidden border border-ink-600">
        <img src={urlRef.current} alt="" className="w-full max-h-64 object-contain" style={{background:"#11100d"}} />
      </div>
    </div>
  );
}
