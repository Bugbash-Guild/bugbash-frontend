import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  findShopTab,
  SHOP_TAB_GROUPS,
  SHOP_TABS,
  type ShopTabKey,
} from "./shopNav";

describe("SHOP_TAB_GROUPS", () => {
  it("covers every shop destination exactly once", () => {
    const keys = SHOP_TABS.map((tab) => tab.key).sort();
    const expected: ShopTabKey[] = ["items", "pass", "runes", "skins"];
    assert.deepEqual(keys, expected.sort());
    assert.equal(new Set(SHOP_TABS.map((tab) => tab.href)).size, SHOP_TABS.length);
  });

  it("separates topping up from spending, so a tap does not surprise with a card form", () => {
    const charge = SHOP_TAB_GROUPS.find((group) => group.key === "charge");
    const spend = SHOP_TAB_GROUPS.find((group) => group.key === "spend");

    assert.deepEqual(charge?.tabs.map((tab) => tab.key), ["runes", "pass"]);
    assert.deepEqual(spend?.tabs.map((tab) => tab.key), ["items", "skins"]);
  });

  it("marks exactly the real-money destinations as such", () => {
    // 「押したら現金決済だった」を防ぐのが目的なので、ここは取り違えられない。
    assert.deepEqual(
      SHOP_TABS.filter((tab) => tab.usesRealMoney).map((tab) => tab.key),
      ["runes", "pass"],
    );
    for (const tab of SHOP_TABS) {
      assert.equal(
        tab.usesRealMoney,
        tab.cost.includes("日本円"),
        `${tab.key}: 支払い表記と課金フラグが食い違っている`,
      );
    }
  });

  it("tells the user what each place is for, not just what it stocks", () => {
    for (const tab of SHOP_TABS) {
      assert.ok(tab.label.length > 0, `${tab.key}: ラベルが無い`);
      assert.ok(tab.purpose.length > 0, `${tab.key}: 用途の説明が無い`);
      assert.ok(tab.cost.length > 0, `${tab.key}: 支払うものが書かれていない`);
    }
  });

  it("does not promise power for cosmetics", () => {
    assert.match(findShopTab("skins").purpose, /能力は変わりません/);
  });
});

describe("findShopTab", () => {
  it("resolves each key to its tab", () => {
    assert.equal(findShopTab("runes").href, "/shop/runes");
    assert.equal(findShopTab("items").href, "/shop");
  });
});
