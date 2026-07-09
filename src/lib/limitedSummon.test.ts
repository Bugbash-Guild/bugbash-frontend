import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildLimitedPullConfirmation,
  buildLimitedStockPolicyCopy,
  createLimitedSummonExecutor,
  fetchLimitedSummonHistory,
  findAddedLimitedHistoryEntries,
  getFeaturedLimitedItem,
  mapLimitedSummonPullError,
  pullLimitedSummon,
} from "./limitedSummon";
import type {
  SummonDisclosureResponse,
  SummonHistoryEntry,
} from "@/types/summon";

const disclosure: SummonDisclosureResponse = {
  adventurerPassHardPityPull: 43,
  currency: "RUNE",
  description: "API provided limited pool",
  guaranteeType: "FEATURED_SSR",
  hardPityPull: 57,
  items: [],
  name: "シーズン限定召喚",
  poolKey: "LIMITED",
  singlePullCost: 37,
  softPityPull: null,
  stockPolicy: "SEASONAL_RERUN",
  tenPullCost: 333,
  totalWeight: 100,
};

describe("limited summon presentation", () => {
  it("selects the featured SSR from disclosure items instead of a frontend catalog", () => {
    const items: SummonDisclosureResponse["items"] = [
      { itemId: "api-r", probabilityPercent: 80, rarity: "R", weight: 80 },
      {
        assetUrl: "https://assets.example.test/featured.webp",
        itemId: "api-featured",
        probabilityPercent: 20,
        rarity: "SSR",
        weight: 20,
      },
    ];

    assert.deepEqual(
      getFeaturedLimitedItem({ ...disclosure, items }),
      items[1],
    );
  });

  it("builds pull confirmation from disclosure costs and the current wallet", () => {
    assert.deepEqual(buildLimitedPullConfirmation(disclosure, 400, 10), {
      balanceLabel: "400ルーン",
      canAfford: true,
      cost: 333,
      costLabel: "333ルーン",
      pullCount: 10,
    });

    assert.equal(
      buildLimitedPullConfirmation(disclosure, 36, 1)?.canAfford,
      false,
    );
  });

  it("does not invent a ten-pull cost when disclosure omits it", () => {
    assert.equal(
      buildLimitedPullConfirmation(
        { ...disclosure, tenPullCost: null },
        9999,
        10,
      ),
      null,
    );
  });

  it("maps stock policy to factual copy without scarcity pressure", () => {
    const copy = buildLimitedStockPolicyCopy(disclosure.stockPolicy);

    assert.equal(copy, "このバナーはシーズン復刻予定です。");
    assert.equal(copy.includes("二度と"), false);
    assert.equal(copy.includes("今だけ"), false);
  });

  it("maps insufficient runes separately from an unknown result", () => {
    assert.deepEqual(
      mapLimitedSummonPullError(422, "insufficient rune balance"),
      {
        message: "ルーンが足りません。",
        needsHistoryCheck: false,
        showRuneTopUpLink: true,
      },
    );
    assert.deepEqual(mapLimitedSummonPullError(null, "Failed to fetch"), {
      message: "召喚結果を確認しています。",
      needsHistoryCheck: true,
      showRuneTopUpLink: false,
    });
  });
});

describe("limited summon request safety", () => {
  it("shares one in-flight request when the pull action is triggered twice", async () => {
    let release: ((response: Response) => void) | null = null;
    let callCount = 0;
    const fetcher: typeof fetch = async () => {
      callCount += 1;
      return new Promise<Response>((resolve) => {
        release = resolve;
      });
    };
    const execute = createLimitedSummonExecutor(fetcher);

    const first = execute(1);
    const second = execute(1);
    assert.equal(first, second);
    assert.equal(callCount, 1);

    release?.(
      Response.json({ newPullCount: 1, results: [], runesRemaining: 100 }),
    );
    await first;
  });

  it("posts to the selected endpoint exactly once without automatic retry", async () => {
    const calls: string[] = [];
    const failingFetch: typeof fetch = async (input) => {
      calls.push(String(input));
      throw new TypeError("Failed to fetch");
    };

    await assert.rejects(
      () => pullLimitedSummon(failingFetch, 10),
      /Failed to fetch/,
    );
    assert.deepEqual(calls, ["/api/summon/limited/pull10"]);
  });

  it("uses the single-pull endpoint and returns the backend response unchanged", async () => {
    const responseBody = {
      newPullCount: 12,
      results: [
        {
          assetUrl: "https://assets.example.test/items/evolution-stone.webp",
          isNew: false,
          itemId: "evolution-stone",
          rarity: "R" as const,
        },
      ],
      runesRemaining: 91,
    };
    const calls: string[] = [];
    const successfulFetch: typeof fetch = async (input, init) => {
      calls.push(`${String(input)}:${init?.method}`);
      return Response.json(responseBody);
    };

    assert.deepEqual(await pullLimitedSummon(successfulFetch, 1), responseBody);
    assert.deepEqual(calls, ["/api/summon/limited/pull:POST"]);
  });
});

describe("limited summon history reconciliation", () => {
  const historyEntry = (
    itemId: string,
    rarity: SummonHistoryEntry["rarity"],
    pulledAt: string,
  ): SummonHistoryEntry => ({ itemId, rarity, pulledAt });

  it("returns only entries added after the pre-request history snapshot", () => {
    const before = [historyEntry("soul-pack-s", "N", "2026-07-10T00:00:00Z")];
    const after = [
      historyEntry("evolution-stone", "R", "2026-07-10T00:01:00Z"),
      ...before,
    ];

    assert.deepEqual(findAddedLimitedHistoryEntries(before, after, 1), [
      after[0],
    ]);
  });

  it("requires all ten entries before treating an unknown 10-pull as consumed", () => {
    const before: SummonHistoryEntry[] = [];
    const partial = Array.from({ length: 9 }, (_, index) =>
      historyEntry(`item-${index}`, "N", `2026-07-10T00:00:0${index}Z`),
    );

    assert.equal(findAddedLimitedHistoryEntries(before, partial, 10), null);
  });

  it("fetches only limited-pool history for result reconciliation", async () => {
    const calls: string[] = [];
    const fetcher: typeof fetch = async (input) => {
      calls.push(String(input));
      return Response.json({ entries: [] });
    };

    assert.deepEqual(await fetchLimitedSummonHistory(fetcher), []);
    assert.deepEqual(calls, ["/api/summon/history?poolKey=LIMITED&limit=10"]);
  });
});
