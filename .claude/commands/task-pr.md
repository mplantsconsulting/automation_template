---
description: Notion のタスクを実装して PR を作り、タスクへ紐付ける
argument-hint: <TSK-000 | タスク URL>
allowed-tools: Read, Glob, Grep, Edit, Write, Bash, Bash(node scripts/notion.mjs:*)
---

タスク `$1` を実装し、PR を作ってタスクへ紐付ける。

ルールは [rules/git.md](../../rules/git.md) の「ブランチ」「コミット」「Pull Request」に従う。

## 手順

1. `node scripts/notion.mjs task-get $1` でタスクを取得する。タスク名、説明、見積工数、対象リポジトリを確認する。
2. 対象リポジトリが今いるリポジトリと違う場合は、その場で止めて利用者に伝える。
3. `dev` の最新から作業ブランチを切る。名前は `type/短い説明` とし、`type` はコミットと同じ語彙から選ぶ。`dev` がないリポジトリでは `main` から切る。
4. タスクのステータスを進行中にする。

   ```bash
   node scripts/notion.mjs task-status $1 --status 進行中
   ```

5. 実装する。次を守る。

   - タスクの範囲だけを変更する。ついでの修正を混ぜない。
   - 公開関数、分岐、エラー経路にテストを書く。バグ修正では、修正前に落ちる再現テストを先に書く。
   - PR の差分が 300 行を超えそうなら、そこで止めて利用者にタスク分割を提案する。

6. Lint、型、テスト、ビルドを通す。出力を絞らず、落ちたら全文を読む。
7. `type: 要約` の形式でコミットする。本文には変更理由を書く。
8. PR を作る。テンプレートは `.github/PULL_REQUEST_TEMPLATE.md`(なければ [templates/PULL_REQUEST_TEMPLATE.md](../../templates/PULL_REQUEST_TEMPLATE.md))に従う。

   - タイトル: `type: 要約（TSK-000）`
   - 本文 1 行目: `タスク: [TSK-000 タスク名](タスクの URL)`
   - 続けて `## 目的`。丁寧語で 1〜3 文。
   - 特に見てほしい箇所を 1〜3 件、理由とともに書く。
   - セルフチェックの各項目を確認してから印を付ける。

9. タスクへ PR を紐付け、ステータスをレビューにする。

   ```bash
   node scripts/notion.mjs task-link-pr $1 --url <PR の URL> --title "<PR のタイトル>"
   node scripts/notion.mjs task-status $1 --status レビュー
   ```

10. CI の結果を確認し、PR の URL とタスクの状態を報告する。

## 注意

- **マージはしない。** マージは利用者が判断する。
- Issue/PR データベースへの相互リレーションは、GitHub からの同期後に付く。`task-link-pr` が `relationLinked: false` を返しても、本文へのリンクは付いている。
- 実装できない理由が見つかった場合は、ブランチを作る前に止めて報告する。
- 軽微な文書・設定変更でタスクがない場合は、タイトルのタスク ID と本文のタスク行を省く。
