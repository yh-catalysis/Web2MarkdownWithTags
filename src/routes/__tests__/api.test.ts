import { describe, it, expect, vi, afterEach } from "vitest";
import { api } from "../api.js";
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
  return { AI: { toMarkdown, run } } as unknown as Env;
}

function postFetch(body: unknown) {
  return api.request(
    "/fetch",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
    makeEnv(),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("POST /fetch", () => {
  it("returns the Markdown for a valid request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<html><body><p>hi</p></body></html>", {
          headers: { "content-type": "text/html" },
        }),
      ),
    );

    const res = await postFetch({
      url: "https://example.com/a",
      headers: { "X-Test": "1" },
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as { markdown: string };
    expect(json.markdown).toContain("# hi");
  });

  it("rejects a header value that is not a string with 400 before fetching", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const res = await postFetch({
      url: "https://example.com/",
      headers: { "X-Test": 1 },
    });

    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: { message: string } };
    expect(json.error.message).not.toBe("");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
