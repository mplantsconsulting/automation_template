# AWS アーキテクチャ設計標準

AWS の構成を、要件から検証と承認まで同じ手順で設計するための標準です。
特定のサービスを一律に採用するのではなく、確認事項、比較方法、必須統制、検証方法を揃えます。

この標準は [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/) の 6 本の柱を品質評価の基盤にし、要件の追跡、設計判断、例外、承認を加えます。

## 適用範囲

- 新しい AWS システムの設計
- 既存 AWS システムの大きな構成変更
- AWS リソースを含む IaC の作成とレビュー
- AWS の権限、公開範囲、データ保護、監視、費用に関する変更

軽微な設定変更でも、権限拡大、外部公開、データ削除・置換を含む場合は省略しません。

## 読む順序

AI は [AGENTS.md](AGENTS.md) に従い、次を順に読みます。

| ファイル | 内容 |
| --- | --- |
| [rules/requirements.md](rules/requirements.md) | 要件、制約、仮定、不明事項 |
| [rules/architecture.md](rules/architecture.md) | 論理構成、候補比較、ADR、追跡関係 |
| [rules/engineering.md](rules/engineering.md) | アカウント、権限、ネットワーク、データ、信頼性、監視、費用 |
| [rules/automation.md](rules/automation.md) | 自動検証、検証ゲート、例外、承認 |
| [reference/service-selection.md](reference/service-selection.md) | サービス候補を絞るための変わりやすい参考情報 |
| [reference/estimate-infra.md](reference/estimate-infra.md) | インフラの工数を見積もるときだけ読む。案件のレベルとブロック |

ルートの `rules/general.md`、`rules/git.md`、`rules/infra.md` も適用します。
競合した場合は、案件固有の承認済み要件、`aws/`、ルートの共通ルールの順で確認し、競合を黙って解決しません。

## 設計の流れ

```text
入力資料
  ↓
要件・制約・仮定・不明事項
  ↓ Gate 1: 要件承認
論理アーキテクチャ
  ↓
AWS 構成候補の比較と ADR
  ↓ Gate 2: 設計承認
IaC と検証計画
  ↓
静的検査・テスト・差分・費用確認
  ↓ Gate 3: リリース承認
デプロイ
  ↓
ヘルスチェック・運用記録・継続検査
```

## 成果物

| 成果物 | 目的 | 雛形 |
| --- | --- | --- |
| 要件一覧 | 要件、制約、仮定、不明事項を分離する | [requirements.yaml](templates/requirements.yaml) |
| アーキテクチャ設計 | 境界、責務、データフロー、AWS 構成を示す | [architecture.md](templates/architecture.md) |
| ADR | 重要な設計判断と代替案を残す | [adr.md](templates/adr.md) |
| 統制ルール | 検証可能なルールを構造化する | [control.yaml](templates/control.yaml) |
| 例外 | 期限付きの例外と補完策を追跡する | [exception.yaml](templates/exception.yaml) |
| 検証報告 | 要件、統制、試験、未解決事項をまとめる | [validation-report.md](templates/validation-report.md) |

## 役割の分離

- AI は要件抽出、論点提示、候補比較、文書と IaC の下書きを行う。
- 静的解析やテストは、決定的に判定できる違反を検出する。
- 人は要件、重要な設計判断、例外、本番変更を承認する。

AI の提案だけを合格証跡にしません。実行結果が必要な要件は、実際の試験結果で確認します。

## ルールの改訂

- AWS サービスの仕様や選択肢は `reference/` に置き、公式資料を確認して更新する。
- 必須統制を変える場合は、影響、移行方法、既存例外を同じ PR で確認する。
- ルールを変更したら、対応する雛形、検証、ルートの `CHANGELOG.md` も更新する。
