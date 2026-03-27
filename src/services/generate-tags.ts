import type { Env } from "../lib/env.js";

const TAG_PROMPT =
  "以下のMarkdownテキストの内容を分析し、記事を分類するための適切なタグ（キーワード）を3〜5個抽出してください。カンマ区切りの文字列のみを出力し、それ以外の説明は含めないでください。";

const MAX_CONTENT_LENGTH = 3000;

export async function generateTags(
  env: Env,
  markdownText: string,
): Promise<string[]> {
  try {
    const truncated = markdownText.slice(0, MAX_CONTENT_LENGTH);

    const result = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
      messages: [
        { role: "system" as const, content: TAG_PROMPT },
        { role: "user" as const, content: truncated },
      ],
    });

    const raw =
      typeof result === "string"
        ? result
        : ((result as { response?: string }).response ?? "");

    if (!raw) return [];

    return raw
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0 && tag.length < 100);
  } catch {
    return [];
  }
}

export function insertTagsIntoFrontmatter(
  markdown: string,
  tags: string[],
): string {
  const tagsYaml =
    tags.length > 0
      ? `tags:\n${tags.map((t) => `  - ${t}`).join("\n")}`
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
