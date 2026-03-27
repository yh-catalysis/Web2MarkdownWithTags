# Web2MarkDown

This is a fork of [maroon1st/Web2MarkDown](https://github.com/maroon1st/Web2MarkDown) with auto-tagging feature.

[English](#english) | [日本語](#日本語)

---

## English

A Cloudflare Worker that converts web pages and documents to Markdown, using [Workers AI toMarkdown](https://developers.cloudflare.com/workers-ai/features/markdown-conversion/) and [Browser Rendering](https://developers.cloudflare.com/browser-rendering/). Accessible via both **MCP (Streamable HTTP)** and **REST API**.

```text
                                           ┌─────────────────────┐
┌───────────────────┐   Streamable HTTP    │                     │
│  MCP Clients      │ ◄──── /mcp ────────►│  Cloudflare Worker  │
│  (Claude etc.)    │   JSON-RPC over HTTP │                     │
└───────────────────┘                      │  AI.toMarkdown()    │
                                           │  Puppeteer          │
┌───────────────────┐   REST API           │                     │
│  Any HTTP Client  │ ◄── /api/* ────────►│                     │
│  (curl, apps)     │   JSON over HTTP     │                     │
└───────────────────┘                      └─────────────────────┘
```

### Tools

| Tool | Description |
| --- | --- |
| `fetch_markdown` | Fetch a static web page and convert its HTML to Markdown |
| `render_markdown` | Render a JS-heavy page in a headless browser, then convert to Markdown |
| `convert_to_markdown` | Download a document (PDF, Office, image, etc.) and convert to Markdown |

> For parameter details and supported formats, see [docs/reference.md](docs/reference.md).

### Setup

#### 1. Deploy the Worker

```bash
npm install
npm run deploy                                # Deploy the Worker first
npx wrangler secret put AUTH_TOKEN            # Then set the secret token
```

Note the deployed URL (e.g. `https://web2markdown-worker.<subdomain>.workers.dev`).

#### 2. Register with MCP Client

Via Claude Code CLI:

```bash
claude mcp add --transport http web2markdown \
  https://web2markdown-worker.<subdomain>.workers.dev/mcp \
  --header "Authorization: Bearer YOUR_AUTH_TOKEN"
```

Or add to `.mcp.json`:

```json
{
  "mcpServers": {
    "web2markdown": {
      "type": "http",
      "url": "https://web2markdown-worker.<subdomain>.workers.dev/mcp",
      "headers": {
        "Authorization": "Bearer <your AUTH_TOKEN>"
      }
    }
  }
}
```

### REST API

For non-MCP clients, the same functionality is available as a REST API. All endpoints require Bearer Token authentication (same `AUTH_TOKEN`).

#### Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/fetch` | Fetch a static web page and convert to Markdown |
| `POST` | `/api/render` | Render a JS-heavy page in a headless browser, then convert to Markdown |
| `POST` | `/api/convert` | Download a document (PDF, Office, image, etc.) and convert to Markdown |

#### Request

```bash
curl -X POST https://web2markdown-worker.<subdomain>.workers.dev/api/fetch \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "maxLength": 5000}'
```

**Parameters** — Same as MCP tools:

| Endpoint | Required | Optional |
| --- | --- | --- |
| `/api/fetch` | `url` | `headers`, `maxLength` |
| `/api/render` | `url` | `waitForSelector`, `maxLength` |
| `/api/convert` | `url` | `filename`, `maxLength` |

#### Response

Success (200):

```json
{
  "markdown": "# Example Domain ...",
  "metadata": { "originalLength": 12500, "truncated": false }
}
```

Error (400 / 502 / 500):

```json
{ "error": { "message": "Access to private/reserved address is not allowed" } }
```

### Environment Variables

Set via `wrangler.toml` `[vars]` or `wrangler secret`.

| Variable | How to set | Default | Description |
| --- | --- | --- | --- |
| `AUTH_TOKEN` | `wrangler secret put` | — | Secret for Bearer Token auth (used by both MCP and REST API) |
| `ALLOW_IMAGE_CONVERSION` | `wrangler.toml` `[vars]` | `"false"` | Set `"true"` to enable image conversion (paid — consumes Workers AI Neurons) |

---

## 日本語

Cloudflare Worker 上で動作し、Web ページやドキュメントを Markdown に変換する。[Workers AI toMarkdown](https://developers.cloudflare.com/workers-ai/features/markdown-conversion/) と [Browser Rendering](https://developers.cloudflare.com/browser-rendering/) を利用。**MCP (Streamable HTTP)** と **REST API** の両方でアクセス可能。

### ツール

| ツール | 説明 |
| --- | --- |
| `fetch_markdown` | 静的な Web ページを取得し Markdown に変換 |
| `render_markdown` | ヘッドレスブラウザで JS を実行後、Markdown に変換 |
| `convert_to_markdown` | ドキュメント (PDF・Office・画像等) をダウンロードし Markdown に変換 |

> パラメータ詳細や対応形式は [docs/reference.md](docs/reference.md) を参照。

### セットアップ

#### 1. Worker のデプロイ

```bash
npm install
npm run deploy                                # まず Worker をデプロイ
npx wrangler secret put AUTH_TOKEN            # その後シークレットを設定
```

デプロイ後に表示される URL (例: `https://web2markdown-worker.<subdomain>.workers.dev`) を控えておく。

#### 2. MCP クライアントへの登録

Claude Code CLI で登録する:

```bash
claude mcp add --transport http web2markdown \
  https://web2markdown-worker.<subdomain>.workers.dev/mcp \
  --header "Authorization: Bearer YOUR_AUTH_TOKEN"
```

または `.mcp.json` に追加する:

```json
{
  "mcpServers": {
    "web2markdown": {
      "type": "http",
      "url": "https://web2markdown-worker.<subdomain>.workers.dev/mcp",
      "headers": {
        "Authorization": "Bearer <AUTH_TOKEN に設定したトークン>"
      }
    }
  }
}
```

### REST API

MCP クライアント以外からも同じ機能を REST API として利用可能。全エンドポイントで Bearer Token 認証 (同じ `AUTH_TOKEN`) が必要。

#### エンドポイント

| メソッド | パス | 説明 |
| --- | --- | --- |
| `POST` | `/api/fetch` | 静的な Web ページを取得し Markdown に変換 |
| `POST` | `/api/render` | ヘッドレスブラウザで JS を実行後、Markdown に変換 |
| `POST` | `/api/convert` | ドキュメント (PDF・Office・画像等) をダウンロードし Markdown に変換 |

#### リクエスト例

```bash
curl -X POST https://web2markdown-worker.<subdomain>.workers.dev/api/fetch \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "maxLength": 5000}'
```

**パラメータ** — MCP ツールと同一:

| エンドポイント | 必須 | オプション |
| --- | --- | --- |
| `/api/fetch` | `url` | `headers`, `maxLength` |
| `/api/render` | `url` | `waitForSelector`, `maxLength` |
| `/api/convert` | `url` | `filename`, `maxLength` |

#### レスポンス

成功 (200):

```json
{
  "markdown": "# Example Domain ...",
  "metadata": { "originalLength": 12500, "truncated": false }
}
```

エラー (400 / 502 / 500):

```json
{ "error": { "message": "Access to private/reserved address is not allowed" } }
```

### 環境変数

`wrangler.toml` の `[vars]` または `wrangler secret` で設定する。

| 変数名 | 設定方法 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `AUTH_TOKEN` | `wrangler secret put` | — | Bearer Token 認証用のシークレット (MCP・REST API 共通) |
| `ALLOW_IMAGE_CONVERSION` | `wrangler.toml` `[vars]` | `"false"` | `"true"` で画像変換（有料・Workers AI Neurons 消費）を許可 |

## License

MIT
