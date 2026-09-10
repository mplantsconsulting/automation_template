# ブランチ運用

| 項目 | 内容 |
| --- | --- |
| 対象 | リポジトリに変更を加えるすべての人 |
| レベル | 必須 |
| 最終更新 | 2026-09-10 |

## 目的

`main` が壊れていると、緊急の修正を出したいときに出せない。
開発中の変更が `main` に直接流れ込むと、リリース済みの状態と開発中の状態を区別できなくなる。
長生きしたブランチは合流先との差が広がり、コンフリクト解消に変更本体より時間がかかるようになる。
ここでは `main` と `dev` の役割を分け、作業ブランチを短命に回すためのルールを定める。

## ブランチの役割

| ブランチ | 役割 | 変更の入れ方 |
| --- | --- | --- |
| `main` | リリース済みの状態。常にデプロイ可能 | `dev` からの PR でまとめて取り込む |
| `dev` | 開発の合流先。次のリリース候補 | 作業ブランチからの PR で取り込む |
| 作業ブランチ | 1 つの目的のための変更 | `dev` から切り、`dev` に向けて PR を出す |

```text
main  ─────●─────────────────────●──────   ← リリース単位で dev から PR
           ↑                     ↑
dev   ──●──●──●──●──●──●──●──●───●──────   ← 開発の合流先
        ↑     ↑        ↑
      feature/a  fix/b  feature/c          ← dev から切り、dev へ PR
```

## ルール

### MUST

- 作業ブランチは `dev` の最新から切り、PR は `dev` に向けて出す。
- `main` へは `dev` から PR でまとめて出す。作業ブランチから `main` へ直接 PR を出さない。
- `main` と `dev` に直接 push しない。すべての変更は Pull Request 経由でマージする。
- `main` は常にデプロイ可能な状態を保つ。テストが通らない変更を `main` に入れない。
- ブランチ名は `type/短い説明` の形式にする。`type` はコミットメッセージと同じ種類を使う(例: `feature/add-login`、`fix/csv-encoding`)。
- 1 つのブランチには 1 つの目的だけを持たせる。別の修正を思いついたら別ブランチを切る。
- マージが完了した作業ブランチは削除する。ただし別の PR のベースになっているブランチは、[pull_request.md](pull_request.md) の「積み上げ PR のマージ順序」に従ってから削除する。

### SHOULD

- 作業ブランチの寿命は数日以内に収める。1 週間を超える場合は分割を検討する。
- `dev` が進んだら作業ブランチに取り込む。取り込みは `rebase` を基本とし、複数人で共有しているブランチでは `merge` を使う。
- 他人と共有しているブランチで `force push` をしない。自分だけのブランチでも `--force-with-lease` を使う。
- ブランチ名は小文字とハイフンだけで書き、Issue 番号があれば含める(例: `fix/123-csv-encoding`)。
- 本番障害の緊急修正は `main` から `hotfix/` ブランチを切り、`main` に PR を出す。マージ後は `main` を `dev` に取り込み、修正が `dev` からも消えないようにする。
- `dev` から `main` へ出す PR には、含まれる変更の一覧と確認済みの事項を書く。

### MAY

- 検証だけが目的で捨てる前提のブランチは `spike/` や `experiment/` を接頭辞にしてもよい。この場合も `dev` にはマージせず、結論を Issue に残して削除する。
- リリースのたびに `main` にタグ(例: `v1.2.0`)を打ってもよい。

## Good / Bad 例

```text
# Bad: 何のブランチか分からず、複数の目的が混ざる
my-branch
fix
update-2

# Good: 種類と目的が名前だけで分かる
feature/add-login
fix/csv-encoding
docs/update-readme
chore/upgrade-ci-image
```

```text
# Bad: 作業ブランチを main から切り、main に直接 PR を出す
main ← feature/add-login

# Good: dev から切って dev へ PR。main へは dev からまとめて出す
dev  ← feature/add-login
main ← dev
```

```text
# Bad: 共有ブランチを force push で上書きする
git push --force origin feature/shared-work

# Good: 自分だけのブランチに限り、安全な形で使う
git push --force-with-lease origin feature/add-login
```

## チェックリスト

- [ ] `dev` の最新から分岐しているか
- [ ] PR の向き先が `dev` になっているか(`main` へは `dev` からだけ)
- [ ] ブランチ名が `type/短い説明` の形式になっているか
- [ ] ブランチの目的が 1 つに絞られているか
- [ ] `dev` の変更を取り込み、コンフリクトを解消してあるか
- [ ] 共有ブランチに `force push` していないか
- [ ] マージ後にブランチを削除したか(積み上げ PR のベースは順序を守ってから)

## 例外

- 小規模なプロジェクトや使い捨てのツールでは `dev` を設けず、`main` だけで運用してよい。その場合は作業ブランチを `main` から切り、`main` に PR を出す。README にその旨を書く。
- 個人開発でレビュアーがいない場合も PR は作成する。ただし承認なしでセルフマージしてよい。
- ドキュメント修正や設定の一行変更などの軽微な変更は、`dev` へ直接コミットしてよい。基準は [pull_request.md](pull_request.md) の「PR を立てるかどうか」に従う。`main` への直接 push はこの場合も禁止する。
- CI やデプロイ基盤が壊れていて PR 経由のマージが物理的にできない場合に限り、直接 push を許可する。その場合は事後に何を直接 push したかを Issue に記録する。

## 参考

- [commit.md](commit.md)
- [pull_request.md](pull_request.md)
- [../60_ci/pipeline.md](../60_ci/pipeline.md)
- [../00_general/principles.md](../00_general/principles.md)
