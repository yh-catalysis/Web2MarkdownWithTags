# Copilot Instructions

## Project: Web2MarkdownWithTags

### General Rules

- Write clean, readable code with minimal comments (comment only when intent is non-obvious)
- Prefer explicit over implicit
- Follow the conventions already established in this codebase
- All GitHub Actions must be pinned by full commit SHA, not by tag

### Security

- Never commit secrets, API keys, or credentials
- Use environment variables or secret managers for sensitive values
- Validate all external input

## TypeScript / Cloudflare Workers 固有の規約

- TypeScript strict モード。`any` を使わない。やむを得ない場合は最小スコープの型を定義し、理由をコメントで残す。
- import は必ず拡張子 `.js` 付きで書く（例: `import { x } from "./shared.js"`）。ESM + bundler resolution のため。
- サービス層（`src/services/`）は例外を呼び出し元に投げず、`ServiceResult` 型を返す。
- ドキュメント（`README.md` / `docs/reference.md`）は英語セクションと日本語セクションの両方を更新する。

## パッケージ管理

- pnpm を使う。`pnpm-lock.yaml` が正。
- 依存の追加・バージョン変更は、Issue で明示的に指示された場合のみ行う。
- `dependencies` はランタイム依存のみ。テスト用ライブラリは `devDependencies` に入れる。

## ブランチ

- `main` から切り、`<type>/<内容>` と名付ける。`<type>` はコミットと同じ Conventional Commits の種類（`feat` / `fix` / `docs` / `build` / `ci` / `chore` / `refactor` / `test`）、`<内容>` は英小文字のケバブケース（例: `fix/tag-generation-model`）。AI エージェントのツールが自動で付ける名前（`copilot/…`、`claude/…`）はそのままでよい。

## 取り扱い注意のファイル

以下はセキュリティ・課金に直結する。変更する場合は、対応するテストも更新し、
PR の説明に変更理由を明記すること。

- `src/lib/validate-url.ts` — SSRF 対策
- `src/lib/image-gate.ts` — 意図しない Workers AI 課金の防止
- `wrangler.toml` のバインディング定義

## テスト

- vitest を使う。テストは対象ディレクトリの `__tests__/` に置く。
- 外部依存（`env.AI`、グローバル `fetch`、Puppeteer）は `vi.fn()` / `vi.stubGlobal()` でスタブする。
  実際のネットワークアクセスを伴うテストは書かない。
- `vi.stubGlobal()` を使ったら `afterEach` で `vi.unstubAllGlobals()` を呼ぶ。

## 完了前に必ず実行する

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm test
```

すべて成功していることを確認してから作業を完了とする。

## バージョン番号を記述するとき

`packageManager` フィールドや設定ファイルにバージョン番号を書く前に、必ず以下を確認する。

1. 現在日時（`current_datetime` コンテキスト）を確認する。
2. 該当パッケージの GitHub Releases ページ等で **その時点の最新安定版** を調べる。
3. 調べた最新バージョンを記述する。推測や以前の記憶だけで古いバージョンを書かない。
