# Monster Art Prompts

BugBash Guild のモンスター画像を生成するときの方針と、再利用するプロンプトをまとめる。

## 基本方針

- メイン画風は「プレミアムなコレクタブルマスコット」。
- エンジニアが見て意味を理解できる概念を、モンスターの体・素材・能力・進化に溶かす。
- 進化するほど、IT感・エンジニア感・コーディング感を強くする。
- 低レアは最後まで愛着とネタの強さを残し、高レアほど素材感・シルエット・演出を強くする。
- 覚醒は「概念を制御・解決した姿」。
- 暴走は「邪悪でかっこいい闇ルート」。エラー画面や単なるグリッチではなく、魅力的な敵役にする。
- ゲーム本番用は、名前・矢印・UI文字なしの単体画像で再生成する。技術ラベルは必要な場合だけ制御して使う。

## 進化構造

基本は以下の6形態。

```text
Base
Evo
Awakened
Awakened Final
Berserk
Berserk Final
```

最初の一覧確認では6形態を1枚に並べる。採用後は1体ずつ単体生成する。

## コンタクトシートの分岐レイアウト

6形態の比較では、`3x2` の単純な一覧にしない。単純な一覧にすると `Evo` と `Berserk` が同格に見え、サイズも揃ってしまう。

分岐進化は以下の4列構造で見せる。

```text
Column 1: Base
Column 2: Evo
Column 3 top: Awakened
Column 4 top: Awakened Final
Column 3 bottom: Berserk
Column 4 bottom: Berserk Final
```

意図:

- `Base` と `Evo` は分岐前なので、上下中央に置く。
- `Awakened` と `Berserk` は `Evo` の次の上位形態として、Column 3 に上下分岐で置く。
- `Awakened Final` と `Berserk Final` は Column 4 に置く。
- `Evo` は `Awakened` / `Berserk` より小さくする。
- `Awakened` と `Berserk` は同じサイズにする。
- `Awakened Final` と `Berserk Final` は同じサイズにする。
- 矢印は原則使わない。必要な場合も、キャラや名前に重ならない薄いガイド線に留める。

## 進化段階の強さ配分

`Evo` は完成形ではなく通過点にする。`Evo` を良くしすぎると、覚醒・暴走が弱く見える。

形態ごとの役割:

- `Base`: 一番小さく、愛着が湧く入口。シンプルでかわいい。
- `Evo`: Baseより明確に成長しているが、まだ未完成。強さ・装飾・体格は中間に留める。
- `Awakened`: Evoより明確に大きく、整っていて、制御された姿。覚醒した価値がひと目で分かる。
- `Awakened Final`: 覚醒よりさらに完成度が高い。最も安定し、最も洗練されている。
- `Berserk`: Evoより明確に強く、邪悪でかっこいい姿。小さくしたり、派生案のように見せない。
- `Berserk Final`: 暴走よりさらに強い最終闇ルート。大きなシルエットと支配感を出す。

視覚的なサイズ感の目安:

```text
Base: 60
Evo: 75
Awakened: 95
Awakened Final: 115
Berserk: 100
Berserk Final: 120
```

コンタクトシート内のセル占有率:

```text
Base: セル高さの35〜40%
Evo: セル高さの40〜45%
Awakened: セル高さの60〜65%
Awakened Final: セル高さの70〜78%
Berserk: セル高さの60〜65%
Berserk Final: セル高さの70〜78%
```

守ること:

- `Evo` はあくまで中間形態。最終形態のように盛らない。
- `Awakened` と `Berserk` は、必ず `Evo` より大きく、強く、明確に上位に見せる。
- `Awakened` と `Berserk` は同じ体高・同じ存在感にする。違いは色、姿勢、素材、役割で出す。
- `Awakened Final` と `Berserk Final` は、それぞれのルートの頂点として一番強く見せる。
- `Awakened Final` と `Berserk Final` も同じ体高・同じ存在感にする。
- 進化後が進化前より小さく見える構図を避ける。
- 進化後のシルエットは、体格・姿勢・部位数・オーラのどれかで必ず上位感を出す。
- 進化途中で別種族に見える変化を避ける。猫、鳥、竜などへ急に変えず、同じコア生物が成長したように見せる。
- 同一シート内では全フォームを同じカメラ距離・同じ床位置で描く。サイズ差は実際の体格差として見せる。
- `Base` から `Berserk Final` まで、体格・重心・存在感が段階的に増えるようにする。
- `Evo` はBaseより少し成長しただけの小さめの通過点にする。
- `Evo` には最終形態用の大きな背面リング、大翼、巨大な装甲、王冠のような要素を持たせない。
- `Base` はセルを埋めない。最初から巨大モンスターに見せない。
- 後半形態をセルに収めるために小さく描かない。後半形態はセル内で明確に大きく見せる。
- 装飾込みの外形だけでなく、本体の体高・体積も進化後ほど大きくする。

## 覚醒・暴走の必須変化

`Awakened` と `Berserk` は、`Evo` の色違いや小変更では失敗。以下を必ず満たす。

- `Awakened` は `Evo` より体積を最低30%大きく見せる。
- `Berserk` は `Awakened` と同じ体高・体積にする。
- `Awakened Final` は `Awakened` よりさらに20%以上大きく見せる。
- `Berserk Final` は `Awakened Final` と同じ体高・体積にする。
- `Awakened` は必ず新しい主要部位を2つ以上持つ。例: 大きな背面リング、広い装甲、強い脚、保護されたコア、リンク状の翼、ガード姿勢。
- `Berserk` は必ず新しい主要部位を2つ以上持つ。例: 大きな爪、重い尻尾、露出した闇コア、壊れたリング、鎖状の翼、低い捕食姿勢。
- `Awakened` は `Evo` より「守れる・制御できる」姿勢にする。
- `Berserk` は `Evo` より「攻める・支配する」姿勢にする。
- 覚醒・暴走の名前だけ変えて、体型が同じなら失敗。

プロンプトには必要に応じて以下を入れる。

```text
Awakened must be at least 30% larger in apparent body volume than Evo, with two new major anatomical features and a clearly upgraded guardian role. It must not share the same pose or silhouette as Evo.
Berserk must match Awakened in apparent body height and volume, with two new major anatomical features and a clearly stronger predatory/dominating role. It must not share the same pose or silhouette as Evo.
```

## シルエット変化の必須ルール

進化は、同じ形をそのまま大きくするだけでは失敗。ファミリーとしての共通点は残しつつ、段階ごとに身体構造を変える。

必ず守ること:

- 進化後は、同じシルエットの拡大コピーにしない。
- 各進化形態は、以下のうち最低3つを変える。
  - 姿勢
  - 手足の構造
  - コアの位置
  - 装甲の形
  - 尻尾の形
  - 背面構造
  - 役割のシルエット
- ファミリーらしさは、共通素材・共通コア・共通モチーフで残す。
- `Awakened` は、守護者・制御者・安定運用者に見える身体構造にする。
- `Berserk` は、捕食者・侵入者・支配者に見える身体構造にする。

段階ごとの考え方:

- `Base`: 小さい。コアだけが目立つ。手足や補助パーツは短い。
- `Evo`: 少し成長。補助パーツが1つ増えるが、まだ未完成。
- `Awakened`: 姿勢が変わる。体が縦に伸びる、装甲が展開する、コアが保護される。
- `Awakened Final`: 身体構造が完成する。背面フレーム、リング、装甲、補助パーツが統合される。
- `Berserk`: 姿勢が変わる。低い構え、爪、重い尻尾、露出コア、壊れた外装が出る。
- `Berserk Final`: 支配者・災害級になる。巨大な外殻、重い尻尾、壊れたリング、広いシルエットを持つ。

プロンプトには必要に応じて以下を入れる。

```text
Do not evolve by simply scaling up the same silhouette.
Each evolved form must change at least three of these: body posture, limb structure, core placement, armor shape, tail shape, back structure, role silhouette.
Keep family identity through shared core materials and motifs, but change the body plan enough that each form feels like a true evolution.
```

## 覚醒・暴走の役割分離

覚醒と暴走は、色や明暗だけで分けない。各モンスターごとに、覚醒ルートと暴走ルートの「役割」を別物として定義する。

基本ルール:

- `Awakened` は、そのエンジニアリング概念を正しく扱った姿にする。
- `Berserk` は、そのエンジニアリング概念が悪用・肥大化・破綻した姿にする。
- 覚醒と暴走は同じ体高・同じ存在感でもよいが、役割・姿勢・骨格・主要部位は変える。
- 覚醒と暴走を、白版・黒版の色違いとして作らない。

プロンプトには必ず以下を入れる。

```text
Awakened and Berserk must not be defined by color.
They must be defined by different functional roles.

For this family:
Awakened role: {awakened_role}
Berserk role: {berserk_role}

The awakened form's silhouette, posture, protected core, and major body parts must express its role.
The berserk form's silhouette, posture, exposed core, and major body parts must express its role.
Do not create light/dark recolors of the same body.
```

10系統の役割案:

| 系統                 | 覚醒の役割                 | 暴走の役割                   |
| -------------------- | -------------------------- | ---------------------------- |
| Token Mimic          | 認証ゲートウェイ           | 認証情報を盗む捕食者         |
| Cache Turtle         | 高速化したランナー         | 迷路化した要塞               |
| Dependency Cub       | 依存グラフを整理する守護者 | 破壊的変更を撒き散らす捕食者 |
| Regex Moth           | 構文を解釈する予言者       | バックトラックで絡め取る狩人 |
| Deploy Wyrm          | 安定リリースの守護者       | ロールバック事故の支配者     |
| Memory Leak Wisp     | メモリを回収する清掃者     | ヒープを喰い潰す亡霊         |
| Race Condition Twins | スレッドを同期する調停者   | デッドロックを起こす双子     |
| Database Golem       | スキーマを整える番人       | インデックスを壊す巨像       |
| Firewall Crab        | 境界を守る防壁             | 通信を遮断する暴君           |
| CI Runner Golem      | 成功パイプラインの実行者   | 失敗ビルドを撒く暴走機械     |

## 切り出し・実装前提ルール

検討用コンタクトシート:

- 1体ごとに独立したセルに置く。
- 矢印、接続線、分岐線を入れない。
- モンスター名は各セルの下に置く。
- 名前はキャラ本体と被らせない。
- キャラの周囲に広い余白を残す。
- ラベルはキャラ名だけにする。`Base` や `Brk Final` などの進化ラベルは使わない。

本番用単体アセット:

- 1体だけを中央に置く。
- 名前、矢印、UI、カード枠を入れない。
- `JWT`、`OAuth`、`IAM`、`scope`、`session` などの技術ラベルは、IT感を強める場合のみ使う。
- 技術ラベルは体の大きな部位に1〜2個だけ入れる。細かい文字模様や大量の英字は避ける。
- 全身がキャンバス内に収まるようにする。
- 後で背景透過・サイズ統一しやすいように、暖かい白背景と薄い影にする。

## IT感を失わないためのチェック

生成プロンプトには必ず以下の意図を入れる。

```text
The coding / IT / software-engineering identity must become stronger as the monster evolves, not weaker.
Do not let final forms become generic fantasy monsters.
Engineering motifs must be integrated into anatomy, materials, posture, and role, not pasted as random icons.
```

各形態で少なくとも2つ以上、以下のような要素を体の一部として入れる。

- トークン、セッション、認証リング、鍵、権限スコープ
- ターミナル色の発光、カーソル、ブラケット
- Cookie状の連結パーツ、JWT風の分割コア
- OAuthポータル風リング、アクセスバッジ
- 暗号化された装甲、Vault構造、Lockfile風プレート
- パッケージキューブ、依存関係グラフ
- キャッシュ層、データベース円柱、パイプライン

## 技術ラベルの扱い

文字は全面禁止ではない。特に認証・セキュリティ系は、`JWT` や `OAuth` のような短い技術ラベルが見えることでIT感が強くなる。

使ってよいもの:

- `JWT`
- `OAuth`
- `IAM`
- `scope`
- `session`
- `token`
- `cache`
- `TTL`
- `lock`

使い方:

- 1形態につき1〜2個まで。
- コア、リング、バッジ、装甲プレートなど、大きな体の部位に入れる。
- キャラ名やUIラベルと混ざらない位置に入れる。
- 読める短いラベルにする。読めない細かい文字列やコード断片を大量に入れない。
- Token Mimic 系統では積極的に使ってよい。

全体で避けるもの:

- 全身に細かい英字がびっしり入ること
- 文字が顔やシルエットを潰すこと
- `ERROR` や `404` だけに寄って安っぽくなること
- キャラ名と技術ラベルが重なること

避けるもの:

- 進化後が普通のドラゴン・天使・悪魔になること
- ITモチーフが単なる模様や貼り付け記号になること
- 暴走がエラー画面、赤い警告、グリッチだけになること
- 覚醒と暴走がEvoの色違いに見えること

## Token Mimic 系統

### 形態名

- Token Mimic
- Session Mimic
- Vault Agent
- OAuth Gateway
- Token Exfiltrator
- Shadow IAM Proxy

### 分岐コンタクトシート用プロンプト

```text
Create a crop-friendly named branching evolution contact sheet for BugBash Guild, a collectible web RPG for software engineers.

Monster family: Token Mimic.
Art direction target: monster-like but strongly IT/security themed, simple readable silhouettes, premium collectible mascot quality. Controlled readable technical labels are wanted for this family because labels like JWT, OAuth, IAM, scope, session, and token help communicate the IT/authentication theme.

Use a branching evolution layout, not a 3x2 equal grid.
Layout structure:
- Column 1 center: Token Mimic
- Column 2 center: Session Mimic
- Column 3 top: Vault Agent
- Column 4 top: OAuth Gateway
- Column 3 bottom: Token Exfiltrator
- Column 4 bottom: Shadow IAM Proxy

Base and Evo are pre-branch forms and should be vertically centered between the two route rows. Awakened route is the top row. Berserk route is the bottom row. No arrows if possible; if guides are needed, use very faint thin lines that do not touch monsters or names.

Strict size rule:
Use the same camera distance. Do not let Base fill its cell.
- Token Mimic body height: 35-40% of its cell height
- Session Mimic body height: 40-45% of its cell height
- Vault Agent body height: 60-65% of its cell height
- OAuth Gateway body height: 70-78% of its cell height
- Token Exfiltrator body height: 60-65%, matching Vault Agent size and presence
- Shadow IAM Proxy body height: 70-78%, matching OAuth Gateway size and presence
Evo must be visibly smaller than both route forms. Awakened and Berserk must be equal size. Both final forms must be equal size and largest.

True evolution rule:
Do not evolve by simply scaling up the same silhouette. Each evolved form must change at least three of these: body posture, limb structure, core placement, armor shape, tail shape, back structure, role silhouette. Keep family identity through shared token core, vault-shell material, key teeth, access badges, OAuth rings, and session-cookie chains, but change the body plan enough that each form feels like a true evolution.

Functional role rule:
Awakened and Berserk must not be defined by color. They must be defined by different functional roles.
For this family:
Awakened role: authentication gateway.
Berserk role: credential-stealing predator.
The awakened form's silhouette, posture, protected core, and major body parts must express authentication gateway/control architecture.
The berserk form's silhouette, posture, exposed core, and major body parts must express credential theft, intrusion, and predatory architecture.
Do not create light/dark recolors of the same body.

Technical label rule:
Use 1-2 large readable technical labels per form, integrated into major body parts only. Labels should be on token cores, rings, badges, or armor plates. Avoid dense tiny text, repeated code strings, decorative text noise, or text covering faces/silhouettes.

Evolution forms:
1. Token Mimic — smallest form. Cute sly vault-chest mimic beast, squat closed vault-door shell body, wide key-tooth mouth, glowing segmented token core labeled JWT as tongue, small access-badge feet, terminal-green eyes.
2. Session Mimic — small waypoint form, not just bigger. The shell opens into a leaner crawling mimic with a masked access-badge face, simple session-cookie chain tail, rotating key module on back, protected token core moved from mouth to chest. Transitional, not final.
3. Vault Agent — awakened form, clearly bigger and structurally different. Upright guardian stance, vault-door torso expanded into shield armor, token core sealed behind clear glass at center, OAuth ring collar labeled OAuth, permission-scope shoulder plates, stronger legs and small key-module forearms.
4. OAuth Gateway — awakened final. Large guardian gateway creature with vertical protector stance, massive OAuth portal ring as back structure, broad vault-shell chest, protected token core, access-badge armor plates labeled scope, stabilizer key fins. Heroic, trustworthy, clearly auth/security themed.
5. Token Exfiltrator — berserk form, same size as Vault Agent but different body plan. Low predatory thief-beast silhouette, exposed violet token core in chest, long key-claw forelimbs, stolen cookie-chain mantle, masked terminal eyes, torn access-badge armor. Evil, cool, not a black recolor of Session Mimic.
6. Shadow IAM Proxy — berserk final, same size as OAuth Gateway. Tall dark proxy beast with obsidian vault-shell body, dark OAuth ring behind it, credential-chain wing shapes, eclipsed token core, broad permission-scope armor plates, IAM label on central badge, dominating stance. Evil, readable, not generic demon.

Critical evolution rules:
- IT/security identity must become stronger as it evolves.
- Evo is only a small waypoint, not the finished form.
- Awakened and Berserk must be visibly larger and stronger than Evo.
- Final forms must be the largest and most dominant silhouettes.
- Awakened route changes into guardian/control architecture.
- Berserk route changes into predator/proxy/intrusion architecture.

Art direction:
Premium collectible mascot illustration, high-end designer toy blended with polished fantasy game character art. Glossy enamel, translucent resin, metallic keys, crystal token cores, expressive faces, clean professional rendering, strong thumbnail readability, commercially desirable.

Layout and crop rules:
16:9 landscape, warm-white studio background, subtle soft shadow under each monster, generous empty margin around every character. Place each monster name centered below its monster and separated from the silhouette. No large card frames, no UI clutter, no decorative background, no labels like Base/Evo/Awk.

Avoid: 3x2 equal grid, generic fantasy dragon/demon/angel, simple scale-up evolution, weak-looking evolved forms, later forms smaller than earlier forms, dense terminal text, random pasted symbols, insect complexity, messy effects, cheap emoji style, pixel art, horror, human characters, text overlapping characters.
```

### 単体生成共通テンプレート

```text
Create a single high-quality game-ready monster asset concept for BugBash Guild.

Monster: {monster_name}.
Family: Token Mimic evolution line.
Role: {role}.
Core concept: {core_concept}.

Subject:
{subject_description}

Engineering / IT identity:
{engineering_identity}
These elements must be integrated into the anatomy and material, not pasted symbols.

Art direction:
Premium collectible mascot illustration, high-end designer toy blended with polished game character art. Glossy enamel, translucent resin, metallic keys, crystal token cores, expressive faces, clean professional rendering, strong thumbnail readability, commercially desirable.

Composition:
Single monster only, centered, full body, lots of padding on all sides for later cropping. No monster name, no UI labels, no arrows, no card frame. Controlled technical labels are allowed only when they strengthen the IT concept. Warm-white studio background with a subtle soft shadow. Keep the monster fully inside the canvas with nothing cropped off.

Critical rule:
The coding / IT / software-engineering identity must become stronger as the monster evolves, not weaker. Do not let final forms become generic fantasy monsters.

Avoid: cheap emoji style, pixel art, horror, human features, messy effects, dense tiny text, decorative text noise, watermark.
```

### Token Exfiltrator 単体生成プロンプト

```text
Create a single high-quality game-ready monster asset concept for BugBash Guild.

Monster: Token Exfiltrator.
Family: Token Mimic evolution line.
Role: Berserk route form.
Core concept: stolen token / credential theft / dark unauthorized access.

Subject:
Token Exfiltrator must not look like a black recolor of Session Mimic. It should transform into a low predatory thief-beast silhouette with long key-claw forelimbs, exposed violet segmented token core in the chest, stolen credential chains wrapped around the body, masked terminal eyes, torn access-badge armor, and a confident predatory posture. Keep family traits through mimic mouth shape, token core, key teeth, access badges, and session-cookie chains. It should be evil, cool, charismatic, and desirable.

Engineering / IT identity:
Use exposed token core, stolen session-cookie chains, dark OAuth ring fragments, corrupted access badges, key-claw forelimbs, masked identity faceplate, permission-scope sigils integrated into armor, and terminal-violet highlights. These elements must be anatomy and materials, not pasted icons.

Art direction:
Premium collectible mascot illustration, high-end designer toy blended with polished fantasy game character art. Glossy black enamel, violet translucent resin, metallic dark gold keys, expressive villain eyes, clean professional rendering, strong thumbnail readability, commercially desirable.

Composition:
Single monster only, centered, full body, lots of padding on all sides for later cropping. No monster name, no UI labels, no arrows, no card frame. Controlled technical labels are allowed only on major body parts. Warm-white studio background with a subtle soft shadow. Keep the monster fully inside the canvas with nothing cropped off.

Critical rule:
The coding / IT / authentication identity must become stronger in this berserk form, not weaker. Do not make it a generic demon, generic shadow animal, or simple black recolor.

Avoid: generic demon, computer error aesthetic, cheap emoji style, pixel art, horror gore, human features, messy effects, dense tiny text, decorative text noise, watermark.
```
