"use client";

import { useEffect, useRef } from "react";

type Props = {
  file: File | null;
};

export default function ImagePreview({ file }: Props) {
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (file) {
      urlRef.current = URL.createObjectURL(file);
    }
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [file]);

  if (!file || !urlRef.current) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-stone-400 uppercase tracking-widest">
        图片预览
      </h2>
      <div className="relative rounded-xl overflow-hidden border border-stone-700 bg-stone-900">
        <img
          src={urlRef.current}
          alt="预览"
          className="w-full max-h-64 object-contain"
        />
      </div>
    </div>
  );
}
