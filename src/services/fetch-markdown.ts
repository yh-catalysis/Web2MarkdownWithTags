import type { Env } from "../lib/env.js";
import { USER_AGENT, FETCH_TIMEOUT } from "../lib/constants.js";
import { validateUrl } from "../lib/validate-url.js";
import { readBodyWithLimit } from "../lib/fetch-utils.js";
import { convertViaAI, applyTruncation } from "./shared.js";
import type { FetchMarkdownInput, ServiceResult } from "./types.js";

export async function fetchMarkdown(
  env: Env,
  input: FetchMarkdownInput,
): Promise<ServiceResult> {
  try {
    validateUrl(input.url);

    const fetchHeaders: Record<string, string> = {
      "User-Agent": USER_AGENT,
      ...input.headers,
    };

    const pageResponse = await fetch(input.url, {
      headers: fetchHeaders,
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });

    if (!pageResponse.ok) {
      return {
        ok: false,
        error: `Failed to fetch ${input.url}: HTTP ${pageResponse.status} ${pageResponse.statusText}`,
        statusCode: 502,
      };
    }

    const htmlBytes = await readBodyWithLimit(pageResponse);

    let hostname: string;
    try {
      hostname = new URL(input.url).hostname;
    } catch {
      hostname = "page";
    }

    const result = await convertViaAI(env, `${hostname}.html`, htmlBytes, "text/html");
    if (!result.ok) return result;

    return applyTruncation(result, input.maxLength);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
