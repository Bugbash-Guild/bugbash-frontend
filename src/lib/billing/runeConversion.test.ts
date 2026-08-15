import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildLimitedSummonEquivalentText,
  calcLimitedSummonEquivalent,
  findCheapestRuneProductIds,
  isExactPityPack,
  parseRuneProductsResponse,
  uniformUnitPriceJpy,
} from "./runeConversion";
import type { RuneProduct } from "@/types/billing";

function product(overrides: Partial<RuneProduct> & { id: string }): RuneProduct {
  return {
    bonusRune: 0,
    firstPurchaseOnly: false,
    priceJpyTaxIncluded: 1000,
    runeAmount: 300,
    sku: `sku-${overrides.id}`,
    totalRune: 300,
    ...overrides,
  };
}

describe("parseRuneProductsResponse", () => {
  it("accepts the legacy top-level array shape (BE not yet deployed)", () => {
    const products = [product({ id: "p1" })];
    assert.deepEqual(parseRuneProductsResponse(products), {
      limitedHardPityPull: null,
      limitedSingleCostRune: null,
      products,
    });
  });

  it("accepts the new object shape with limitedSingleCostRune", () => {
    const products = [product({ id: "p1" })];
    assert.deepEqual(parseRuneProductsResponse({ limitedSingleCostRune: 30, products }), {
      limitedHardPityPull: null,
      limitedSingleCostRune: 30,
      products,
    });
  });

  it("reads limitedSingleCostRune embedded in array elements (actual BE shape)", () => {
    // BEはトップレベル配列を維持したまま各要素に同梱する（旧FE互換のため）
    const products = [
      { ...product({ id: "p1" }), limitedSingleCostRune: 30 },
      { ...product({ id: "p2" }), limitedSingleCostRune: 30 },
    ];
    const parsed = parseRuneProductsResponse(products);
    assert.equal(parsed.limitedSingleCostRune, 30);
    assert.equal(parsed.products.length, 2);
  });

  it("ignores unusable embedded values and keeps searching the array", () => {
    const products = [
      { ...product({ id: "p1" }), limitedSingleCostRune: 0 },
      { ...product({ id: "p2" }), limitedSingleCostRune: 30 },
    ];
    assert.equal(parseRuneProductsResponse(products).limitedSingleCostRune, 30);
    // 未開催（BEが null を入れる）や未対応BE（フィールド無し）は null のまま
    assert.equal(
      parseRuneProductsResponse([
        { ...product({ id: "p1" }), limitedSingleCostRune: null },
      ]).limitedSingleCostRune,
      null,
    );
  });

  it("normalizes an unusable limitedSingleCostRune to null instead of dividing by it", () => {
    const products = [product({ id: "p1" })];
    for (const bad of [null, undefined, 0, -30, Number.NaN, "30"]) {
      assert.deepEqual(parseRuneProductsResponse({ limitedSingleCostRune: bad, products }), {
        limitedHardPityPull: null,
        limitedSingleCostRune: null,
        products,
      });
    }
  });

  it("collapses out-of-contract responses into an empty payload, not a crash", () => {
    for (const bad of [null, undefined, 42, "oops", { products: "not-an-array" }]) {
      assert.deepEqual(parseRuneProductsResponse(bad), {
        limitedHardPityPull: null,
        limitedSingleCostRune: null,
        products: [],
      });
    }
  });
});

describe("calcLimitedSummonEquivalent", () => {
  it("floors the division — never shows more pulls than the runes can buy", () => {
    assert.equal(calcLimitedSummonEquivalent(1000, 30), 33);
    assert.equal(calcLimitedSummonEquivalent(90, 30), 3);
    assert.equal(calcLimitedSummonEquivalent(59, 30), 1);
  });

  it("returns null when the cost is unknown or invalid", () => {
    assert.equal(calcLimitedSummonEquivalent(1000, null), null);
    assert.equal(calcLimitedSummonEquivalent(1000, undefined), null);
    assert.equal(calcLimitedSummonEquivalent(1000, 0), null);
    assert.equal(calcLimitedSummonEquivalent(1000, -5), null);
    assert.equal(calcLimitedSummonEquivalent(1000, Number.NaN), null);
  });

  it("returns null when the rune amount is non-positive or below one pull", () => {
    assert.equal(calcLimitedSummonEquivalent(0, 30), null);
    assert.equal(calcLimitedSummonEquivalent(-10, 30), null);
    assert.equal(calcLimitedSummonEquivalent(Number.NaN, 30), null);
    // 1回ぶんに満たない（floor で 0）は表示しない
    assert.equal(calcLimitedSummonEquivalent(29, 30), null);
  });
});

describe("buildLimitedSummonEquivalentText", () => {
  it("says 約 only when the remainder was actually dropped", () => {
    assert.equal(buildLimitedSummonEquivalentText(1000, 30), "限定召喚 約33回ぶん");
    // 円固定後のSKUは30の倍数なので正確に言い切れる（約を付けると過小に見せる）
    assert.equal(buildLimitedSummonEquivalentText(90, 30), "限定召喚 3回ぶん");
  });

  it("says nothing when the conversion is not possible", () => {
    assert.equal(buildLimitedSummonEquivalentText(1000, null), null);
    assert.equal(buildLimitedSummonEquivalentText(10, 30), null);
  });
});

describe("findCheapestRuneProductIds", () => {
  it("marks the product with the lowest yen-per-rune", () => {
    const ids = findCheapestRuneProductIds([
      product({ id: "small", priceJpyTaxIncluded: 500, totalRune: 100 }), // 5.0
      product({ id: "large", priceJpyTaxIncluded: 3000, totalRune: 1000 }), // 3.0
    ]);
    assert.deepEqual([...ids], ["large"]);
  });

  it("marks every product tied for the lowest unit price", () => {
    const ids = findCheapestRuneProductIds([
      product({ id: "a", priceJpyTaxIncluded: 1000, totalRune: 500 }), // 2.0
      product({ id: "b", priceJpyTaxIncluded: 2000, totalRune: 1000 }), // 2.0
      product({ id: "c", priceJpyTaxIncluded: 1000, totalRune: 200 }), // 5.0
    ]);
    assert.deepEqual([...ids].sort(), ["a", "b"]);
  });

  it("stays silent without at least two comparable products", () => {
    // 比較相手がいないのに「最安」を名乗らせない
    assert.equal(findCheapestRuneProductIds([]).size, 0);
    assert.equal(findCheapestRuneProductIds([product({ id: "only" })]).size, 0);
    assert.equal(
      findCheapestRuneProductIds([
        product({ id: "valid" }),
        product({ id: "broken", totalRune: 0 }),
      ]).size,
      0,
    );
  });

  it("excludes products whose price or grant is unusable", () => {
    const ids = findCheapestRuneProductIds([
      product({ id: "a", priceJpyTaxIncluded: 1000, totalRune: 100 }), // 10.0
      product({ id: "b", priceJpyTaxIncluded: 3000, totalRune: 1000 }), // 3.0
      product({ id: "zero-rune", priceJpyTaxIncluded: 1, totalRune: 0 }),
      product({ id: "zero-price", priceJpyTaxIncluded: 0, totalRune: 9999 }),
    ]);
    assert.deepEqual([...ids], ["b"]);
  });

  it("stays silent when every product shares the same unit price (fixed-rate catalog)", () => {
    // 円固定後の正常状態。全SKU同一単価なら「最安」という比較は成立しない
    const ids = findCheapestRuneProductIds([
      product({ id: "a", priceJpyTaxIncluded: 270, totalRune: 90 }),
      product({ id: "b", priceJpyTaxIncluded: 900, totalRune: 300 }),
    ]);
    assert.equal(ids.size, 0);
  });
});

describe("uniformUnitPriceJpy", () => {
  it("returns the rate only when every product sells at the same integer unit price", () => {
    assert.equal(
      uniformUnitPriceJpy([
        product({ id: "a", priceJpyTaxIncluded: 270, totalRune: 90 }),
        product({ id: "b", priceJpyTaxIncluded: 5400, totalRune: 1800 }),
      ]),
      3,
    );
  });

  /*
    「1ルーン=¥3」の表示はこの関数の戻り値だけを根拠にする。
    単価が混在・非整数・データ無しのときに null を返さないと、
    事実と食い違う単価宣言が画面に残る。
  */
  it("returns null when rates differ, are fractional, or there is no data", () => {
    assert.equal(
      uniformUnitPriceJpy([
        product({ id: "a", priceJpyTaxIncluded: 270, totalRune: 90 }),
        product({ id: "b", priceJpyTaxIncluded: 240, totalRune: 60 }), // ¥4
      ]),
      null,
    );
    assert.equal(
      uniformUnitPriceJpy([product({ id: "a", priceJpyTaxIncluded: 480, totalRune: 170 })]),
      null, // ¥2.82…
    );
    assert.equal(uniformUnitPriceJpy([]), null);
  });
});

describe("isExactPityPack", () => {
  it("tags only the product whose runes equal cost × hard pity", () => {
    const pityPack = product({ id: "rune_1800", priceJpyTaxIncluded: 5400, totalRune: 1800 });
    const half = product({ id: "rune_900", priceJpyTaxIncluded: 2700, totalRune: 900 });
    assert.equal(isExactPityPack(pityPack, 30, 60), true);
    assert.equal(isExactPityPack(half, 30, 60), false);
  });

  it("never guesses when cost or pity is unknown", () => {
    const pityPack = product({ id: "rune_1800", priceJpyTaxIncluded: 5400, totalRune: 1800 });
    assert.equal(isExactPityPack(pityPack, null, 60), false);
    assert.equal(isExactPityPack(pityPack, 30, null), false);
  });
});
