import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

import { findShopTab, SHOP_TABS } from "./shopNav";

const PAGE_URL = new URL("../app/(shell)/(authed)/shop/skins/page.tsx", import.meta.url);
const SHOP_PAGE_URL = new URL("../app/(shell)/(authed)/shop/page.tsx", import.meta.url);

describe("/shop/skins catalog route", () => {
  it("renders the canonical API-backed catalog structure without urgency UI", async () => {
    assert.equal(existsSync(PAGE_URL), true, "the canonical /shop/skins route must exist");

    const page = await readFile(PAGE_URL, "utf8");
    assert.match(page, /useSkinCatalog/);
    assert.match(page, /buildSkinCatalogLines/);
    // Wallet is now shown via the shared ConsoleTopbar (showWallet) header.
    assert.match(page, /ConsoleTopbar[\s\S]*showWallet/);
    assert.match(page, /変身前/);
    assert.match(page, /変身後/);
    assert.match(page, /初出/);
    assert.match(page, /復刻カレンダー/);
    assert.match(page, /LegalFooter/);
    assert.doesNotMatch(page, /カウントダウン|残り時間|あと\d+|在庫/);
  });

  it("exposes the skin catalog from the shared shop tabs", async () => {
    // The tab bar lives in the shared ShopTabs component, rendered by all four
    // shop leaves (the sidebar has a single ~/shop entry). Assert against the
    // nav model rather than the component source, so the link is verified even
    // as the markup changes.
    const shopPage = await readFile(SHOP_PAGE_URL, "utf8");
    assert.match(shopPage, /<ShopTabs current="items" \/>/);

    const skins = findShopTab("skins");
    assert.equal(skins.href, "/shop/skins");
    assert.ok(
      SHOP_TABS.some((tab) => tab.key === "skins"),
      "スキンはショップのタブから辿れなければならない",
    );
  });
});
