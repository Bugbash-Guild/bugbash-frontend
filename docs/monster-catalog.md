# Monster Catalog

BugBash Guild のモンスター系統を、ITテーマ・動物モチーフ・被り防止の観点で管理する。

AIエージェントが新しいモンスターを提案・生成する前に、このファイルを必ず確認する。
`docs/monster-art-prompts.md` は描画ルールの正、こちらは「既存テーマとモチーフ」の正として扱う。

## 使い方

- 新規案を出す前に、下の表の `ITテーマ` と `動物/生物モチーフ` を確認する。
- 既存系統と同じ主要テーマ、同じ動物、同じ失敗モードを避ける。
- 近いテーマを使う場合は、先に差分を明記する。例: `schema migration` と `schema validation` は別物だが、どちらも schema 領域なので役割を分ける。
- 採用された系統は、画像生成前または画像承認時にこの台帳へ追加する。
- `状態` が `計画中` のものも、被り防止では既存扱いにする。

## 本番アセット投入済み

`game-assets/source/monsters/{slug}/` に6形態の画像が揃っている系統。

| slug | 系統名 | ITテーマ | 動物/生物モチーフ | 主要キーワード |
| --- | --- | --- | --- | --- |
| `cache-phantom` | Cache Phantom | キャッシュ、stale data、invalidation、TTL | 幽霊/phantom | cache, stale, invalidation, TTL, ghost data |
| `dependency-hydra` | Dependency Hydra | 依存関係、package graph、version conflict | ヒドラ | dependencies, package lock, transitive dependency, version conflict |
| `deploy-canary-finch` | Deploy Canary Finch | デプロイ、canary release、rollback、health check | カナリア/finch | deploy, canary, rollout, rollback, health check |
| `feature-flag-chameleon` | Feature Flag Chameleon | feature flag、段階公開、toggle、variant | カメレオン | feature flag, toggle, variant, rollout, hidden state |
| `git-branch-kitsune` | Git Branch Kitsune | Git branch、merge、fork、commit graph | キツネ/kitsune | git, branch, merge, fork, commit, rebase |
| `observability-owl` | Observability Lantern Owl | observability、logs、metrics、traces、alerts | フクロウ/owl | observability, log, metric, trace, alert, SLO |
| `queue-worker-hedgehog` | Queue Worker Hedgehog | queue worker、job processing、backpressure | ハリネズミ | queue, worker, job, retry, backpressure, throughput |
| `race-condition-twins` | Race Condition Twins | race condition、thread sync、deadlock、starvation | 双子/twins | race condition, thread, lock, deadlock, starvation, scheduler |
| `rate-limit-djinn` | Rate Limit Djinn | rate limit、quota、throttle、burst control | ジン/djinn | rate limit, quota, throttle, burst, 429 |
| `regex-ferret` | Regex Capture Ferret | regex、pattern matching、capture group、backtracking | フェレット/ferret | regex, pattern, capture group, backtracking, parser |
| `schema-migration-golem` | Schema Migration Golem | DB schema migration、versioned schema、rollback | ゴーレム | migration, database, schema version, rollback, DDL |
| `schema-validator-lynx` | Schema Validator Lynx | schema validation、contract check、型検証 | リンクス/lynx | validation, schema, contract, type check, JSON schema |
| `serialization-kraken` | Serialization Kraken | serialization、deserialization、encoding、payload shape | クラーケン | serialization, deserialization, JSON, payload, encoding |
| `timeout-jellyfish` | Timeout Jellyfish | timeout、latency、retry、slow response | クラゲ/jellyfish | timeout, latency, retry, slow request, deadline |
| `token-mimic` | Token Mimic | authentication token、session、OAuth、権限 | ミミック | token, session, OAuth, auth, scope, exfiltration |
| `webhook-bat` | Webhook Signal Bat | webhook、event delivery、signature verification、dead-letter queue | コウモリ/bat | webhook, event, delivery, signature, callback, DLQ |

## 旧ローカルフォールバック

R2移行前のローカル画像やSVGとして残っている系統。今後の提案では、これらもテーマ被りとして扱う。

| slug / 系統 | ITテーマ | 動物/生物モチーフ | 主要キーワード | メモ |
| --- | --- | --- | --- | --- |
| `null-pointer-axolotl` | null参照、optional、安全なdereference、memory safety | ウーパールーパー/イモリ系 | null pointer, dereference, optional, memory safety | `/public/monsters/*.png` の6形態フォールバック |
| `token-mimic` legacy SVG | authentication token、session、OAuth | ミミック | token, session, OAuth, IAM | R2投入済み `token-mimic` と同テーマ |
| `race-condition-twins` legacy SVG | race condition、thread sync、deadlock | 双子/twins | race, thread, lock, deadlock | R2投入済み `race-condition-twins` と同テーマ |
| `git-branch-kitsune` base fallback | Git branch | 子犬/キツネ系 | branch, git | base画像 `Branch Pup` として残る |
| `timeout-jellyfish` base fallback | timeout、latency | polyp/クラゲ系 | timeout, latency | base画像 `Latency Polyp` として残る |
| `feature-flag-chameleon` base fallback | feature flag | ヤモリ/カメレオン系 | flag, toggle | base画像 `Flag Gecko` として残る |

## 計画中・作りかけ

まだ本番アセットが揃っていないが、過去に候補または計画として扱った系統。被り防止では既存扱いにする。

| slug / 仮名 | 状態 | ITテーマ | 動物/生物モチーフ | 主要キーワード |
| --- | --- | --- | --- | --- |
| `circuit-breaker-armadillo` | 提案中 | circuit breaker、fallback、half-open、service protection | アルマジロ | circuit breaker, fallback, half-open, isolation |
| `cron-scheduler-ram` | 提案中 | cron、scheduled job、missed run、clock drift | 牡羊/ram | cron, scheduler, clock drift, missed run |
| `sandbox-hermit` | 提案中 | sandbox、isolation、permission、escape attempt | ヤドカリ/hermit crab | sandbox, isolation, permissions, escape |

## テーマ領域マップ

既存または計画中でカバー済みの大きな領域。

- 認証/認可: `token-mimic`
- null安全/memory safety: `null-pointer-axolotl`
- キャッシュ: `cache-phantom`
- 競合/並行処理: `race-condition-twins`
- Git/branch: `git-branch-kitsune`
- timeout/latency: `timeout-jellyfish`
- feature flag: `feature-flag-chameleon`
- 依存関係: `dependency-hydra`
- DB migration/schema変更: `schema-migration-golem`
- schema validation/contract: `schema-validator-lynx`
- serialization/payload: `serialization-kraken`
- rate limit/quota: `rate-limit-djinn`
- queue worker/job処理: `queue-worker-hedgehog`
- deploy/canary rollout: `deploy-canary-finch`
- webhook/event delivery: `webhook-bat`
- regex/pattern matching: `regex-ferret`
- observability/logs/metrics/traces: `observability-owl`
- circuit breaker/fallback: `circuit-breaker-armadillo`
- cron/scheduler: `cron-scheduler-ram`
- sandbox/isolation/permissions: `sandbox-hermit`

## 新規提案時のチェックリスト

1. 既存の `ITテーマ` と同じ主題ではないか。
2. 既存の `動物/生物モチーフ` と同じ動物ではないか。
3. 既存の `主要キーワード` と3語以上重なっていないか。
4. 近い領域の場合、別のバグ・失敗モード・解決ルートとして説明できるか。
5. Berserk の失敗表現が既存系統と同じではないか。
6. 採用後、このファイルに状態とテーマを追加したか。
