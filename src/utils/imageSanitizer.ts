/**
 * EXIF Geolocation & Metadata Stripper
 *
 * Automatically removes all embedded GPS coordinates, altitude tags, camera models,
 * and personal metadata from uploaded images by re-rasterizing them through an in-memory
 * HTML5 Canvas before storage or network transmission.
 */

export interface SanitizedImageResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Sanitizes an image File or Blob by stripping EXIF GPS metadata.
 * @param file - Raw image File or Blob from file input or drag-and-drop
 * @param quality - Output JPEG/WebP compression quality (0.1 to 1.0, default: 0.92)
 * @param mimeType - Output MIME type (default: 'image/jpeg')
 */
export async function stripExifGpsMetadata(
  file: File | Blob,
  quality: number = 0.92,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<SanitizedImageResult> {
  return new Promise((resolve, reject) => {
    // Only process images
    if (!file.type.startsWith('image/')) {
      return reject(new Error('File is not a valid image format'));
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        // Create in-memory canvas
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          return reject(new Error('Canvas 2D context unavailable'));
        }

        // Draw image onto canvas - this discards all EXIF / GPS metadata blocks
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert canvas back to clean data URL and Blob
        const cleanDataUrl = canvas.toDataURL(mimeType, quality);

        canvas.toBlob(
          (cleanBlob) => {
            URL.revokeObjectURL(objectUrl);
            if (!cleanBlob) {
              return reject(new Error('Failed to create sanitized image blob'));
            }
            resolve({
              blob: cleanBlob,
              dataUrl: cleanDataUrl,
              width: canvas.width,
              height: canvas.height,
            });
          },
          mimeType,
          quality
        );
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for EXIF GPS sanitization'));
    };

    img.src = objectUrl;
  });
}
