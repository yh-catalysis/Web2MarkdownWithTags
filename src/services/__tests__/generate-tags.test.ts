import { describe, it, expect, vi, afterEach } from "vitest";
import {
  generateTags,
  insertTagsIntoFrontmatter,
} from "../generate-tags.js";
import { TAG_MODEL } from "../../lib/constants.js";
import type { Env } from "../../lib/env.js";

function makeEnv(run: ReturnType<typeof vi.fn>) {
  return { AI: { run } } as unknown as Env;
}

function envReturning(result: unknown) {
  const run = vi.fn().mockResolvedValue(result);
  return { env: makeEnv(run), run };
}

function chatCompletion(content: string | null, extra: object = {}) {
  return {
    id: "1",
    object: "chat.completion",
    created: 0,
    model: TAG_MODEL,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content, refusal: null, ...extra },
        finish_reason: "stop",
        logprobs: null,
      },
    ],
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("generateTags", () => {
  it("calls the configured model with reasoning disabled", async () => {
    const { env, run } = envReturning(chatCompletion("a"));
    await generateTags(env, "x".repeat(5000));
    expect(run).toHaveBeenCalledTimes(1);
    const [model, inputs] = run.mock.calls[0];
    expect(model).toBe(TAG_MODEL);
    expect(inputs.chat_template_kwargs).toEqual({ enable_thinking: false });
    expect(inputs.max_completion_tokens).toBeGreaterThanOrEqual(1024);
    expect(inputs.messages[1].content).toHaveLength(3000);
  });

  it("reads a plain string response", async () => {
    const { env } = envReturning("React, TypeScript, Vite");
    expect(await generateTags(env, "body")).toEqual([
      "React",
      "TypeScript",
      "Vite",
    ]);
  });

  it("reads { response }", async () => {
    const { env } = envReturning({ response: "React, TypeScript" });
    expect(await generateTags(env, "body")).toEqual(["React", "TypeScript"]);
  });

  it("reads { choices: [{ message: { content } }] }", async () => {
    const { env } = envReturning(chatCompletion("Zenn, Markdown"));
    expect(await generateTags(env, "body")).toEqual(["Zenn", "Markdown"]);
  });

  it("ignores reasoning_content", async () => {
    const { env } = envReturning(
      chatCompletion("Zenn, Markdown", {
        reasoning_content: "Maybe Qiita, GitHub",
      }),
    );
    expect(await generateTags(env, "body")).toEqual(["Zenn", "Markdown"]);
  });

  it("removes <think> blocks", async () => {
    const { env } = envReturning(
      chatCompletion("<think>\nQiita, GitHub?\n</think>\nZenn, Markdown"),
    );
    expect(await generateTags(env, "body")).toEqual(["Zenn", "Markdown"]);
  });

  it("removes reasoning that ends with a bare </think>", async () => {
    const { env } = envReturning(chatCompletion("Qiita, GitHub?</think>Zenn"));
    expect(await generateTags(env, "body")).toEqual(["Zenn"]);
  });

  it("drops an unclosed <think> cut off by the token limit", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { env } = envReturning(chatCompletion("<think>Qiita, GitHub"));
    expect(await generateTags(env, "body")).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("splits on the Japanese comma", async () => {
    const { env } = envReturning(chatCompletion("Markdown、記法、Zenn"));
    expect(await generateTags(env, "body")).toEqual([
      "Markdown",
      "記法",
      "Zenn",
    ]);
  });

  it("strips quotes, # and list markers", async () => {
    const { env } = envReturning(
      chatCompletion('- "React"\n* #TypeScript\n「Zenn」, \'C#\''),
    );
    expect(await generateTags(env, "body")).toEqual([
      "React",
      "TypeScript",
      "Zenn",
      "C#",
    ]);
  });

  it("removes duplicates and keeps at most five tags", async () => {
    const { env } = envReturning(chatCompletion("a, b, A, c, b, d, e, f, g"));
    expect(await generateTags(env, "body")).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("returns [] and logs a warning when the content is empty", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { env } = envReturning(chatCompletion(null));
    expect(await generateTags(env, "body")).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain(TAG_MODEL);
  });

  it("returns [] and logs the model and error, not the article", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const run = vi.fn().mockRejectedValue(new Error("5007: No such model"));
    const tags = await generateTags(makeEnv(run), "SECRET ARTICLE BODY");
    expect(tags).toEqual([]);
    expect(error).toHaveBeenCalledTimes(1);
    const logged = error.mock.calls[0].join(" ");
    expect(logged).toContain(TAG_MODEL);
    expect(logged).toContain("5007: No such model");
    expect(logged).not.toContain("SECRET ARTICLE BODY");
  });
});

describe("insertTagsIntoFrontmatter", () => {
  function tagLines(markdown: string): string[] {
    return markdown.split("\n").filter((line) => line.startsWith("  - "));
  }

  it("writes tags as double-quoted YAML scalars", () => {
    const tags = ["key: value", "#hash", 'say "hi"', "C#"];
    const out = insertTagsIntoFrontmatter("# Title", tags);
    expect(out).toBe(
      [
        "---",
        "tags:",
        '  - "key: value"',
        '  - "#hash"',
        '  - "say \\"hi\\""',
        '  - "C#"',
        "---",
        "",
        "# Title",
      ].join("\n"),
    );
    // A JSON string is a valid YAML double-quoted scalar with the same value.
    expect(tagLines(out).map((line) => JSON.parse(line.slice(4)))).toEqual(
      tags,
    );
  });

  it("appends tags to an existing frontmatter", () => {
    const out = insertTagsIntoFrontmatter("---\ntitle: T\n---\nbody", [
      "a: b",
    ]);
    expect(out).toBe('---\ntitle: T\ntags:\n  - "a: b"\n---\nbody');
  });

  it("writes an empty list when there are no tags", () => {
    expect(insertTagsIntoFrontmatter("body", [])).toBe(
      "---\ntags: []\n---\n\nbody",
    );
  });
});
