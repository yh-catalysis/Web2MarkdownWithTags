import { describe, it, expect, vi } from "vitest";
import { convertViaAI } from "../shared.js";
import type { Env } from "../../lib/env.js";

function makeEnv() {
  const toMarkdown = vi.fn().mockResolvedValue([
    {
      id: "1",
      name: "example.com.html",
      mimeType: "text/html",
      format: "markdown",
      tokens: 0,
      data: "# hi",
    },
  ]);
  const env = { AI: { toMarkdown } } as unknown as Env;
  return { env, toMarkdown };
}

describe("convertViaAI conversionOptions", () => {
  it("omits the options argument when no html options are given", async () => {
    const { env, toMarkdown } = makeEnv();
    await convertViaAI(env, "a.html", "<p>x</p>", "text/html");
    expect(toMarkdown).toHaveBeenCalledTimes(1);
    expect(toMarkdown.mock.calls[0]).toHaveLength(1);
  });

  it("omits the options argument when every html option is undefined", async () => {
    const { env, toMarkdown } = makeEnv();
    await convertViaAI(env, "a.html", "<p>x</p>", "text/html", {
      hostname: undefined,
      cssSelector: undefined,
    });
    expect(toMarkdown.mock.calls[0]).toHaveLength(1);
  });

  it("passes hostname only", async () => {
    const { env, toMarkdown } = makeEnv();
    await convertViaAI(env, "a.html", "<p>x</p>", "text/html", {
      hostname: "example.com",
    });
    expect(toMarkdown.mock.calls[0][1]).toEqual({
      conversionOptions: { html: { hostname: "example.com" } },
    });
  });

  it("passes cssSelector only", async () => {
    const { env, toMarkdown } = makeEnv();
    await convertViaAI(env, "a.html", "<p>x</p>", "text/html", {
      cssSelector: "article",
    });
    expect(toMarkdown.mock.calls[0][1]).toEqual({
      conversionOptions: { html: { cssSelector: "article" } },
    });
  });

  it("passes both options", async () => {
    const { env, toMarkdown } = makeEnv();
    await convertViaAI(env, "a.html", "<p>x</p>", "text/html", {
      hostname: "example.com",
      cssSelector: "#main",
    });
    expect(toMarkdown.mock.calls[0][1]).toEqual({
      conversionOptions: {
        html: { hostname: "example.com", cssSelector: "#main" },
      },
    });
  });

  it("still returns the converted markdown", async () => {
    const { env } = makeEnv();
    const result = await convertViaAI(env, "a.html", "<p>x</p>", "text/html", {
      hostname: "example.com",
    });
    expect(result).toMatchObject({ ok: true, markdown: "# hi" });
  });
});
