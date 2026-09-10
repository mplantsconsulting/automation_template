# 外部依存の扱い

| 項目 | 内容 |
| --- | --- |
| 対象 | 外部 API、DB、ファイルシステム、時刻、乱数、環境変数に触れるコードとそのテスト |
| レベル | 必須 |
| 最終更新 | 2026-09-10 |

## 目的

外部に依存したテストは、コードが正しくてもネットワークや時刻の都合で落ちる。
落ちる理由が自分たちのコードにないテストは信頼されなくなり、赤い CI が常態化して本当の失敗が見逃される。
ここでは外部依存をテストから切り離し、切り離した先で本物とのずれを起こさないための基準を定める。

## ルール

### MUST

- 外部 API、DB、ファイルシステム、時刻、乱数、環境変数には本番コードから直接触らず、差し替え可能な形(引数やコンストラクタで渡す依存注入)にする。
- モックは外部との境界だけに使う。自分たちのコードの内部関数やクラスをモックしない。
- モックの戻り値は実際のレスポンス形式に合わせる。想像で作らず、実際に記録したデータを fixture として保存して使う。
- 時刻は注入して固定する。テスト内で「現在時刻」を直接取得しない。
- 本番の秘密情報(API キー、パスワード、トークン)をテストコードや fixture に書かない。ダミー値を使う。
- ネットワークに出るテストは、単体テストと同じジョブで実行しない。CI では実行しないか、別ジョブに分ける。

### SHOULD

- 乱数は seed を固定するか、乱数生成器を注入して決定的にする。
- ファイルを扱うテストは一時ディレクトリを使い、テスト終了時に削除する。リポジトリ内のファイルを直接書き換えない。
- 環境変数は直接読まず、起動時に 1 か所で読んで設定オブジェクトにまとめ、テストではそのオブジェクトを渡す。
- 本物の外部システムに接続する統合テストは、専用の環境(テスト用 DB、サンドボックス API)に対して実行し、`integration` のような明示的なマークを付けて通常のテストと区別する。
- 記録した fixture には取得日と取得元を書く。外部 API の仕様が変わったときに古さを判断できるようにする。

### MAY

- 外部 API の応答を記録・再生する仕組み(VCR 系ツール)を使ってもよい。ただし記録ファイルから秘密情報を除いたことを確認する。
- 外部システムとの契約(リクエストとレスポンスの形式)を確認するテストを、定期実行の別ジョブとして持ってもよい。

## Good / Bad 例

```text
# Bad: 現在時刻を内部で取得しており、日付によって結果が変わる
def is_expired(token):
    return token.expires_at < now()

# Good: 時刻を注入し、テストでは固定する
def is_expired(token, clock):
    return token.expires_at < clock.now()

test_token_is_expired_after_expiry:
    clock = FixedClock("2026-09-10T00:00:00")
    token = Token(expires_at="2026-09-09T00:00:00")
    assert is_expired(token, clock)
```

```text
# Bad: 内部関数をモックしていて、実装を変えるとテストが壊れる
mock(calc_total)            # 自分たちのコード
mock(apply_discount)        # 自分たちのコード
assert checkout(cart) == 900

# Good: 境界(外部 API)だけをモックし、内部はそのまま動かす
payment_api = FakePaymentApi(response=load_fixture("payment_success.json"))
result = checkout(cart, payment_api)
assert result.status == PAID
```

```text
# Bad: 想像で作ったレスポンス。実際の API は "amount" ではなく "total_amount" を返す
payment_api.respond_with({"status": "ok", "amount": 100})

# Good: 実際のレスポンスを記録した fixture を使う
# fixtures/payment_success.json  (取得日: 2026-09-01、取得元: サンドボックス環境)
payment_api.respond_with(load_fixture("payment_success.json"))
```

## チェックリスト

- [ ] 外部 API、DB、ファイル、時刻、乱数、環境変数が差し替え可能になっているか
- [ ] モックしているのは外部との境界だけか
- [ ] モックの戻り値は実際のレスポンス形式と一致しているか
- [ ] テストの結果が実行日時や乱数に左右されないか
- [ ] テストコードや fixture に本番の秘密情報が含まれていないか
- [ ] ネットワークに出るテストが単体テストのジョブから分離されているか
- [ ] 一時ファイルがテスト後に残らないか

## 例外

- 標準ライブラリのファイル読み書きや文字列処理など、安定していて副作用のない依存は注入しなくてよい。
- 外部ライブラリ自体の使い方を確認する学習用のコードは対象外とする。ただしリポジトリのテストには含めない。

## 参考

- [policy.md](policy.md)
- [writing.md](writing.md)
- [../00_general/security.md](../00_general/security.md)
- [../30_src/config_env.md](../30_src/config_env.md)
- [../30_src/functions.md](../30_src/functions.md)
- [../60_ci/pipeline.md](../60_ci/pipeline.md)
