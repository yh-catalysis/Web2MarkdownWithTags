import type { Env } from "../lib/env.js";
import { FETCH_TIMEOUT, WAIT_FOR_SELECTOR_TIMEOUT } from "../lib/constants.js";
import { validateUrl } from "../lib/validate-url.js";
import { convertViaAI, applyTruncation, enrichWithTags } from "./shared.js";
import type { RenderMarkdownInput, ServiceResult } from "./types.js";
import puppeteer from "@cloudflare/puppeteer";

export async function renderMarkdown(
  env: Env,
  input: RenderMarkdownInput,
): Promise<ServiceResult> {
  try {
    validateUrl(input.url);

    const browser = await puppeteer.launch(env.BROWSER);
    try {
      const page = await browser.newPage();
      await page.goto(input.url, {
        waitUntil: "networkidle0",
        timeout: FETCH_TIMEOUT,
      });

      if (input.waitForSelector) {
        await page.waitForSelector(input.waitForSelector, {
          timeout: WAIT_FOR_SELECTOR_TIMEOUT,
        });
      }

      const html = await page.content();
      await browser.close();

      const result = await convertViaAI(
        env,
        "rendered.html",
        html,
        "text/html",
      );
      if (!result.ok) return result;

      const enriched = await enrichWithTags(env, result);
      return applyTruncation(enriched, input.maxLength);
    } catch (error) {
      await browser.close().catch(() => {});
      throw error;
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
