import type { Env } from "../lib/env.js";
import type { ServiceResult } from "./types.js";
import { generateTags, insertTagsIntoFrontmatter } from "./generate-tags.js";

export async function enrichWithTags(
  env: Env,
  result: ServiceResult & { ok: true },
): Promise<ServiceResult & { ok: true }> {
  const tags = await generateTags(env, result.markdown);
  const enriched = insertTagsIntoFrontmatter(result.markdown, tags);
  return { ...result, markdown: enriched, originalLength: enriched.length };
}

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
  return {
    ok: true,
    markdown,
    truncated: false,
    originalLength: markdown.length,
  };
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
