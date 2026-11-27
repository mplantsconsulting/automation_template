---
description: すべてのタスクが閉じたプロジェクトを完了にし、見積と実績の差をまとめ、削減時間を先方の回答で置き換える
argument-hint: <PJ-000 | プロジェクト URL>
allowed-tools: Read, Write, Bash(node scripts/notion.mjs:*)
---

プロジェクト `$1` を完了にする。見積と実績の差をまとめ、削減時間の概算を先方の回答で置き換える。

実績と削減時間の決まりは [rules/estimate.md](../../rules/estimate.md) の「実績」と「削減時間の見積」、先方への質問は [rules/client.md](../../rules/client.md) に従う。
質問は手順 5 の 1 回にまとめ、Notion へは手順 6 の承認の後にだけ書き込む。

先方の回答は完了の後に届くことが多い。完了だけを先に済ませ、回答が届いたらもう一度 `/project-close $1` を実行する。完了済みのプロジェクトでは、手順 1〜3 を飛ばして削減時間だけを扱う。

## 手順

### 1. 閉じられるかを確かめる

1. `node scripts/notion.mjs project-get $1` でタスクを読む。
2. 完了していないタスクと、子のないタスクで `actualHours` が空のものを洗い出す。あれば止めて一覧を示し、`/task-close` で閉じるよう伝える。要らなくなったタスクを消すか（`task-archive`）は利用者が決める。

### 2. 見積と実績をまとめる

3. `node scripts/notion.mjs project-estimate $1 --dry-run` と `node scripts/notion.mjs project-status $1 --status 完了 --dry-run` で、親ごとの見積と実績、合計、実績 ÷ 見積を出す。あわせて、`project-get` の子タスクから種別ごとの実績の合計を出す。基準を直すときの材料になる（[rules/estimate.md](../../rules/estimate.md) の「基準の見直し」）。
4. 見積から大きく外れた親は、親の本文の「見積」に理由が残っているかを `body-get` で見る。残っていなければ、理由を手順 5 で聞く。

### 3. 削減時間を確かめる

5. `node scripts/notion.mjs body-get $1` で「削減時間の見積」の節を読み、次を 1 つのメッセージで示して聞く。

   - 手順 3 と 4 の表と、理由が要る親。
   - 先方の回答が手元にあるか。あれば、回答の日付、回答者、業務ごとの自動化後の 1 回の時間と月の回数、運用の月の時間を貼ってもらう。
   - 回答がまだなら、先方への質問の下書きを添える。下書きは [rules/client.md](../../rules/client.md) の「送る前の振り分け」を通し、概算の内訳の業務ごとに、自動化後の実際の時間だけを聞く。送るのは利用者が行う。

6. 答えを入れて、書き込む内容を `--dry-run` で示し、**利用者の承認を取ってから**書き込む。

### 4. 書き込む

7. プロジェクトを完了にする。完了日も入る。完了済みなら飛ばす。

   ```bash
   node scripts/notion.mjs project-status $1 --status 完了
   ```

8. 親の差の理由を聞いたら、その親の「見積」の末尾へ足す。

   ```bash
   node scripts/notion.mjs body-section <親の TSK> --heading 見積 --append --md <理由のパス>
   ```

9. 先方の回答があれば、「削減時間の見積」の節の末尾に、日付と回答者を付けて回答の内訳を足す。概算は消さずに残す。続けて、自動化前と後の月の時間を回答の値に置き換える。

   ```bash
   node scripts/notion.mjs body-section $1 --heading 削減時間の見積 --append --md <回答の節のパス>
   node scripts/notion.mjs project-savings $1 --before <時間> --after <時間> --answer
   ```

   回答で削減が出ていなくても、回答のまま入れる。理由は回答の節に書く。

### 5. 報告する

10. 完了日、見積と実績の合計と比、種別ごとの実績、月の削減時間（概算か回答か）を報告する。回答がまだなら、届いたら `/project-close $1` をもう一度実行するよう伝える。

## 注意

- `project-status --status 完了` は、完了していないタスクか、実績の空いた子のないタスクがあると止まる。
- 削減時間と削減額は Notion の数式が出す。列に手で入れない。
- 回答の節の見出しは、「削減時間の見積」より下の段（`###`）にする。同じ段にすると、次の節として扱われる。
