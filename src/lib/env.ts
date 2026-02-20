export interface Env {
  AI: Ai;
  BROWSER: Fetcher;
  AUTH_TOKEN: string;
  ALLOW_IMAGE_CONVERSION: string;
}

export function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);

  if (bufA.byteLength !== bufB.byteLength) {
    crypto.subtle.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.subtle.timingSafeEqual(bufA, bufB);
}
