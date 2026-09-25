import type { Env } from "../lib/env.js";
import { TAG_MODEL } from "../lib/constants.js";

const TAG_PROMPT =
  "以下のMarkdownテキストの内容を分析し、記事を分類するための適切なタグ（キーワード）を3〜5個抽出してください。カンマ区切りの文字列のみを出力し、それ以外の説明は含めないでください。";

const MAX_CONTENT_LENGTH = 3000;
const MAX_TAGS = 5;
// Leaves room for reasoning tokens in case the model ignores enable_thinking: false.
const MAX_COMPLETION_TOKENS = 4096;

const TAG_SEPARATORS = /[,，、\n]/;
const LEADING_MARKERS = /^(?:[-*•・#]\s*)+/;
const EDGE_QUOTES = /^["'`“”‘’「」『』*]+|["'`“”‘’「」『』*]+$/g;

export async function generateTags(
  env: Env,
  markdownText: string,
): Promise<string[]> {
  try {
    const truncated = markdownText.slice(0, MAX_CONTENT_LENGTH);

    const result = await env.AI.run(TAG_MODEL, {
      messages: [
        { role: "system", content: TAG_PROMPT },
        { role: "user", content: truncated },
      ],
      max_completion_tokens: MAX_COMPLETION_TOKENS,
      chat_template_kwargs: { enable_thinking: false },
    });

    const tags = parseTags(extractText(result));
    if (tags.length === 0) {
      console.warn(`generateTags: no tags extracted (model: ${TAG_MODEL})`);
    }
    return tags;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`generateTags: ${TAG_MODEL} failed: ${message}`);
    return [];
  }
}

// Reads a plain string, `{ response }` (legacy Workers AI) or
// `{ choices: [{ message: { content } }] }` (OpenAI-compatible). Fields that
// carry only the model's reasoning, such as `reasoning_content`, are ignored.
function extractText(result: unknown): string {
  if (typeof result === "string") return result;
  if (typeof result !== "object" || result === null) return "";

  const { response, choices } = result as {
    response?: unknown;
    choices?: unknown;
  };
  if (typeof response === "string") return response;
  if (Array.isArray(choices)) {
    const first = choices[0] as { message?: { content?: unknown } } | null;
    const content = first?.message?.content;
    if (typeof content === "string") return content;
  }
  return "";
}

function stripThinking(text: string): string {
  return (
    text
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      // Reasoning whose opening tag came from the chat template.
      .replace(/^[\s\S]*<\/think>/i, "")
      // Reasoning cut off by the token limit.
      .replace(/<think>[\s\S]*$/i, "")
  );
}

function cleanTag(raw: string): string {
  return raw
    .trim()
    .replace(LEADING_MARKERS, "")
    .replace(EDGE_QUOTES, "")
    .replace(LEADING_MARKERS, "")
    .trim();
}

function parseTags(text: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of stripThinking(text).split(TAG_SEPARATORS)) {
    const tag = cleanTag(part);
    if (tag.length === 0 || tag.length >= 100) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length === MAX_TAGS) break;
  }
  return tags;
}

export function insertTagsIntoFrontmatter(
  markdown: string,
  tags: string[],
): string {
  const tagsYaml =
    tags.length > 0
      ? `tags:\n${tags.map((t) => `  - ${JSON.stringify(t)}`).join("\n")}`
      : "tags: []";

  if (markdown.startsWith("---\n")) {
    const endIndex = markdown.indexOf("\n---", 3);
    if (endIndex !== -1) {
      const frontmatter = markdown.slice(4, endIndex);
      const body = markdown.slice(endIndex + 4);
      return `---\n${frontmatter}\n${tagsYaml}\n---${body}`;
    }
  }

  return `---\n${tagsYaml}\n---\n\n${markdown}`;
}
