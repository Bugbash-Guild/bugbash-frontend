import assert from "node:assert/strict";
import test from "node:test";

import {
  createMintIdempotencyKeyManager,
  formatPlateEngraving,
  getMintDisplayState,
  getMintPricePresentation,
  isAllowedRecolor,
  matchMintToOwnedMonster,
} from "./commemorativeMint";

const unlockedOffer = {
  achievement: "PR_MERGED_100",
  unlocked: true,
  achievedAt: "2026-07-23T00:00:00Z",
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
      repositoryFullName: null,
      mintNumber: 7,
    }),
    {
      achievement: "100 PR マージ",
      achievedDate: "2026.07.23",
      mintNumber: "#000007",
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
