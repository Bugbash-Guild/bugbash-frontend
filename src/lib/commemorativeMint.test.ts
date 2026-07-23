import assert from "node:assert/strict";
import test from "node:test";

import {
  createMintIdempotencyKeyManager,
  formatPlateEngraving,
  getMintDisplayState,
  getMintPricePresentation,
  isAllowedRecolor,
  mapMintPurchaseFailure,
  matchMintToOwnedMonster,
} from "./commemorativeMint";

const unlockedOffer = {
  achievement: "PR_MERGED_100",
  unlocked: true,
  achievedAt: "2026-07-23T00:00:00Z",
  achievedAtEstimated: false,
  repositoryFullName: "bugbash-guild/bugbash-backend",
  subjectOwnedMonsterId: 42,
  runeCost: 247,
  allowedRecolors: ["AZURE", "CRIMSON"],
  mint: null,
} as const;

test("derives locked, unlocked, and minted states solely from the offer", () => {
  assert.equal(getMintDisplayState({ ...unlockedOffer, unlocked: false }), "locked");
  assert.equal(getMintDisplayState(unlockedOffer), "unlocked");
  assert.equal(
    getMintDisplayState({
      ...unlockedOffer,
      mint: {
        ...unlockedOffer,
        mintNumber: 8,
        recolor: "AZURE",
        mintedAt: "2026-07-23T01:00:00Z",
      },
    }),
    "minted",
  );
});

test("accepts only recolors provided by the API", () => {
  assert.equal(isAllowedRecolor("AZURE", unlockedOffer.allowedRecolors), true);
  assert.equal(isAllowedRecolor("GOLD", unlockedOffer.allowedRecolors), false);
});

test("uses API rune cost for price and affordability", () => {
  assert.deepEqual(getMintPricePresentation(unlockedOffer, 246), {
    runeCost: 247,
    affordable: false,
    text: "247 ルーン",
  });
  assert.equal(getMintPricePresentation(unlockedOffer, 247).affordable, true);
});

test("reuses a mint idempotency key until success or selection changes", () => {
  const values = new Map<string, string>();
  let counter = 0;
  const manager = createMintIdempotencyKeyManager(
    {
      getItem: (key) => values.get(key) ?? null,
      removeItem: (key) => values.delete(key),
      setItem: (key, value) => values.set(key, value),
    },
    () => `mint-key-${++counter}`,
  );

  const first = manager.get("PR_MERGED_100", "AZURE");
  assert.equal(manager.get("PR_MERGED_100", "AZURE"), first);
  assert.equal(manager.get("PR_MERGED_100", "CRIMSON"), "mint-key-2");
  manager.clear("PR_MERGED_100", "CRIMSON");
  assert.equal(manager.get("PR_MERGED_100", "CRIMSON"), "mint-key-3");
});

test("formats deterministic engravings and tolerates a null repository", () => {
  assert.deepEqual(
    formatPlateEngraving({
      achievement: "PR_MERGED_100",
      achievedAt: "2026-07-23T01:02:03Z",
      achievedAtEstimated: false,
      repositoryFullName: null,
      mintNumber: 7,
    }),
    {
      achievement: "100 PR マージ",
      achievedDate: "2026.07.23",
      achievedLabel: "達成日",
      mintNumber: "#000007",
      repository: "REPOSITORY / —",
    },
  );
});

test("labels legacy fallback dates as estimated instead of exact achievements", () => {
  assert.deepEqual(
    formatPlateEngraving({
      achievement: "MONSTER_LEVEL_100",
      achievedAt: "2025-04-05T00:00:00Z",
      achievedAtEstimated: true,
      repositoryFullName: null,
      mintNumber: 12,
    }),
    {
      achievement: "モンスター Lv.100",
      achievedDate: "2025.04.05",
      achievedLabel: "達成時期（推定）",
      mintNumber: "#000012",
      repository: "REPOSITORY / —",
    },
  );
});

test("matches plates to the owned instance id, not the monster catalog id", () => {
  const plate = {
    ...unlockedOffer,
    mintNumber: 9,
    recolor: "AZURE",
    mintedAt: "2026-07-23T01:00:00Z",
  };
  assert.equal(matchMintToOwnedMonster([plate], "42"), plate);
  assert.equal(matchMintToOwnedMonster([plate], "monster-slug"), undefined);
});

test("maps deterministic mint rejections to reconciliation without automatic retry", () => {
  assert.deepEqual(mapMintPurchaseFailure(400), {
    clearIdempotencyKey: false,
    message: "鋳造内容が最新の状態と一致しません。内容を確認してからもう一度操作してください。",
    refreshOffers: true,
    refreshWallet: false,
    routeToLogin: false,
    retrySameContent: false,
  });
  assert.deepEqual(mapMintPurchaseFailure(409), {
    clearIdempotencyKey: true,
    message: "鋳造内容を確認する必要があります。最新の状態を確認して、内容を選び直してください。",
    refreshOffers: true,
    refreshWallet: true,
    routeToLogin: false,
    retrySameContent: false,
  });
  assert.deepEqual(mapMintPurchaseFailure(422), {
    clearIdempotencyKey: false,
    message: "現在このプレートは鋳造できません。残高と鋳造権を確認してください。",
    refreshOffers: true,
    refreshWallet: true,
    routeToLogin: false,
    retrySameContent: false,
  });
  assert.deepEqual(mapMintPurchaseFailure(401), {
    clearIdempotencyKey: false,
    message: "",
    refreshOffers: false,
    refreshWallet: false,
    routeToLogin: true,
    retrySameContent: false,
  });
});

test("preserves the idempotency key for uncertain mint outcomes", () => {
  assert.deepEqual(mapMintPurchaseFailure(500), {
    clearIdempotencyKey: false,
    message: "通信結果を確認できません。同じ内容で再試行できます。",
    refreshOffers: false,
    refreshWallet: false,
    routeToLogin: false,
    retrySameContent: true,
  });
});
