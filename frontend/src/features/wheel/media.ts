export const MAX_IMAGE_BYTES = 1024 * 1024;
export const MAX_WHEEL_IMAGE_BYTES = 2 * MAX_IMAGE_BYTES;
const embeddedImage = /^data:(image\/(?:gif|png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

export function embeddedBytes(value: string): number {
  if (!value.startsWith("data:")) return 0;
  const payload = value.slice(value.indexOf(",") + 1);
  return Math.floor(payload.length * 3 / 4) - (payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0);
}

export function validGifSource(value: string): boolean {
  if (!value) return true;
  if (value.startsWith("data:")) {
    const match = embeddedImage.exec(value);
    if (!match || match[2].length % 4 !== 0 || embeddedBytes(value) > MAX_IMAGE_BYTES) return false;
    try {
      const header = atob(match[2].slice(0, 16));
      const type = header.startsWith("GIF87a") || header.startsWith("GIF89a") ? "image/gif"
        : header.startsWith("\x89PNG\r\n\x1a\n") ? "image/png"
        : header.startsWith("\xff\xd8\xff") ? "image/jpeg"
        : header.startsWith("RIFF") && header.slice(8, 12) === "WEBP" ? "image/webp" : "";
      return type === match[1];
    } catch { return false; }
  }
  try {
    const url = new URL(value);
    return value.length <= 2048 && url.protocol === "https:" && !url.username && !url.password;
  } catch { return false; }
}

export async function imageFileSource(file: File): Promise<string> {
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Choose a GIF or image smaller than 1 MB.");
  if (!["image/gif", "image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new Error("Choose a GIF, PNG, JPEG, or WebP image.");
  }
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read this image. Try choosing the file again."));
    reader.readAsDataURL(file);
  });
  if (!validGifSource(source)) throw new Error("This file is not a supported image.");
  return source;
}
