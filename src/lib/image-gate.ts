import type { Env } from "./env.js";

const IMAGE_MIME_PREFIXES = ["image/"];
const IMAGE_EXTENSIONS = [".jpeg", ".jpg", ".png", ".webp", ".svg"];

export function isPaidConversion(fileName: string, mimeType: string): boolean {
  if (IMAGE_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix))) {
    return true;
  }
  const lowerName = fileName.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

export function isImageConversionAllowed(env: Env): boolean {
  return env.ALLOW_IMAGE_CONVERSION === "true";
}
