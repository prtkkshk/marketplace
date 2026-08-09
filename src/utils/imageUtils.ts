/**
 * Image validation and metadata stripping.
 *
 * Both functions here are P1 privacy/security controls. Covered by
 * tests/unit/imageUtils.test.ts — do not change the byte offsets or the re-encode step
 * without updating those tests.
 */

/** Bytes we need to identify every format we accept. WebP needs 12. */
const HEADER_BYTES = 12;

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

/**
 * Validates that a file really is an image we accept, by reading its MAGIC BYTES rather
 * than trusting the filename or the browser-reported MIME type. Both of those are
 * attacker-controlled: a `.txt` renamed `.jpg` was accepted before this existed.
 *
 * SVG is deliberately NOT accepted. It is XML, it can carry <script>, and serving one
 * inline from storage is a stored-XSS vector.
 */
export async function validateImageMagicBytes(file: File): Promise<boolean> {
  let buffer: ArrayBuffer | null = null;
  try {
    const slice = file.slice(0, HEADER_BYTES);
    buffer = slice.arrayBuffer ? await slice.arrayBuffer() : await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(slice);
    });
  } catch (e) {
    return false;
  }
  if (!buffer || buffer.byteLength < 4) return false;

  const bytes = new Uint8Array(buffer);
  const header = toHex(bytes);

  if (header.startsWith('ffd8ff')) return true; // JPEG
  if (header.startsWith('89504e470d0a1a0a')) return true; // PNG (full 8-byte signature)
  if (header.startsWith('474946383761') || header.startsWith('474946383961')) return true; // GIF87a / GIF89a

  // WebP is a RIFF container: "RIFF" ....(size).... "WEBP".
  // Checking only "RIFF" (the previous implementation) also matches AVI and WAV, so a
  // .wav renamed .jpg passed validation. Bytes 8-11 must spell WEBP.
  if (bytes.byteLength >= HEADER_BYTES) {
    const riff = header.startsWith('52494646');
    const webp = toHex(bytes.subarray(8, 12)) === '57454250';
    if (riff && webp) return true;
  }

  return false;
}

/**
 * Strips ALL metadata — including GPS EXIF — by re-encoding through a canvas.
 *
 * Why this exists: students photograph items in their hall rooms, so listing photos carry
 * GPS coordinates that identify where they live. An audit uploaded an image with known GPS,
 * downloaded the stored object, and found the coordinates intact.
 *
 * `browser-image-compression` drops metadata as a side effect of re-encoding, but only when
 * it actually re-encodes — a file already under maxSizeMB can pass straight through. This
 * runs unconditionally, before compression.
 *
 * The canvas 2D context has no access to the source file's metadata, so anything it draws
 * out is metadata-free by construction.
 */
export async function stripExif(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');

      // Resize while we are already re-encoding. A phone camera produces 3000-4000px
      // images; the largest place a listing photo is ever rendered is the detail hero at
      // roughly 800px CSS, so 1600px covers 2x DPR with room to spare.
      //
      // This is done HERE rather than with Supabase's image transform API because that API
      // lives at /storage/v1/render/image/... (not /object/...) AND is a paid Pro feature.
      // Appending ?width= to an /object/ URL is silently ignored, so the full-resolution
      // file is still downloaded. Resizing on upload is free, works on any plan, and also
      // keeps the 500MB free-tier storage cap from filling with 4MB originals.
      const MAX_EDGE = 1600;
      const srcW = img.naturalWidth || img.width;
      const srcH = img.naturalHeight || img.height;
      const scale = Math.min(1, MAX_EDGE / Math.max(srcW, srcH));

      canvas.width = Math.round(srcW * scale);
      canvas.height = Math.round(srcH * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob failed'));
            return;
          }

          // Trust the blob's ACTUAL type, not the type we asked for. Browsers that cannot
          // encode WebP (Safari below 14, some Android WebViews) silently fall back to PNG
          // while toBlob still succeeds. Labelling that blob "image/webp" would ship a file
          // whose extension, MIME type and real contents disagree — which the storage
          // bucket's allowed_mime_types check would then reject, or worse, accept and serve
          // incorrectly.
          const actualType = blob.type || 'image/png';
          const ext = actualType === 'image/webp' ? 'webp' : 'png';
          const base = file.name.replace(/\.[^/.]+$/, '');

          resolve(
            new File([blob], `${base}.${ext}`, {
              type: actualType,
              lastModified: Date.now(),
            })
          );
        },
        'image/webp',
        0.9
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for EXIF stripping'));
    };

    img.src = url;
  });
}
