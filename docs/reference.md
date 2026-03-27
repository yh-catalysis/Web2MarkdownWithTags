# Reference

[English](#english) | [日本語](#日本語)

---

## English

### MCP Tool Details

#### `fetch_markdown`

Fetch a static web page and convert its HTML to Markdown using Workers AI `toMarkdown`.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `url` | string | Yes | URL to convert |
| `headers` | `Record<string, string>` | No | Custom HTTP headers to include in the request |
| `maxLength` | number | No | Maximum character length of returned Markdown |

#### `render_markdown`

Convert a JavaScript-rendered page (SPA, etc.) to Markdown. Launches a headless browser (Puppeteer), executes JS, then converts the resulting DOM with `toMarkdown`.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `url` | string | Yes | URL to convert |
| `waitForSelector` | string | No | CSS selector to wait for before capturing |
| `maxLength` | number | No | Maximum character length of returned Markdown |

> Browser Rendering limits: Free 6 req/min, 10 min/day / Paid 180 req/min, 10 hrs/month

#### `convert_to_markdown`

Convert documents (PDF, Office, images, etc.) to Markdown. Downloads the file and converts it with Workers AI `toMarkdown`.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `url` | string | Yes | File URL |
| `filename` | string | No | Override filename (used for MIME type detection) |
| `maxLength` | number | No | Maximum character length of returned Markdown |

### Supported Formats

Formats supported by `convert_to_markdown`:

| Format | Extensions | Cost |
| --- | --- | --- |
| PDF | `.pdf` | Free |
| HTML | `.html`, `.htm` | Free |
| Microsoft Office | `.docx`, `.xlsx`, `.xlsm`, `.xlsb`, `.xls`, `.et` | Free |
| Open Document | `.odt`, `.ods` | Free |
| Apple | `.numbers` | Free |
| CSV | `.csv` | Free |
| XML | `.xml` | Free |
| Images | `.jpeg`, `.jpg`, `.png`, `.webp`, `.svg` | **Paid** (consumes Workers AI Neurons) |

> Image conversion uses Workers AI models (object detection + summarization), which consume Neurons. Enable/disable via the `ALLOW_IMAGE_CONVERSION` setting.

### Project Structure

```text
.
├── src/
│   ├── index.ts                 # Hono app (routing / middleware)
│   ├── mcp-server.ts            # McpServer + 3 tool registrations
│   ├── routes/
│   │   └── api.ts               # REST API endpoints
│   ├── services/                # Business logic (shared by MCP & REST)
│   │   ├── types.ts             # ServiceResult type / input types
│   │   ├── shared.ts            # Shared utils (AI conversion / truncation)
│   │   ├── fetch-markdown.ts
│   │   ├── render-markdown.ts
│   │   └── convert-to-markdown.ts
│   └── lib/
│       ├── constants.ts         # Constants (USER_AGENT, MIME_TO_EXT, etc.)
│       ├── env.ts               # Env type / timingSafeEqual
│       ├── validate-url.ts      # SSRF protection URL validation
│       ├── image-gate.ts        # Image conversion gate
│       └── fetch-utils.ts       # Size-limited fetch utility
├── docs/
│   └── reference.md             # This file
├── wrangler.toml                # Worker config (AI / Browser binding)
├── package.json
├── LICENSE
└── README.md
```

### Development

```bash
# Local development
npm run dev

# Deploy
npm run deploy

# View logs
npm run tail
```

---

## 日本語

### MCP ツール詳細

#### `fetch_markdown`

静的な Web ページを Markdown に変換する。HTML を取得し、Workers AI `toMarkdown` で変換する。

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `url` | string | Yes | 変換対象の URL |
| `headers` | `Record<string, string>` | No | HTTP リクエストに付与するカスタムヘッダー |
| `maxLength` | number | No | 返却する Markdown の最大文字数 |

#### `render_markdown`

JavaScript で動的にレンダリングされるページ (SPA 等) を Markdown に変換する。ヘッドレスブラウザ (Puppeteer) を起動し、JS 実行後の DOM を `toMarkdown` で変換する。

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `url` | string | Yes | 変換対象の URL |
| `waitForSelector` | string | No | レンダリング完了を待つ CSS セレクタ |
| `maxLength` | number | No | 返却する Markdown の最大文字数 |

> Browser Rendering の制限: Free 6 req/min, 10 min/day / Paid 180 req/min, 10 hrs/month

#### `convert_to_markdown`

PDF・画像・Office 文書などを Markdown に変換する。ファイルをダウンロードし、Workers AI `toMarkdown` で変換する。

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `url` | string | Yes | ファイルの URL |
| `filename` | string | No | ファイル名の上書き (MIME 判定に使用) |
| `maxLength` | number | No | 返却する Markdown の最大文字数 |

### 対応形式

`convert_to_markdown` で変換可能な形式:

| 形式 | 拡張子 | 料金 |
| --- | --- | --- |
| PDF | `.pdf` | 無料 |
| HTML | `.html`, `.htm` | 無料 |
| Microsoft Office | `.docx`, `.xlsx`, `.xlsm`, `.xlsb`, `.xls`, `.et` | 無料 |
| Open Document | `.odt`, `.ods` | 無料 |
| Apple | `.numbers` | 無料 |
| CSV | `.csv` | 無料 |
| XML | `.xml` | 無料 |
| 画像 | `.jpeg`, `.jpg`, `.png`, `.webp`, `.svg` | **有料** (Workers AI Neurons 消費) |

> 画像変換は Workers AI のモデル（物体検出 + 要約）を使用するため Neurons を消費する。Worker の `ALLOW_IMAGE_CONVERSION` 設定で有効/無効を切り替え可能。

### プロジェクト構成

```text
.
├── src/
│   ├── index.ts                 # Hono アプリ (ルーティング / ミドルウェア)
│   ├── mcp-server.ts            # McpServer + 3 ツール登録
│   ├── routes/
│   │   └── api.ts               # REST API エンドポイント
│   ├── services/                # ビジネスロジック (MCP・REST 共通)
│   │   ├── types.ts             # ServiceResult 型 / 入力型
│   │   ├── shared.ts            # 共通処理 (AI 変換 / truncation)
│   │   ├── fetch-markdown.ts
│   │   ├── render-markdown.ts
│   │   └── convert-to-markdown.ts
│   └── lib/
│       ├── constants.ts         # 定数 (USER_AGENT, MIME_TO_EXT 等)
│       ├── env.ts               # Env 型 / timingSafeEqual
│       ├── validate-url.ts      # SSRF 対策 URL バリデーション
│       ├── image-gate.ts        # 画像変換ゲート
│       └── fetch-utils.ts       # サイズ制限付き fetch ユーティリティ
├── docs/
│   └── reference.md             # 本ファイル
├── wrangler.toml                # Worker 設定 (AI / Browser binding)
├── package.json
├── LICENSE
└── README.md
```

### 開発

```bash
# ローカル開発
npm run dev

# デプロイ
npm run deploy

# ログ確認
npm run tail
```
