# Lint / Formatter

| 項目 | 内容 |
| --- | --- |
| 対象 | リポジトリ内のすべてのソースコード、設定ファイル、Markdown |
| レベル | 必須 |
| 最終更新 | 2026-09-10 |

## 目的

インデントや改行位置をレビューで指摘し合うのは時間の無駄で、本質的な指摘が埋もれる。
Linter を人によって使ったり使わなかったりすると、警告が積み上がり、誰も見なくなる。
ここでは「フォーマットはツールに任せ、Lint は CI で強制する」ことを定め、レビューを中身の議論に使えるようにする。

## ルール

### MUST

- プロジェクトごとに Formatter と Linter をそれぞれ 1 つ決め、その設定ファイルをリポジトリ直下に置く(例: Prettier、Ruff、ESLint、markdownlint)。
- フォーマットの好みを PR で議論しない。Formatter の出力を正とし、不満があれば設定変更の PR を出す。
- CI で Lint と Formatter のチェックを実行し、失敗した PR はマージしない。
- Lint の警告を特定の行で無視する場合は、その行(または直前)に理由をコメントで書く。理由のない無視は差し戻す。
- Lint ルールの緩和・無効化は、設定ファイルを変更する PR で行い、レビューで合意を得る。個人の環境設定で緩めない。
- Lint 設定はプロジェクト内で 1 つにする。ディレクトリごとに別の設定を持たない。

### SHOULD

- コミット前フック(例: pre-commit、husky)で Formatter と Linter を自動実行する。CI で初めて気づくのを避ける。
- 既存プロジェクトに Formatter を導入するときは、整形だけの PR を 1 本作り、機能変更と混ぜない。
- Formatter と Linter のバージョンはロックファイルで固定し、ローカルと CI で同じ結果になるようにする。
- Formatter と Linter の実行コマンドを 1 つにまとめ(例: `make lint`、`npm run lint`)、README に書く。
- Linter は「まず既定ルール」で始め、必要が出たときだけルールを追加・削除する。最初から大量のカスタムルールを作らない。

### MAY

- エディタの保存時に Formatter が動く設定(`.editorconfig`、エディタ設定の共有ファイル)をリポジトリに含めてもよい。
- 型チェッカーを Lint の一部として CI に含めてもよい。

## Good / Bad 例

```text
# Bad: 理由なく無視している
result = risky_call()  # noqa

# Good: なぜ無視するかが分かる
result = risky_call()  # noqa: E501 — 外部 API のパス文字列は改行できない
```

```text
# Bad: PR のレビューコメント
「ここはシングルクォートにしてください」
「インデントが 2 と 4 で混ざっています」

# Good: ツールに任せ、レビューは中身に使う
CI: format check ... PASSED
CI: lint ........... PASSED
レビュー: 「この分岐は空配列のときに落ちませんか」
```

```text
# Bad: 設定が散らばり、人によって結果が違う
src/a/.eslintrc, src/b/.eslintrc, ~/.eslintrc(個人設定)

# Good: リポジトリ直下に 1 つ
/.eslintrc.json
/.prettierrc
/package.json (scripts.lint に実行コマンド)
```

## チェックリスト

- [ ] Formatter と Linter の設定ファイルがリポジトリ直下にあるか
- [ ] CI で Lint / Format チェックが実行され、失敗時にマージがブロックされるか
- [ ] Lint 無視のコメントすべてに理由が書かれているか
- [ ] ルールの緩和が設定ファイルの変更として PR に含まれ、説明があるか
- [ ] ローカルと CI で同じバージョンのツールが動くか
- [ ] Lint の実行方法が README に書かれているか

## 例外

- 自動生成ファイル(ビルド成果物、スキーマから生成したコードなど)は Lint / Format の対象から除外してよい。除外リストを設定ファイルに書き、生成元を明記する。
- 使い捨てスクリプトは Linter の警告を許容してよい。ただし Formatter は適用する。

## 参考

- [pipeline.md](pipeline.md)
- [../00_general/principles.md](../00_general/principles.md)
- [../10_git/pull_request.md](../10_git/pull_request.md)
- [../20_docs/markdown.md](../20_docs/markdown.md)
- [../30_src/comments.md](../30_src/comments.md)
