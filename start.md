# はじめかた

案件の資料 1 枚から、Notion のプロジェクトとタスクを作り、最初の PR を出すまでの手順です。

使う人は、AI に「start.md を読んで」とだけ伝えてください。
あとは AI が順に聞いてくるので、答えていけば最初の PR まで進みます。

所要時間は、資料が手元にあれば 30 分ほどです。

## このファイルを読んだ AI への指示

この節はあなた（AI）への指示です。利用者へ読み上げず、次のとおり動いてください。

1. **最初の返答は次の 1 文だけにする。** 手順の説明も要約もしない。

   > 要件定義を入力してください。ファイルのパスでも、内容の貼り付けでも構いません。

2. 入力を受け取るまで、ファイルの調査もコマンドの実行もしない。
3. 入力を受け取ったら、「全体の流れ」の順に 1 ステップずつ進める。
   各ステップの終わりに結果を示し、次へ進んでよいか確認する。
4. Notion と GitHub へ書き込む前に、必ず内容を見せて承認を得る。承認なしで作らない。
5. 途中で不明な点が出たら、推測で埋めずに聞く。ただし聞くのは 1 回にまとめる。
6. `/notion-project` のようなコマンドが使えない環境（Codex など）では、
   各節に併記した `node scripts/notion.mjs ...` を直接組み立てて実行する。
7. 実装に入る前に [rules/general.md](rules/general.md) と [rules/git.md](rules/git.md) を読む。
   実装中は [rules/source.md](rules/source.md) と [rules/testing.md](rules/testing.md) に従う。
8. 作業する場所は手順によって変わる。手順 3 までは automation_template の中で実行し、
   案件のリポジトリを作ったら、手順 4 以降はそちらへ移って実行する。
   automation_template に案件のコードを置かない。

## 全体の流れ

```text
案件資料 (Markdown)
   ↓  /notion-project
🚀 プロジェクト  PJ-000          予想開発時間 = 親の見積の合計
   └ 親タスク    1. 機能のまとまり  見積工数を入れる
   ↓  GitHub リポジトリを作る
🗂 リポジトリ    プロジェクトへ紐付け
   ↓  /notion-tasks
✅ 子タスク      1-1. 具体的な作業  TSK-000  見積は入れない
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
| 規模 | 数で書く。画面の数、帳票の種類、連携先、移す既存の処理、配布の回数など。見積はここから作る |
| スコープ | やること |
| スコープ外 | やらないこと |
| 前提 | データの置き場所、利用者、制約 |
| 想定効果 | 数字で。見積の根拠になる |
| スケジュール感 | いつまでに何を |

スコープ外を書いてください。ここが空だと、タスクが際限なく増えます。
規模も数で書いてください。ここが空だと、見積が少なく出ます。

## 2. プロジェクトを作る

```text
/notion-project docs/requirements.md
```

コマンドが使えない環境では、資料を読んで次を組み立てます。

```bash
node scripts/notion.mjs clients     # クライアント名を確認する
node scripts/notion.mjs members     # 担当者名を確認する
node scripts/notion.mjs project-create \
  --name "<プロジェクト名>" --client "<会社名>" --pm "<氏名>" --dev "<氏名>" \
  --start 2026-10-01 --due 2026-12-31 --priority 中 --kind ショット \
  --md docs/requirements.md --dry-run
```

`--dry-run` で内容を見せ、承認を得てから外して実行します。

AI が資料を読み、クライアント、担当、期間を埋めてプロジェクトを作ります。
足りない項目は聞かれます。内容を見せられたら、作ってよければ承認してください。

`PJ-000` という番号と Notion の URL が返ります。以降はこの番号で指します。

売上やコストの数値は、資料に明記がある場合だけ入ります。全社ダッシュボードの集計に効くためです。

続けて親タスクを決め、目的を書いてから見積を入れます。順番は次のとおりです。

1. AI が **親タスクをいくつ作るか** を聞いてきます。候補を見て決めてください。
2. AI が親ごとの「目的」を示します。何のためにやるか、終わった状態、範囲（何を、いくつ）が書いてあるかを確かめてください。**見積はこの目的だけを見て作るので、範囲が足りないとその分の見積が抜けます。**
3. AI が目的だけを見て見積を作ります。親の作業を種別（共通、フロント、バック、インフラの各区分）に分けて数え、[見積の基準](reference/estimate-baseline.md)の値を出発点に、親ごとの事情で上げ下げします。数えるのは手を動かす時間だけで、先方の返事や資料を待つ時間は入れません。
4. 親ごとの内訳と調整の理由、合計が示されるので、よければ承認してください。親の見積の合計がプロジェクトの `予想開発時間` に入ります。

コマンドが使えない環境では、次を組み立てます。

```bash
node scripts/notion.mjs task-create --project PJ-000 \
  --name "1. データ取得・投入基盤構築" --estimate 24 --kind 開発 --priority 中
node scripts/notion.mjs body-set TSK-000 --md <親の本文のパス>
node scripts/notion.mjs project-estimate PJ-000     # 予想開発時間を入れる
```

## 3. リポジトリを作る

コードを書く案件なら、この時点で作ります。PR を出す前までにあれば大丈夫です。

```bash
gh repo create mplantsconsulting/<リポジトリ名> --private --source=. --remote=origin --push
git switch -c dev && git push -u origin dev
gh repo edit mplantsconsulting/<リポジトリ名> --default-branch dev
```

`rules/`、`reference/`、`.claude/commands/`、`scripts/notion.mjs`、`.github/` をこのリポジトリからコピーして入れておきます。
AI が同じルールとコマンドを使えるようになります。

作ったら Notion にも登録し、プロジェクトへ紐付けます。

```bash
node scripts/notion.mjs repo-create \
  --full mplantsconsulting/<リポジトリ名> \
  --project PJ-000 \
  --url https://github.com/mplantsconsulting/<リポジトリ名> \
  --visibility private --branch dev
```

ブランチ保護は設定しません。理由は [rules/git.md](rules/git.md) にあります。

## 4. タスクを作る

```text
/notion-tasks PJ-000
```

コマンドが使えない環境では、親ごとに子を作ります。

```bash
node scripts/notion.mjs task-create --project PJ-000 --parent TSK-000 \
  --name "1-1. レジュメ取り込みの入力処理を実装" --kind 開発 --due 2026-10-17
```

親タスクは手順 2 で作ってあります。ここでは子タスクだけを作り、見積は入れません。
1 つの親に子が 6 件を超えるなら、親の分け方を見直します。

命名は番号で順序が分かる形にします。

| 段 | 形式 | 例 | 見積工数 | 実績工数 |
| --- | --- | --- | --- | --- |
| 親 | `N. 機能のまとまり` | `2. データ取得・投入基盤構築` | 入れる | 入れない |
| 子 | `N-M. 具体的な作業` | `2-1. レジュメ取り込みの入力処理を実装` | 入れない | 完了時に入れる |

子タスクは 1 件が 1 PR に収まる粒度にします。PR の差分が 300 行を超えそうなものは分けてください。
分けないと PR が大きくなり、レビューされなくなります。

分けてみて親の見積が明らかに合わないと分かったら、登録前に指摘されます。親の見積を直すかはあなたが決めます。

## 5. 実装して PR を出す

子タスクの番号を渡します。

```text
/task-pr TSK-000
```

コマンドが使えない環境では、次を順に行います。

```bash
node scripts/notion.mjs task-get TSK-000                  # 対象リポジトリを確認
node scripts/notion.mjs task-status TSK-000 --status 進行中
git switch dev && git pull --ff-only && git switch -c <type>/<短い説明>
# 実装、テスト、lint、型、ビルド
git commit -m "<type>: <要約>（TSK-000）"
git push -u origin <type>/<短い説明>
gh pr create --base dev --title "<type>: <要約>（TSK-000）" --body-file <本文>
node scripts/notion.mjs task-link-pr TSK-000 --url <PR の URL> --title "<PR タイトル>"
node scripts/notion.mjs task-status TSK-000 --status レビュー
```

AI が次を順に行います。

1. タスクを読み、対象リポジトリを確認する
2. タスクのステータスを進行中にする
3. `dev` の最新から `type/短い説明` のブランチを切る
4. 実装し、テストを書く
5. Lint、型、テスト、ビルドを通す
6. `type: 要約（TSK-000）` の形式でコミットする
7. PR を作る。本文の 1 行目はタスクへのリンク、最初の見出しは `## 概要`
8. タスクへ PR を紐付け、ステータスをレビューにする

PR の差分が 300 行を超えそうなときは、途中で止まってタスク分割を提案します。そこで分けてください。

マージはしません。レビューを受けてから、自分でマージします。

## 6. レビューとマージ

- 作業ブランチから `dev` へは squash merge です。
- `dev` から `main` へは merge commit です。
- マージ後にブランチを削除します。
- タスクのステータスを完了にし、実績工数を入れます。実績は子タスクに入れます。子のない親タスクは、親に入れます。

```bash
node scripts/notion.mjs task-status TSK-000 --status 完了 --actual 6
```

親ごとの見積と、子の実績の合計は次で見られます。

```bash
node scripts/notion.mjs project-estimate PJ-000 --dry-run
```

## つまずきやすいところ

| 症状 | 理由と対処 |
| --- | --- |
| 優先度が `中` に戻る | Notion のオートメーションが作成の数秒後に上書きする。残したいときだけ `NOTION_VERIFY_DELAY_MS=8000` を付ける |
| タスクに PR のリレーションが付かない | Issue/PR は GitHub から毎時同期される。次の同期で付く。本文のリンクは先に入っている |
| `CI では実行しない` と出る | `NOTION_TOKEN` を CI から使おうとしている。手元で実行する |
| `TSK-000 が見つからない` | 番号か接頭辞の間違い。タスクは `TSK`、プロジェクトは `PJ` |
| クライアント名で止まる | Notion の登録名と違う。`node scripts/notion.mjs clients` で確認する |
| PR の差分が 300 行を超えた | タスクの粒度が粗い。タスクを分けてから PR も分ける |
| `親タスクには --estimate が必須` と出る | 見積は親を作るときに入れる。`--parent` を付け忘れた子なら `--parent` を付ける |
| `子タスクには見積を入れない` と出る | 見積は親だけ。子の `--estimate` を外す |
| `--actual で実績工数を必ず入れる` と出る | タスクを閉じるときは実績工数が必須。既に値があっても `--actual <時間>` を付けて入れ直す |
| `実績工数が空の子タスクがある` と出る | 子のある親は、すべての子に実績が入るまで完了にできない。先に子へ実績を入れる |
| 完了した親に「📝実績工数未入力」が出る | アラートが親と子を区別しないため。子のある親では無視する。子のない親なら `--actual` で実績を入れる |

## 次に読むもの

[rules/general.md](rules/general.md) と [rules/git.md](rules/git.md) は常に読みます。
残りは作業内容に応じて開きます。ファイルの一覧と読む場面は [README.md](README.md) の「ルール一覧」にあります。

Notion のデータベース名や列の一覧は [reference/notion-workspace.md](reference/notion-workspace.md) にあります。
