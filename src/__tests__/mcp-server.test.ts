import { describe, it, expect, vi, afterEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "../mcp-server.js";
import type { Env } from "../lib/env.js";

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

const clients: Client[] = [];

async function connect(env: Env): Promise<Client> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await createMcpServer(env).connect(serverTransport);
  const client = new Client({ name: "test", version: "1.0.0" });
  await client.connect(clientTransport);
  clients.push(client);
  return client;
}

async function callTool(client: Client, name: string, args: Record<string, unknown>) {
  const result = await client.callTool({ name, arguments: args });
  const [first] = (result.content ?? []) as { type: string; text?: string }[];
  return { isError: result.isError === true, text: first?.text ?? "" };
}

afterEach(async () => {
  await Promise.all(clients.splice(0).map((client) => client.close()));
  vi.unstubAllGlobals();
});

describe("createMcpServer", () => {
  it("lists the three tools with their input schemas", async () => {
    const client = await connect(makeEnv().env);
    const { tools } = await client.listTools();

    expect(tools.map((tool) => tool.name).sort()).toEqual([
      "convert_to_markdown",
      "fetch_markdown",
      "render_markdown",
    ]);
    for (const tool of tools) {
      expect(tool.inputSchema).toMatchObject({
        type: "object",
        required: ["url"],
        properties: {
          url: { type: "string", format: "uri" },
          maxLength: { type: "integer", minimum: 0 },
        },
      });
    }
    const fetchTool = tools.find((tool) => tool.name === "fetch_markdown");
    expect(fetchTool?.inputSchema.properties?.headers).toMatchObject({
      type: "object",
      additionalProperties: { type: "string" },
    });
  });

  it("passes validated arguments through to fetch_markdown", async () => {
    const { env, toMarkdown } = makeEnv();
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response("<html><body><p>hi</p></body></html>", {
        headers: { "content-type": "text/html" },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const client = await connect(env);

    const result = await callTool(client, "fetch_markdown", {
      url: "https://example.com/a",
      headers: { "X-Test": "1" },
      cssSelector: "article",
    });

    expect(result.isError).toBe(false);
    expect(result.text).toContain("# hi");
    expect(fetchSpy.mock.calls[0][0]).toBe("https://example.com/a");
    expect(fetchSpy.mock.calls[0][1].headers).toMatchObject({ "X-Test": "1" });
    expect(toMarkdown.mock.calls[0][1]).toEqual({
      conversionOptions: {
        html: { hostname: "example.com", cssSelector: "article" },
      },
    });
  });

  it("rejects a header value that is not a string before fetching", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const client = await connect(makeEnv().env);

    const result = await callTool(client, "fetch_markdown", {
      url: "https://example.com/",
      headers: { "X-Test": 1 },
    });

    expect(result.isError).toBe(true);
    expect(result.text).toContain("headers");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects a malformed URL before fetching", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const client = await connect(makeEnv().env);

    const result = await callTool(client, "fetch_markdown", { url: "not-a-url" });

    expect(result.isError).toBe(true);
    expect(result.text).toContain("url");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
