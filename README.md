# automation_template

プロジェクト横断で使うコーディングルール集です。
言語やフレームワークに依存しない共通ルールを中心に Markdown で管理します。
特定の技術は推奨候補に留め、言語固有の書式や Lint 設定は各プロジェクト側で定義してください。

例外は、社内全体で共通に使うツールです。Notion のように使い方を揃える必要があるものは、ツール名のルールを置きます。

初めての方は、AI に「start.md を読んで」とだけ伝えてください。
案件の資料 1 枚から、Notion のプロジェクトとタスクを作り、最初の PR を出すまで案内します。
手順と必要な準備は [start.md](start.md) にまとめてあります。

## 使い方

### 新規プロジェクトで使う

1. このリポジトリを GitHub の Template Repository として指定し、新しいリポジトリを作成する。
2. [templates/](templates/) から必要なファイルをプロジェクトのルートや `.github/` にコピーする。
3. プロジェクトの `CLAUDE.md` と `README.md` に「この共通ルールに従う」と明記し、言語固有ルールがあれば追記する。

### 既存プロジェクトで使う

1. [rules/](rules/) を丸ごと、または必要なカテゴリだけコピーする。
2. プロジェクト側の `CLAUDE.md` から `rules/` を参照する(書き方は [templates/CLAUDE_template.md](templates/CLAUDE_template.md) を参照)。

## ルール一覧

| ファイル | 読む場面 |
| --- | --- |
| [rules/general.md](rules/general.md) | 常に。全体原則、命名、セキュリティ、標準ツール |
| [rules/git.md](rules/git.md) | 常に。ブランチ、コミット、Pull Request |
| [rules/source.md](rules/source.md) | 実装するとき。構成、関数、設定、エラー、ログ、コメント |
| [rules/testing.md](rules/testing.md) | テストを書くとき。方針、書き方、外部依存 |
| [rules/docs.md](rules/docs.md) | 文書を書くとき。Markdown、README、引き継ぎ |
| [rules/frontend.md](rules/frontend.md) | 画面を作るとき。技術選定、部品、状態、操作性 |
| [rules/ci.md](rules/ci.md) | CI を触るとき。Lint、Formatter、パイプライン |
| [rules/notion.md](rules/notion.md) | Notion を使うとき。置き場所、ページ、タスク |

各ファイルはテーマごとに節を作り、その中を強度で分けます。
新しいカテゴリを追加するときは [rules/_template.md](rules/_template.md) を使います。

| 表記 | 意味 |
| --- | --- |
| 必須 | 例外なく守る。違反はレビューで差し戻す |
| 推奨 | 原則守る。外す場合は理由を PR に書く |
| 任意 | 必要に応じて採用する |

「推奨」「任意」「例外」と明記した項目以外は必須です。

## 参照資料

判断のルールではなく、現状を写した一覧です。実物が変わったら同じ日に直します。

| ファイル | 内容 |
| --- | --- |
| [reference/notion-workspace.md](reference/notion-workspace.md) | Notion のデータベース、列、選択肢、既知の癖 |

## テンプレート一覧

| ファイル | 用途 |
| --- | --- |
| [templates/PULL_REQUEST_TEMPLATE.md](templates/PULL_REQUEST_TEMPLATE.md) | `.github/` に置く PR テンプレート |
| [templates/ISSUE_TEMPLATE/](templates/ISSUE_TEMPLATE/) | `.github/ISSUE_TEMPLATE/` に置く Issue テンプレート |
| [templates/README_template.md](templates/README_template.md) | プロジェクト README の雛形 |
| [templates/CLAUDE_template.md](templates/CLAUDE_template.md) | プロジェクト CLAUDE.md の雛形 |

## コマンド

案件資料からプロジェクト、タスク、PR までを順に作ります。
使い方と準備は [start.md](start.md) にあります。

| コマンド | 入力 | 作るもの |
| --- | --- | --- |
| `/notion-project <資料のパス>` | 要件定義や提案資料の Markdown | Notion のプロジェクト 1 件 |
| `/notion-tasks <PJ-000>` | プロジェクト | 親タスクと子タスク |
| `/task-pr <TSK-000>` | タスク | 作業ブランチ、実装、PR、タスクへの紐付け |

## ルールの改訂

- このリポジトリは `main` だけで運用する。ルール本体の `dev` 運用は適用しない。
- ルールの追加・変更・削除はすべて Pull Request で行う。
- 変更内容は [CHANGELOG.md](CHANGELOG.md) に記録する。
- 新しいルールは [rules/_template.md](rules/_template.md) をコピーして書き始める。
- 年に 1 回、全ルールを見直し、使われていないルールは削除する。

## ディレクトリ構成

```text
automation_template/
├── README.md          # このファイル。ルール一覧の正
├── start.md           # 案件資料から最初の PR までの手順。AI への指示の正
├── CLAUDE.md          # Claude Code が読む短い案内
├── AGENTS.md          # Codex など他のツールが読む短い案内。CLAUDE.md と同内容
├── CHANGELOG.md       # ルール改訂履歴
├── rules/             # カテゴリごとのルール本体
├── reference/         # 現状を写した一覧。変わったら直す
├── templates/         # コピーして使うファイル
├── .claude/commands/  # プロジェクト、タスク、PR を作るコマンド
└── scripts/
    └── notion.mjs     # Notion を読み書きする CLI
```
