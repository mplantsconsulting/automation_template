# automation_template

プロジェクト横断で使うコーディングルール集です。
言語やフレームワークに依存しない共通ルールだけを Markdown で管理します。
言語固有のルール(Lint 設定、型の書き方など)は各プロジェクト側で定義してください。

## 使い方

### 新規プロジェクトで使う

1. このリポジトリを GitHub の Template Repository として指定し、新しいリポジトリを作成する。
2. [templates/](templates/) から必要なファイルをプロジェクトのルートや `.github/` にコピーする。
3. プロジェクトの `CLAUDE.md` と `README.md` に「この共通ルールに従う」と明記し、言語固有ルールがあれば追記する。

### 既存プロジェクトで使う

1. [rules/](rules/) を丸ごと、または必要なディレクトリだけコピーする。
2. プロジェクト側の `CLAUDE.md` から `rules/` を参照する(書き方は [templates/CLAUDE_template.md](templates/CLAUDE_template.md) を参照)。

## ルール一覧

| ディレクトリ | 内容 |
| --- | --- |
| [rules/00_general/](rules/00_general/) | 全体原則、命名、セキュリティ |
| [rules/10_git/](rules/10_git/) | ブランチ、コミット、Pull Request |
| [rules/20_docs/](rules/20_docs/) | Markdown、README、引き継ぎ資料 |
| [rules/30_src/](rules/30_src/) | ディレクトリ構成、関数設計、エラーとログ、設定、コメント |
| [rules/40_frontend/](rules/40_frontend/) | 画面部品、状態管理、表示と操作性 |
| [rules/50_testing/](rules/50_testing/) | テスト方針、書き方、外部依存の扱い |
| [rules/60_ci/](rules/60_ci/) | Lint / Formatter、CI パイプライン |

各ルールは [rules/_template.md](rules/_template.md) の形式で書かれています。
ルールの強さは MUST / SHOULD / MAY の 3 段階です。

| 表記 | 意味 |
| --- | --- |
| MUST | 例外なく守る。違反はレビューで差し戻す |
| SHOULD | 原則守る。外す場合は理由を PR に書く |
| MAY | 推奨するが任意 |

## テンプレート一覧

| ファイル | 用途 |
| --- | --- |
| [templates/PULL_REQUEST_TEMPLATE.md](templates/PULL_REQUEST_TEMPLATE.md) | `.github/` に置く PR テンプレート |
| [templates/ISSUE_TEMPLATE/](templates/ISSUE_TEMPLATE/) | `.github/ISSUE_TEMPLATE/` に置く Issue テンプレート |
| [templates/README_template.md](templates/README_template.md) | プロジェクト README の雛形 |
| [templates/CLAUDE_template.md](templates/CLAUDE_template.md) | プロジェクト CLAUDE.md の雛形 |

## ルールの改訂

- ルールの追加・変更・削除はすべて Pull Request で行う。
- 変更内容は [CHANGELOG.md](CHANGELOG.md) に記録する。
- 新しいルールは [rules/_template.md](rules/_template.md) をコピーして書き始める。
- 年に 1 回、全ルールを見直し、使われていないルールは削除する。

## ディレクトリ構成

```text
automation_template/
├── README.md          # このファイル
├── CLAUDE.md          # AI エージェント向けの入口
├── CHANGELOG.md       # ルール改訂履歴
├── rules/             # ルール本体
│   ├── _template.md   # ルールを書くときの雛形
│   ├── 00_general/
│   ├── 10_git/
│   ├── 20_docs/
│   ├── 30_src/
│   ├── 40_frontend/
│   ├── 50_testing/
│   └── 60_ci/
└── templates/         # コピーして使うファイル
```
