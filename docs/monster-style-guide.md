# Monster Style Guide

BugBash Guild のモンスター画像を新しいチャットで生成しても、絵柄・温度感・IT感がぶれないようにするための短いスタイル固定ガイド。

AIエージェントは、モンスター画像を生成する前に必ずこのファイルを読み、下の `BugBash House Style Lock` を画像生成プロンプトの先頭付近に入れる。
長い会話履歴や過去の記憶に頼らない。
文章だけでは絵柄がぶれやすいため、`docs/monster-visual-references.md` の参照シートも見る。

## BugBash House Style Lock

```text
BugBash Guild house style:
Create cute-cool simplified collectible monster art for a mobile web RPG made for software engineers.
The character should feel like a premium designer-toy mascot crossed with polished fantasy game character art: big expressive eyes, rounded readable forms, clean silhouette, soft cel-shaded 2.5D rendering, glossy enamel or translucent resin accents, crisp edge highlights, and strong thumbnail readability.

Keep the monster appealing, collectible, and easy to like. Prefer cute, cool, mischievous, heroic, rival-like, or dark-cute energy. Avoid photorealism, gritty realism, horror, gore, gross slime, body horror, excessive teeth, realistic insect anatomy, creepy parasite shapes, dense tentacles, and heavy machine-only designs.

The monster must stay living-creature first. Software engineering identity must be integrated into anatomy and equipment, not pasted as random symbols: readable badges, cores, shells, fins, wings, tails, horns, rings, plates, charms, lanterns, capsules, scrolls, locks, traces, branches, queue beads, YAML plates, terminal tails, schema marks, check/fail cores, API tags, or log ribbons.

Every monster should keep the natural BugBash 3/4 mascot angle and look slightly toward the left. This is a gentle orientation bias, not a strict side-profile pose. Do not force hard left-facing silhouettes, and avoid strongly right-facing or straight front-facing poses when generating a lineage.

Use a simple but distinctive palette per family. Do not default every family to teal, purple, or dark blue. Use 2-3 dominant hues and one accent, consistent across the lineage.

Evolution should feel like broad monster-collecting RPG evolution logic: a young creature grows into a new battle role and body architecture, not the same body with more accessories. Do not copy any specific existing franchise character or art style; use only the general principle of readable creature evolution. Base is small and charming, Evo is a clear waypoint, Awakened is controlled/heroic/solved, Berserk is a stylish failed evolution of the same species.

True evolution must change the monster's naked body silhouette before accessories are considered. If all horns, badges, rings, glow, armor plates, and decorative effects were removed, the evolved form should still have a different body plan, posture, limb emphasis, head/torso ratio, tail/wing/back structure, locomotion, and role silhouette. Accessory-only evolution is a failed result.

Keep the same lineage through recognizable face/eyes, core motif, materials, color family, and 1-2 species anchor traits, but allow the body architecture to mature strongly: chick -> long-legged runner -> fan-wing guardian, cub -> upright bruiser -> armored sentinel, larva -> winged caster, crab -> shell fortress, etc. Berserk can be dark-cute or dark-cool, but must not be gross and must not become a random unrelated animal.
```

## 新チャットでの最短手順

1. `docs/monster-art-prompts.md` を読む。
2. `docs/monster-catalog.md` を読み、既存テーマ・動物モチーフと被らない案にする。
3. `docs/monster-visual-references.md` の3枚を見て、絵柄・IT感・暴走の温度感を合わせる。
4. このファイルの `BugBash House Style Lock` を生成プロンプトの先頭付近に入れる。
5. その後に、系統固有のテーマ・名前・進化ルート・技術ラベル・色を入れる。
6. すべての形態が自然な3/4角度を保ちつつ、どちらかというと左を向いているか確認する。真横の左向きに寄せすぎない。
7. 生成結果がこのスタイルから外れたら、本番投入せず再生成する。

## 判定基準

OK:

- かわいい、かっこいい、少しシンプル。
- 小さい一覧表示でも顔・シルエット・ITモチーフが読める。
- ダーク表現でもプレイヤーが欲しくなる。
- 技術要素が体の構造や装備として入っている。
- 進化しても同じ種族の成長に見える。
- 装飾を外して黒塗りにしても、体型・姿勢・移動方法・主構造が親形態と違う。
- ポケモンのようなモンスター収集RPGの「幼体から別の戦闘ロールへ育つ」進化感がある。ただし特定キャラや絵柄は模倣しない。
- 全形態が自然な3/4角度を保ちつつ、どちらかというと左を向いている。

NG:

- リアルすぎる。
- キモい、怖すぎる、グロい。
- 無機物や機械だけに見える。
- ただ大きくしただけ、または色を変えただけ。
- 同じ胴体・同じ立ち姿・同じ手足に、角・羽・リング・棘・エフェクト・ラベルだけを足している。
- ラベルだけITっぽく、体の形は普通の動物。
- Berserkで別の動物や別カテゴリの生物になっている。
- 真横の左向きに寄りすぎている、右向きが強い、正面向きが強い、または同じ系統内で向きが大きく混在している。
