"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import CitySelector from "@/components/CitySelector";
import PhotoUploader from "@/components/PhotoUploader";
import ImagePreview from "@/components/ImagePreview";
import AtlasCardView from "@/components/AtlasCardView";
import EditModal from "@/components/EditModal";
import HistoryList from "@/components/HistoryList";
import ModelSelector from "@/components/ModelSelector";
import ApiSettingsPanel from "@/components/ApiSettingsPanel";
import CardPresetSelector from "@/components/CardPresetSelector";
import type { CityProfile } from "@/lib/cities";
import type { AtlasCard, CardPreset } from "@/lib/types";
import { loadCards, saveCard, deleteCard } from "@/lib/storage";
import { loadModelId } from "@/lib/model-storage";
import { resizeImageForUpload } from "@/lib/image-utils";
import { calculateCrop, cropImage } from "@/lib/crop-utils";
import type { SubjectBox, CropBox } from "@/lib/crop-utils";
import { loadByokConfig, saveByokConfig, clearByokConfig } from "@/lib/byok-storage";
import type { ByokConfig } from "@/lib/byok-storage";
import { loadPreset, savePreset } from "@/lib/preset-storage";

type Detection = {
  subjectBox: SubjectBox;
  cropBox: CropBox;
  croppedImageUrl: string;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

export default function HomePage() {
  const [city, setCity] = useState<CityProfile | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentCard, setCurrentCard] = useState<AtlasCard | null>(null);
  const [history, setHistory] = useState<AtlasCard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modelId, setModelId] = useState("");
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [detection, setDetection] = useState<Detection | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const [byokConfig, setByokConfig] = useState<ByokConfig | null>(null);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [cardPreset, setCardPreset] = useState<CardPreset>("antique");

  const resizedBase64Ref = useRef<string | null>(null);
  const detectingRef = useRef(false);
  const generatingRef = useRef(false);

  const byokParams = useMemo(() => {
    if (!byokConfig?.enabled) return {};
    return { userApiKey: byokConfig.apiKey, userBaseUrl: byokConfig.baseUrl, userModelId: byokConfig.modelId };
  }, [byokConfig]);

  const effectiveModelId = byokConfig?.enabled && byokConfig.modelId ? byokConfig.modelId : modelId;

  useEffect(() => {
    setHistory(loadCards());
    const saved = loadModelId();
    if (saved) setModelId(saved);
    const byok = loadByokConfig();
    if (byok) setByokConfig(byok);
    const savedPreset = loadPreset();
    if (savedPreset) setCardPreset(savedPreset);
  }, []);

  const resetCard = useCallback(() => { setCurrentCard(null); setGenerateError(null); }, []);
  const resetDetection = useCallback(() => { setDetection(null); resizedBase64Ref.current = null; setGenerateError(null); }, []);

  const handleCityChange = useCallback((c: CityProfile) => { setCity(c); resetCard(); }, [resetCard]);
  const handleImageSelect = useCallback((f: File) => { setImageFile(f); resetCard(); resetDetection(); }, [resetCard, resetDetection]);

  const handleDetect = useCallback(async () => {
    if (!imageFile || !effectiveModelId) return;
    if (detectingRef.current) return;
    detectingRef.current = true;
    setIsDetecting(true);
    setGenerateError(null);
    try {
      const base64 = await resizeImageForUpload(imageFile);
      resizedBase64Ref.current = base64;
      const res = await fetch("/api/detect-subject", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, modelId: effectiveModelId, ...byokParams }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "检测失败");
      const box = data.subjectBox as SubjectBox;
      const img = await loadImage(base64);
      const crop = calculateCrop(img.width, img.height, box);
      const cropped = await cropImage(base64, crop);
      setDetection({ subjectBox: box, cropBox: crop, croppedImageUrl: cropped });
    } catch (e) {
      setGenerateError((e as Error).message);
      resetDetection();
    } finally { setIsDetecting(false); detectingRef.current = false; }
  }, [imageFile, effectiveModelId, resetDetection, byokParams]);

  const handleGenerate = useCallback(async () => {
    if (!city || !imageFile || !effectiveModelId) return;
    if (generatingRef.current) return;
    generatingRef.current = true;
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const imageBase64 = detection?.croppedImageUrl ?? await resizeImageForUpload(imageFile);
      const res = await fetch("/api/generate-atlas-card", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64, city: city.name, modelId: effectiveModelId, ...byokParams }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "生成失败");
      const card = data.card as AtlasCard;
      card.cardPreset = cardPreset;
      if (detection?.croppedImageUrl) card.croppedImageUrl = detection.croppedImageUrl;
      setCurrentCard(card);
    } catch (e) {
      setGenerateError((e as Error).message);
    } finally { setIsGenerating(false); generatingRef.current = false; }
  }, [city, imageFile, effectiveModelId, detection, byokParams]);

  const handleSaveToHistory = useCallback(() => {
    if (!currentCard) return;
    saveCard(currentCard);
    setHistory(loadCards());
  }, [currentCard]);

  const handleOpenEdit = useCallback(() => { setEditError(null); setShowEditModal(true); }, []);

  const handleEditSubmit = useCallback(async (newName: string) => {
    if (!currentCard || !effectiveModelId) return;
    setShowEditModal(false);
    setIsEditing(true);
    setEditError(null);
    try {
      const res = await fetch("/api/regenerate-atlas-card", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: currentCard.city, modelId: effectiveModelId,
          originalObjectName: currentCard.originalObjectName, category: currentCard.category,
          userEditedFantasyName: newName, ...byokParams,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "重新生成失败");
      setCurrentCard({
        ...currentCard,
        id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fantasyName: data.fantasyName ?? newName,
        description: data.description ?? currentCard.description,
        stats: data.stats ?? currentCard.stats,
        funFact: data.funFact ?? currentCard.funFact,
        facts: data.facts ?? currentCard.facts,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      setEditError((e as Error).message);
    } finally { setIsEditing(false); }
  }, [currentCard, effectiveModelId, byokParams]);

  const handleSaveByok = useCallback((config: ByokConfig, remember: boolean) => {
    setByokConfig(config); saveByokConfig(config, remember);
  }, []);
  const handleClearByok = useCallback(() => { setByokConfig(null); clearByokConfig(); }, []);

  const handlePresetChange = useCallback((p: CardPreset) => {
    setCardPreset(p);
    savePreset(p);
    // If card already exists, switch its preset without re-generating
    if (currentCard) {
      setCurrentCard({ ...currentCard, cardPreset: p });
    }
  }, [currentCard]);

  const handleHistorySelect = useCallback((card: AtlasCard) => {
    setCurrentCard(card); setCity(null); setImageFile(null); setGenerateError(null); setEditError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  const handleHistoryDelete = useCallback((id: string) => {
    deleteCard(id); setHistory(loadCards());
    if (currentCard?.id === id) setCurrentCard(null);
  }, [currentCard]);

  const canGenerate = city !== null && imageFile !== null && effectiveModelId !== "" && !isGenerating;

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: "radial-gradient(ellipse at 50% 0%, #1e1a1522 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, #11100d 0%, transparent 50%), #0b0a08" }}>
      <header className="text-center py-6 px-4 relative">
        <h1 className="text-xl sm:text-2xl font-bold tracking-[0.2em]" style={{ color: "#c7aa67", fontFamily: "var(--font-display), serif", textShadow: "0 1px 0 rgba(0,0,0,0.8)" }}>
          识物图鉴
        </h1>
        <p className="text-[10px] text-warm-100 mt-1 tracking-[0.2em]">拍照识物 · 风格生成 · 图鉴收藏</p>
        <button onClick={() => setShowApiSettings(true)} className="absolute top-6 right-4 px-3 py-1 rounded text-[11px] border border-ink-600 text-warm-200 hover:border-gold-500/30 transition-colors">
          API
        </button>
        {byokConfig?.enabled && (
          <span className="block text-[9px] text-gold-500/60 mt-1">自定义 API</span>
        )}
      </header>

      <main className="flex-1 px-4 pb-8 max-w-lg mx-auto w-full space-y-5">
        {currentCard ? (
          <>
            <CardPresetSelector value={currentCard.cardPreset ?? "antique"} onChange={handlePresetChange} />
            <div className="animate-fade-in">
              <AtlasCardView card={currentCard} onEdit={handleOpenEdit} onClose={() => setCurrentCard(null)} />
            </div>
            {editError && <p className="text-center text-xs" style={{color:"#8b5e5e"}}>{editError}</p>}
            <button onClick={handleSaveToHistory} disabled={isEditing}
              className="w-full py-2.5 rounded text-sm font-medium bg-ink-800 border border-ink-600 text-warm-300 hover:border-gold-500/30 transition-colors disabled:opacity-50">
              保存到历史记录
            </button>
          </>
        ) : (
          <>
            <ModelSelector value={modelId} onChange={setModelId}
              disabled={isGenerating || byokConfig?.enabled === true}
              showByokOverride={byokConfig?.enabled === true} byokModelId={byokConfig?.modelId} />
            <CardPresetSelector value={cardPreset} onChange={handlePresetChange} disabled={isGenerating} />

            <CitySelector value={city} onChange={handleCityChange} disabled={isGenerating} />
            <PhotoUploader onImageSelect={handleImageSelect} disabled={isGenerating} />
            <ImagePreview file={imageFile} />

            {imageFile && !detection?.croppedImageUrl && (
              <button onClick={handleDetect} disabled={!effectiveModelId || isDetecting}
                className={`w-full py-2.5 rounded text-sm font-medium tracking-wider transition-all ${
                  effectiveModelId && !isDetecting
                    ? "bg-ink-800 border border-ink-600 text-warm-300 hover:border-gold-500/30"
                    : "bg-ink-900 border border-ink-800 text-warm-100 cursor-not-allowed"
                }`}>
                {isDetecting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-3 h-3 border border-ink-600 border-t-gold-500 rounded-full animate-spin" />
                    AI 正在定位主体...
                  </span>
                ) : "定位主体并裁切"}
              </button>
            )}

            {detection?.croppedImageUrl && (
              <div className="space-y-2">
                <h2 className="text-[10px] font-medium text-warm-200 uppercase tracking-[0.2em]">裁切预览</h2>
                <div className="rounded-sm overflow-hidden border border-gold-500/20">
                  <img src={detection.croppedImageUrl} alt="" className="w-full aspect-square object-cover" />
                </div>
                <button onClick={() => resetDetection()} disabled={isGenerating}
                  className="w-full py-2 rounded text-xs border border-ink-600 text-warm-200 hover:border-gold-500/30 transition-colors disabled:opacity-50">
                  重新裁切
                </button>
              </div>
            )}

            <button onClick={handleGenerate} disabled={!canGenerate}
              className={`w-full py-3 rounded text-sm font-bold tracking-wider transition-all ${
                canGenerate ? "text-ink-900 hover:scale-[1.01] active:scale-[0.99]" : "text-warm-100 cursor-not-allowed"
              }`}
              style={canGenerate
                ? { background: "linear-gradient(135deg, #d3bd82 0%, #b99a5b 100%)", boxShadow: "0 0 16px rgba(185,154,91,0.15)" }
                : { background: "#1e1a15" }}>
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-ink-600 border-t-gold-500 rounded-full animate-spin" />
                  AI 正在生成...
                </span>
              ) : "生成图鉴"}
            </button>

            {!canGenerate && (city || imageFile || effectiveModelId) && (
              <div className="text-center text-[10px] text-warm-100 space-y-0.5">
                {!effectiveModelId && <p>请选择模型（或在 API 设置中配置）</p>}
                {!city && <p>请选择风格来源</p>}
                {!imageFile && <p>请上传照片</p>}
              </div>
            )}

            {generateError && (
              <div className="p-3 rounded border" style={{background:"rgba(139,94,94,0.1)",borderColor:"rgba(139,94,94,0.2)"}}>
                <p className="text-xs" style={{color:"#c48b8b"}}>{generateError}</p>
                <p className="text-[10px] text-warm-100 mt-1">站点默认模型暂不可用？在右上角 API 设置中填写自己的 Key</p>
              </div>
            )}

            {!city && !imageFile && !effectiveModelId && (
              <p className="text-center text-xs text-warm-100">选择模型和风格来源，上传照片即可生成</p>
            )}
          </>
        )}

        {!currentCard && (
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px" style={{background:"rgba(185,154,91,0.1)"}} />
            <span className="text-[10px] text-warm-100 tracking-[0.2em]">历史图鉴</span>
            <div className="flex-1 h-px" style={{background:"rgba(185,154,91,0.1)"}} />
          </div>
        )}

        <HistoryList cards={history} onSelect={handleHistorySelect} onDelete={handleHistoryDelete} />
        {history.length === 0 && !currentCard && (
          <p className="text-center text-xs text-warm-100 py-8">还没有生成过图鉴，快来试试吧</p>
        )}
      </main>

      <footer className="text-center py-4 px-4">
        <p className="text-[9px] text-warm-100">识物图鉴</p>
      </footer>

      <EditModal isOpen={showEditModal} currentName={currentCard?.fantasyName ?? ""}
        onClose={() => setShowEditModal(false)} onSubmit={handleEditSubmit} disabled={isEditing} />
      {isEditing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" style={{background:"rgba(0,0,0,0.7)"}}>
          <div className="text-center space-y-3">
            <div className="inline-block w-8 h-8 border-2 border-ink-600 border-t-gold-500 rounded-full animate-spin" />
            <p className="text-sm text-gold-400/80">AI 正在重新生成...</p>
          </div>
        </div>
      )}
      <ApiSettingsPanel isOpen={showApiSettings} onClose={() => setShowApiSettings(false)}
        onSave={handleSaveByok} onClear={handleClearByok} initialConfig={byokConfig} />
    </div>
  );
}
