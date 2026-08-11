import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchMarkdown } from "../fetch-markdown.js";
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
  const run = vi.fn().mockResolvedValue({ response: "" });
  const env = { AI: { toMarkdown, run } } as unknown as Env;
  return { env, toMarkdown };
}

function stubFetchOk() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response("<html><body><p>hi</p></body></html>", {
        headers: { "content-type": "text/html" },
      }),
    ),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchMarkdown", () => {
  it("derives hostname from the request URL", async () => {
    const { env, toMarkdown } = makeEnv();
    stubFetchOk();
    const result = await fetchMarkdown(env, {
      url: "https://example.com/a/b?q=1",
    });
    expect(result.ok).toBe(true);
    expect(toMarkdown.mock.calls[0][1]).toEqual({
      conversionOptions: { html: { hostname: "example.com" } },
    });
  });

  it("forwards cssSelector alongside hostname", async () => {
    const { env, toMarkdown } = makeEnv();
    stubFetchOk();
    await fetchMarkdown(env, {
      url: "https://example.com/a",
      cssSelector: "article",
    });
    expect(toMarkdown.mock.calls[0][1]).toEqual({
      conversionOptions: {
        html: { hostname: "example.com", cssSelector: "article" },
      },
    });
  });

  it("uses the hostname for the generated file name", async () => {
    const { env, toMarkdown } = makeEnv();
    stubFetchOk();
    await fetchMarkdown(env, { url: "https://example.com/a" });
    expect(toMarkdown.mock.calls[0][0][0].name).toBe("example.com.html");
  });

  it("rejects private addresses before fetching", async () => {
    const { env } = makeEnv();
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const result = await fetchMarkdown(env, { url: "http://127.0.0.1/" });
    expect(result.ok).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
