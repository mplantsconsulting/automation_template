# CLAUDE.md

このリポジトリはプロジェクト横断のコーディングルール集です。

## 案件を始めるとき

利用者から「start.md を読んで」と言われたら、[start.md](start.md) を開き、
その中の「このファイルを読んだ AI への指示」に従う。
最初の返答は「要件定義を入力してください」の 1 文だけにし、入力を受け取るまで先へ進まない。

Codex など別のツールでも同じ手順で動くよう、[AGENTS.md](AGENTS.md) に同じ内容を置いている。
片方を直したらもう片方も直す。

## このリポジトリで作業するとき

- ルールを追加・変更する前に [rules/_template.md](rules/_template.md) を読み、同じ形式で書く。
- ルールは原則として言語やフレームワークに依存しない内容にする。特定の言語やツールは必須にせず、推奨または例として示す。
- 必須と推奨を分け、1 文 1 ルールで書く。
- 「推奨」「任意」「例外」と明記していない項目は必須として扱う。
- Markdown の書き方は [rules/docs.md](rules/docs.md) に従う。
- ルールを変更したら [CHANGELOG.md](CHANGELOG.md) に 1 行追記する。

## 他のプロジェクトからこのルールを参照するとき

プロジェクト側の `CLAUDE.md` に次のように書く。

```markdown
## コーディングルール

共通ルールは `rules/` 配下に従う。特に次を必ず読む。

- rules/general.md
- rules/git.md
- rules/source.md
- rules/testing.md

このプロジェクト固有のルールは以下。

- (言語固有の Lint / Formatter 設定)
- (フレームワーク固有の規約)
```

## ルール一覧

| ファイル | 内容 |
| --- | --- |
| rules/general.md | 全体原則、命名、セキュリティ、標準ツール |
| rules/git.md | ブランチ、コミット、Pull Request |
| rules/docs.md | Markdown、README、引き継ぎ |
| rules/notion.md | Notion の階層、ページ、データベース |
| rules/source.md | 構成、関数、設定、エラー、ログ、コメント |
| rules/frontend.md | 技術選定、部品、状態、表示、操作性 |
| rules/testing.md | テスト方針、書き方、外部依存 |
| rules/ci.md | Lint、Formatter、CI |
