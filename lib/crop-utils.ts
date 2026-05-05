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

/**
 * Calculate a square crop box centered on the subject, with 1.5× padding.
 * Coordinates are in actual image pixels.
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

  // Square crop = max(bw, bh) × 1.5
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
 * Crop an image (given as a data URL) using the specified CropBox.
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
