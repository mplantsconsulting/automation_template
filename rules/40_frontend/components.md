# 画面部品の分割と責務

| 項目 | 内容 |
| --- | --- |
| 対象 | 画面(UI)を構成する部品を作る・変更するすべてのコード |
| レベル | 必須 |
| 最終更新 | 2026-09-10 |

## 目的

画面部品は「表示」「データ取得」「操作」が 1 か所に混ざりやすく、放置すると 1 ファイルが数百行に膨らむ。
そうなると 1 か所の見た目を変えるだけでデータ取得まで壊れ、テストも書けなくなる。
ここでは部品の切り方と責務の置き場所を定め、修正の影響範囲を小さく保つ。

## ルール

### MUST

- 1 つの部品は 1 つの責務だけを持つ。「一覧を表示する」と「一覧を取得する」は別の部品に分ける。
- 表示専用の部品はデータ取得や保存を行わない。必要なデータはすべて引数(props)で受け取る。
- データ取得を行う部品は、取得した結果を表示専用の部品に渡すだけにし、自分では描画ロジックを持たない。
- 部品への引数は親から子への一方向にする。子が親の状態を直接書き換えない。変更が必要なら親からコールバックを渡す。
- ページ単位の入口(ルートに対応する部品)は薄く保つ。データ取得部品と表示部品を並べるだけにし、そこに描画ロジックや業務ロジックを書かない。
- 部品名は画面上の役割で付ける。実装の都合(`Wrapper`、`Container2`、`NewTable`)や見た目の詳細(`BlueButton`)で付けない。

### SHOULD

- 部品 1 つは 150 行以内を目安にする。超えたら責務が混ざっていないか確認し、分割する。
- 引数は 5 個以内を目安にする。超える場合は関連する引数を 1 つのオブジェクトにまとめるか、部品を分ける。
- 部品の共通化は 2 回目に同じ見た目・振る舞いが必要になったときに行う。1 回目から汎用部品を作らない。
- スタイルの置き場所はプロジェクトで 1 つに決める(部品と同じファイル、隣接ファイル、共通テーマのいずれか)。混在させない。
- 業務ロジック(計算、判定、変換)は部品の外の関数に出す。部品はその関数を呼ぶだけにする。

### MAY

- 部品ごとにディレクトリを作り、部品本体・スタイル・テストを同じ場所に置いてもよい。
- 表示専用の部品はサンプルデータだけで単体表示できる仕組み(カタログ、Storybook など)を用意してもよい。

## Good / Bad 例

```text
# Bad: 取得・整形・描画・保存が 1 つの部品に混ざっている
OrderPage:
    orders = fetch("/api/orders")
    total = sum(o.amount for o in orders if o.status != "cancelled")
    render table of orders
    render "合計: {total}"
    on click "確定": post("/api/orders/confirm")

# Good: 責務ごとに分け、入口は並べるだけ
OrderPage:
    render OrderListLoader(render=OrderList)

OrderListLoader(render):
    orders = fetch("/api/orders")
    render(orders, on_confirm=confirm_orders)

OrderList(orders, on_confirm):
    render OrderTable(orders)
    render OrderTotal(calc_total(orders))
    render ConfirmButton(on_click=on_confirm)
```

```text
# Bad: 実装の都合や見た目で命名している
Container2, DataWrapper, BlueButton, NewTable

# Good: 画面上の役割で命名している
OrderList, OrderTotal, ConfirmButton, CustomerSearchForm
```

## チェックリスト

- [ ] 部品を 1 文で説明できるか(「〜を表示する」「〜を取得する」のどちらか一方か)
- [ ] 表示専用の部品の中に API 呼び出しや保存処理がないか
- [ ] 子部品が親の状態を直接書き換えていないか
- [ ] ページの入口に描画ロジックや業務ロジックが書かれていないか
- [ ] 部品名から画面上の役割が分かるか
- [ ] 150 行、引数 5 個の目安を超えていないか。超えている場合は理由が説明できるか
- [ ] スタイルの置き場所がプロジェクトの決まりに沿っているか

## 例外

- 使い捨ての検証用画面(プロトタイプ、社内デモ)は SHOULD を緩めてよい。ただしファイル冒頭に使い捨てであることを書き、本番コードには取り込まない。
- Streamlit のように 1 ファイルで画面を書く前提のフレームワークでは、部品を「関数」と読み替えて同じ基準を適用する。

## 参考

- [state.md](state.md)
- [ux_a11y.md](ux_a11y.md)
- [../00_general/principles.md](../00_general/principles.md)
- [../00_general/naming.md](../00_general/naming.md)
- [../30_src/functions.md](../30_src/functions.md)
- [../30_src/structure.md](../30_src/structure.md)
