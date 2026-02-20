import { MAX_RESPONSE_SIZE } from "./constants.js";

export async function readBodyWithLimit(
  response: Response,
): Promise<ArrayBuffer> {
  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
    await response.body?.cancel();
    throw new Error(
      `Response too large: ${contentLength} bytes exceeds ${MAX_RESPONSE_SIZE} byte limit`,
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response has no body");
  }

  const chunks: Uint8Array[] = [];
  let totalSize = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalSize += value.byteLength;
    if (totalSize > MAX_RESPONSE_SIZE) {
      await reader.cancel();
      throw new Error(
        `Response exceeded ${MAX_RESPONSE_SIZE} byte limit during download`,
      );
    }
    chunks.push(value);
  }

  const result = new Uint8Array(totalSize);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result.buffer;
}
