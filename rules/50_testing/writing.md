# テストの書き方

| 項目 | 内容 |
| --- | --- |
| 対象 | すべてのテストコード |
| レベル | 必須 |
| 最終更新 | 2026-09-10 |

## 目的

テストは失敗したときに初めて読まれる。
失敗したテストを読んでも「何を確認していて、何が期待と違ったか」が分からないと、原因調査に時間がかかり、最終的にテストごと消される。
ここではテストを「失敗したときに読めば分かる」形で書くための基準を定める。

## ルール

### MUST

- テスト名は「どの条件で、何が期待されるか」が読み取れる形にする。例: `割引_金額がしきい値未満なら_0になる`、`test_login_fails_when_password_is_empty`。
- テスト本体は Arrange(準備)/ Act(実行)/ Assert(検証)の 3 段に分け、順番を入れ替えない。
- 1 つのテストで検証することは論理的に 1 つにする。複数の振る舞いを確認したいなら、テストを分ける。
- テスト同士を独立させる。実行順序に依存しない、テスト間で状態を共有しない、どの 1 つだけを実行しても通るようにする。
- テスト内で `if` や `for` などの条件分岐・ループを書かない。分岐が必要ならテストを分けるか、パラメータ化の仕組みを使う。
- テストコードにも本番コードと同じ品質基準(命名、重複排除、不要コードの削除)を適用する。

### SHOULD

- テストに現れる数値や文字列は、意味の分かる名前を付ける。`assert total == 1080` ではなく `assert total == PRICE_WITH_TAX` のようにする。
- テストデータは検証に必要な最小限にする。関係のない項目を埋めるとテストの意図が見えなくなる。
- テストファイルは本番コードの構成をミラーして配置する。`src/billing/discount` のテストは `tests/billing/test_discount` に置く。
- 準備を共通化する fixture やヘルパーは、読み手が中身を追わなくても分かる範囲に留める。3 段以上の継承や、引数で挙動が大きく変わるヘルパーは作らない。
- 期待値はテスト内に直接書く。本番コードと同じ計算式で期待値を組み立てると、本番のバグをそのまま写して通ってしまう。

### MAY

- 同じロジックに対して入力だけが異なるテストは、パラメータ化(テーブル駆動)でまとめてもよい。
- テスト名が長くなる場合は、テストの説明文やコメントに日本語で補足してもよい。

## Good / Bad 例

```text
# Bad: 名前から何を確認しているか分からず、複数の検証と分岐が混ざっている
test_discount:
    for amount in [999, 1000, 5000]:
        result = calc_discount(amount)
        if amount < 1000:
            assert result == 0
        else:
            assert result > 0

# Good: 条件と期待結果ごとにテストを分け、3 段構造で書く
test_discount_is_zero_when_amount_is_below_threshold:
    # Arrange
    amount = THRESHOLD - 1
    # Act
    result = calc_discount(amount)
    # Assert
    assert result == 0

test_discount_applies_when_amount_equals_threshold:
    amount = THRESHOLD
    result = calc_discount(amount)
    assert result == MIN_DISCOUNT
```

```text
# Bad: 前のテストが作ったデータに依存している
test_create_user:   db.insert(User(id=1))
test_delete_user:   db.delete(1); assert db.count() == 0   # 単独実行すると失敗する

# Good: 各テストが自分で準備し、自分で片付ける
test_delete_user_removes_it:
    user = create_user_in(db)
    db.delete(user.id)
    assert db.find(user.id) is None
```

```text
# Bad: 検証に関係ない項目まで埋めてあり、意図が埋もれている
user = User(name="太郎", age=30, address="東京", phone="000", plan="gold", ...)
assert is_adult(user)

# Good: 検証に関係する項目だけ
user = User(age=ADULT_AGE)
assert is_adult(user)
```

## チェックリスト

- [ ] テスト名だけで「条件」と「期待結果」が分かるか
- [ ] Arrange / Act / Assert の順に並んでいるか
- [ ] 1 テストで検証しているのは論理的に 1 つか
- [ ] テストを 1 つだけ、または順序を変えて実行しても通るか
- [ ] テスト内に条件分岐やループがないか
- [ ] 意味不明な数値・文字列がそのまま書かれていないか
- [ ] テストファイルが本番コードの構成と対応しているか

## 例外

- 性質を検証するテスト(ランダムな入力を多数生成して条件を確認するもの)は、生成の都合上ループを含んでよい。ただし検証の条件は 1 つにする。
- 複数の項目をまとめて 1 つの構造体として比較する場合、assert が 1 つなら「1 検証」とみなす。

## 参考

- [policy.md](policy.md)
- [external_deps.md](external_deps.md)
- [../00_general/naming.md](../00_general/naming.md)
- [../00_general/principles.md](../00_general/principles.md)
- [../30_src/structure.md](../30_src/structure.md)
