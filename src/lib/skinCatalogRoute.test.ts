import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const PAGE_URL = new URL("../app/shop/skins/page.tsx", import.meta.url);
const SHOP_PAGE_URL = new URL("../app/shop/page.tsx", import.meta.url);

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

  it("exposes the skin catalog from the existing shop tabs", async () => {
    const shopPage = await readFile(SHOP_PAGE_URL, "utf8");

    assert.match(shopPage, /href="\/shop\/skins"/);
    assert.match(shopPage, />\s*SKINS\s*</);
  });
});
