# CLAUDE.md

このリポジトリはプロジェクト横断のコーディングルール集です。コードは含まれません。

## このリポジトリで作業するとき

- ルールを追加・変更する前に [rules/_template.md](rules/_template.md) を読み、同じ形式で書く。
- ルールは言語やフレームワークに依存しない内容に限る。ツール名は「例」として添える程度にする。
- MUST / SHOULD / MAY の 3 段階を使い、1 文 1 ルールで書く。
- Markdown の書き方は [rules/20_docs/markdown.md](rules/20_docs/markdown.md) に従う。
- ルールを変更したら [CHANGELOG.md](CHANGELOG.md) に 1 行追記する。

## 他のプロジェクトからこのルールを参照するとき

プロジェクト側の `CLAUDE.md` に次のように書く。

```markdown
## コーディングルール

共通ルールは `rules/` 配下に従う。特に次を必ず読む。

- rules/00_general/principles.md
- rules/10_git/pull_request.md
- rules/30_src/structure.md
- rules/50_testing/policy.md

このプロジェクト固有のルールは以下。

- (言語固有の Lint / Formatter 設定)
- (フレームワーク固有の規約)
```

## ルール一覧

| ディレクトリ | 内容 |
| --- | --- |
| rules/00_general/ | 全体原則、命名、セキュリティ |
| rules/10_git/ | ブランチ、コミット、Pull Request |
| rules/20_docs/ | Markdown、README、引き継ぎ資料 |
| rules/30_src/ | ディレクトリ構成、関数設計、エラーとログ、設定、コメント |
| rules/40_frontend/ | 画面部品、状態管理、表示と操作性 |
| rules/50_testing/ | テスト方針、書き方、外部依存の扱い |
| rules/60_ci/ | Lint / Formatter、CI パイプライン |
