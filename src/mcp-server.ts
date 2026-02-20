import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CfWorkerJsonSchemaValidator } from "@modelcontextprotocol/sdk/validation/cfworker";
import { z } from "zod";
import type { Env } from "./lib/env.js";
import { fetchMarkdown } from "./services/fetch-markdown.js";
import { renderMarkdown } from "./services/render-markdown.js";
import { convertToMarkdown } from "./services/convert-to-markdown.js";
import type { ServiceResult } from "./services/types.js";

function toMcpResult(result: ServiceResult) {
  if (!result.ok) {
    return { content: [{ type: "text" as const, text: result.error }], isError: true };
  }
  return { content: [{ type: "text" as const, text: result.markdown }] };
}

export function createMcpServer(env: Env): McpServer {
  const server = new McpServer(
    { name: "web2markdown", version: "1.0.0" },
    { jsonSchemaValidator: new CfWorkerJsonSchemaValidator() },
  );

  server.tool(
    "fetch_markdown",
    "Fetch a web page and convert its HTML to Markdown using Cloudflare Workers AI. Best for static pages. Does not execute JavaScript \u2014 use render_markdown for SPAs.",
    {
      url: z.string().url().describe("The URL of the web page to convert to Markdown"),
      headers: z.record(z.string()).optional().describe("Optional custom HTTP headers for the fetch request (e.g. Cookie, Authorization)"),
      maxLength: z.number().int().min(0).optional().describe("Maximum character length of returned Markdown. 0 or omitted means no limit."),
    },
    async (input) => toMcpResult(await fetchMarkdown(env, input)),
  );

  server.tool(
    "render_markdown",
    "Render a web page in a headless browser and convert it to Markdown using Cloudflare Browser Rendering. Use this for JavaScript-heavy SPAs and dynamic content that fetch_markdown cannot handle. Rate limits: Free tier 6 req/min, 10 min/day.",
    {
      url: z.string().url().describe("The URL of the web page to render and convert to Markdown"),
      waitForSelector: z.string().optional().describe("CSS selector to wait for before extracting content (e.g. '#main-content')"),
      maxLength: z.number().int().min(0).optional().describe("Maximum character length of returned Markdown. 0 or omitted means no limit."),
    },
    async (input) => toMcpResult(await renderMarkdown(env, input)),
  );

  server.tool(
    "convert_to_markdown",
    "Download a document (PDF, image, Office doc, CSV, XML) from a URL and convert it to Markdown using Cloudflare Workers AI. Supported formats: PDF, JPEG, PNG, WebP, SVG, DOCX, XLSX, PPTX, CSV, XML, ODT, ODS, ODP.",
    {
      url: z.string().url().describe("URL of the document to download and convert"),
      filename: z.string().optional().describe("Override filename (with extension) for MIME type detection. If omitted, derived from URL."),
      maxLength: z.number().int().min(0).optional().describe("Maximum character length of returned Markdown. 0 or omitted means no limit."),
    },
    async (input) => toMcpResult(await convertToMarkdown(env, input)),
  );

  return server;
}
