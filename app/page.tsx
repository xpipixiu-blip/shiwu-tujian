"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import CitySelector from "@/components/CitySelector";
import PhotoUploader from "@/components/PhotoUploader";
import ImagePreview from "@/components/ImagePreview";
import AtlasCardView from "@/components/AtlasCardView";
import EditModal from "@/components/EditModal";
import HistoryList from "@/components/HistoryList";
import ModelSelector from "@/components/ModelSelector";
import ApiSettingsPanel from "@/components/ApiSettingsPanel";
import type { CityProfile } from "@/lib/cities";
import type { AtlasCard } from "@/lib/types";
import { loadCards, saveCard, deleteCard } from "@/lib/storage";
import { loadModelId } from "@/lib/model-storage";
import { resizeImageForUpload } from "@/lib/image-utils";
import { calculateCrop, cropImage } from "@/lib/crop-utils";
import type { SubjectBox, CropBox } from "@/lib/crop-utils";
import { loadByokConfig, saveByokConfig, clearByokConfig } from "@/lib/byok-storage";
import type { ByokConfig } from "@/lib/byok-storage";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

export default function HomePage() {
  // --- Core state ---
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
  const [subjectBox, setSubjectBox] = useState<SubjectBox | null>(null);
  const [cropBox, setCropBox] = useState<CropBox | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [resizedBase64, setResizedBase64] = useState<string | null>(null);

  // --- BYOK state ---
  const [byokConfig, setByokConfig] = useState<ByokConfig | null>(null);
  const [showApiSettings, setShowApiSettings] = useState(false);

  // Build BYOK params for API calls
  const byokParams = useMemo(() => {
    if (!byokConfig?.enabled) return {};
    return {
      userApiKey: byokConfig.apiKey,
      userBaseUrl: byokConfig.baseUrl,
      userModelId: byokConfig.modelId,
    };
  }, [byokConfig]);

  // Effective model ID: BYOK's modelId takes priority over site model
  const effectiveModelId = byokConfig?.enabled && byokConfig.modelId
    ? byokConfig.modelId
    : modelId;

  // Load history, saved modelId, and BYOK config on mount
  useEffect(() => {
    setHistory(loadCards());
    const saved = loadModelId();
    if (saved) setModelId(saved);
    const byok = loadByokConfig();
    if (byok) setByokConfig(byok);
  }, []);

  const resetCard = useCallback(() => {
    setCurrentCard(null);
    setGenerateError(null);
  }, []);

  const resetDetection = useCallback(() => {
    setSubjectBox(null);
    setCropBox(null);
    setCroppedImageUrl(null);
    setResizedBase64(null);
    setGenerateError(null);
  }, []);

  // ── Detect subject ────────────────────────────────────────

  const handleDetect = useCallback(async () => {
    if (!imageFile || !effectiveModelId) return;

    setIsDetecting(true);
    setGenerateError(null);

    try {
      const base64 = await resizeImageForUpload(imageFile);
      setResizedBase64(base64);

      const res = await fetch("/api/detect-subject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          modelId: effectiveModelId,
          ...byokParams,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "检测失败");

      const box = data.subjectBox as SubjectBox;
      setSubjectBox(box);

      const img = await loadImage(base64);
      const crop = calculateCrop(img.width, img.height, box);
      setCropBox(crop);

      const cropped = await cropImage(base64, crop);
      setCroppedImageUrl(cropped);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "检测失败";
      setGenerateError(msg);
      resetDetection();
    } finally {
      setIsDetecting(false);
    }
  }, [imageFile, effectiveModelId, resetDetection, byokParams]);

  // ── Generate card ─────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!city || !imageFile || !effectiveModelId) return;

    setIsGenerating(true);
    setGenerateError(null);

    try {
      const imageBase64 = croppedImageUrl ?? await resizeImageForUpload(imageFile);

      const res = await fetch("/api/generate-atlas-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageBase64,
          city: city.name,
          modelId: effectiveModelId,
          ...byokParams,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "生成失败");

      const card = data.card as AtlasCard;
      if (croppedImageUrl) card.croppedImageUrl = croppedImageUrl;
      setCurrentCard(card);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "未知错误";
      setGenerateError(msg);
    } finally {
      setIsGenerating(false);
    }
  }, [city, imageFile, effectiveModelId, croppedImageUrl, byokParams]);

  // ── Save to history ──────────────────────────────────────

  const handleSaveToHistory = useCallback(() => {
    if (!currentCard) return;
    saveCard(currentCard);
    setHistory(loadCards());
  }, [currentCard]);

  // ── Edit and regenerate ──────────────────────────────────

  const handleOpenEdit = useCallback(() => {
    setEditError(null);
    setShowEditModal(true);
  }, []);

  const handleEditSubmit = useCallback(
    async (newName: string) => {
      if (!currentCard || !effectiveModelId) return;

      setShowEditModal(false);
      setIsEditing(true);
      setEditError(null);

      try {
        const res = await fetch("/api/regenerate-atlas-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city: currentCard.city,
            modelId: effectiveModelId,
            originalObjectName: currentCard.originalObjectName,
            category: currentCard.category,
            userEditedFantasyName: newName,
            ...byokParams,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "重新生成失败");

        const newCard: AtlasCard = {
          ...currentCard,
          id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          fantasyName: data.fantasyName ?? newName,
          description: data.description ?? currentCard.description,
          stats: data.stats ?? currentCard.stats,
          funFact: data.funFact ?? currentCard.funFact,
          createdAt: new Date().toISOString(),
        };

        setCurrentCard(newCard);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "未知错误";
        setEditError(msg);
      } finally {
        setIsEditing(false);
      }
    },
    [currentCard, effectiveModelId, byokParams]
  );

  // ── BYOK handlers ────────────────────────────────────────

  const handleSaveByok = useCallback((config: ByokConfig, remember: boolean) => {
    setByokConfig(config);
    saveByokConfig(config, remember);
  }, []);

  const handleClearByok = useCallback(() => {
    setByokConfig(null);
    clearByokConfig();
  }, []);

  // ── History handlers ──────────────────────────────────────

  const handleHistorySelect = useCallback((card: AtlasCard) => {
    setCurrentCard(card);
    setCity(null);
    setImageFile(null);
    setGenerateError(null);
    setEditError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleHistoryDelete = useCallback(
    (id: string) => {
      deleteCard(id);
      setHistory(loadCards());
      if (currentCard?.id === id) setCurrentCard(null);
    },
    [currentCard]
  );

  // ── Derived ───────────────────────────────────────────────

  const canGenerate = city !== null && imageFile !== null && effectiveModelId !== "" && !isGenerating;

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="text-center py-6 px-4 relative">
        <h1
          className="text-2xl sm:text-3xl font-bold tracking-[0.15em]"
          style={{
            color: "#d4a853",
            textShadow: "0 2px 8px rgba(0,0,0,0.6), 0 1px 0 rgba(0,0,0,0.8)",
            fontFamily: "var(--font-display), serif",
          }}
        >
          识物图鉴
        </h1>
        <p className="text-xs text-stone-500 mt-1 tracking-wider">
          拍照识物 · 风格生成 · 图鉴收藏
        </p>
        {/* API Settings button */}
        <button
          onClick={() => setShowApiSettings(true)}
          className="absolute top-6 right-4 px-3 py-1.5 rounded-lg text-xs border border-stone-700 text-stone-400 hover:border-amber-700/50 hover:text-amber-300 transition-colors"
        >
          ⚙ API
        </button>
        {byokConfig?.enabled && (
          <span className="block text-[10px] text-emerald-500/80 mt-1">
            ⬤ 使用自定义 API
          </span>
        )}
      </header>

      <main className="flex-1 px-4 pb-8 max-w-lg mx-auto w-full space-y-6">
        {currentCard ? (
          <>
            <div className="animate-fade-in">
              <AtlasCardView
                card={currentCard}
                onEdit={handleOpenEdit}
                onClose={() => setCurrentCard(null)}
              />
            </div>
            {editError && <p className="text-center text-xs text-red-400/80">{editError}</p>}
            <button
              onClick={handleSaveToHistory}
              disabled={isEditing}
              className="w-full py-2.5 rounded-lg text-sm font-medium bg-stone-800/80 border border-stone-700 text-stone-300 hover:border-amber-700/50 transition-colors disabled:opacity-50"
            >
              💾 保存到历史记录
            </button>
          </>
        ) : (
          <>
            <ModelSelector
              value={modelId}
              onChange={setModelId}
              disabled={isGenerating || byokConfig?.enabled === true}
              showByokOverride={byokConfig?.enabled === true}
              byokModelId={byokConfig?.modelId}
            />

            <CitySelector
              value={city}
              onChange={(c) => { setCity(c); resetCard(); }}
              disabled={isGenerating}
            />

            <PhotoUploader
              onImageSelect={(f) => { setImageFile(f); resetCard(); resetDetection(); }}
              disabled={isGenerating}
            />

            <ImagePreview file={imageFile} />

            {imageFile && !croppedImageUrl && (
              <button
                onClick={handleDetect}
                disabled={!effectiveModelId || isDetecting}
                className={`w-full py-2.5 rounded-xl text-sm font-medium tracking-wider transition-all ${
                  effectiveModelId && !isDetecting
                    ? "bg-stone-800/80 border border-stone-600 text-stone-300 hover:border-amber-700/50"
                    : "bg-stone-900/50 border border-stone-800 text-stone-600 cursor-not-allowed"
                }`}
              >
                {isDetecting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-3 h-3 border border-stone-500 border-t-amber-500 rounded-full animate-spin" />
                    AI 正在定位主体...
                  </span>
                ) : (
                  "🔍 定位主体并裁切"
                )}
              </button>
            )}

            {croppedImageUrl && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-stone-400 uppercase tracking-widest">裁切预览</h2>
                <div className="relative rounded-xl overflow-hidden border border-amber-800/40 bg-stone-900">
                  <img src={croppedImageUrl} alt="裁切结果" className="w-full aspect-square object-cover" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => resetDetection()}
                    disabled={isGenerating}
                    className="flex-1 py-2 rounded-lg text-xs font-medium border border-stone-600 text-stone-400 hover:border-stone-500 transition-colors disabled:opacity-50"
                  >
                    重新裁切
                  </button>
                  <span className="flex-1 py-2 text-center text-[10px] text-stone-600 flex items-center justify-center">
                    主体已定位，点击下方生成图鉴
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={`w-full py-3 rounded-xl text-base font-bold tracking-wider transition-all ${
                canGenerate ? "text-stone-900 hover:scale-[1.02] active:scale-[0.98]" : "text-stone-600 cursor-not-allowed"
              }`}
              style={
                canGenerate
                  ? { background: "linear-gradient(135deg, #d4a853 0%, #b45309 50%, #92400e 100%)", boxShadow: "0 0 20px rgba(180,83,9,0.3)" }
                  : { background: "#292524", boxShadow: "none" }
              }
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-stone-600 border-t-amber-500 rounded-full animate-spin" />
                  AI 正在生成...
                </span>
              ) : (
                "⚒ 生成图鉴"
              )}
            </button>

            {!canGenerate && (city || imageFile || effectiveModelId) && (
              <div className="text-center text-[10px] text-stone-500 space-y-0.5">
                {!effectiveModelId && <p>⬩ 请选择模型（或在 API 设置中配置）</p>}
                {!city && <p>⬩ 请选择风格来源</p>}
                {!imageFile && <p>⬩ 请上传照片</p>}
              </div>
            )}

            {generateError && (
              <div className="p-3 rounded-lg border border-red-900/50 bg-red-900/20 text-center">
                <p className="text-xs text-red-400/80">{generateError}</p>
                <p className="text-[10px] text-stone-500 mt-1">
                  站点默认模型暂不可用？你可以在右上角 ⚙ API 设置中填写自己的 API Key 继续使用
                </p>
              </div>
            )}

            {!city && !imageFile && !effectiveModelId && (
              <p className="text-center text-xs text-stone-600">
                选择模型和风格来源，上传照片，AI 将为你生成识物图鉴卡片
              </p>
            )}
          </>
        )}

        {!currentCard && (
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-stone-800" />
            <span className="text-[10px] text-stone-600 tracking-wider">历史图鉴</span>
            <div className="flex-1 h-px bg-stone-800" />
          </div>
        )}

        <HistoryList cards={history} onSelect={handleHistorySelect} onDelete={handleHistoryDelete} />

        {history.length === 0 && !currentCard && (
          <p className="text-center text-xs text-stone-700 py-8">还没有生成过图鉴，快来试试吧</p>
        )}
      </main>

      <footer className="text-center py-4 px-4">
        <p className="text-[10px] text-stone-700">识物图鉴</p>
      </footer>

      <EditModal
        isOpen={showEditModal}
        currentName={currentCard?.fantasyName ?? ""}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditSubmit}
        disabled={isEditing}
      />

      {isEditing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center space-y-3">
            <div className="inline-block w-8 h-8 border-2 border-stone-600 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-sm text-amber-400/80">AI 正在重新生成...</p>
          </div>
        </div>
      )}

      <ApiSettingsPanel
        isOpen={showApiSettings}
        onClose={() => setShowApiSettings(false)}
        onSave={handleSaveByok}
        onClear={handleClearByok}
        initialConfig={byokConfig}
      />
    </div>
  );
}
