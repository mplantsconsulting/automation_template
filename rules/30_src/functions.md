# 関数・クラス設計

| 項目 | 内容 |
| --- | --- |
| 対象 | すべてのソースコード内の関数、メソッド、クラス |
| レベル | 必須 |
| 最終更新 | 2026-09-10 |

## 目的

長く複数の仕事をする関数は、読むのに時間がかかり、テストが書けず、修正時に意図しない箇所を壊す。
引数や戻り値の形が揺れていると、呼び出し側で場合分けが増え、バグの温床になる。
ここでは関数とクラスを「小さく、予測可能に」保つための基準を定める。

## ルール

### MUST

- 1 関数は 1 つの責務だけを持つ。「A して B する」と説明する関数は分割する。
- 引数は 4 個までにする。超える場合は関連する引数を構造体(オブジェクト、辞書、データクラスなど)にまとめる。
- 真偽値のフラグ引数で振る舞いを切り替えない。別の関数に分けるか、列挙型で意図を表す。
- 副作用のある処理(入出力、外部通信、状態変更)と純粋な計算(入力だけから出力を決める)を同じ関数に混ぜない。
- 戻り値の型を一貫させる。同じ関数が場合によって値と `None`、単一の値とリストを返し分けてはならない。
- グローバルな可変状態を使わない。必要な値は引数で渡し、結果は戻り値で返す。

### SHOULD

- 関数の長さは 30〜50 行を目安にする。超えたら責務が混ざっていないか確認する。
- 異常系や前提条件の確認は早期リターンで先に処理し、正常系のネストを浅くする。
- ネストは 3 段までにする。超える場合は内側を関数に切り出す。
- クラスは「状態と、その状態を操作する振る舞い」が結びつくときだけ作る。関数の置き場所としてクラスを作らない。
- 引数を関数内で書き換えない。変更した結果が必要なら新しい値を返す。
- 省略可能な引数のデフォルト値には不変な値だけを使う。

### MAY

- 純粋な計算部分を切り出して単体テストしやすくし、副作用のある部分は薄いラッパーにしてもよい。
- 引数が多くなる設定系の関数は、設定オブジェクトを 1 つ受け取る形にしてもよい。

## Good / Bad 例

```text
# Bad: フラグ引数で振る舞いが変わり、呼び出し側で意味が読めない
export_report(data, True, False)

# Good: 意図が名前に出る
export_report_as_csv(data)
export_report_as_pdf(data)
```

```text
# Bad: 副作用と計算が混ざり、戻り値の型も揺れる
def process(order_id):
    order = db.fetch(order_id)          # 外部アクセス
    if order is None:
        return None                     # None を返す
    total = sum(i.price for i in order.items)
    db.save_total(order_id, total)      # 外部アクセス
    return [total]                      # リストを返す

# Good: 計算は純粋関数に分け、入出力は外側で行う。戻り値の型は一定
def calc_total(items) -> Money:
    return sum(i.price for i in items)

def update_order_total(order_id, repo):
    order = repo.fetch(order_id)
    if order is None:
        raise OrderNotFound(order_id)
    repo.save_total(order_id, calc_total(order.items))
```

```text
# Bad: 深いネスト
def handle(request):
    if request.is_valid():
        if request.user.is_active():
            if request.has_permission():
                ...処理...

# Good: 早期リターンでネストを浅くする
def handle(request):
    if not request.is_valid():
        raise InvalidRequest()
    if not request.user.is_active():
        raise InactiveUser()
    if not request.has_permission():
        raise Forbidden()
    ...処理...
```

## チェックリスト

- [ ] 関数の説明を 1 文で書けるか(「〜して〜する」になっていないか)
- [ ] 引数が 4 個以内か。多い場合は構造体にまとめているか
- [ ] 真偽値のフラグ引数で振る舞いを切り替えていないか
- [ ] 入出力や外部通信と純粋な計算が同じ関数に混ざっていないか
- [ ] 戻り値の型が呼び出しごとに変わらないか
- [ ] グローバル変数を読み書きしていないか
- [ ] ネストが 3 段以内か。早期リターンを使っているか
- [ ] クラスが状態と振る舞いの組み合わせを表しているか

## 例外

- フレームワークが要求するシグネチャ(イベントハンドラ、コールバックなど)は引数の数や形を変えられないため、そのまま従う。ただし中身は別関数に委譲して薄く保つ。
- 使い捨てのスクリプト(1 回実行して破棄するもの)は SHOULD を緩めてよい。ただし `scripts/` に置き、使い捨てであることをファイル冒頭に書く。

## 参考

- [../00_general/principles.md](../00_general/principles.md)
- [../00_general/naming.md](../00_general/naming.md)
- [structure.md](structure.md)
- [errors_logging.md](errors_logging.md)
- [comments.md](comments.md)
- [../50_testing/writing.md](../50_testing/writing.md)
