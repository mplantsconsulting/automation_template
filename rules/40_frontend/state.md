# 状態管理と副作用

| 項目 | 内容 |
| --- | --- |
| 対象 | 画面の状態(表示中のデータ、入力値、選択状態など)と副作用(API 呼び出し、保存、通知)を扱うすべてのコード |
| レベル | 必須 |
| 最終更新 | 2026-09-10 |

## 目的

状態の置き場所が場当たり的だと、「どこで値が変わったのか」を追うために画面全体を読む必要が出てくる。
副作用が部品の中に散らばると、同じ API が何度も呼ばれたり、画面によって失敗時の挙動が違ったりする。
ここでは状態のスコープと副作用の置き場所を定め、値の流れを追える画面にする。

## ルール

### MUST

- 状態はそれを使う最小のスコープに置く。1 つの部品だけが使う状態をページや全体に置かない。
- 他の状態から計算できる値は状態にしない。表示のたびに計算する(例: 合計、件数、フィルタ結果)。
- サーバーから取得した値(データ)と、ローカルの UI 状態(選択中、開閉、入力途中)は別の変数として持つ。1 つのオブジェクトに混ぜない。
- 副作用(API 呼び出し、保存、外部サービス連携)は部品の中に直接書かず、1 か所(サービス層、hooks、store など)に集める。部品はそれを呼ぶだけにする。
- データを取得して表示する箇所は、読み込み中・エラー・空(0 件)の 3 状態を必ず扱う。どれかを省略しない。
- 状態を直接書き換えない。新しい値を作って置き換える。

### SHOULD

- グローバル状態(アプリ全体で共有する状態)は本当に横断的なものだけにする(例: ログインユーザー、テーマ、通知)。画面固有のデータをグローバルに置かない。
- 状態の名前は「何の・どういう状態か」が分かるように付ける(例: `selected_order_id`、`is_saving`、`orders`)。`data`、`flag`、`state` のような名前は使わない。
- 真偽値の状態には `is_` / `has_` / `can_` などの接頭辞を付け、名前だけで真偽値と分かるようにする。
- 同じサーバーデータを複数の部品で使う場合は、取得を 1 か所にまとめ、結果を引数で配る。部品ごとに取得しない。
- 副作用の失敗時の扱い(再試行、エラー表示、ログ)は共通の 1 か所で決め、部品ごとに変えない。

### MAY

- サーバーデータの取得・キャッシュ・再取得を扱う専用ライブラリを使ってもよい。ただし導入理由を README に書く。
- 状態の変化を追いにくい画面では、状態遷移を表(状態 × 操作 → 次の状態)で設計メモに残してもよい。

## Good / Bad 例

```text
# Bad: 派生値を状態として持ち、更新漏れが起きる
state.items = fetch_items()
state.total = sum(i.amount for i in state.items)
...
state.items.append(new_item)   # total が古いまま

# Good: 派生値は計算する
state.items = fetch_items()
total = sum(i.amount for i in state.items)   # 表示時に計算
```

```text
# Bad: サーバーデータと UI 状態が混ざり、副作用が部品の中にある
OrderList:
    state = { orders: [], selected: null, is_open: false }
    on mount: state.orders = http.get("/api/orders")
    render ...

# Good: 分けて持ち、取得は 1 か所に集める
# services/orders
fetch_orders(): return http.get("/api/orders")

OrderList:
    orders, is_loading, error = use_orders()      # サーバーデータ
    selected_order_id = local_state(null)         # UI 状態
    is_detail_open = local_state(false)           # UI 状態

    if is_loading: render Spinner
    if error:      render ErrorMessage(error)
    if empty(orders): render EmptyMessage("注文はありません")
    render OrderTable(orders, selected_order_id)
```

## チェックリスト

- [ ] 各状態は、それを使う部品のうち最も内側に置かれているか
- [ ] 他の状態から計算できる値を状態として保存していないか
- [ ] サーバーから取得した値と UI 状態が別の変数になっているか
- [ ] 部品の中に API 呼び出しや保存処理が直接書かれていないか
- [ ] 読み込み中・エラー・空の 3 状態がすべて表示されるか
- [ ] グローバル状態に画面固有のデータが入っていないか
- [ ] 状態の名前から「何の・どういう状態か」が分かるか

## 例外

- 計算コストが高く、実測で描画が遅くなることを確認した派生値は、メモ化(計算結果のキャッシュ)を使ってよい。状態として保存するのは最後の手段とし、理由をコメントに書く。
- 表示のみの静的な画面(データ取得も入力もない)では、3 状態の扱いは不要。

## 参考

- [components.md](components.md)
- [ux_a11y.md](ux_a11y.md)
- [../00_general/naming.md](../00_general/naming.md)
- [../30_src/errors_logging.md](../30_src/errors_logging.md)
- [../50_testing/external_deps.md](../50_testing/external_deps.md)
