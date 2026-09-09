import { toBlob } from "html-to-image";
import JSZip from "jszip";

/**
 * Renders a 1080x1350 DOM slide element to a high-quality PNG Blob.
 * Awaits web fonts and images to guarantee complete, crisp rendering.
 */
export async function exportSlideElementToBlob(
  element: HTMLElement,
): Promise<Blob> {
  if (document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // fonts ready fallback
    }
  }

  // Ensure all image elements inside have finished decoding (with 4s safety timeout)
  const imgs = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const timer = setTimeout(() => resolve(), 4000);
        img.onload = () => {
          clearTimeout(timer);
          resolve();
        };
        img.onerror = () => {
          clearTimeout(timer);
          resolve();
        };
      });
    }),
  );

  const blob = await toBlob(element, {
    width: 1080,
    height: 1350,
    canvasWidth: 1080,
    canvasHeight: 1350,
    pixelRatio: 1,
    quality: 0.95,
    cacheBust: true,
  });

  if (!blob) {
    throw new Error("Failed to render 1080x1350 slide image");
  }

  return blob;
}

/**
 * Downloads a single slide as a 1080x1350 PNG file.
 */
export async function downloadSlidePng(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const blob = await exportSlideElementToBlob(element);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Renders all provided slide elements at 1080x1350, bundles them into a ZIP archive
 * containing slide_1.png through slide_N.png, and triggers browser download.
 */
export async function downloadAllSlidesAsZip(
  slideElements: HTMLElement[],
  zipFilename: string = "nzz-carousel-1080x1350.zip",
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  const zip = new JSZip();

  for (let i = 0; i < slideElements.length; i++) {
    if (onProgress) {
      onProgress(i + 1, slideElements.length);
    }
    const el = slideElements[i];
    if (!el) continue;
    const blob = await exportSlideElementToBlob(el);
    zip.file(`slide_${i + 1}.png`, blob);
  }

  const content = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipFilename.endsWith(".zip")
    ? zipFilename
    : `${zipFilename}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
