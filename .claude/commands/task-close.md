---
description: マージ済みのタスクを、実績工数を聞いてから完了にし、親の現在地と見積との差を直す
argument-hint: <TSK-000 | タスク URL>
allowed-tools: Read, Write, Bash(node scripts/notion.mjs:*), Bash(gh pr view:*)
---

タスク `$1` を完了にし、実績工数を入れる。子タスクなら、親の本文の「現在地」とステータスも直す。

実績の決まりは [rules/estimate.md](../../rules/estimate.md) の「実績」、親の本文の書き方は [rules/notion.md](../../rules/notion.md) の「親タスク」に従う。
質問は手順 4 の 1 回にまとめ、Notion へは手順 5 の承認の後にだけ書き込む。

## 手順

### 1. 状態を読む

1. `node scripts/notion.mjs task-get $1` でタスクを読む。`children` が空でなければ子のある親、`parent` があれば子、どちらも無ければ子のない親として進める。
2. 既に `完了` で実績も入っている場合は、その値を示し、入れ直すかを手順 4 で聞く。

### 2. マージを確かめる

3. 子のない親と子タスクは、`prUrls` の PR ごとに `gh pr view <URL> --json state,mergedAt,baseRefName,title` で状態を見る。

   - マージされていない PR があれば、その場で止めて伝える。**マージはしない。** 利用者が判断する。
   - `prUrls` が空なら、PR の要らないタスク（PM の作業、学習・調査、説明資料など）かを手順 4 で確かめる。
   - 子のある親は、`children` がすべて `完了` で、すべてに `actualHours` が入っていることを確かめる。そろっていなければ、残っている子を示して止める。

### 3. 書き込む内容を作る

4. 次を 1 つのメッセージで示し、利用者に聞く。

   - **実績工数**（子のある親では聞かない）。見積の値を写さず、推測で埋めない。比べる材料として、親の見積と、ほかの子の実績の合計を添える。待ち時間は入れない（[rules/estimate.md](../../rules/estimate.md) の「数える時間」）。
   - `タスク種別` が空の子なら、[reference/estimate-baseline.md](../../reference/estimate-baseline.md) から候補を 1 つ添える。種別は Notion で利用者が付ける。
   - 子タスクなら、親の「現在地」の書き換え案。今日の日付を見出しに付け、いま何が進んでいて何を待っているかを 5 行以内で書く。今の本文は `node scripts/notion.mjs body-get <親の TSK>` で読む。
   - 子タスクで、この子を閉じると親の子がすべて `完了` になるなら、親も完了にするか。
   - 親を閉じるなら、`node scripts/notion.mjs project-estimate <PJ> --dry-run` の親の行で、見積と実績の合計の差を示す。差が大きければ、理由を親の本文の「見積」の末尾に残す案を添える。
   - 子が残っているのに、子の実績の合計が親の見積に届く、または超えるなら、そのことを知らせる。

5. 答えを入れた内容を `--dry-run` で示し、**利用者の承認を取ってから**書き込む。

### 4. 書き込む

6. タスクを完了にする。子のある親には `--actual` を付けない。

   ```bash
   node scripts/notion.mjs task-status $1 --status 完了 --actual <時間>
   ```

7. 子タスクなら、親の「現在地」を差し替える。中身は一時ファイルに書き、見出しは含めない。

   ```bash
   node scripts/notion.mjs body-section <親の TSK> --heading 現在地 \
     --new-heading "現在地（YYYY-MM-DD）" --md <現在地の中身のパス>
   ```

8. 親のステータスを直す。子がすべて完了なら、親を完了にする。子のどれかが進行中かレビューで、親が `未着手` なら `進行中` にする。

   ```bash
   node scripts/notion.mjs task-status <親の TSK> --status 完了
   ```

9. 親を閉じて差の理由を残すことになったら、「見積」の節の末尾へ足す。

   ```bash
   node scripts/notion.mjs body-section <親の TSK> --heading 見積 --append --md <理由のパス>
   ```

### 5. 報告する

10. 閉じたタスク、入れた実績、親の見積と実績の合計を報告する。プロジェクトの親がすべて完了したら、次に `/project-close <PJ>` を実行できることを伝える。

## 注意

- 実績を入れるのは子のないタスクだけ。子のある親に `--actual` を付けると `task-status` が止まる。
- `body-section` はその節だけを書き換える。親の本文全体を `body-set` で書き直すと、「子タスク」のページメンションが消える。
- 作り直しや手戻りで足した子（修正・手戻り）も、同じ手順で実績を入れて閉じる。
