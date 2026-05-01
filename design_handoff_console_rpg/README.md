# Handoff: BugBash Frontend Redesign — Direction A "Console RPG"

## Overview

This is a redesign of the **BugBash** frontend (a gamified GitHub activity tracker — PRs merged → XP → monster catches → leveling up). The new direction reframes the entire app as a **terminal/devtool** aesthetic: developers' native habitat. Hero stats render like `git status` output, the activity feed reads like `git log`, the XP bar is a build-progress bar made of ASCII-style cells, and rarity tags look like terminal output chips.

The visual core: deep green-on-near-black (`#7ee787` on `#0b0f0d`), JetBrains Mono throughout, GitHub-dark-style chrome. The result feels closer to a CLI dashboard or VSCode extension panel than a typical RPG UI — which is the point. The audience is engineers; meet them where they live.

## Screens at a glance

| Login | Home |
|---|---|
| ![Login](screenshots/4-login.png) | ![Home](screenshots/1-home.png) |

| Monster Dex | Inventory |
|---|---|
| ![Monsters](screenshots/2-monsters.png) | ![Items](screenshots/3-items.png) |

For an interactive walk-through, open `preview.html` in a browser.

## About the Design Files

The HTML/JSX in `reference/` are **design references**, not production code to copy verbatim. They were written as a single-file React+Babel prototype to communicate intent — colors, type scales, layout proportions, content density, interaction surfaces.

Your task is to **recreate these designs inside the existing `bugbash-frontend` codebase** (Next.js 15 App Router + Tailwind v4 + TypeScript). Use the project's existing patterns:
- Hook-based data fetching (`useHero`, `useMonsters`, `useItems`, `useAuth`)
- `MainWrapper` + `SideBar` shell layout
- `'use client'` page components calling typed hooks
- Tailwind utility classes (no inline `style={}` objects in production — those are only in the reference for prototyping speed)

Don't import the reference JSX directly — read it, extract the visual decisions, and rebuild with Tailwind classes against the existing component shells.

## Fidelity

**High-fidelity.** Colors, type, spacing, and layout should be reproduced as specified. Component composition (which screens have which sections, in what order) is also fixed. What's flexible: micro-interactions, hover states, loading skeletons — use your judgment, keep the terminal vocabulary (caret blinks, monospace numbers, subtle glow on focus).

## Screens

### 1. Login (`/login`)
A standalone centered terminal-window card. No sidebar.

- **Layout**: viewport-centered, single 480px-wide "terminal window" card with traffic-light chrome (red/yellow/green dots), title "~/bugbash — login", and inner padding `32px 28px 28px`.
- **Top of card body**: 3 lines of dimmed mono prompt text (`$ ./bugbash --auth github` → `> Initializing hero registry…` → `> Awaiting OAuth2 handshake.`), `13px`, color `#7a9c8c`, line-height `1.7`.
- **Title**: "BugBash" at `48px / 700`, gradient fill `linear-gradient(135deg, #7ee787, #79c0ff)` clipped to text.
- **Subtitle copy** (Japanese): two lines explaining "your GitHub activity becomes your hero's adventure" — `14px`, `#7a9c8c`.
- **CTA**: full-width button, white background `#dcefe5`, dark text `#0b0f0d`, `14px / 600`, `4px` radius, GitHub mark icon (left) + "Authorize with GitHub". 14px vertical padding.
- **Footnote**: dimmed mono caption — `hero_id := github_id · permissions: read:user, repo`.
- **Hooks**: `useAuth().login()` on click.

### 2. Home (`/`)
The dashboard. Sidebar + main column.

**Sidebar (240px)** — see "Sidebar" section below for the full spec; appears on every authed screen.

**Main column** — vertical stack with `28px 36px` outer padding:

1. **Command-prompt header** — single line at the top: `<username>@bugbash:~/home$ hero --stats` followed by a blinking block caret. Use color tokens: username = green (`--accent`), `~/home` = blue (`--accent-2`), `:` and `$` = `--text-faint`, command = `--text`.

2. **Hero status block** (`bg-elev` card, `1px line` border, `6px` radius, `24px 28px` padding):
   - Top row, two columns:
     - Left: `HERO.HEAD` micro-label, then the level: `Lv` (green) `.50` (white) at `72px / 700`, line-height 1, JetBrains Mono. Beneath: `hero_id: 169417583 · github: @username` at 13px in dim/blue tones. Beside the level, a green chip `● online`.
     - Right: `TOTAL_XP` micro-label, then `12,873` at `32px / 600` in gold (`#e3b341`).
   - Bottom: progress section. Header line: `building Lv.51 … 272/1028` on the left, `26.5%` (green) on the right. Below that, a 40-cell ASCII-style progress bar — flex row of 40 children, each `flex:1; height:14px; border-radius:1px; gap:2px`. Filled cells use `--accent` with a `0 0 6px --accent` glow; empty cells use `--bg-elev-2`. Bottom caption: `> ETA: 756 XP to next level · ≈ 8 PRs`.

3. **Stat grid** — 4 cards in `repeat(4,1fr) gap:12px`. Each card: `bg-elev`, `1px line` border, `6px` radius, `14px 16px` padding. Inside: micro-label uppercase 11px in `--text-faint`, value at `22px / 600` in a chosen accent color, supporting text 11px in `--text-dim`.
   - PRs merged · `128` (green) · `+2 today`
   - Monsters caught · `<owned>` (purple `#d2a8ff`) · `<dex>/<total> dex`
   - SSR rate · `4.2%` (gold) · `lifetime`
   - Streak · `7d` (blue `#79c0ff`) · `best: 14d`

4. **Bottom split row** — `grid-template-columns: 1fr 1fr; gap: 16px`:
   - **Active party card** — header `ACTIVE_PARTY [4]` micro-label + `edit →` link. Body: 4-column grid of square monster slots, each `aspect-ratio: 1`, `bg-elev-2`, `1px line` border. Inside: large emoji (`36px`), 10px name beneath, rarity chip absolutely positioned top-right (4px inset).
   - **Activity log card** — header `git log --activity` + `● 3 unread` (green). Body is a list of 5 rows, each `padding: 10px 16px`, separated by `1px line` dividers. Each row: 28×28px monster icon thumbnail (left), then a single-line message `+100 XP · caught <name> <rarity-chip> [LV UP if true]` followed by a second-line repo + PR + title in dim/blue, then 10px `--text-faint` timestamp.

### 3. Monster Dex (`/monsters`)
Sidebar + main column.

- **Prompt header**: `<username>@bugbash:~/monsters$ ls --rarity`.
- **Title row**: title "Monster Dex" at `28px / 600`. Subtitle: `discovered <n> / <total> · owned <n> instances`. On the right, filter chip group: `all | SSR | SR | R | N` — each a small `6px 12px` button, 11px mono, active state has green tint and border.
- **For each rarity (SSR → SR → R → N)**: a section header row showing the rarity chip + a `<n>/<total> discovered` caption + a 1px dividing line filling the row. Then an **8-column grid** of monster cells, `gap: 8px`.
- **Monster cell**: `aspect-ratio: 1`, `bg-elev`, `1px line` border, `4px` radius, `10px` padding. Discovered state shows the emoji at 32px + 10px name. Undiscovered: dashed border, `45%` opacity, `?` glyph instead of emoji, `???` instead of name. Top-left absolute: `#<id>` in 9px `--text-faint`. Top-right (when owned > 1): `×N` count in the rarity color. SSR cells get an inset gold glow ring.

### 4. Items (`/items`)
Sidebar + main column.

- **Prompt header**: `inv --list`.
- **Title**: "Inventory" at 28px. Subtitle: `<n> stacks · <total> items total`.
- **Items table** — single card (`bg-elev`, border, 6px radius). Header row (`10px 16px`, 10px micro-labels): `[icon] · NAME · KIND · EFFECT · QTY`. Each item row: `12px 16px`, dividers between rows, columns `40px 1fr 100px 120px 60px`.
  - icon: 20px emoji
  - name: 13px white
  - kind/effect: 11px `--text-dim`
  - qty: right-aligned, `--accent`, 600

## Sidebar (`240px`, persistent)

- Background `--bg-elev`, right border `1px --line`. Mono throughout.
- **Top "window chrome"**: 14px 16px padding, bottom-bordered. Three traffic-light dots (10px each, red `#ff5f56` / yellow `#ffbd2e` / green `#27c93f`) + caption `bugbash · v0.1.0` in 11px `--text-dim`.
- **Section label**: `Navigation` in 10px uppercase `--text-faint`, letter-spacing `0.12em`.
- **Nav items** (5): each row `8px 10px` padding, 4px radius, 13px text, with a leading 14px-wide glyph (`⌂ ◆ ▣ ≡ ⚙`). Active state: text in `--accent`, background `rgba(126,231,135,0.08)`, left border `2px solid --accent`.
  - `~/home` → `/`
  - `~/monsters` → `/monsters`
  - `~/items` → `/items`
  - `~/activity` → `/activity` (new — see "What's new")
  - `~/settings` → `/settings`
- **Hero summary footer** (auto-margined to bottom, 12px padding, `bg-elev-2`, top border): micro-label `HERO_STATUS`. Below: 32×32 gradient avatar tile (`linear-gradient(135deg, --accent, --accent-2)`, white "H" at 14/700) + username (12px) + `Lv.<n>` (10px dim). Then a 4px height mini XP bar with the same gradient, filled to `progressRatio`.

## Sidebar (login screen)

The login screen does NOT show the sidebar. It's a centered standalone terminal-window card.

## Design Tokens

```css
/* Direction A — Console RPG */
--bg:           #0b0f0d;   /* page bg */
--bg-elev:      #101614;   /* cards, sidebar */
--bg-elev-2:    #161e1b;   /* nested cards, sidebar footer */
--line:         #1f2a26;   /* hairlines, borders */
--line-strong:  #2d3d37;   /* divider on hover */

--text:         #dcefe5;   /* primary */
--text-dim:     #7a9c8c;   /* secondary */
--text-faint:   #4a6157;   /* tertiary, captions */

--accent:       #7ee787;   /* primary green — links, active, success */
--accent-dim:   #3da55a;
--accent-2:     #79c0ff;   /* blue — paths, secondary action */
--purple:       #d2a8ff;
--gold:         #e3b341;   /* SSR, XP totals */
--pink:         #ff7b72;
```

### Rarity colors (for chips)
- `N`   — `#7a9c8c` text, `rgba(122,156,140,0.1)` bg, `rgba(122,156,140,0.3)` border
- `R`   — `#79c0ff` text, `rgba(121,192,255,0.1)` bg, `rgba(121,192,255,0.3)` border
- `SR`  — `#d2a8ff` text, `rgba(210,168,255,0.1)` bg, `rgba(210,168,255,0.35)` border
- `SSR` — `#e3b341` text, `rgba(227,179,65,0.12)` bg, `rgba(227,179,65,0.4)` border

### Type scale
All UI uses **JetBrains Mono** (400/500/600/700). No serif, no system sans on UI surfaces.
- Display level number: `72px / 700 / line-height 1`
- Section title: `28px / 600`
- Card title: `14px / 600`
- Body: `13px / 400`
- Caption / micro-label: `10–11px / 600`, uppercase, letter-spacing `0.10em–0.12em`

### Spacing
Round multiples of 4. Card outer padding `24px 28px` (hero block) or `14px 16px` (stat tiles). Page padding `28px 36px`. Grid gaps `8 / 10 / 12 / 16` depending on density.

### Border radius
- Cards / panels: `6px`
- Buttons / chips: `4px`
- Inline tags / pills: `3px`

### Shadows
Mostly avoid. Use subtle inner glows on active/SSR (`box-shadow: inset 0 0 12px rgba(227,179,65,0.25)` for the SSR ring). Login card gets `0 20px 60px rgba(0,0,0,0.5)`.

## Components to add / modify

The existing codebase has:
- `src/components/SideBar.tsx` — needs **a full rewrite** to match the Console RPG sidebar above
- `src/components/UserProfile.tsx` — currently shows a green-bg user card; replace with the sidebar footer block (gradient avatar tile + username + Lv + mini XP bar)
- `src/app/components/HeroCard.tsx` — replace inner with the **Hero status block** spec
- `src/app/components/HeroParty.tsx` — replace with the **Active party card** spec (4 square slots with rarity chip top-right)
- `src/components/MonsterBoxCard.tsx`, `ItemBoxCard.tsx` — these are currently sidebar-link-cards; under this redesign sidebar links are simple anchor rows, so these components likely go away (or get repurposed for the inline grid cells in the dex/items pages — see `MonsterCell` / `ItemRow` below).

New components to create:
- `<PromptHeader path="~/monsters" command="ls --rarity" />` — the green/blue prompt line at the top of each main page.
- `<RarityChip rarity="SSR" />` — uses the rarity color tokens.
- `<StatTile label value sub color />` — for the 4-up dashboard grid.
- `<ProgressBarASCII ratio={0.265} cells={40} />` — flex row of `cells` divs colored by ratio.
- `<ActivityRow activity={...} />` — for the activity log.
- `<MonsterCell monster={...} />` — square cell for the dex grid.
- `<ItemRow item={...} />` — table row for inventory.

## Interactions & Behavior

- **Caret blink** on the prompt header — pure CSS keyframe, 1s steps(2) infinite, only on the home screen.
- **Sidebar nav active state** is driven by `usePathname()` from `next/navigation` (existing pattern).
- **Filter chips on Monster Dex** — clicking a rarity filter narrows the dex to that rarity's section only. Default = "all" shows all four sections stacked.
- **Loading**: while hooks are fetching, render skeleton blocks with `bg-elev-2` background and a subtle `1.5s ease-in-out infinite` opacity pulse — keep it monochrome, don't shimmer.
- **Hover** on nav links and cards: lighten the background by ~4% (use `--bg-elev-2`), don't move or scale.
- **Click** on a monster cell → opens a modal with full monster details (defer to follow-up; placeholder OK in v1).
- **Authorize button** on login: calls `useAuth().login()`. While redirecting, swap the button label to `> connecting…` with the same blink caret.

## State Management

Existing hooks are sufficient — no new state shape required:
- `useAuth()` — login/logout/status
- `useHero()` — returns `{level, totalExperience, currentLevelExperience, experienceForNextLevel, experienceToNextLevel, progressRatio}`
- `useMonsters()` — returns owned monster list
- `useItems()` — returns inventory

What changes is the **derived data** the screens need. Add small selector helpers (or `useMemo`) for:
- `dexEntries`: merge a static species master list with owned counts → `{id, name, emoji, rarity, requiredLevel, owned, discovered}`
- `discoveredCount` / `totalCount` / `ownedTotal`
- Group dex entries by rarity for the dex page

Master species list should live alongside the types — see `reference/mock-data.js` for a working 20-species master matching the Phase 1 spec (`N:3, R:6, SR:7, SSR:4`). Confirm the canonical list with backend before shipping; the mock list is a placeholder.

## What's new vs. the current frontend

- **Activity feed page (`/activity`)** — implied by sidebar nav and surfaced on Home. Backend exposes `GET /api/v1/hero/activities` per `docs/design.md`; the current frontend doesn't display it. Add `useActivities()` hook and an Activity page that's basically the activity log card from the home screen, full-width and paginated.
- **Hero stat grid** — adds top-line stats (PRs merged, SSR rate, streak) that aren't in the current UI. PRs-merged is derivable from activities; SSR rate and streak need backend support — confirm before shipping or hide tiles until available.
- **Filter chips** on the dex.
- **Rarity-grouped dex** — current frontend lists owned monsters in a flat grid; new design shows the **full dex** with placeholders for undiscovered species, grouped by rarity.

## Files in this handoff

```
design_handoff_console_rpg/
├── README.md                  ← this file
├── preview.html               ← open in browser to see Direction A in isolation
├── screenshots/               ← reference screenshots of each screen
└── reference/
    ├── dirA.jsx               ← React reference implementation (inline styles)
    └── mock-data.js           ← mock data + derived selectors matching the API shape
```

Open `preview.html` in a browser to interact with the four screens. Tabs at the top switch between Home / Monsters / Items / Login.

## Suggested implementation order

1. Drop in the design tokens as Tailwind theme extensions (or CSS vars in `globals.css`).
2. Wire up JetBrains Mono in `layout.tsx` (replace Geist).
3. Rewrite `SideBar.tsx` to match the new sidebar spec.
4. Build the small reusable primitives: `PromptHeader`, `RarityChip`, `StatTile`, `ProgressBarASCII`.
5. Rebuild `/` (HeroCard + HeroParty + ActivityFeed inline).
6. Rebuild `/monsters` (rarity-grouped dex with filter chips).
7. Rebuild `/items` (table layout).
8. Rebuild `/login` (centered terminal-window card).
9. Add `/activity` page using the existing `GET /api/v1/hero/activities` endpoint.

## Notes for the implementer

- **Do not introduce a UI library** (shadcn, Radix, MUI) just to ship this. Hand-rolled divs + Tailwind utilities are appropriate — the design vocabulary is small (cards, chips, rows, progress bars) and the visual specificity is high.
- **Avoid emoji-only icons in nav and chrome.** The reference uses unicode glyphs (`⌂ ◆ ▣ ≡ ⚙ ●`) intentionally — they fit the terminal aesthetic better than colorful emoji. Monster emojis stay (they're content, not chrome).
- **Don't add gradients beyond what's specified** (the Lv title gradient on login, the avatar tile, the XP mini-bar). Console RPG is restrained — flat green-on-black is the brand.
- **Numbers should be tabular** — apply `font-variant-numeric: tabular-nums` everywhere a number renders (XP totals, levels, percentages, counts) to keep them rock-steady.
