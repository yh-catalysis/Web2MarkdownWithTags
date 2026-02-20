export type ServiceResult =
  | { ok: true; markdown: string; truncated: boolean; originalLength: number }
  | { ok: false; error: string; statusCode?: number };

export interface FetchMarkdownInput {
  url: string;
  headers?: Record<string, string>;
  maxLength?: number;
}

export interface RenderMarkdownInput {
  url: string;
  waitForSelector?: string;
  maxLength?: number;
}

export interface ConvertToMarkdownInput {
  url: string;
  filename?: string;
  maxLength?: number;
}
