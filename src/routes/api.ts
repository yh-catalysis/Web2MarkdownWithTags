import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../lib/env.js";
import { fetchMarkdown } from "../services/fetch-markdown.js";
import { renderMarkdown } from "../services/render-markdown.js";
import { convertToMarkdown } from "../services/convert-to-markdown.js";
import type { ServiceResult } from "../services/types.js";

type HonoEnv = { Bindings: Env };

function toHttpResponse(c: { json: (data: unknown, status?: number) => Response }, result: ServiceResult) {
  if (!result.ok) {
    const status = result.statusCode ?? 500;
    return c.json({ error: { message: result.error } }, status);
  }
  return c.json({
    markdown: result.markdown,
    metadata: {
      originalLength: result.originalLength,
      truncated: result.truncated,
    },
  });
}

const fetchSchema = z.object({
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
  maxLength: z.number().int().min(0).optional(),
});

const renderSchema = z.object({
  url: z.string().url(),
  waitForSelector: z.string().optional(),
  maxLength: z.number().int().min(0).optional(),
});

const convertSchema = z.object({
  url: z.string().url(),
  filename: z.string().optional(),
  maxLength: z.number().int().min(0).optional(),
});

const api = new Hono<HonoEnv>();

api.onError((err, c) => {
  if (err instanceof SyntaxError) {
    return c.json({ error: { message: "Invalid JSON in request body" } }, 400);
  }
  return c.json({ error: { message: "Internal server error" } }, 500);
});

api.post("/fetch", async (c) => {
  const parsed = fetchSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: { message: parsed.error.issues[0].message } }, 400);
  }
  const result = await fetchMarkdown(c.env, parsed.data);
  return toHttpResponse(c, result);
});

api.post("/render", async (c) => {
  const parsed = renderSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: { message: parsed.error.issues[0].message } }, 400);
  }
  const result = await renderMarkdown(c.env, parsed.data);
  return toHttpResponse(c, result);
});

api.post("/convert", async (c) => {
  const parsed = convertSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: { message: parsed.error.issues[0].message } }, 400);
  }
  const result = await convertToMarkdown(c.env, parsed.data);
  return toHttpResponse(c, result);
});

export { api };
