# automation_template

プロジェクト横断で使うコーディングルール集です。
言語やフレームワークに依存しない共通ルールを中心に Markdown で管理します。
特定の技術は推奨候補に留め、言語固有の書式や Lint 設定は各プロジェクト側で定義してください。

初めての方は [start.md](start.md) を読んでください。
案件の資料 1 枚から、Notion のプロジェクトとタスクを作り、最初の PR を出すまでの手順です。

## 使い方

### 新規プロジェクトで使う

1. このリポジトリを GitHub の Template Repository として指定し、新しいリポジトリを作成する。
2. [templates/](templates/) から必要なファイルをプロジェクトのルートや `.github/` にコピーする。
3. プロジェクトの `CLAUDE.md` と `README.md` に「この共通ルールに従う」と明記し、言語固有ルールがあれば追記する。

### 既存プロジェクトで使う

1. [rules/](rules/) を丸ごと、または必要なカテゴリだけコピーする。
2. プロジェクト側の `CLAUDE.md` から `rules/` を参照する(書き方は [templates/CLAUDE_template.md](templates/CLAUDE_template.md) を参照)。

## ルール一覧

| ファイル | 内容 |
| --- | --- |
| [rules/general.md](rules/general.md) | 全体原則、命名、セキュリティ、標準ツール |
| [rules/git.md](rules/git.md) | ブランチ、コミット、Pull Request |
| [rules/docs.md](rules/docs.md) | Markdown、README、引き継ぎ |
| [rules/notion.md](rules/notion.md) | Notion の階層、ページ、データベース |
| [rules/source.md](rules/source.md) | 構成、関数、設定、エラー、ログ、コメント |
| [rules/frontend.md](rules/frontend.md) | 技術選定、部品、状態、表示、操作性 |
| [rules/testing.md](rules/testing.md) | テスト方針、書き方、外部依存 |
| [rules/ci.md](rules/ci.md) | Lint、Formatter、CI |

新しいカテゴリを追加するときは [rules/_template.md](rules/_template.md) を使います。
必須と推奨を分け、例や例外は必要な場合だけ書きます。
カテゴリ内では、「推奨」「任意」「例外」と明記した項目以外を必須とします。

| 表記 | 意味 |
| --- | --- |
| 必須 | 例外なく守る。違反はレビューで差し戻す |
| 推奨 | 原則守る。外す場合は理由を PR に書く |
| 任意 | 必要に応じて採用する |

## テンプレート一覧

| ファイル | 用途 |
| --- | --- |
| [templates/PULL_REQUEST_TEMPLATE.md](templates/PULL_REQUEST_TEMPLATE.md) | `.github/` に置く PR テンプレート |
| [templates/ISSUE_TEMPLATE/](templates/ISSUE_TEMPLATE/) | `.github/ISSUE_TEMPLATE/` に置く Issue テンプレート |
| [templates/README_template.md](templates/README_template.md) | プロジェクト README の雛形 |
| [templates/CLAUDE_template.md](templates/CLAUDE_template.md) | プロジェクト CLAUDE.md の雛形 |

## コマンド

案件資料からプロジェクト、タスク、PR までを順に作るコマンドです。
`.claude/commands/` と `scripts/notion.mjs` をプロジェクトへコピーして使います。

| コマンド | 入力 | 作るもの |
| --- | --- | --- |
| `/notion-project <資料のパス>` | 要件定義や提案資料の Markdown | Notion のプロジェクト 1 件 |
| `/notion-tasks <PJ-000>` | プロジェクト | 1 タスク 1 PR の粒度に分けたタスク |
| `/task-pr <TSK-000>` | タスク | 作業ブランチ、実装、PR、タスクへの紐付け |

いずれも Notion へ書き込む前に内容を提示して確認を取ります。
`/task-pr` はマージまでは行いません。

### 準備

Notion の内部インテグレーションのトークンを `NOTION_TOKEN` に設定します。

```bash
export NOTION_TOKEN=ntn_xxx            # または .env に書く
export NOTION_ENV_FILE=/path/to/.env   # 別の場所の .env を使う場合
node scripts/notion.mjs members        # 接続確認
```

このトークンは給与を含むページへ到達できます。CI では実行しないでください。
スクリプトも `CI` 環境変数を検出すると実行を拒否します。

## ルールの改訂

- このリポジトリは `main` だけで運用する。ルール本体の `dev` 運用は適用しない。
- ルールの追加・変更・削除はすべて Pull Request で行う。
- 変更内容は [CHANGELOG.md](CHANGELOG.md) に記録する。
- 新しいルールは [rules/_template.md](rules/_template.md) をコピーして書き始める。
- 年に 1 回、全ルールを見直し、使われていないルールは削除する。

## ディレクトリ構成

```text
automation_template/
├── README.md          # このファイル
├── start.md           # 案件資料から最初の PR までの手順
├── CLAUDE.md          # AI エージェント向けの入口
├── CHANGELOG.md       # ルール改訂履歴
├── .claude/commands/  # 案件資料からプロジェクト、タスク、PR を作るコマンド
├── scripts/
│   └── notion.mjs     # Notion のプロジェクトとタスクを読み書きする CLI
├── rules/             # カテゴリごとのルール本体
│   ├── general.md
│   ├── git.md
│   ├── docs.md
│   ├── notion.md
│   ├── source.md
│   ├── frontend.md
│   ├── testing.md
│   ├── ci.md
│   └── _template.md   # ルールを書くときの雛形
└── templates/         # コピーして使うファイル
```
