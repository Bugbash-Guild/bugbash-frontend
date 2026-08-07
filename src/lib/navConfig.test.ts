import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isNavActive, NAV_SECTIONS, runeChipTarget } from "./navConfig";

const allHrefs = NAV_SECTIONS.flatMap((section) =>
  section.items.map((item) => item.href),
);

describe("NAV_SECTIONS", () => {
  it("keeps the 6-item cap (5 static + injected profile)", () => {
    // サイドバーは 6 項目上限（§7）。静的 5 + SideBar が注入する
    // ~/@username で 6。ここが増えたら情報設計の再議論が要る。
    assert.equal(allHrefs.length, 5);
    assert.equal(new Set(allHrefs).size, allHrefs.length);
  });

  it("pairs every english command with a japanese sublabel", () => {
    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        // 英語コマンド美学は維持（置換ではなく併記 — §2）
        assert.ok(item.label.startsWith("~/"), `${item.href}: コマンド表記が消えている`);
        assert.ok((item.jaLabel ?? "").length > 0, `${item.href}: jaLabel が無い`);
      }
    }
  });
});

describe("isNavActive section mapping", () => {
  it("lights ~/monsters for /forge (工房は「育てる」文脈)", () => {
    assert.equal(isNavActive("/forge", "/monsters", allHrefs), true);
    assert.equal(isNavActive("/forge", "/shop", allHrefs), false);
  });

  it("keeps /items under ~/monsters and /pass under ~/shop", () => {
    assert.equal(isNavActive("/items", "/monsters", allHrefs), true);
    assert.equal(isNavActive("/pass", "/shop", allHrefs), true);
    assert.equal(isNavActive("/pass", "/monsters", allHrefs), false);
  });

  it("prefers the more specific href", () => {
    assert.equal(isNavActive("/summon/limited", "/summon", allHrefs), true);
    assert.equal(isNavActive("/", "/", allHrefs), true);
    assert.equal(isNavActive("/monsters", "/", allHrefs), false);
  });
});

describe("runeChipTarget", () => {
  it("routes to the limited summon only when disclosure proves it is live", () => {
    const live = runeChipTarget(30);
    assert.equal(live.href, "/summon/limited");
    assert.match(live.title, /開催中/);
  });

  it("falls back to billing whenever liveness cannot be proven", () => {
    // 判定できないのに「開催中」扱いにしない（未取得/失敗/0円プールすべて）
    for (const cost of [null, undefined, 0, -1, Number.NaN]) {
      const target = runeChipTarget(cost);
      assert.equal(target.href, "/mypage/billing", `cost=${String(cost)}`);
      assert.ok(!target.title.includes("開催中"), `cost=${String(cost)}: 開催を捏造している`);
    }
  });
});
