export type SubjectBox = {
  centerX: number; // 0-1000
  centerY: number; // 0-1000
  width: number;   // 0-1000
  height: number;  // 0-1000
};

export type CropBox = {
  x: number;
  y: number;
  size: number;
};

export type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Calculate a square crop box centered on the subject, with 1.5x padding.
 * Coordinates are in actual image pixels.
 * Used for OLD cards and AI analysis that need square images.
 */
export function calculateCrop(
  imgWidth: number,
  imgHeight: number,
  box: SubjectBox
): CropBox {
  // Convert 0-1000 normalized coords to actual pixels
  const cx = (box.centerX / 1000) * imgWidth;
  const cy = (box.centerY / 1000) * imgHeight;
  const bw = (box.width / 1000) * imgWidth;
  const bh = (box.height / 1000) * imgHeight;

  // Square crop = max(bw, bh) x 1.5
  let size = Math.max(bw, bh) * 1.5;

  // Clamp to image's shortest side
  size = Math.min(size, Math.min(imgWidth, imgHeight));

  // Center on subject, then clamp to image bounds
  let x = cx - size / 2;
  let y = cy - size / 2;

  x = Math.max(0, Math.min(x, imgWidth - size));
  y = Math.max(0, Math.min(y, imgHeight - size));

  return { x: Math.round(x), y: Math.round(y), size: Math.round(size) };
}

/**
 * Calculate a template-aware crop rect centered on the subject,
 * with aspect ratio matching the template's portrait slot.
 *
 * targetRatio = portraitSlot.w / portraitSlot.h
 *
 * The crop gives the subject padding (1.35x by default), extends to the
 * target aspect ratio, then clamps to image bounds.
 */
export function calculateTemplatePortraitCrop(
  imgWidth: number,
  imgHeight: number,
  box: SubjectBox,
  targetRatio: number,
  opts?: { paddingFactor?: number }
): CropRect {
  const padding = opts?.paddingFactor ?? 1.35;

  // Convert 0-1000 normalized coords to actual pixels
  const cx = (box.centerX / 1000) * imgWidth;
  const cy = (box.centerY / 1000) * imgHeight;
  const bw = (box.width / 1000) * imgWidth;
  const bh = (box.height / 1000) * imgHeight;

  // Padded subject size
  const minCropW = bw * padding;
  const minCropH = bh * padding;

  // Extend to target ratio
  let cropW: number;
  let cropH: number;
  if (minCropW / minCropH < targetRatio) {
    cropH = minCropH;
    cropW = cropH * targetRatio;
  } else {
    cropW = minCropW;
    cropH = cropW / targetRatio;
  }

  // Clamp to what the image can contain at this ratio
  const maxCropW = imgHeight * targetRatio <= imgWidth
    ? imgHeight * targetRatio
    : imgWidth;
  const maxCropH = imgWidth / targetRatio <= imgHeight
    ? imgWidth / targetRatio
    : imgHeight;

  cropW = Math.min(cropW, maxCropW);
  cropH = Math.min(cropH, maxCropH);

  // Center on subject
  let x = cx - cropW / 2;
  let y = cy - cropH / 2;

  // Clamp to image bounds
  x = Math.max(0, Math.min(x, imgWidth - cropW));
  y = Math.max(0, Math.min(y, imgHeight - cropH));

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(cropW),
    height: Math.round(cropH),
  };
}

/**
 * Crop an image (given as a data URL) using the specified CropBox (square).
 * Returns a JPEG data URL.
 */
export function cropImage(dataUrl: string, crop: CropBox): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = crop.size;
      canvas.height = crop.size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      ctx.drawImage(
        img,
        crop.x, crop.y, crop.size, crop.size,
        0, 0, crop.size, crop.size
      );
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = () => reject(new Error("Failed to load image for cropping"));
    img.src = dataUrl;
  });
}

/**
 * Crop an image (given as a data URL) to an arbitrary rect.
 * Returns a JPEG data URL with dimensions matching the crop rect.
 */
export function cropImageToRect(
  dataUrl: string,
  crop: CropRect,
  opts?: { quality?: number }
): Promise<string> {
  const quality = opts?.quality ?? 0.9;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      ctx.drawImage(
        img,
        crop.x, crop.y, crop.width, crop.height,
        0, 0, crop.width, crop.height
      );
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Failed to load image for cropping"));
    img.src = dataUrl;
  });
}

/**
 * Get the portrait slot aspect ratio (w/h) from template slot dimensions.
 */
export function getPortraitSlotRatio(
  slotW: number,
  slotH: number,
  inset?: { top: number; right: number; bottom: number; left: number }
): number {
  const w = inset ? slotW - inset.left - inset.right : slotW;
  const h = inset ? slotH - inset.top - inset.bottom : slotH;
  return w / h;
}
