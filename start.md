# はじめかた

案件の資料 1 枚から、Notion のプロジェクトとタスクを作り、最初の PR を出すまでの手順です。
AI に `rules/` を読ませ、`.claude/commands/` のコマンドを呼ばせる前提で書いています。

所要時間は、資料が手元にあれば 30 分ほどです。
手順の途中で AI が確認を求めるので、内容を見てから進めてください。

## 全体の流れ

```text
案件資料 (Markdown)
   ↓  /notion-project
🚀 プロジェクト  PJ-000
   ↓  GitHub リポジトリを作る
🗂 リポジトリ    プロジェクトへ紐付け
   ↓  /notion-tasks
✅ 親タスク      1. 機能のまとまり
   └ 子タスク    1-1. 具体的な作業  TSK-000
        ↓  /task-pr
      作業ブランチ → 実装 → PR → タスクへ紐付け
        ↓
      レビュー → dev へマージ
```

1 つの子タスクが 1 つの PR に対応します。ここが崩れると、あとの管理が全部ずれます。

## 0. 準備

一度だけ行います。

```bash
git clone https://github.com/mplantsconsulting/automation_template.git
cd automation_template
```

Notion の内部インテグレーションのトークンを用意します。管理者に発行を依頼してください。

```bash
export NOTION_TOKEN=ntn_xxx        # または .env に書く
node scripts/notion.mjs members    # 名前が並べば接続できている
```

このトークンは給与を含むページへ到達できます。CI やログへ出さないでください。
スクリプトも `CI` 環境変数を見つけると実行を拒否します。

## 1. 案件資料を書く

先方の要望を Markdown 1 枚にまとめます。体裁より、次が書いてあるかが大事です。

| 見出し | 書くこと |
| --- | --- |
| 背景 | 今どうなっているか。件数や時間を数字で |
| 課題 | 何が困っているか |
| やりたいこと | 実現したいことを箇条書きで |
| スコープ | やること |
| スコープ外 | やらないこと |
| 前提 | データの置き場所、利用者、制約 |
| 想定効果 | 数字で。見積の根拠になる |
| スケジュール感 | いつまでに何を |

スコープ外を書いてください。ここが空だと、タスクが際限なく増えます。

## 2. プロジェクトを作る

```text
/notion-project docs/requirements.md
```

AI が資料を読み、クライアント、担当、期間を埋めてプロジェクトを作ります。
足りない項目は聞かれます。内容を見せられたら、作ってよければ承認してください。

`PJ-000` という番号と Notion の URL が返ります。以降はこの番号で指します。

売上やコストの数値は、資料に明記がある場合だけ入ります。全社ダッシュボードの集計に効くためです。

## 3. リポジトリを作る

コードを書く案件なら、この時点で作ります。PR を出す前までにあれば大丈夫です。

```bash
gh repo create mplantsconsulting/<リポジトリ名> --private --source=. --remote=origin --push
git switch -c dev && git push -u origin dev
gh repo edit mplantsconsulting/<リポジトリ名> --default-branch dev
```

`rules/`、`.claude/commands/`、`scripts/notion.mjs`、`.github/` をこのリポジトリからコピーして入れておきます。
AI が同じルールとコマンドを使えるようになります。

作ったら Notion にも登録し、プロジェクトへ紐付けます。

```bash
node scripts/notion.mjs repo-create \
  --full mplantsconsulting/<リポジトリ名> \
  --project PJ-000 \
  --url https://github.com/mplantsconsulting/<リポジトリ名> \
  --visibility private --branch dev
```

ブランチ保護は設定しません。組織の GitHub プランでは private リポジトリに設定できないためです。
`main` への直接 push の禁止は運用で守ります。

## 4. タスクを作る

```text
/notion-tasks PJ-000
```

親タスクを先に作り、そのあとで子タスクを作ります。

AI は **親タスクをいくつ作るか** を聞いてきます。候補を見て決めてください。
1 つの親に子が 6 件を超えるなら、親の分け方を見直します。

命名は番号で順序が分かる形にします。

| 段 | 形式 | 例 | 見積工数 |
| --- | --- | --- | --- |
| 親 | `N. 機能のまとまり` | `2. データ取得・投入基盤構築` | 入れない |
| 子 | `N-M. 具体的な作業` | `2-1. レジュメ取り込みの入力処理を実装` | 必ず入れる |

子タスクは 1 件が 1 PR に収まる粒度にします。見積は 3 時間から 16 時間が目安です。
超えるものは分けてください。分けないと PR が大きくなり、レビューされなくなります。

登録前に一覧と合計工数が示されます。プロジェクトの `予想開発時間` と大きくずれていたら、そこで見直します。

## 5. 実装して PR を出す

子タスクの番号を渡します。

```text
/task-pr TSK-000
```

AI が次を順に行います。

1. タスクを読み、対象リポジトリを確認する
2. タスクのステータスを進行中にする
3. `dev` の最新から `type/短い説明` のブランチを切る
4. 実装し、テストを書く
5. Lint、型、テスト、ビルドを通す
6. `type: 要約（TSK-000）` の形式でコミットする
7. PR を作る。本文の 1 行目はタスクへのリンク、最初の見出しは `## 目的`
8. タスクへ PR を紐付け、ステータスをレビューにする

差分が 300 行を超えそうなときは、途中で止まってタスク分割を提案します。そこで分けてください。

マージはしません。レビューを受けてから、自分でマージします。

## 6. レビューとマージ

- 作業ブランチから `dev` へは squash merge です。
- `dev` から `main` へは merge commit です。
- マージ後にブランチを削除します。
- タスクのステータスを完了にし、実績工数を入れます。

```bash
node scripts/notion.mjs task-status TSK-000 --status 完了
```

## つまずきやすいところ

| 症状 | 理由と対処 |
| --- | --- |
| 優先度が `中` に戻る | Notion のオートメーションが作成の数秒後に上書きする。残したいときだけ `NOTION_VERIFY_DELAY_MS=8000` を付ける |
| タスクに PR のリレーションが付かない | Issue/PR は GitHub から毎時同期される。次の同期で付く。本文のリンクは先に入っている |
| `CI では実行しない` と出る | `NOTION_TOKEN` を CI から使おうとしている。手元で実行する |
| `TSK-000 が見つからない` | 番号か接頭辞の間違い。タスクは `TSK`、プロジェクトは `PJ` |
| クライアント名で止まる | Notion の登録名と違う。`node scripts/notion.mjs clients` で確認する |
| PR が大きくなった | タスクの粒度が粗い。タスクを分けてから PR も分ける |

## 次に読むもの

| ファイル | 読む場面 |
| --- | --- |
| [rules/git.md](rules/git.md) | ブランチ、コミット、PR の書き方 |
| [rules/notion.md](rules/notion.md) | Notion の階層とデータベースの使い分け |
| [rules/general.md](rules/general.md) | 命名とセキュリティの原則 |
| [rules/source.md](rules/source.md) | 実装を始める前に |
| [rules/testing.md](rules/testing.md) | テストを書く前に |
| [README.md](README.md) | ルール全体の一覧 |

## 実例

この手順で作った実験用のプロジェクトがあります。迷ったら形を見てください。

- Notion のプロジェクト `PJ-168 小宮実験`（架空の案件）
- リポジトリ `mplantsconsulting/komiya-experiment`
- 親 5 件と子 13 件のタスク、最初の PR まで
