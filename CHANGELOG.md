# CHANGELOG

ルールの追加・変更・削除を記録します。新しいものを上に書きます。

形式: `- YYYY-MM-DD 種別 対象ファイル: 内容`
種別は `追加` / `変更` / `削除` のいずれか。

## 2026-09

- 2026-09-15 変更 rules/ 全体: 書式を統一。テーマごとに節を作り、その中を必須・推奨・任意で分ける形に揃えた。general.md の入れ子の向きを他と合わせ、4 ファイルで省かれていた「必須」の見出しを明示
- 2026-09-15 変更 README.md, CLAUDE.md, AGENTS.md, start.md: 入口を一本化。ルール一覧の正を README、手順と AI への指示の正を start.md に決め、CLAUDE.md と AGENTS.md はリンクだけの短い案内にした。3 か所にあったルール一覧表と最初の 1 文を 1 か所へ集約
- 2026-09-15 追加 reference/notion-workspace.md: 変わりやすい一覧を rules から分離。データベース名、列、選択肢、既知の癖を移した
- 2026-09-15 変更 rules/git.md: PR の差分の上限を明記。「300 行」がファイルと差分の両方を指していたため、呼び分けを全ファイルで統一
- 2026-09-15 追加 start.md: 案件資料からプロジェクト、リポジトリ、タスク、最初の PR までの手順をまとめた入口を追加
- 2026-09-15 変更 rules/git.md: ブランチ保護を設定しない方針を明記。組織の GitHub プランでは private リポジトリに設定できないため、マージ条件は運用で守る
- 2026-09-15 追加 .claude/commands/, scripts/notion.mjs: 案件資料からプロジェクト、タスク、PR を作る 3 コマンドと、Notion を読み書きする CLI を追加
- 2026-09-15 追加 rules/notion.md: Notion のルールを新設。階層と置き場所、ページとデータベースの書き方、各データベースの使い分け、同期スクリプトが更新する列、GitHub との対応、権限と秘密情報
- 2026-09-15 追加 rules/git.md, templates/PULL_REQUEST_TEMPLATE.md: PR とタスクの紐付けを追加。1 PR 1 タスク、タイトルへのタスク ID、本文冒頭のタスクリンク、タスク側からの逆引き、ステータス追従
- 2026-09-10 変更 rules/ ほか: 統合後に変化したルール強度、重複基準、行数基準、単体利用時の説明を修正
- 2026-09-10 変更 rules/: 23 個のルール文書を 7 個のカテゴリ文書へ統合し、重複する例とチェックリストを削減
- 2026-09-10 変更 rules/general.md: 簡潔な文章、既存ツールの再利用、OCR の標準ツールを追加
- 2026-09-10 変更 rules/frontend.md: 推奨技術、外部データ検証、利用者視点のテスト、実画面確認を追加
- 2026-09-10 変更 rules/10_git/branch.md ほか: ブランチ運用を main / dev の 2 段構成に変更。作業ブランチは dev から切り dev へ PR、main へは dev からまとめて PR。pull_request.md、commit.md、60_ci/pipeline.md の main 言及を合わせて修正
- 2026-09-10 変更 rules/10_git/pull_request.md, templates/PULL_REQUEST_TEMPLATE.md: 本文は「目的」から始め対象ファイルと見どころを書く形式に変更。出す前のセルフチェック 7 項目、積み上げ PR のマージ順序と方式を追加
- 2026-09-10 追加 全体: リポジトリ初版。rules/ 配下 7 ディレクトリと templates/ を作成

### 旧ルールファイルの移行先

| 旧パス | 新パス |
| --- | --- |
| `rules/00_general/*.md` | `rules/general.md` |
| `rules/10_git/*.md` | `rules/git.md` |
| `rules/20_docs/*.md` | `rules/docs.md` |
| `rules/30_src/*.md` | `rules/source.md` |
| `rules/40_frontend/*.md` | `rules/frontend.md` |
| `rules/50_testing/*.md` | `rules/testing.md` |
| `rules/60_ci/*.md` | `rules/ci.md` |
