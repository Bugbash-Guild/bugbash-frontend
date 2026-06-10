# Monster Art Prompts

BugBash Guild のモンスター画像を生成するときの方針と、再利用するプロンプトをまとめる。

## AIエージェント必須手順

モンスター画像を生成・レビュー・本番アセット化する前に、AIエージェントは必ずこのファイルを読む。
過去の会話や記憶だけでプロンプトを書かない。
新しいモンスター案を出す前に、`docs/monster-catalog.md` も読み、既存のITテーマ・動物モチーフ・計画中モンスターと被らないことを確認する。
新しいチャットでも絵柄がぶれないように、`docs/monster-style-guide.md` も読み、`BugBash House Style Lock` を画像生成プロンプトの先頭付近に必ず入れる。
文章だけでは絵柄がぶれやすいため、`docs/monster-visual-references.md` の参照シートも確認し、かわいさ・IT感・暴走の温度感を合わせる。

- コンタクトシートは、このファイルの「全系統共通: 分岐コンタクトシート用プロンプト」を使う。
- コンタクトシートは名前ありの分岐レイアウトにする。3x2等分グリッドや名前なしシートにしない。
- 本番用の単体画像だけ、名前・矢印・UI文字なしで再生成する。
- 進化後もIT感・エンジニアリング感・コーディング感を薄めない。
- `Awakened` と `Awakened Final` は装飾差ではなく、シルエット・構造・役割が明確に違うようにする。
- 進化トポロジーは必ず `Base -> Evo -> Awakened/Berserk` として扱う。`Awakened` と `Berserk` はどちらも `Evo` から派生した姿にする。
- `Evo -> Berserk` は色違い禁止。Evoのbody-plan nounを再利用せず、姿勢・脚数・主構造・コア位置・重心を変える。
- 進化は「同じ種族のまま本体形状が変わる」こと。顔・目・コアモチーフ・主要素材・色系統・種族アンカーは残しつつ、外形・骨格・重心・姿勢・移動方法・主要部位を段階ごとに変える。
- 角、羽、リング、棘、発光、ラベル、装甲、道具を外しても、本体だけで進化後だと分かること。装飾だけ増やした進化は失敗。
- ポケモンのようなモンスター収集RPGにある「幼体から別の戦闘ロール・体型へ育つ」進化感を参考にする。ただし特定キャラ、具体的デザイン、絵柄は模倣しない。
- IT感はラベルだけに頼らず、terminal tail、YAML armor、runner badge、queue capsule、deploy gate、commit node、log cable、API plate、lock、schema、trace、branch、check/fail core などの身体構造に入れる。
- すべてのモンスターは、自然な3/4角度を保ちつつ、どちらかというと左を向くようにする。真横の左向きに寄せすぎない。
- 本番用単体画像は、全形態で同じキャンバス・同じ安全余白・同じ接地位置を保つ。進化による大きさの差は、画像内の余白を変えすぎず、将来の詳細画面や演出側の表示倍率で表現する。

## 基本方針

- メイン画風は「プレミアムなコレクタブルマスコット」。
- エンジニアが見て意味を理解できる概念を、モンスターの体・素材・能力・進化に溶かす。
- 進化するほど、IT感・エンジニア感・コーディング感を強くする。
- 進化の主役はアクセサリではなく、体型・姿勢・移動方法・役割の変化。幼体、走者、飛行型、守護者、砲台型、殻型、低姿勢の捕食者など、段階ごとに読むべき本体シルエットを変える。
- 低レアは最後まで愛着とネタの強さを残し、高レアほど素材感・シルエット・演出を強くする。
- 覚醒は「概念を制御・解決した姿」。
- 暴走は「邪悪でかっこいい闇ルート」。エラー画面や単なるグリッチではなく、魅力的な敵役にする。
- ゲーム本番用は、名前・矢印・UI文字なしの単体画像で再生成する。技術ラベルは必要な場合だけ制御して使う。
- 一覧や管理画面の小さい枠で見やすくするため、単体画像の実寸占有率は形態間で大きく変えない。巨大感・上位感は、シルエット、姿勢、装備量、翼・尾・コア・エフェクトの広がりで出し、表示上の拡大率はアプリ側で扱う。

## 進化構造

基本は以下の6形態。

```text
Base
  ↓
Evo
  ├─ Awakened
  │    ↓
  │  Awakened Final
  │
  └─ Berserk
       ↓
     Berserk Final
```

最初の一覧確認では6形態を1枚に並べる。採用後は1体ずつ単体生成する。

ゲーム内では、バックエンドから返る `formStage` に対応して画像を出し分ける。

```text
Lv 1〜29     NORMAL        => BASE
Lv 30〜100   NORMAL        => EVO
Lv 50〜79    AWAKENED      => AWAKENED
Lv 80〜100   AWAKENED      => AWAKENED_FINAL
Lv 50〜79    BERSERK       => BERSERK
Lv 80〜100   BERSERK       => BERSERK_FINAL
```

進行ライン:

- Lv30で中間形態 `EVO` の見た目になる。
- Lv50で覚醒/暴走が可能になる。
- Lv80で各ルートのFinal見た目になる。
- 最大レベルはLv100。
- DB上は別モンスターにせず、1種族 + `level` + `awakeningState` + `formStage` として扱う。

## 制作フロー

量産は10系統ずつ進める。

```text
1. 10体の初期モンスター候補をコンタクトシートで作る
2. 採用する系統を選ぶ
3. 採用系統だけ6形態を単体生成する
4. 画質・進化感・IT感がOKならゲームに登録する
5. 画像をアセット置き場へアップロードする
6. バックエンドの種族slugと `formStage` から画像URLを返す
```

コンタクトシートからの切り出しは画質が落ちやすいため、本番用は最初から単体画像として生成する。

## アセット登録方針

新規アセットは、フロントエンドのリポジトリに直接増やすのではなく、オブジェクトストレージ/CDNに置く。

```text
monsters/{monster-slug}/{form-stage}.webp
items/{item-id}.webp
equipment/{equipment-id}.webp
```

例:

```text
monsters/token-mimic/base.webp
monsters/token-mimic/berserk-final.webp
items/evolution-stone.webp
```

同じアセット置き場に `asset-manifest.json` を置く。

```json
{
  "assets": [
    "monsters/token-mimic/base.webp",
    "monsters/token-mimic/berserk-final.webp",
    "items/evolution-stone.webp"
  ]
}
```

バックエンドは `BUGBASH_ASSETS_BASE_URL` と `asset-manifest.json` を元に `assetUrl` / `artworkByStage` を返す。
manifestにないパスはURLを返さない。これにより、未アップロード画像の404表示を避ける。
フロントエンドは同じURLを `NEXT_PUBLIC_ASSETS_BASE_URL` に設定して、Next Image の許可ドメインとして扱う。
フロントエンドはAPIから返ったURLを優先して表示し、URLがない場合や画像読み込みに失敗した場合だけ既存のローカル画像や絵文字にフォールバックする。
小さい固定サイズのゲームアイコンは事前最適化済みWebPをそのまま配信し、大きい表示やレスポンシブ表示ではNext Imageの最適化を残す。

この形にしておくと、画像差し替えだけでフロントエンドのコード変更が不要になる。モンスターだけでなく、アイテム・装備にも同じ流れを使う。

## 10系統バッチ運用フロー

次回以降は、以下の順で進める。

```text
1. 10系統ぶんの候補名・テーマ・覚醒役割・暴走役割を決める
2. 1系統ずつ、分岐コンタクトシートを生成する
3. 採用する系統だけ、6形態を1枚ずつ単体生成する
4. 単体画像は、モンスター内の色と被らない単色背景で生成する
5. 背景を透過し、透明PNG/WebPとして書き出す
6. 生成した18枚などの本番画像をユーザーにすべて見せる
7. OKが出た画像だけ `game-assets/source/monsters/{monster-slug}/{form-stage}.png` に置く
8. `npm run assets:build` でWebP化とmanifest生成を確認する
9. PRを作成する。純粋なモンスターアセット追加だけは承認済み画像であればmergeしてよい
10. R2のmanifestと代表画像URLが200で返ることを確認する
```

重要:

- ゲームDBに入れるのは系統の `BASE` 種族だけ。進化後の名前は画像表示用に扱う。
- 表示の切り替えはバックエンドが返す `formStage` で行う。
- バックエンドが `artworkByStage` を返すため、フロントエンドに種族ごとの対応表を増やさない。
- バックエンドはmanifestにある画像だけURLを返す。
- 既存のローカルPNG/SVGは移行までのフォールバックとして残す。
- モンスターアセット追加以外のPRは勝手にmergeしない。バグ修正・ドキュメント・表示ロジック変更はPR作成までで止め、ユーザーの明示確認を待つ。

## 画像完成後の短縮投入ルール

画像生成が終わっていて、やることが既存と同じモンスターアセット追加だけの場合は、時間を優先して短縮フローにする。
このケースでは、テスト・ビルド・デプロイ監視を毎回フルで行わない。画像投入は定型作業なので、下記の最低限だけ確認する。

やること:

```text
1. 最終候補の画像をすべてユーザーに見せる
2. OKが出た画像だけ単体化・透過する
3. `game-assets/source/monsters/{slug}/` に置く
4. 18枚など、期待枚数が存在することを確認する
5. 透過PNGの最低限確認をする
6. `npm run assets:build` を実行し、manifestに新規slugが入ったことだけ確認する
7. frontend PRを作成する
8. 純粋なモンスターアセット追加だけは、画像承認済みであればmergeしてよい
9. `Upload Game Assets to R2` workflowを実行する
10. R2の代表URLだけ確認する
11. 新slugがbackend未登録なら、base speciesだけを追加する
12. backend PRを作成する
13. 純粋なbase species追加だけはmergeしてよい
```

やらないこと:

- 毎回TDDのRED/GREENをしない。
- 既存と同じ画像投入だけなら、新しいテストを増やさない。
- `npm run test` を実行しない。
- `npm run build` を実行しない。
- backendの `./gradlew test` を毎回実行しない。
- GitHub Actionsの完了を毎回待たない。
- Cloud RunやVercelのdeploy完了を毎回待たない。
- backend APIを外部curlで確認しようとしない。
- R2の全URLを確認しない。
- frontendに種族ごとの画像対応表を増やさない。
- manifestを手で編集しない。`npm run assets:build` とworkflowに任せる。
- 画像承認後に長い設計・計画フェーズを挟まない。
- PR本文に長い説明や確認ログを書かない。

最低限の確認:

- 期待するファイル数が揃っている。
- 透過PNGにalphaがある。
- 透過PNGの四隅alphaが0である。
- `npm run assets:build` が成功する。
- manifestに新規アセットが含まれる。
- R2アップロード後、代表1〜3 URLが200で返る。

省かないこと:

- 画像生成前にこのファイルを読む。
- 生成した候補画像をすべてユーザーに見せ、OKをもらう。
- 画像がプロンプト・進化ルール・IT感から明らかにズレている場合の再生成。
- 透過が怪しい場合の目視確認と修正。
- manifestに新規slugが出ない場合の原因調査。
- 純粋なモンスターアセット追加ではない変更のレビュー・検証。
- ユーザーが「マージしないで」と言っているPRのmerge停止。

## 単体SVG化ワークフロー

採用済みコンタクトシートの方向性を維持して、1形態ずつ生成する。

単体生成時に追加する指示:

```text
Create one isolated game asset of the same monster form from the approved contact sheet direction.
Do not redesign the character. Preserve the same species identity, face, posture language, core motif, materials, technical labels, and role from the approved sheet.

Single monster only. No name text, no arrows, no UI, no card frame, no extra characters.
Full body centered with generous padding. Nothing cropped.
The monster should keep the approved natural BugBash 3/4 mascot angle and look slightly toward the left. This is a gentle orientation bias, not a strict side-profile pose. Do not force a hard left-facing silhouette, and avoid strongly right-facing or straight front-facing poses.
Use the same square canvas, same safe padding, same visual baseline, and same overall framing policy as the other forms in this lineage.
Do not make later evolution forms tiny inside the canvas by adding excessive empty space. Do not make early forms oversized by filling the canvas.
Express evolution size and power mostly through silhouette, posture, anatomy, equipment, wings, tails, cores, and presence. The app may apply display scale later for detail pages or battle scenes.
This must read as true monster evolution, not accessory accumulation. Before rendering, imagine removing all horns, rings, armor plates, glow, labels, and carried objects; the remaining naked body silhouette must still differ from the parent form through body architecture, head/torso ratio, limb emphasis, posture, locomotion, tail/wing/back structure, and core placement.
Use broad monster-collecting RPG evolution logic: the creature matures into a new body type and battle role while keeping lineage identity. Do not copy any specific existing franchise character, pose, or art style.
Use a perfectly flat {background_key_color} chroma-key background and no shadow so the background can be removed cleanly.
Choose {background_key_color} so it is as far as possible from every important monster color, glow color, crystal color, label color, and edge highlight.
Do not use magenta or hot pink for monsters with purple/violet glow. Do not use green/cyan for monsters with green, teal, cache, nature, or blue energy. Do not use a key color that appears in the subject.
Keep all monster parts away from the canvas edge.
```

後処理:

```text
1. 背景色は固定しない。生成前に、その系統のキャラ内にほぼ存在しない色を選ぶ
2. 透過PNGを確認する。四隅のalphaが0であること
3. 透明PNG/WebPとして保存する
4. ファイル名は kebab-case にする
5. 必要ならローカル確認用ギャラリーを生成する。本番の `public` には入れない
```

背景色の選び方:

- まず真の透明背景で生成できる場合は、それを優先する。
- 透明背景が使えない場合だけ、単色背景 + 後処理で透過する。
- 背景色は毎回固定しない。コンタクトシートを見て、キャラ本体・発光・半透明素材・ラベル・縁取りに使われていない色を選ぶ。
- Token Mimic のような紫発光系には、マゼンタ・ピンク・青紫を使わない。
- Cache Turtle のような緑・ティール・水色系には、緑・シアン・青緑を使わない。
- Race Condition Twins のような青・紫・白・金系には、青・紫・マゼンタを使わない。
- 背景を抜くときは、キー色が本体・発光・半透明素材・ラベル・縁取りに使われていないことを色分布と目視で確認し、問題なければ画像全体から一括削除する。
- キー色が本体側にも混ざっている可能性がある場合だけ、外周につながっている背景領域だけを透過する。
- 透過したピクセルのRGBも無彩色に正規化し、WebP変換時の色にじみを抑える。
- 内部の発光、エッジ光、半透明クリスタル、コア、ラベル色は必ず残す。
- 生成後に `hasAlpha` を確認する。プロンプトに transparent と書いても、実ファイルが透明とは限らない。

SVGコンテナの前提:

```text
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <image width="1024" height="1024" href="data:image/png;base64,..." />
</svg>
```

本番登録時のチェック:

- 6形態すべてが存在する。
- 背景が透過されている。
- 全形態が自然な3/4角度を保ちつつ、どちらかというと左を向いている。
- 全形態でキャンバス・余白・接地位置が安定しており、小さい一覧枠でどれかだけ極端に小さく見えない。
- `Base` と `Evo` が強すぎず、覚醒・暴走が明確に上位に見える。
- 覚醒と暴走が色違いではなく、役割・姿勢・主要部位で別物になっている。
- 最終形態でもエンジニアリング、IT、コーディングの要素が薄れていない。
- 画像パスが `src/lib/monsterArtwork.ts` の `formStage` マッピングと一致している。
- バックエンドに追加するのは `BASE` 種族名だけ。

## 全系統共通: 分岐コンタクトシート用プロンプト

このテンプレートは、すべてのモンスター系統の6形態コンタクトシート生成に使う。`{...}` を対象モンスターの内容に置き換える。

```text
Create a crop-friendly named branching evolution contact sheet for BugBash Guild, a collectible web RPG for software engineers.

Monster family: {family_name}.
Theme: {engineering_theme}.
BugBash House Style Lock:
Create cute-cool simplified collectible monster art for a mobile web RPG made for software engineers.
The character should feel like a premium designer-toy mascot crossed with polished fantasy game character art: big expressive eyes, rounded readable forms, clean silhouette, soft cel-shaded 2.5D rendering, glossy enamel or translucent resin accents, crisp edge highlights, and strong thumbnail readability.
Keep the monster appealing, collectible, and easy to like. Prefer cute, cool, mischievous, heroic, rival-like, or dark-cute energy. Avoid photorealism, gritty realism, horror, gore, gross slime, body horror, excessive teeth, realistic insect anatomy, creepy parasite shapes, dense tentacles, and heavy machine-only designs.
The monster must stay living-creature first. Software engineering identity must be integrated into anatomy and equipment, not pasted as random symbols: readable badges, cores, shells, fins, wings, tails, horns, rings, plates, charms, lanterns, capsules, scrolls, locks, traces, branches, queue beads, YAML plates, terminal tails, schema marks, check/fail cores, API tags, or log ribbons.
Every monster should keep the natural BugBash 3/4 mascot angle and look slightly toward the left. This is a gentle orientation bias, not a strict side-profile pose. Do not force hard left-facing silhouettes, and avoid strongly right-facing or straight front-facing poses across the sheet.
Use a simple but distinctive palette per family. Do not default every family to teal, purple, or dark blue. Use 2-3 dominant hues and one accent, consistent across the lineage.
Evolution should follow broad monster-collecting RPG evolution logic: a young creature matures into a new body architecture and battle role, not the same body with more accessories. Do not copy any specific existing franchise character or art style; use only the general principle of readable creature evolution.
True evolution must change the naked body silhouette before accessories are considered. If all horns, badges, rings, glow, armor plates, and decorative effects were removed, the evolved form should still have a different body plan, posture, limb emphasis, head/torso ratio, tail/wing/back structure, locomotion, and role silhouette. Accessory-only evolution is a failed result.
Keep the same lineage through recognizable face/eyes, core motif, materials, color family, and 1-2 species anchor traits, but allow the body architecture to mature strongly. Base is small and charming, Evo is a clear waypoint, Awakened is controlled/heroic/solved, Berserk is a stylish failed evolution of the same species. Berserk can be dark-cute or dark-cool, but must not be gross and must not become a random unrelated animal.

Art direction target: cute-cool simplified mobile RPG mascot quality, clearly monster-like, strongly software-engineering themed, clean readable silhouettes. Use big expressive eyes, rounded appealing shapes, soft cel-shaded 2.5D rendering, toy-like charm, and fewer details than realistic concept art. Controlled readable technical labels are allowed and encouraged when they strengthen the engineering theme.

Style and charm rule:
Keep every form appealing as a collectible game monster. Avoid photorealism, hyper-detail, gritty texture, realistic insect/animal anatomy, horror, gore, gross slime, excessive teeth, body horror, tentacle clutter, and heavy metallic/mechanical bodies. Complexity should come from silhouette and theme clarity, not dense surface noise.
Living creature appeal should remain central. Tech motifs should read as wing patterns, shell badges, glowing cores, cursor antennae, YAML plates, queue beads, log scrolls, schema markings, branch horns, or other clean anatomy-integrated details.
Dark-but-cute is allowed and often desirable. Small fangs, mischievous eyes, shadowy colors, edgy markings, and rival energy are fine when the monster remains appealing, cute-cool, and collectible.

Attribute palette rule:
Give this family a distinct color identity based on its engineering theme.
Family palette: {family_palette}.
Use 2-3 dominant hues plus one accent color. Keep the palette consistent across all six forms, but let Awakened and Berserk emphasize different parts of it. Do not default every family to green/teal/purple. When generating several families, deliberately vary the palette by theme: memory can be lime/mint, async can be cyan/amber, containers can be coral/blue, tests can be gold/indigo, dependency graphs can be rose/teal, security can be emerald/black, deploy/build can be green/gold, data can be blue/silver, and feature flags can be yellow/violet.

Use a branching evolution layout, not a 3x2 equal grid.
Layout structure:
- Column 1 center: {base_name}
- Column 2 center: {evo_name}
- Column 3 top: {awakened_name}
- Column 4 top: {awakened_final_name}
- Column 3 bottom: {berserk_name}
- Column 4 bottom: {berserk_final_name}

Base and Evo are pre-branch forms and should be vertically centered between the two route rows. Awakened route is the top row. Berserk route is the bottom row. No arrows if possible; if guides are needed, use very faint thin lines that do not touch monsters or names.

Facing direction rule:
All six forms should keep the same natural 3/4 mascot angle and look slightly toward the left. Preserve the original BugBash pose language; the face and body can remain mostly three-quarter, with only a subtle leftward bias. Do not turn the monsters into strict side-profile silhouettes. Avoid strongly right-facing or straight front-facing poses, and do not alternate strongly different directions between branches.

Mandatory evolution topology:
Base evolves into Evo.
Only Evo branches into two routes:
Evo -> Awakened -> Awakened Final
Evo -> Berserk -> Berserk Final
Awakened and Berserk must both visibly inherit from Evo, not directly from Base. Final forms must visibly inherit from their route parent. Do not make the six forms look like six unrelated alternatives, and do not make Awakened or Berserk appear as replacements for Base/Evo.

Strict size rule:
Use the same camera distance. Do not let Base fill its cell.
- {base_name} body height: 35-40% of its cell height
- {evo_name} body height: 40-45% of its cell height
- {awakened_name} body height: 60-65% of its cell height
- {awakened_final_name} body height: 70-78% of its cell height
- {berserk_name} body height: 60-65%, matching {awakened_name} size and presence
- {berserk_final_name} body height: 70-78%, matching {awakened_final_name} size and presence
Evo must be visibly smaller than both route forms. Awakened and Berserk must be equal size. Both final forms must be equal size and largest.

True evolution rule:
Do not evolve by simply scaling up the same silhouette, repainting it, or adding more decoration. Each evolved form must change the underlying creature body, not just the surface costume.
Accessory-stripping test: if every horn, badge, ring, glow effect, armor plate, weapon, floating prop, and label were removed, the evolved form must still be recognizable as a different evolutionary stage from its parent.
Each evolved form must change at least five of these: body posture, head/torso ratio, limb count or limb emphasis, locomotion, core placement, armor/body shell shape, tail shape, wing/back structure, dominant mass, role silhouette.
Keep family identity through the shared engineering theme, shared core motif, shared materials, recognizable face/eyes, color family, and 1-2 species anchor traits from the base form. Base and Evo should feel like the same species. After Evo, Awakened and Berserk may diverge strongly in body architecture when that better expresses each route role.
Use broad monster-collecting RPG evolution principles: baby mascot -> adolescent role form -> mature specialized battle form. Examples of acceptable body architecture shifts include round hatchling -> long-legged runner -> winged guardian, cub -> upright bruiser -> armored sentinel, larva -> winged caster, small crab -> shell fortress, or tadpole -> four-limbed caster. Do not copy specific existing franchise characters, silhouettes, poses, or art styles.
Each form must have a distinct body-plan noun. Examples: capsule larva -> runner mantis -> gate guardian -> release crown centipede -> cross join prowler -> full scan basilisk. The exact nouns must come from the family theme.
Evo -> Berserk must not reuse Evo's body-plan noun. If Evo is a runner, mantis, bird, turtle, fox, golem, jellyfish, or similar body plan, Berserk must become a different cool failure-shaped body plan such as prowler, basilisk, rogue serpent, shadow runner, overload lancer, fault raptor, rival guardian, sleek crawler, or dark leviathan.
Evo and Berserk must differ in at least five of these: posture, limb count, silhouette, dominant mass, core placement, tail/body plan, armor rhythm, facial structure, or movement logic.
Color-only berserk is forbidden. Berserk must look like the technical concept failed structurally, not like Evo with red, purple, or black paint.

Berserk taste rule:
Berserk means a dark, cool, dangerous alternate evolution, not a disgusting monster. The berserk route should feel like a rival form that players still want to collect: confident, sleek, powerful, sharp, shadowy, or unstable in a stylish way. Avoid making Berserk a gross maw, slime blob, parasite pile, tentacle mass, body-horror failure, or excessive-tooth creature unless the user explicitly asks for that tone.
Dark-cute berserk is allowed: the route may be mischievous, edgy, shadowy, or villain-like while still having big readable eyes, clean shapes, mascot appeal, and toy-like charm.

Berserk silhouette variety rule:
Do not let every Berserk route become the same dark quadruped, prowler, basilisk, eel, serpent, or shadow lizard. Each family needs its own failure silhouette and movement logic.
Berserk silhouette archetype for this family: {berserk_silhouette_archetype}.
When generating several families, choose a different Berserk silhouette archetype for each family before writing prompts. Examples: winged rogue, shell brute, coiled trickster, split twin, floating wisp, thorny sprinter, armored crab, shadow moth, lock-jawed turtle, glitch bird, rogue fox, overclocked beetle, cursed otter, packet-ray, timeout owl. Reuse neither the same body-plan noun nor the same stance across the batch.

Functional role rule:
Awakened and Berserk must not be defined by color. They must be defined by different functional roles.
For this family:
Awakened role: {awakened_role}.
Berserk role: {berserk_role}.
The awakened form's silhouette, posture, protected core, and major body parts must express {awakened_role}.
The berserk form's silhouette, posture, exposed core, and major body parts must express {berserk_role}.
Do not create light/dark recolors of the same body.

Route divergence rule:
After Evo, the Awakened route and Berserk route must diverge into different outcomes of the same technical idea.
Awakened route should express the concept working correctly: controlled, reliable, protected, organized, supportive, or operational.
Berserk route should express the concept failing or being abused in a stylish way: rogue, overloaded, unsafe, corrupted, exploitative, dangerous, or rival-like, while staying visually appealing and not gross.
The Awakened and Berserk forms must differ in at least four of these: posture, body-height distribution, limb/body structure, core protection versus exposure, back or main structure, transformation of the shared motif, facial expression, armor rhythm.
Evo -> Awakened and Evo -> Berserk must both be visually traceable to Evo, but the two routes must transform different aspects of Evo. Awakened should stabilize, organize, armor, route, protect, or orchestrate Evo's motif. Berserk should collapse, jam, corrupt, expose, overload, consume, trap, or loop Evo's motif.
Do not use the same base creature pose for both routes.
Do not make Berserk a dark recolor of Awakened.
Do not make Awakened a clean recolor of Berserk.
It is acceptable for Awakened or Berserk to no longer look like the base animal/species if the IT theme, core motif, and evolution logic remain clear. The result should feel like a different technical outcome, not a random different monster.

Route silhouette lock:
Awakened route silhouette: {awakened_silhouette_lock}.
Berserk route silhouette: {berserk_silhouette_lock}.
These two silhouettes are mutually exclusive. Do not let both routes share the same main outline, main structure, stance, dominant mass, or dominant transformed motif. If the family has a signature motif, each route must transform that motif into a different dominant structure.
When generating multiple families, Berserk route silhouettes must also be mutually distinct from each other. Avoid repeating dark quadruped, long serpent/eel, basilisk, or prowler as the default answer.
Do not hard-code one family's example into the shared template. Fill the two silhouette locks for each family from its own engineering theme and failure mode.

Technical label rule:
Use 1-2 large readable technical labels per form, integrated into major body parts only. Labels should be on cores, armor plates, badges, small tags, rings, shells, tails, or other anatomy. Good labels for this family: {technical_labels}. Avoid dense tiny text, repeated code strings, decorative text noise, or text covering faces/silhouettes.
Coding / IT / software-engineering identity must appear in anatomy, not only labels. Use theme-appropriate body structures such as terminal tails, YAML plates, CI runner badges, queue capsules, deploy gates, commit nodes, build logs, API badges, locks, schemas, traces, branches, checks, fail cores, sockets, shards, config scrolls, or circuit paths.

Evolution forms:
1. {base_name} — smallest form. {base_description}
2. {evo_name} — small waypoint form, not just bigger. {evo_description}
3. {awakened_name} — awakened form, clearly bigger and structurally different. {awakened_description}
4. {awakened_final_name} — awakened final. {awakened_final_description}
5. {berserk_name} — berserk form, same size as {awakened_name} but different body plan. {berserk_description}
6. {berserk_final_name} — berserk final, same size as {awakened_final_name}. {berserk_final_description}

Critical evolution rules:
- Coding / IT / software-engineering identity must become stronger as it evolves.
- The evolution topology is Base -> Evo, then Evo branches into Awakened and Berserk. Do not route Awakened or Berserk directly from Base.
- Evo is only a small waypoint, not the finished form.
- Evo and Berserk must not share the same body-plan noun or the same main posture.
- Evo -> Berserk must be a structural failure transformation, not a color-only corruption.
- Every parent-child step must pass the accessory-stripping test: the body shape still changes after removing horns, rings, badges, glow, labels, extra armor, and props.
- Do not solve evolution by adding more feathers, spikes, fins, shells, halos, cables, badges, or particles to an unchanged torso and stance.
- Berserk should be dark, cool, stylish, and collectible, never gross, slimy, grotesque, or horror-like by default.
- Dark-but-cute Berserk is valid when it remains appealing, readable, and collectible.
- Awakened and Berserk must be visibly larger and stronger than Evo.
- Final forms must be the largest and most dominant silhouettes.
- Final forms may become serpents, basilisks, prowlers, mantises, guardians, runners, leviathans, or other non-base creature body plans if the engineering concept remains clear. Avoid making final forms primarily vehicles, fortresses, gates, towers, buildings, tanks, engines, or machines unless specifically requested.
- Awakened route changes into {awakened_route_summary}.
- Berserk route changes into {berserk_route_summary}.

Art direction:
Cute-cool simplified collectible mascot illustration for a mobile RPG. High-end designer toy feel, polished fantasy game character art, soft cel-shaded 2.5D rendering, glossy enamel accents, translucent resin cores, expressive faces, clean professional rendering, strong thumbnail readability, commercially desirable. Keep forms simpler and more charming than realistic concept art.

Layout and crop rules:
16:9 landscape, warm-white studio background, subtle soft shadow under each monster, generous empty margin around every character. Place each monster name centered below its monster and separated from the silhouette. Add a small family title at the top: {family_title}. Add a small theme subtitle below the title: {theme_subtitle}. No large card frames, no UI clutter, no decorative background, no labels like Base/Evo/Awk.

Avoid: 3x2 equal grid, generic fantasy dragon/demon/angel, simple scale-up evolution, color-only berserk, Evo/Berserk sharing the same body plan, weak-looking evolved forms, later forms smaller than earlier forms, dense terminal text, random pasted symbols, insect complexity, messy effects, photorealism, hyper-detail, gritty texture, gross slime, grotesque mouths, excessive teeth, tentacle clutter, body horror, cheap emoji style, pixel art, horror gore, human characters, text overlapping characters.
```

## 採用済み: Null Pointer Axolotl

| formStage        | 表示名               | 画像                                 |
| ---------------- | -------------------- | ------------------------------------ |
| `BASE`           | Null Pointer Axolotl | `/monsters/null-pointer-axolotl.png` |
| `EVO`            | Dereference Newt     | `/monsters/dereference-newt.png`     |
| `AWAKENED`       | Optional Guardian    | `/monsters/optional-guardian.png`    |
| `AWAKENED_FINAL` | Safe Memory Oracle   | `/monsters/safe-memory-oracle.png`   |
| `BERSERK`        | Void Leech Axolotl   | `/monsters/void-leech-axolotl.png`   |
| `BERSERK_FINAL`  | Null Abyss Devourer  | `/monsters/null-abyss-devourer.png`  |

## 採用済み: Batch 1 Engineering SVG Families

### Token Mimic

| formStage        | 表示名            | 画像                                  |
| ---------------- | ----------------- | ------------------------------------- |
| `BASE`           | Token Mimic       | `/monster-svgs/token-mimic.svg`       |
| `EVO`            | Session Mimic     | `/monster-svgs/session-mimic.svg`     |
| `AWAKENED`       | Vault Agent       | `/monster-svgs/vault-agent.svg`       |
| `AWAKENED_FINAL` | OAuth Gateway     | `/monster-svgs/oauth-gateway.svg`     |
| `BERSERK`        | Token Exfiltrator | `/monster-svgs/token-exfiltrator.svg` |
| `BERSERK_FINAL`  | Shadow IAM Proxy  | `/monster-svgs/shadow-iam-proxy.svg`  |

### Race Condition Twins

| formStage        | 表示名                 | 画像                                       |
| ---------------- | ---------------------- | ------------------------------------------ |
| `BASE`           | Race Condition Twins   | `/monster-svgs/race-condition-twins.svg`   |
| `EVO`            | Thread Sprinters       | `/monster-svgs/thread-sprinters.svg`       |
| `AWAKENED`       | Sync Mediators         | `/monster-svgs/sync-mediators.svg`         |
| `AWAKENED_FINAL` | Deterministic Arbiters | `/monster-svgs/deterministic-arbiters.svg` |
| `BERSERK`        | Deadlock Knot          | `/monster-svgs/deadlock-knot.svg`          |
| `BERSERK_FINAL`  | Starvation Hydra       | `/monster-svgs/starvation-hydra.svg`       |

### Null Pointer Axolotl 分岐コンタクトシート用プロンプト

全系統共通テンプレートに、Null Pointer Axolotl 系統の名前・テーマ・役割・技術ラベルを入れた具体例。

```text
Create a crop-friendly named branching evolution contact sheet for BugBash Guild, a collectible web RPG for software engineers.

Monster family: Null Pointer Axolotl.
Theme: null references, dangling references, safe optional handling, dereferencing, memory safety, and panic when null is misused.
Art direction target: cute-to-cool premium collectible mascot quality, clearly monster-like, strongly software-engineering themed, clean readable silhouettes. Controlled readable technical labels are wanted for this family because labels like null, ref, Some, Option, safe, panic, pointer, and memory help communicate the coding theme.

Use a branching evolution layout, not a 3x2 equal grid.
Layout structure:
- Column 1 center: Null Pointer Axolotl
- Column 2 center: Dereference Newt
- Column 3 top: Optional Guardian
- Column 4 top: Safe Memory Oracle
- Column 3 bottom: Void Leech Axolotl
- Column 4 bottom: Null Abyss Devourer

Base and Evo are pre-branch forms and should be vertically centered between the two route rows. Awakened route is the top row. Berserk route is the bottom row. No arrows if possible; if guides are needed, use very faint thin lines that do not touch monsters or names.

Strict size rule:
Use the same camera distance. Do not let Base fill its cell.
- Null Pointer Axolotl body height: 35-40% of its cell height
- Dereference Newt body height: 40-45% of its cell height
- Optional Guardian body height: 60-65% of its cell height
- Safe Memory Oracle body height: 70-78% of its cell height
- Void Leech Axolotl body height: 60-65%, matching Optional Guardian size and presence
- Null Abyss Devourer body height: 70-78%, matching Safe Memory Oracle size and presence
Evo must be visibly smaller than both route forms. Awakened and Berserk must be equal size. Both final forms must be equal size and largest.

True evolution rule:
Do not evolve by simply scaling up the same silhouette. Each evolved form must change at least three of these: body posture, limb structure, core placement, armor shape, tail shape, back structure, role silhouette. Keep family identity through shared axolotl/newt anatomy, translucent aquatic material, pointer antennae, circuit-gill frills, nullable memory core, bracket armor, memory bead nodes, and cable tails, but change the body plan enough that each form feels like a true evolution.

Functional role rule:
Awakened and Berserk must not be defined by color. They must be defined by different functional roles.
For this family:
Awakened role: safe optional guardian that protects and resolves missing values correctly.
Berserk role: dangling-reference predator that consumes invalid references and spreads panic.
The awakened form's silhouette, posture, protected core, and major body parts must express safe optional handling, memory safety, and controlled fallback behavior.
The berserk form's silhouette, posture, exposed core, and major body parts must express dangling pointers, invalid references, panic, and predatory null consumption.
Do not create light/dark recolors of the same body.

Technical label rule:
Use 1-2 large readable technical labels per form, integrated into major body parts only. Labels should be on cores, armor plates, badges, small tags, or rings. Good labels for this family: null, ref, Some, Option, safe, panic, ptr, memory. Avoid dense tiny text, repeated code strings, decorative text noise, or text covering faces/silhouettes.

Evolution forms:
1. Null Pointer Axolotl — smallest form. Tiny cute translucent axolotl with circuit-gill frills, pointer-cursor antennae, a small chest core labeled null, dangling ref charm, rounded body, curious expression, and tiny memory bead nodes.
2. Dereference Newt — small waypoint form, not just bigger. Slightly longer newt with cable-like pointer tail, clearer circuit gills, small glass stack-frame armor, a chest core labeled ref, and a few bracket-shaped plates. Transitional, not final.
3. Optional Guardian — awakened form, clearly bigger and structurally different. Protective upright guardian posture, nullable capsule armor around the core, shield-like side fins shaped like brackets, safe fallback ring fragments, core or armor label Some or Option, calm controlled expression.
4. Safe Memory Oracle — awakened final. Large elegant oracle-guardian axolotl/newt with halo-like memory ring, protected central core labeled safe or Option, layered translucent armor, organized circuit-gill crown, bracket wings/fins, and stable blue-green memory glow. Heroic, trustworthy, clearly memory-safety themed.
5. Void Leech Axolotl — berserk form, same size as Optional Guardian but different body plan. Low predatory stance, exposed violet-black core labeled null or panic, dangling pointer hooks, broken-reference cable tail, hooked aquatic fins, black chrome shell fragments, and hungry villain expression. Evil, cool, not glitchy, not a recolor.
6. Null Abyss Devourer — berserk final, same size as Safe Memory Oracle. Dominating abyssal axolotl predator with maw-like void core labeled null, heavy hooked fins, corrupted memory bead lures, dangling pointer chains, broken bracket armor, and a powerful low silhouette. Evil, readable, desirable villain art, not generic demon.

Critical evolution rules:
- Coding / IT / memory-safety identity must become stronger as it evolves.
- Evo is only a small waypoint, not the finished form.
- Awakened and Berserk must be visibly larger and stronger than Evo.
- Final forms must be the largest and most dominant silhouettes.
- Awakened route changes into guardian/safe optional architecture.
- Berserk route changes into dangling-reference predator/panic architecture.

Art direction:
Premium collectible mascot illustration, high-end designer toy blended with polished fantasy game character art. Glossy enamel, translucent resin, aquatic glass, metallic gold accents, crystal memory cores, expressive faces, clean professional rendering, strong thumbnail readability, commercially desirable.

Layout and crop rules:
16:9 landscape, warm-white studio background, subtle soft shadow under each monster, generous empty margin around every character. Place each monster name centered below its monster and separated from the silhouette. Add a small family title at the top: Null Pointer Axolotl Line. Add a small theme subtitle below the title: null refs / optional safety / memory safety. No large card frames, no UI clutter, no decorative background, no labels like Base/Evo/Awk.

Avoid: 3x2 equal grid, generic fantasy dragon/demon/angel, simple scale-up evolution, weak-looking evolved forms, later forms smaller than earlier forms, dense terminal text, random pasted symbols, insect complexity, messy effects, cheap emoji style, pixel art, horror gore, human characters, text overlapping characters.
```

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
- `Base` と `Evo` は同じ系統の生物として見せる。分岐後は、同じ生物種であることよりもITテーマ・役割・コアモチーフの連続性を優先し、必要なら別物のシルエットになってよい。
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

## 暴走ルートの品質基準

暴走は「黒い差分」ではなく、そのエンジニアリング概念が破綻・悪用・肥大化した姿にする。表現方法は系統ごとに変える。Token Mimic のように捕食者が合う系統もあるが、すべての暴走を爪・鎖・低い構えに寄せない。

基本ルール:

- `Berserk` は、`Evo` より明確に危険で強そうに見せる。
- `Berserk` は、単なる黒色版・紫色版・赤色版にしない。
- `Berserk` は、その系統の failure mode から身体構造を決める。
- `Berserk` には、その failure mode を表す大きな構造を最低2つ入れる。
- `Berserk Final` は、`Berserk` の役割をさらに強くした最終形にする。
- 暴走の魅力は「怖い」より「邪悪でかっこいい」「引きたい敵役」に寄せる。

failure mode ごとの表現例:

- 盗難・侵入: 捕食姿勢、鍵爪、盗んだトークン、認証チェーン、露出コア
- 迷路化・閉じ込め: 要塞化した外殻、迷路状の甲羅、ループ構造、重い壁のような脚
- 汚染・破損: 割れたコア、壊れた装甲、濁った発光、崩れた結晶
- 肥大化・過負荷: 膨張した体、溢れる液体/滴、重い尾、圧縮されたコア
- 断片化・分裂: 複数の破片、ばらけた身体、ズレたパーツ、同期しない目
- 連鎖崩壊: 壊れたグラフ、絡まったリンク、割れたパッケージ、崩れるリング
- 遮断・支配: 巨大な壁、封鎖ゲート、広い盾、支配的な直立姿勢
- 暴走実行: 赤いパイプライン、壊れたジョブレーン、破損した実行モジュール

系統別の考え方:

- `Token Mimic`: 認証情報を盗む捕食者。爪・鎖・露出コアが合う。
- `Cache Turtle`: 迷路化した要塞。爪よりも巨大な迷路甲羅・ループ構造・閉じ込める外殻が大事。
- `Dependency Cub`: 破壊的変更を撒き散らす存在。爪よりも壊れた依存グラフ・割れたパッケージ・連鎖崩壊が大事。
- `Memory Leak Wisp`: ヒープを喰い潰す存在。爪よりも膨張・吸収・重いメモリ滴・圧迫感が大事。
- `Firewall Crab`: 通信を遮断する暴君。爪は合うが、遮断壁・封鎖ゲート・境界線が主役。

避けるもの:

- 覚醒と同じポーズ・同じ骨格で色だけ違うこと
- ただ赤いエラー表示やグリッチを足すこと
- 小さくまとまったかわいい差分になること
- 1つの暴走表現を全系統に使い回すこと
- ファンタジーの悪魔・ドラゴン・死神に逃げて、IT概念が薄れること

プロンプトには必要に応じて以下を入れる。

```text
Berserk is not a color variant. It must express this family’s engineering failure mode as a dangerous higher-form monster.
Do not reuse one fixed berserk visual formula across all families.
For this family, derive the berserk anatomy from: {failure_mode}.
The berserk form can be predatory, fortress-like, swollen, fragmented, chained, corrupted, labyrinthine, overloaded, or authoritarian depending on the concept.
Use large structural features that express the selected failure mode, not generic claws/chains unless they fit this family.
Berserk Final must amplify that same failure mode into a dominant final form.
Make the berserk route evil and desirable, not merely scary, glitchy, or red.
```

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
- 透過SVG化する場合は、後処理しやすい完全な単色背景にして、影を入れない。
- 背景色は固定しない。キャラ内の色、発光、半透明パーツ、ラベル色と最も衝突しない色を系統ごとに選ぶ。
- 確認用やコンタクトシートでは、暖かい白背景と薄い影を使ってよい。

実装用の透過PNGを作る場合:

- 生成時は単色背景を使い、後処理で背景透過する。
- 透明化しやすいように、背景色をキャラ本体に使わない。
- 背景透過は外周につながっている背景だけを対象にする。色が近いという理由だけで、キャラ内部の発光や装飾を消さない。
- 新規実装ではアセット置き場にアップロードし、バックエンドからURLを返す。
- 既存PNG/SVGアセットは、移行完了まで `/public/monsters/*.png` と `/public/monster-svgs/*.svg` に残る。
- 画像が未採用のモンスターは、既存の絵文字表示にフォールバックする。

採用済みコンタクトシートから単体化する場合:

- 新しい解釈で作り直さない。
- 採用済みシートの体型、顔、姿勢、色、ラベル、装備を固定する。
- 単体生成プロンプトには「同じキャラを単体化する。新しいキャラデにしない」と明記する。
- とくにBase形態は、過剰にメカ化・大型化・高級化しすぎない。
- 採用済みシートから名前も引き継ぐ。

## 採用済み単体アセット

| 表示名        | 系統                   | 用途     | ファイル                      |
| ------------- | ---------------------- | -------- | ----------------------------- |
| Branch Pup    | Git Branch Kitsune     | Base形態 | `/monsters/branch-pup.png`    |
| Latency Polyp | Timeout Jellyfish      | Base形態 | `/monsters/latency-polyp.png` |
| Flag Gecko    | Feature Flag Chameleon | Base形態 | `/monsters/flag-gecko.png`    |

実装上の別名:

- `Branch Pup`: `git-branch-kitsune`, `git_branch_kitsune`, `Git Branch Kitsune`
- `Latency Polyp`: `timeout-jellyfish`, `timeout_jellyfish`, `Timeout Jelly`
- `Flag Gecko`: `feature-flag-chameleon`, `feature_flag_chameleon`, `Feature Flag Chameleon`

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
