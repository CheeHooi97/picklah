import { embeddedBytes, MAX_IMAGE_BYTES, validGifSource } from "./media.ts";

const MAX_PIXELS = 40_000_000;

function checkDimensions(width: number, height: number) {
  if (!width || !height || width * height > MAX_PIXELS) {
    throw new Error("This image is too large to process. Choose a photo under 40 megapixels.");
  }
}

function encodeImage(image: CanvasImageSource, width: number, height: number): string {
  checkDimensions(width, height);
  const canvas = document.createElement("canvas");
  let edge = 512;
  for (let attempt = 0; attempt < 4; attempt++, edge /= 2) {
    const scale = Math.min(1, edge / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing is unavailable in this browser.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    // PNG keeps transparency and makes a static, portable wheel image.
    const source = canvas.toDataURL("image/png");
    if (embeddedBytes(source) <= Math.min(MAX_IMAGE_BYTES, 256 * 1024) && validGifSource(source)) return source;
  }
  throw new Error("This image could not be resized. Try another image.");
}

async function loadImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Image decode failed"));
    });
    image.src = url;
    await loaded;
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function convertImageFile(file: File, detectedType: string): Promise<string> {
  const header = String.fromCharCode(...new Uint8Array(await file.slice(0, 64).arrayBuffer()));
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const heif = header.slice(4, 8) === "ftyp" && /heic|heix|hevc|hevx|heim|heis|mif1|msf1/.test(header.slice(8));
  const tiff = header.startsWith("II\x2a\x00") || header.startsWith("MM\x00\x2a");
  const extensions: Record<string, string> = {
    svg: "image/svg+xml", bmp: "image/bmp", ico: "image/x-icon", avif: "image/avif",
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp",
    jxl: "image/jxl", heic: "image/heic", heif: "image/heif", tif: "image/tiff", tiff: "image/tiff",
  };
  let type = detectedType || (header.startsWith("BM") ? "image/bmp"
    : header.startsWith("\x00\x00\x01\x00") ? "image/x-icon"
    : header.slice(4, 8) === "ftyp" && /avif|avis/.test(header.slice(8)) ? "image/avif"
    : file.type.startsWith("image/") ? file.type : extensions[extension] || "");
  if (!type && !heif && !tiff) throw new Error("Choose an image file. This file's format could not be recognized.");
  if (heif) type = "image/heic";
  if (tiff) type = "image/tiff";
  const blob = file.slice(0, file.size, type);
  try {
    // Prefer native decoding, including future formats supported by the browser.
    const image = await loadImage(blob);
    return encodeImage(image, image.naturalWidth, image.naturalHeight);
  } catch (nativeError) {
    if (!heif && !tiff && !["heic", "heif", "tif", "tiff"].includes(extension)) {
      if (nativeError instanceof Error && /too large|unavailable|resized/.test(nativeError.message)) throw nativeError;
      throw new Error("This image is damaged or its format cannot be decoded in this browser. Try exporting it as PNG or JPG.");
    }
  }
  try {
    if (tiff || ["tif", "tiff"].includes(extension)) {
      const { default: UTIF } = await import("utif");
      const buffer = await file.arrayBuffer();
      const page = UTIF.decode(buffer).find((entry) => Number((entry.t256 as number[])?.[0]) > 0 && Number((entry.t257 as number[])?.[0]) > 0);
      if (!page) throw new Error("No image page");
      checkDimensions(Number((page.t256 as number[])[0]), Number((page.t257 as number[])[0]));
      UTIF.decodeImage(buffer, page);
      const canvas = document.createElement("canvas");
      canvas.width = page.width;
      canvas.height = page.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      const pixels = new Uint8ClampedArray(UTIF.toRGBA8(page));
      context.putImageData(new ImageData(pixels, page.width, page.height), 0, 0);
      return encodeImage(canvas, page.width, page.height);
    }
    const { heicTo } = await import("heic-to/csp");
    const bitmap = await heicTo({ blob, type: "bitmap" });
    try { return encodeImage(bitmap, bitmap.width, bitmap.height); }
    finally { bitmap.close(); }
  } catch (error) {
    if (error instanceof Error && /too large/.test(error.message)) throw error;
    throw new Error("This image could not be converted. It may be damaged or use an unsupported codec. Try exporting it as PNG or JPG.");
  }
}
