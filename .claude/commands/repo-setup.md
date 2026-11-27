---
description: 案件のリポジトリを GitHub に作り、共通ルールとテンプレートを写して、Notion のプロジェクトへ紐付ける
argument-hint: <PJ-000 | プロジェクト URL> <リポジトリ名>
allowed-tools: Read, Glob, Write, Bash(node scripts/notion.mjs:*), Bash(gh repo view:*), Bash(gh repo create:*), Bash(gh repo edit:*), Bash(git:*), Bash(mkdir:*), Bash(cp:*), Bash(ls:*)
---

プロジェクト `$1` のリポジトリ `$2` を作る。automation_template の共通ルールとテンプレートを写し、`dev` を既定のブランチにして、Notion のリポジトリに登録する。

ブランチの決まりは [rules/git.md](../../rules/git.md)、リポジトリの登録は [rules/notion.md](../../rules/notion.md) の「タスク」に従う。ブランチ保護は設定しない（[rules/git.md](../../rules/git.md) の「マージ」）。
質問は手順 6 の 1 回にまとめ、GitHub と Notion へは手順 7 の承認の後にだけ書き込む。

## 手順

### 1. 確かめる

1. `node scripts/notion.mjs project-get $1` でプロジェクトを確かめる。
2. 作る先の組織は、automation_template と同じにする。`gh repo view --json owner -q .owner.login` で調べ、決め打ちしない。
3. 同じ名前のリポジトリが無いことを `gh repo view <組織>/$2` で確かめる。あれば止めて、既存のものを紐付けるだけにするかを聞く。
4. 手元の作業場所は、automation_template と同じ階層の `../$2` にする。既にあって空でなければ止める。空なら、そのまま使う。automation_template の中には作らない。

### 2. 写すものを決める

5. 次を写す。`aws/` は AWS を使う案件のときだけ写す。

   | 写すもの | 写し先 |
   | --- | --- |
   | `rules/` | `rules/` |
   | `reference/` | `reference/` |
   | `.claude/commands/` | `.claude/commands/` |
   | `scripts/notion.mjs`、`scripts/notion-body.mjs` | `scripts/`（テストは写さない） |
   | `templates/PULL_REQUEST_TEMPLATE.md` | `.github/PULL_REQUEST_TEMPLATE.md` |
   | `templates/ISSUE_TEMPLATE/` | `.github/ISSUE_TEMPLATE/` |
   | `templates/CLAUDE_template.md` | `CLAUDE.md` と `AGENTS.md`（同じ内容） |
   | `templates/README_template.md` | `README.md` |
   | `aws/` | `aws/`（AWS の案件だけ） |

   `.gitignore` は新しく作り、`.env` を必ず入れる。言語ごとの行は、実装を始めるときに足す。

### 3. 確認する

6. 次を 1 つのメッセージで示し、聞く。

   - 作るリポジトリ：`<組織>/$2`、private、既定のブランチ `dev`
   - 手元の場所：`../$2`
   - 手順 5 の表
   - Notion：リポジトリの行を作り、`$1` へ紐付ける
   - 聞くこと：AWS を使う案件か（`aws/` を写すか）。`CLAUDE.md` の「プロジェクト概要」に書く内容を、プロジェクトの本文から案として添える。

7. **利用者の承認を取ってから**作る。

### 4. 作る

8. 手元に作り、写して、最初のコミットを作る。ステージするものは写したものを名指しする（[rules/git.md](../../rules/git.md) の「コミット」）。`aws/` を写したときは `aws` も足す。

   ```bash
   mkdir -p ../$2 && git -C ../$2 init -b main
   # 手順 5 の表のとおりに cp で写し、.gitignore を作る
   git -C ../$2 add rules reference .claude .github scripts CLAUDE.md AGENTS.md README.md .gitignore
   git -C ../$2 commit -m "chore: 共通ルールとテンプレートを取り込む"
   ```

9. GitHub に作り、`dev` を既定のブランチにする。最初のコミットだけは `main` へ直接 push する（[rules/git.md](../../rules/git.md) の「例外」）。

   ```bash
   gh repo create <組織>/$2 --private --source=../$2 --remote=origin --push
   git -C ../$2 switch -c dev && git -C ../$2 push -u origin dev
   gh repo edit <組織>/$2 --default-branch dev
   ```

10. Notion に登録し、プロジェクトへ紐付ける。

    ```bash
    node scripts/notion.mjs repo-create --full <組織>/$2 --project $1 \
      --url https://github.com/<組織>/$2 --visibility private --branch dev
    ```

### 5. 報告する

11. リポジトリの URL、手元の場所、Notion の行を報告する。`CLAUDE.md` と `README.md` の「(記入)」が残っていることを伝え、次は `../$2` へ移って `/notion-tasks $1` を実行できることを伝える。以降の作業は案件のリポジトリで行い、automation_template に案件のコードを置かない。

## 注意

- public にするのは、利用者が明示したときだけにする。
- `NOTION_TOKEN` の入った `.env` は写さない。案件のリポジトリでは、`NOTION_ENV_FILE` で automation_template の `.env` を指すか、案件側に `.env` を作る。
- ブランチ保護は設定しない。
