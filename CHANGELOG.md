# CHANGELOG

ルールの追加・変更・削除を記録します。新しいものを上に書きます。

形式: `- YYYY-MM-DD 種別 対象ファイル: 内容`
種別は `追加` / `変更` / `削除` のいずれか。

## 2026-09

- 2026-09-10 変更 rules/10_git/branch.md ほか: ブランチ運用を main / dev の 2 段構成に変更。作業ブランチは dev から切り dev へ PR、main へは dev からまとめて PR。pull_request.md、commit.md、60_ci/pipeline.md の main 言及を合わせて修正
- 2026-09-10 変更 rules/10_git/pull_request.md, templates/PULL_REQUEST_TEMPLATE.md: 本文は「目的」から始め対象ファイルと見どころを書く形式に変更。出す前のセルフチェック 7 項目、積み上げ PR のマージ順序と方式を追加
- 2026-09-10 追加 全体: リポジトリ初版。rules/ 配下 7 ディレクトリと templates/ を作成
