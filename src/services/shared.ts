import type { Env } from "../lib/env.js";
import type { ServiceResult } from "./types.js";

export async function convertViaAI(
  env: Env,
  fileName: string,
  data: ArrayBuffer | string,
  mimeType: string,
): Promise<ServiceResult> {
  const blob = new Blob([data], { type: mimeType });
  const results = await env.AI.toMarkdown([{ name: fileName, blob }]);

  if (results.length === 0) {
    return { ok: false, error: "Cloudflare toMarkdown returned no results" };
  }

  const result = results[0];
  if (result.format === "error") {
    return {
      ok: false,
      error: `Cloudflare conversion error: ${(result as { error?: string }).error ?? "unknown"}`,
    };
  }

  const markdown = result.data ?? "";
  return { ok: true, markdown, truncated: false, originalLength: markdown.length };
}

export function applyTruncation(
  result: ServiceResult & { ok: true },
  maxLength?: number,
): ServiceResult {
  const { markdown } = result;
  if (maxLength && maxLength > 0 && markdown.length > maxLength) {
    return {
      ok: true,
      markdown:
        `[Truncated: showing ${maxLength} of ${markdown.length} characters]\n\n` +
        markdown.slice(0, maxLength),
      truncated: true,
      originalLength: markdown.length,
    };
  }
  return result;
}
