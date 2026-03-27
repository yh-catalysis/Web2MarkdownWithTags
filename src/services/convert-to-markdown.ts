import type { Env } from "../lib/env.js";
import {
  extractFilename,
  DOCUMENT_DOWNLOAD_TIMEOUT,
} from "../lib/constants.js";
import { validateUrl } from "../lib/validate-url.js";
import { readBodyWithLimit } from "../lib/fetch-utils.js";
import {
  isPaidConversion,
  isImageConversionAllowed,
} from "../lib/image-gate.js";
import { convertViaAI, applyTruncation, enrichWithTags } from "./shared.js";
import type { ConvertToMarkdownInput, ServiceResult } from "./types.js";

export async function convertToMarkdown(
  env: Env,
  input: ConvertToMarkdownInput,
): Promise<ServiceResult> {
  try {
    validateUrl(input.url);

    const response = await fetch(input.url, {
      signal: AbortSignal.timeout(DOCUMENT_DOWNLOAD_TIMEOUT),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Failed to download ${input.url}: HTTP ${response.status} ${response.statusText}`,
        statusCode: 502,
      };
    }

    const contentType = response.headers.get("content-type");
    const resolvedFilename =
      input.filename ?? extractFilename(input.url, contentType);

    const mimeType =
      contentType?.split(";")[0].trim() ?? "application/octet-stream";
    if (
      isPaidConversion(resolvedFilename, mimeType) &&
      !isImageConversionAllowed(env)
    ) {
      return {
        ok: false,
        error: `Image conversion is disabled. '${resolvedFilename}' (${mimeType}) requires Workers AI models which consume Neurons. Set ALLOW_IMAGE_CONVERSION=true to enable.`,
        statusCode: 400,
      };
    }

    const fileBytes = await readBodyWithLimit(response);

    const result = await convertViaAI(
      env,
      resolvedFilename,
      fileBytes,
      mimeType,
    );
    if (!result.ok) return result;

    const enriched = await enrichWithTags(env, result);
    return applyTruncation(enriched, input.maxLength);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
