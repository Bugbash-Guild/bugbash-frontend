# UI Asset Art Prompts（勇者・アイコン・アイテム）

`docs/art-asset-order-sheet.md` のバッチ1（勇者・アプリアイコン・アイテムアイコン）を
生成するための、貼って使えるプロンプト集。モンスターと同じ流儀:

- スタイルブロックをプロンプト先頭に入れる
- 背景は「キャラ/オブジェクトに存在しない単色」のクロマキー（真の透過が使えるなら透過優先）
- 影なし・床なし・文字なし・正方形・余白均等
- 出力は正方形・1024px以上あればOK（**1254×1254への正規化・背景抜き・配置はこちらでやる**）

## 共通スタイルブロック（各プロンプトの先頭に）

```text
BugBash Guild house style: cute-cool collectible game art for a mobile web RPG made for software engineers.
Premium designer-toy mascot crossed with polished fantasy game character art: rounded readable forms, clean silhouette, soft cel-shaded 2.5D rendering, glossy enamel and translucent resin accents, crisp edge highlights, strong thumbnail readability.
No photorealism, no horror, no gritty grime, no text, no UI, no watermark.
Must read clearly on a very dark background (#0b0f0d).
```

---

## 1. 勇者・立ち絵（`hero-full.png`）

```text
Subject: the guild's hero - a young, gender-neutral software-engineer adventurer.
Dark hooded dev jacket in deep charcoal green with terminal-green (#7ee787) trim and subtle circuit-stitch details, light armor accents of polished resin, and a glowing keyboard-blade: a short sword whose blade is a translucent column of terminal glyphs. A small cursor-shaped familiar floats near one shoulder. Confident, friendly expression.
Pose: full body, standing, natural 3/4 mascot angle, looking slightly toward the left.
Framing: single character fully inside a square canvas with generous even margins on all sides.
Background: perfectly flat solid magenta (#ff00ff), no shadow, no floor; do not use magenta anywhere on the character. If true transparency is available, use a transparent background instead.
```

- 服装・武器は好みで変えてOK。固定したいのは「エンジニアの勇者」「緑アクセント」「3/4・やや左向き」だけ
- `public/hero_toka.png` に既存キャラ案があるなら、それを参照画像として添付して同一人物にするのが最短

## 2. 勇者・顔アップ（`hero-face.png`）

立ち絵の採用版を**参照画像として添付**してから:

```text
Same character as the attached reference image.
Bust-up portrait (head and shoulders), face large and centered so it stays readable at 32x32 pixels. Same 3/4 angle looking slightly left, same colors, same materials.
Square canvas, even margins, no text.
Background: perfectly flat solid magenta (#ff00ff), no shadow; transparent if available.
```

## 3. アプリアイコン（`app-icon.png`）※これだけ背景あり

```text
App icon for a developer RPG called BugBash.
One single bold motif: a cute round bug-monster curled around a glowing terminal prompt symbol (">_"), glossy enamel finish, terminal-green (#7ee787) on deep green-black (#0b0f0d).
Centered with about 12% safe margin, background fills the entire square with a flat or very subtle gradient. No text besides the prompt glyph, no rounded corners (the OS applies them), no border.
Must stay readable at 48x48 pixels.
```

## 4. アイテムアイコン（単品7種）

テンプレート（`{SUBJECT}` と `{KEY}` を差し替え）:

```text
Game item icon: {SUBJECT}.
Single centered object, big simple silhouette that stays readable at 24x24 pixels, slight 3/4 tilt, glossy enamel and translucent resin materials, one strong accent glow.
Square canvas, generous even margins, no text, no character, no scene.
Background: perfectly flat solid {KEY}, no shadow, no floor; do not use {KEY} anywhere on the object. Transparent background preferred if available.
```

| 保存名 | {SUBJECT} | {KEY}の目安 |
|---|---|---|
| `soul-pack-s.png` | a small translucent capsule pouch holding one glowing cyan soul wisp | magenta |
| `soul-pack-m.png` | a medium translucent capsule pouch holding three glowing blue soul wisps | magenta |
| `soul-pack-l.png` | a large ornate capsule pouch overflowing with seven glowing purple soul wisps | green |
| `evolution-stone.png` | a faceted evolution crystal with a teal-green core and branching circuit veins inside | magenta |
| `purification-proof.png` | a bright white-and-gold sigil medal with a clean circle-check emblem | magenta |
| `abyss-proof.png` | a dark violet sigil medal with an inverted star-and-lock emblem, dark-cute not scary | green |
| `commemorative-mint.png` | a commemorative minted medal plate, brushed dark metal with terminal-green enamel inlay and small laurel details | magenta |

## 5. 属性魂パック（ベース6枚 → S/M/Lはこちらで加工）

同じテンプレートで `{SUBJECT}` を差し替え:

| 保存名 | {SUBJECT} | {KEY}の目安 |
|---|---|---|
| `fire-soul-pack.png` | a sealed glass soul vial containing a warm crimson-orange flame wisp | green |
| `water-soul-pack.png` | a sealed glass soul vial containing a calm blue water-droplet wisp | magenta |
| `thunder-soul-pack.png` | a sealed glass soul vial containing a crackling yellow spark wisp | magenta |
| `nature-soul-pack.png` | a sealed glass soul vial containing a leaf-green nature wisp with tiny sprouting leaves | magenta |
| `light-soul-pack.png` | a sealed glass soul vial containing a radiant white-gold light wisp | magenta |
| `dark-soul-pack.png` | a sealed glass soul vial containing a violet-black shadow wisp, dark-cute | green |

- ビン（容器）の形は6本とも同じにして、中身の色・光だけ変えると売り場が揃って見える
- S/M/L 差分（`{attribute}-soul-pack-{s,m,l}` の18ID展開）は入稿後にこちらで加工する

## 6. スキン（第1弾）— 系統が決まったら専用プロンプトを用意

スキンは「素体の各形態PNGを参照画像に添付して、体型・ポーズはそのまま衣装と配色だけ変える」
img2img 方式が必須（6形態の同一性を文章だけで保つのは無理がある）。

**対象の系統（slug）とスキンのコンセプト（例: ネオン・和装・スチームパンク）を決めてくれれば、
6形態ぶんの個別プロンプトをこちらで書き起こす。**

## 入稿方法

- 上の「保存名」でファイルを送ってくれれば（チャット添付でもリポジトリ push でもOK）、
  背景抜き・1254正規化・`game-assets/source/` 配置・R2公開・UI組み込みまで全部こちらでやる
- 生成物がスタイルから外れていると感じたら遠慮なく再生成（既存モンスターの絵と並べて違和感がないか、が判定基準）
