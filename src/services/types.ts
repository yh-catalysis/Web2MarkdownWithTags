export type ServiceResult =
  | { ok: true; markdown: string; truncated: boolean; originalLength: number }
  | { ok: false; error: string; statusCode?: number };

/**
 * Options forwarded to `AI.toMarkdown()` as `conversionOptions.html`.
 *
 * - `hostname`: host used to resolve relative links when the document has no
 *   `<base>` element.
 * - `cssSelector`: when set, only matching elements are converted. When unset,
 *   toMarkdown only strips `<header>`, `<footer>` and `<head>`.
 */
export interface HtmlConversionOptions {
  hostname?: string;
  cssSelector?: string;
}

export interface FetchMarkdownInput {
  url: string;
  headers?: Record<string, string>;
  maxLength?: number;
  cssSelector?: string;
}

export interface RenderMarkdownInput {
  url: string;
  waitForSelector?: string;
  maxLength?: number;
  cssSelector?: string;
}

export interface ConvertToMarkdownInput {
  url: string;
  filename?: string;
  maxLength?: number;
}
