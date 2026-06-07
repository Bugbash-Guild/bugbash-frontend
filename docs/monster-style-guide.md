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

Every monster must face left in a clear left-facing 3/4 side view. Do not make any form face right, face front, or alternate directions across a contact sheet or production asset set.

Use a simple but distinctive palette per family. Do not default every family to teal, purple, or dark blue. Use 2-3 dominant hues and one accent, consistent across the lineage.

Evolution should change silhouette and role, not just scale or color. Base is small and charming, Evo is a clear waypoint, Awakened is controlled/heroic/solved, Berserk is a stylish failed evolution of the same species. Berserk can be dark-cute or dark-cool, but must not be gross and must not become a different animal.
```

## 新チャットでの最短手順

1. `docs/monster-art-prompts.md` を読む。
2. `docs/monster-catalog.md` を読み、既存テーマ・動物モチーフと被らない案にする。
3. `docs/monster-visual-references.md` の3枚を見て、絵柄・IT感・暴走の温度感を合わせる。
4. このファイルの `BugBash House Style Lock` を生成プロンプトの先頭付近に入れる。
5. その後に、系統固有のテーマ・名前・進化ルート・技術ラベル・色を入れる。
6. すべての形態が左向きになっているか確認する。右向き・正面向き・向きが混在したものは本番投入しない。
7. 生成結果がこのスタイルから外れたら、本番投入せず再生成する。

## 判定基準

OK:

- かわいい、かっこいい、少しシンプル。
- 小さい一覧表示でも顔・シルエット・ITモチーフが読める。
- ダーク表現でもプレイヤーが欲しくなる。
- 技術要素が体の構造や装備として入っている。
- 進化しても同じ種族の成長に見える。
- 全形態が左向きの3/4サイドビューで統一されている。

NG:

- リアルすぎる。
- キモい、怖すぎる、グロい。
- 無機物や機械だけに見える。
- ただ大きくしただけ、または色を変えただけ。
- ラベルだけITっぽく、体の形は普通の動物。
- Berserkで別の動物や別カテゴリの生物になっている。
- 右向き、正面向き、または同じ系統内で向きが混在している。
