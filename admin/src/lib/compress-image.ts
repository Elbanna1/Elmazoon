/**
 * Shrink an image before it is uploaded.
 *
 * Publishing a fatwa with a picture was slow, and the cause was not the API and
 * not the database — a create with no image round-trips in ~120ms. It was the
 * bytes. The uploader accepted the camera's original file (up to 5MB) and sent it
 * verbatim, and the backend ingests at roughly 100KB/s, so publish time was very
 * nearly a straight line through the file size:
 *
 *     no image     0KB    ~120ms
 *     small      215KB   ~2,200ms
 *     medium     664KB   ~6,900ms
 *     large    1,387KB  ~13,600ms
 *
 * Nothing downstream can fix that; the only lever is to send less. A cover image
 * is displayed at a few hundred pixels, so a 4000px original carries perhaps
 * fifteen times the pixels that are ever shown, and PNG (what phones and
 * screenshots produce) is the worst possible encoding for a photograph.
 *
 * So: downscale to at most MAX_EDGE, re-encode as WebP, and send that. A typical
 * 1.4MB photo lands around 80–120KB — roughly a tenfold cut, and publish drops
 * from ~14s to under a second.
 *
 * This is deliberately best-effort. Every failure path returns the original file
 * unchanged, because a slow publish is a far better outcome than a failed one.
 */

/** The longest edge we will send. Larger than any surface that displays it. */
const MAX_EDGE = 1600;

/** Quality for the re-encode. Above ~0.85 the file grows with no visible gain. */
const QUALITY = 0.82;

/**
 * Files at or below this are already cheap to upload (<1s), and re-encoding one
 * can easily make it *bigger*. Left alone.
 */
const SKIP_BELOW_BYTES = 150 * 1024;

/** Encoders to try, best first. Safari gained WebP encoding late; JPEG is the floor. */
const CANDIDATE_TYPES = ["image/webp", "image/jpeg"] as const;

function extensionFor(type: string): string {
  return type === "image/webp" ? "webp" : "jpg";
}

/** `photo.HEIC.png` → `photo.HEIC` → we want `photo.HEIC.webp`, not `photo.webp`. */
function renameTo(name: string, type: string): string {
  const stem = name.replace(/\.[^./\\]+$/, "") || "image";
  return `${stem}.${extensionFor(type)}`;
}

async function encode(
  canvas: HTMLCanvasElement,
  type: string,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        // A canvas asked for a type it cannot encode does not throw — it silently
        // falls back to PNG, which for a photograph is *larger* than the original.
        // Detect that by what came back, not by what was asked for.
        resolve(blob && blob.type === type ? blob : null);
      },
      type,
      QUALITY,
    );
  });
}

export async function compressImage(file: File): Promise<File> {
  // SSR, or a browser too old for the APIs below. Send what we were given.
  if (typeof document === "undefined" || typeof createImageBitmap !== "function") {
    return file;
  }

  // An animated GIF/WebP would be flattened to a single frame by a canvas, and
  // an SVG has no pixels to resample. Neither is worth the risk.
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;

  if (file.size <= SKIP_BELOW_BYTES) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Corrupt, or an encoding this browser cannot decode. The server may still
    // cope with it, so it is not ours to reject here — that is the uploader's job.
    return file;
  }

  try {
    const { width, height } = bitmap;
    if (!width || !height) return file;

    // Only ever scale down. Upscaling a small image would invent detail and cost
    // bytes to do it.
    const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    if (!context) return file;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

    for (const type of CANDIDATE_TYPES) {
      const blob = await encode(canvas, type);
      if (!blob) continue;

      // Re-encoding is not guaranteed to win — a small, already-optimised JPEG can
      // come back bigger. Send whichever is actually smaller.
      if (blob.size >= file.size) continue;

      return new File([blob], renameTo(file.name, type), {
        type,
        lastModified: Date.now(),
      });
    }

    return file;
  } catch {
    return file;
  } finally {
    // The decoded bitmap is full-resolution and lives outside the JS heap until
    // it is closed; a few large publishes without this is tens of MB held.
    bitmap.close();
  }
}
