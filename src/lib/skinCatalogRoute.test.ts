import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const PAGE_URL = new URL("../app/(shell)/(authed)/shop/skins/page.tsx", import.meta.url);
const MONSTERS_PAGE_URL = new URL("../app/(shell)/(authed)/monsters/page.tsx", import.meta.url);
const FORGE_TARGET_URL = new URL("../components/forge/SkinTargetList.tsx", import.meta.url);

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

  it("stays reachable after the shop tabs were removed", async () => {
    /*
     * ショップの1枚化でスキンのタブは消えた（在庫0のタブを見せない）。
     * その代わり、スキンを実際に使う場所 — 図鑑とフォージ — からの導線が
     * カタログへの入口になる。ここが切れるとカタログは孤島になる。
     */
    const monstersPage = await readFile(MONSTERS_PAGE_URL, "utf8");
    assert.match(monstersPage, /\/shop\/skins/);

    const forgeTargets = await readFile(FORGE_TARGET_URL, "utf8");
    assert.match(forgeTargets, /\/shop\/skins/);
  });
});
