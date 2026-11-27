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

ルールのファイルと読む場面の一覧は [rules/README.md](rules/README.md) にあります。

## 参照資料

判断のルールではなく、現状を写した一覧です。実物が変わったら同じ日に直します。

| ファイル | 内容 |
| --- | --- |
| [reference/notion-workspace.md](reference/notion-workspace.md) | Notion のデータベース、列、選択肢、既知の癖 |
| [reference/estimate-baseline.md](reference/estimate-baseline.md) | 見積の種別、数える単位、基準の値、改訂の記録 |

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
| `/notion-project <資料のパス>` | 要件定義や提案資料の Markdown | 利用者と 4 往復して、Notion のプロジェクト 1 件、削減時間、親タスクと見積 |
| `/repo-setup <PJ-000> <リポジトリ名>` | プロジェクト | GitHub のリポジトリ、写した共通ルール、Notion への紐付け |
| `/notion-tasks <PJ-000>` | 親タスクのあるプロジェクト | 子タスク |
| `/task-pr <TSK-000>` | タスク | 作業ブランチ、実装、PR、タスクへの紐付け |
| `/task-close <TSK-000>` | PR がマージされたタスク | 実績工数を入れた完了、親の現在地とステータス |
| `/project-close <PJ-000>` | すべてのタスクが閉じたプロジェクト | 完了、見積と実績の差のまとめ、先方の回答での削減時間 |
| `/rule-review [PR 番号]` | PR、または今のブランチの差分 | ルールに沿った指摘と、見た範囲の表 |

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
├── start.md           # 案件資料から最初の PR までの手順。AI への指示の正
├── CLAUDE.md          # Claude Code が読む短い案内
├── AGENTS.md          # Codex など他のツールが読む短い案内。CLAUDE.md と同内容
├── CHANGELOG.md       # ルール改訂履歴
├── aws/               # AWS の設計手順、統制、自動検証、テンプレート
├── rules/             # カテゴリごとのルール本体。README.md がルール一覧の正
├── reference/         # 現状を写した一覧。変わったら直す
├── templates/         # コピーして使うファイル
├── .claude/commands/  # プロジェクト、リポジトリ、タスク、PR を作り、レビューし、閉じるコマンド
└── scripts/
    └── notion.mjs     # Notion を読み書きする CLI
```
