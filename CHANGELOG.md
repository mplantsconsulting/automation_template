# CHANGELOG

ルールの追加・変更・削除を記録します。新しいものを上に書きます。

形式: `- YYYY-MM-DD 種別 対象ファイル: 内容`
種別は `追加` / `変更` / `削除` のいずれか。

## 2026-11

- 2026-11-26 変更 start.md, .claude/commands/notion-project.md: start.md の各手順を「あなたがすること」とコマンドだけにし、AI の手順とスクリプトの書き方はコマンドのファイルへ寄せた。/notion-project に project-create の例を足した

- 2026-11-26 追加 rules/estimate.md, rules/notion.md, README.md, templates/CLAUDE_template.md, .claude/commands/, start.md, reference/: 見積と実績の決まりを rules/notion.md から rules/estimate.md へ分けた。rules/notion.md には Notion のどの列と本文に入れるかだけを残した

- 2026-11-26 変更 rules/notion.md, reference/estimate-baseline.md, .claude/commands/, start.md, CLAUDE.md, AGENTS.md: 見積の決まりを rules/notion.md だけに書き、reference は種別・値・定義・計算式、コマンドは手順とリンクにした。start.md は手順とリンクを中心にし、利用者に要る 2 つの一文（85% の値を伝える、実績の入れ先）だけ残した。要件定義を入れない、インフラ（設計）を足す、悲観を上限にする、小数第 1 位まで、修正系の扱いをルールの必須にし、子が 6 件を超えたら見直すを必須に戻した。種別の名前を 3 か所でそろえる決まりは CLAUDE.md と AGENTS.md へ移した

- 2026-11-26 変更 reference/estimate-baseline.md, scripts/notion.mjs, rules/notion.md, .claude/commands/notion-tasks.md, start.md: 見積の種別を 24 個の平らな一覧に整理した。学習・調査（PoC を含む）、リファクタリング、データ分析、機械学習を足し、インフラ（構築）を案件のレベル別（L1〜L3）にしてブロックで数える。フロントとバックの設計・土台、結合確認をまとめた

- 2026-11-24 変更 start.md: 各手順を「あなたがすること」「AI がすること」「コマンド」「コマンドが使えない場合」の並びにそろえ、親タスクの目的と見積を独立した手順 3 にした。全体の流れに目的の確認と実績の入力を足し、つまずきやすいところを 3 つに分けた

- 2026-11-24 変更 rules/notion.md, .claude/commands/notion-project.md, start.md: 親の目的に範囲（何を、いくつ）を書き、目的を見積より先に書いて確認してから、目的だけを見て見積もる。案件資料に「規模」の行を足した

- 2026-11-24 変更 rules/notion.md: レビュー（実装）の本数に、PR を作らない子（レビューそのもの、PM の作業、記録用）を数えない

- 2026-11-24 追加 reference/estimate-baseline.md, rules/notion.md, scripts/notion.mjs, .claude/commands/notion-tasks.md: タスク種別に修正・手戻りを足し、修正系の分類（指摘対応、不具合・見た目の修正、作り直し）を決めた。修正・手戻りは見積に入れず実績だけを記録する

- 2026-11-24 変更 rules/notion.md, reference/estimate-baseline.md, .claude/commands/notion-project.md: 見積は親タスクの名前、目的、案件資料だけで考え、子タスクの中身から種別や数を拾わない。子の数はレビュー（実装）の本数にだけ使う

- 2026-11-24 変更 reference/estimate-baseline.md: バック（AI・OCR）の基準を 2 / 4 / 8 時間に下げ、精度の目標がある場合は調整で上げる

- 2026-11-24 変更 reference/estimate-baseline.md: レビュー（設計）の基準を 1.5 / 3 / 6 時間に下げた

- 2026-11-24 変更 rules/notion.md, scripts/notion.mjs, .claude/commands/task-pr.md, start.md: タスクを完了にするときは必ず実績工数を入れる。既に値があっても入れ直し、子のある親は子の実績がそろうまで完了にできない。AI は実績工数を推測せず利用者に聞く

- 2026-11-24 変更 rules/notion.md, reference/notion-workspace.md, scripts/notion.mjs, start.md: 子のない親タスクは、親に実績工数を入れる。実績は子のないタスクに入れ、子のある親には入れない

- 2026-11-24 変更 reference/estimate-baseline.md, scripts/notion.mjs: 見積の種別のドキュメントを、ドキュメント（リポジトリ）0.5 / 1 / 3 時間と、パワポを含むドキュメント（説明資料）4 / 8 / 16 時間に分けた

- 2026-11-24 変更 rules/notion.md, reference/estimate-baseline.md: 見積の数はファイルや文書の数ではなく基準の単位で数え、同じ PR に入る修正は子タスク 1 件として数える
- 2026-11-24 変更 reference/estimate-baseline.md, rules/notion.md, scripts/notion.mjs: レビューをレビュー（実装）とレビュー（設計）に分けた。実装の PR は 0.5 / 1 / 2 時間、設計は 3 / 6 / 12 時間

- 2026-11-24 変更 reference/estimate-baseline.md: バック（定期実行）の含む作業に見張りと診断、実行ログを足した
- 2026-11-24 追加 rules/notion.md, reference/notion-workspace.md, reference/estimate-baseline.md, .claude/commands/notion-tasks.md, scripts/notion.mjs: タスクに任意の列「タスク種別」を足し、子タスクに見積の種別を付ける（推奨）。種別ごとの実績で基準を直すのに使う
- 2026-11-24 変更 reference/estimate-baseline.md, rules/notion.md: AI で実装する前提に見積の基準を変えた。実装の種別を下げ、レビュー（PR ごと）とフロント・バックの設計を種別に足した。先方確認と修正を外し、要件定義はプロジェクト作成前に終わっている前提で見積に入れない
- 2026-11-24 変更 reference/estimate-baseline.md: 見積の種別から置き換えと要件の詰めを外した。置き換えはバック（処理）に含め、要件の詰めなど PM の作業は当面見積の対象にしない
- 2026-11-24 変更 reference/estimate-baseline.md, start.md: 見積の種別を共通・フロント・バック・インフラの区分で並べ直し、処理と連携をバックの 7 種別（土台、処理、ファイル入出力、外部連携、AI・OCR、定期実行、結合確認）に置き換えた
- 2026-11-24 変更 rules/notion.md, reference/estimate-baseline.md, .claude/commands/notion-project.md: 見積に工程のチェックリストを入れ、要らない工程には理由を書く。種別に要件の詰め、先方確認と修正、リリース・引き継ぎを足した。平均に加えて 85% の確率で収まる値を出し、先方にはそちらを伝える
- 2026-11-24 変更 rules/notion.md, reference/estimate-baseline.md, reference/notion-workspace.md, .claude/commands/notion-project.md, start.md: 見積の基準の値を定めた（処理、連携、調査、ドキュメント、置き換え、インフラの設計と構築、フロントの 5 工程）。基準を出発点に AI が親ごとに調整し、理由を残す。見積工数と実績工数は手を動かした時間だけで、先方を待つ時間を入れない。start.md の実例の節を削除した
- 2026-11-24 変更 rules/notion.md, reference/estimate-baseline.md, reference/notion-workspace.md, .claude/commands/notion-project.md, .claude/commands/notion-tasks.md, .claude/commands/task-pr.md, scripts/notion.mjs, start.md, README.md: 見積は親タスクにだけ、実績は子タスクにだけ入れる。見積はプロジェクトを作るときに種別ごとの量と基準の値、3 点見積で作り、親の見積の合計を予想開発時間に入れる。親タスクの作成を /notion-tasks から /notion-project へ移した。プロジェクトのステータスの一覧を実物に合わせた
- 2026-11-24 変更 scripts/notion.mjs, .claude/commands/notion-project.md: `project-create` が同名のプロジェクトを見つけたら作らずに止まるようにした。コマンドが参照する「各データベースの使い分け」のリンク先を reference/notion-workspace.md に直した
- 2026-11-13 追加 aws/, README.md, AGENTS.md, CLAUDE.md, rules/infra.md: AWS の要件整理、設計判断、技術標準、自動検証、例外管理を一続きに扱うアーキテクチャ設計標準を追加

## 2026-10

- 2026-10-30 変更 rules/git.md, templates/PULL_REQUEST_TEMPLATE.md: 残る制約に、ルールから外れた点の弁明（PR やファイルの行数が目安を超えた理由など）を書かない。セルフチェックの 300 行の項目から「しない理由を書いた」を外した
- 2026-10-20 変更 rules/git.md: コミットのルールを足した。要約と本文は日本語（種別だけ英語）、ステージするファイルの名指し、コミット前の Lint・型・テストを必須に、別の作業がある作業ツリーでの `git worktree` と AI のコミットへの `Co-Authored-By` を推奨に
- 2026-10-15 追加 rules/infra.md, README.md, templates/PULL_REQUEST_TEMPLATE.md: クラウドの構成をコードで書くときのルールを新設。構成管理、データを持つリソース、権限とネットワーク、テスト、デプロイ。PR のセルフチェックにインフラの項目を足した
- 2026-10-15 変更 rules/git.md: PR の差分の行数にロックファイルと自動生成ファイルを数えない
- 2026-10-02 変更 rules/git.md, templates/PULL_REQUEST_TEMPLATE.md, .claude/commands/task-pr.md: レビューのポイントは、何をするところかを先に普通の言葉で書き、コード上の名前は括弧で添える
- 2026-10-02 変更 rules/git.md, templates/PULL_REQUEST_TEMPLATE.md, .claude/commands/task-pr.md: 節の名前「特に見てほしいところ」を「レビューのポイント」に変えた
- 2026-10-02 変更 rules/git.md, templates/PULL_REQUEST_TEMPLATE.md, .claude/commands/task-pr.md: PR の概要に、プロジェクト全体で何を進めているかと、この PR がその中のどの段階かを書く。全体の流れの節は作らず、位置は概要の数文で示す
- 2026-10-01 変更 rules/git.md, templates/PULL_REQUEST_TEMPLATE.md, .claude/commands/task-pr.md, scripts/notion.mjs: 親タスクがあれば PR 本文の 2 行目に親タスクへのリンクを置く。task-get が親タスクを返すようにした
- 2026-10-01 変更 rules/git.md, templates/PULL_REQUEST_TEMPLATE.md, .claude/commands/task-pr.md, start.md: PR 本文の構成を変更。最初の見出しを「目的」から「概要」に変え、「設計上の判断」を「特に見てほしいところ」にまとめた。「確認方法と結果」と「全体の流れ」の節は作らない。本文を短く書く（1 項目 1〜2 文、太字は数か所まで）を推奨に足した

## 2026-09

- 2026-09-29 追加 rules/notion.md, .claude/commands/notion-tasks.md, .claude/commands/task-pr.md: 親タスクの役割を明記。親はまとまりの入口とし、本文に目的・進め方・子タスク・現在地・決定事項と未決事項を置く。子の範囲や状態が変わったら同じ日に親を直す。2 つのコマンドに親の本文を作る・直す手順を足した
- 2026-09-15 変更 rules/ 全体: 書式を統一。テーマごとに節を作り、その中を必須・推奨・任意で分ける形に揃えた。general.md の入れ子の向きを他と合わせ、4 ファイルで省かれていた「必須」の見出しを明示
- 2026-09-15 変更 README.md, CLAUDE.md, AGENTS.md, start.md: 入口を一本化。ルール一覧の正を README、手順と AI への指示の正を start.md に決め、CLAUDE.md と AGENTS.md はリンクだけの短い案内にした。3 か所にあったルール一覧表と最初の 1 文を 1 か所へ集約
- 2026-09-15 追加 reference/notion-workspace.md: 変わりやすい一覧を rules から分離。データベース名、列、選択肢、既知の癖を移した
- 2026-09-15 変更 rules/git.md: PR の差分の上限を明記。「300 行」がファイルと差分の両方を指していたため、呼び分けを全ファイルで統一
- 2026-09-15 追加 start.md: 案件資料からプロジェクト、リポジトリ、タスク、最初の PR までの手順をまとめた入口を追加
- 2026-09-15 変更 rules/git.md: ブランチ保護を設定しない方針を明記。組織の GitHub プランでは private リポジトリに設定できないため、マージ条件は運用で守る
- 2026-09-15 追加 .claude/commands/, scripts/notion.mjs: 案件資料からプロジェクト、タスク、PR を作る 3 コマンドと、Notion を読み書きする CLI を追加
- 2026-09-15 追加 rules/notion.md: Notion のルールを新設。階層と置き場所、ページとデータベースの書き方、各データベースの使い分け、同期スクリプトが更新する列、GitHub との対応、権限と秘密情報
- 2026-09-15 追加 rules/git.md, templates/PULL_REQUEST_TEMPLATE.md: PR とタスクの紐付けを追加。1 PR 1 タスク、タイトルへのタスク ID、本文冒頭のタスクリンク、タスク側からの逆引き、ステータス追従
- 2026-09-10 変更 rules/ ほか: 統合後に変化したルール強度、重複基準、行数基準、単体利用時の説明を修正
- 2026-09-10 変更 rules/: 23 個のルール文書を 7 個のカテゴリ文書へ統合し、重複する例とチェックリストを削減
- 2026-09-10 変更 rules/general.md: 簡潔な文章、既存ツールの再利用、OCR の標準ツールを追加
- 2026-09-10 変更 rules/frontend.md: 推奨技術、外部データ検証、利用者視点のテスト、実画面確認を追加
- 2026-09-10 変更 rules/10_git/branch.md ほか: ブランチ運用を main / dev の 2 段構成に変更。作業ブランチは dev から切り dev へ PR、main へは dev からまとめて PR。pull_request.md、commit.md、60_ci/pipeline.md の main 言及を合わせて修正
- 2026-09-10 変更 rules/10_git/pull_request.md, templates/PULL_REQUEST_TEMPLATE.md: 本文は「目的」から始め対象ファイルと見どころを書く形式に変更。出す前のセルフチェック 7 項目、積み上げ PR のマージ順序と方式を追加
- 2026-09-10 追加 全体: リポジトリ初版。rules/ 配下 7 ディレクトリと templates/ を作成

### 旧ルールファイルの移行先

| 旧パス | 新パス |
| --- | --- |
| `rules/00_general/*.md` | `rules/general.md` |
| `rules/10_git/*.md` | `rules/git.md` |
| `rules/20_docs/*.md` | `rules/docs.md` |
| `rules/30_src/*.md` | `rules/source.md` |
| `rules/40_frontend/*.md` | `rules/frontend.md` |
| `rules/50_testing/*.md` | `rules/testing.md` |
| `rules/60_ci/*.md` | `rules/ci.md` |
