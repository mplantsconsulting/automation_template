# AGENTS.md

このリポジトリはプロジェクト横断のコーディングルール集です。

## 案件を始めるとき

利用者から「start.md を読んで」と言われたら、[start.md](start.md) を開き、
その中の「このファイルを読んだ AI への指示」に従ってください。

最初の返答は次の 1 文だけにします。手順の説明も要約もしません。

> 要件定義を入力してください。ファイルのパスでも、内容の貼り付けでも構いません。

入力を受け取るまで、ファイルの調査もコマンドの実行もしません。

## コマンドが使えない環境

`/notion-project` のようなスラッシュコマンドは Claude Code だけで動きます。
使えない場合は、[start.md](start.md) の各節に併記した `node scripts/notion.mjs ...` を
直接組み立てて実行してください。使い方は次で確認できます。

```bash
node scripts/notion.mjs
```

## 守ること

- Notion と GitHub へ書き込む前に、内容を見せて承認を得る。承認なしで作らない。
- 推測で値を埋めない。分からない項目は聞く。聞くのは 1 回にまとめる。
- 案件のコードをこのリポジトリに置かない。リポジトリを作ったら、以降はそちらで作業する。
- `NOTION_TOKEN` をログや CI へ出さない。給与を含むページへ到達できる。
- ブランチ保護は設定しない。組織の GitHub プランでは private リポジトリに使えない。

## ルール

| ファイル | 読む場面 |
| --- | --- |
| [rules/general.md](rules/general.md) | 常に。命名とセキュリティの原則 |
| [rules/git.md](rules/git.md) | ブランチ、コミット、PR |
| [rules/notion.md](rules/notion.md) | Notion の階層とデータベース |
| [rules/source.md](rules/source.md) | 実装するとき |
| [rules/testing.md](rules/testing.md) | テストを書くとき |
| [rules/docs.md](rules/docs.md) | 文書を書くとき |
| [rules/frontend.md](rules/frontend.md) | 画面を作るとき |
| [rules/ci.md](rules/ci.md) | CI を触るとき |

「推奨」「任意」「例外」と明記した項目以外は必須です。

## このリポジトリ自体を直すとき

- ルールの形式は [rules/_template.md](rules/_template.md) に合わせる。
- 言語やフレームワークに依存しない内容にする。特定のツールは推奨か例として示す。
- 変更したら [CHANGELOG.md](CHANGELOG.md) に 1 行追記する。
- このリポジトリは `main` だけで運用する。
