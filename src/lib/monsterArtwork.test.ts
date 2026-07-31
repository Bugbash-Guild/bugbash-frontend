import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getMonsterArtwork } from "./monsterArtwork.ts";

describe("monster artwork catalog", () => {
  const formStages = [
    "BASE",
    "EVO",
    "AWAKENED",
    "AWAKENED_FINAL",
    "BERSERK",
    "BERSERK_FINAL",
  ] as const;

  it("resolves the adopted base monsters by display name", () => {
    assert.equal(
      getMonsterArtwork({ name: "Branch Pup" })?.src,
      "/monsters/branch-pup.png",
    );
    assert.equal(
      getMonsterArtwork({ name: "Latency Polyp" })?.src,
      "/monsters/latency-polyp.png",
    );
    assert.equal(
      getMonsterArtwork({ name: "Flag Gecko" })?.src,
      "/monsters/flag-gecko.png",
    );
  });

  it("resolves likely backend aliases for the same monster families", () => {
    assert.equal(
      getMonsterArtwork({ id: "git-branch-kitsune" })?.src,
      "/monsters/branch-pup.png",
    );
    assert.equal(
      getMonsterArtwork({ name: "Timeout Jellyfish" })?.src,
      "/monsters/latency-polyp.png",
    );
    assert.equal(
      getMonsterArtwork({ id: "feature_flag_chameleon" })?.src,
      "/monsters/flag-gecko.png",
    );
  });

  it("selects the Null Pointer family artwork from form stage", () => {
    assert.equal(
      getMonsterArtwork({ name: "Null Pointer Axolotl", formStage: "BASE" })
        ?.src,
      "/monsters/null-pointer-axolotl.png",
    );
    assert.equal(
      getMonsterArtwork({ name: "Null Pointer Axolotl", formStage: "EVO" })
        ?.src,
      "/monsters/dereference-newt.png",
    );
    assert.equal(
      getMonsterArtwork({
        name: "Null Pointer Axolotl",
        formStage: "AWAKENED",
      })?.src,
      "/monsters/optional-guardian.png",
    );
    assert.equal(
      getMonsterArtwork({
        name: "Null Pointer Axolotl",
        formStage: "AWAKENED_FINAL",
      })?.src,
      "/monsters/safe-memory-oracle.png",
    );
    assert.equal(
      getMonsterArtwork({
        name: "Null Pointer Axolotl",
        formStage: "BERSERK",
      })?.src,
      "/monsters/void-leech-axolotl.png",
    );
    assert.equal(
      getMonsterArtwork({
        name: "Null Pointer Axolotl",
        formStage: "BERSERK_FINAL",
      })?.src,
      "/monsters/null-abyss-devourer.png",
    );
  });

  it("can derive Null Pointer artwork from legacy level and awakening state data", () => {
    // formStage が無いときの保険。しきい値は BE の ①普通進化（Lv20）に合わせる。
    assert.equal(
      getMonsterArtwork({
        name: "Null Pointer Axolotl",
        level: 19,
        awakeningState: "NORMAL",
      })?.src,
      "/monsters/null-pointer-axolotl.png",
    );
    assert.equal(
      getMonsterArtwork({
        name: "Null Pointer Axolotl",
        level: 20,
        awakeningState: "NORMAL",
      })?.src,
      "/monsters/dereference-newt.png",
    );
  });

  it("never infers the final form from level alone", () => {
    /*
     * 最終進化は Lv100 到達 + 輝石3個の儀式で決まる。レベルだけで *_FINAL を
     * 出すと、儀式をしていないモンスターに最終形態の絵を見せることになる。
     * Lv100 でも覚醒どまり（optional-guardian）で、最終形態の
     * safe-memory-oracle は formStage が明示されたときだけ出る。
     */
    assert.equal(
      getMonsterArtwork({
        name: "Null Pointer Axolotl",
        level: 100,
        awakeningState: "AWAKENED",
      })?.src,
      "/monsters/optional-guardian.png",
    );
    assert.equal(
      getMonsterArtwork({
        name: "Null Pointer Axolotl",
        formStage: "AWAKENED_FINAL",
      })?.src,
      "/monsters/safe-memory-oracle.png",
    );
  });

  it("selects Token Mimic family artwork from form stage", () => {
    const expectedByStage = {
      BASE: "/monsters/token-mimic.png",
      EVO: "/monsters/session-mimic.png",
      AWAKENED: "/monsters/vault-agent.png",
      AWAKENED_FINAL: "/monsters/oauth-gateway.png",
      BERSERK: "/monsters/token-exfiltrator.png",
      BERSERK_FINAL: "/monsters/shadow-iam-proxy.png",
    };

    for (const formStage of formStages) {
      assert.equal(
        getMonsterArtwork({ name: "Token Mimic", formStage })?.src,
        expectedByStage[formStage],
      );
    }
  });

  it("selects Race Condition Twins family artwork from form stage", () => {
    const expectedByStage = {
      BASE: "/monsters/race-condition-twins.png",
      EVO: "/monsters/thread-sprinters.png",
      AWAKENED: "/monsters/sync-mediators.png",
      AWAKENED_FINAL: "/monsters/deterministic-arbiters.png",
      BERSERK: "/monsters/deadlock-knot.png",
      BERSERK_FINAL: "/monsters/starvation-hydra.png",
    };

    for (const formStage of formStages) {
      assert.equal(
        getMonsterArtwork({ name: "Race Condition Twins", formStage })?.src,
        expectedByStage[formStage],
      );
    }
  });

  it("prefers API-provided monster asset URLs over the local fallback catalog", () => {
    assert.equal(
      getMonsterArtwork({
        name: "Token Mimic",
        formStage: "BASE",
        assetUrl: "https://assets.example.test/monsters/token-mimic/base.webp",
      })?.src,
      "https://assets.example.test/monsters/token-mimic/base.webp",
    );
  });

  it("selects API-provided artwork by form stage before the local fallback catalog", () => {
    assert.equal(
      getMonsterArtwork({
        name: "Token Mimic",
        formStage: "BERSERK_FINAL",
        artworkByStage: {
          BERSERK_FINAL:
            "https://assets.example.test/monsters/token-mimic/berserk-final.webp",
        },
      })?.src,
      "https://assets.example.test/monsters/token-mimic/berserk-final.webp",
    );
  });

  it("selects API-provided stage artwork before the base asset URL", () => {
    assert.equal(
      getMonsterArtwork({
        name: "Branch Pup",
        formStage: "BERSERK_FINAL",
        assetUrl:
          "https://assets.example.test/monsters/git-branch-kitsune/base.webp",
        artworkByStage: {
          BERSERK_FINAL:
            "https://assets.example.test/monsters/git-branch-kitsune/berserk-final.webp",
        },
      })?.src,
      "https://assets.example.test/monsters/git-branch-kitsune/berserk-final.webp",
    );
  });

  it("falls back when a monster has no adopted artwork yet", () => {
    assert.equal(
      getMonsterArtwork({ id: "unknown-slime", name: "Unknown Slime" }),
      null,
    );
  });
});
