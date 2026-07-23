import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const COMPONENT_ROOT = new URL("../components/forge/", import.meta.url);

describe("forge UI safety contract", () => {
  it("keeps the optimistic-lock and idempotent manual-retry note visible beside cosmetic mastery", async () => {
    const panel = await readFile(
      new URL("SkinMasteryPanel.tsx", COMPONENT_ROOT),
      "utf8",
    );

    assert.match(panel, /古い表示のまま上書きしません/);
    assert.match(panel, /同じ操作が二重に反映されない/);
    assert.match(panel, /自動では再実行しません/);
    assert.match(panel, /見た目だけ/);
  });

  it("routes the no-owned-skins CTA to the canonical skin catalog", async () => {
    const targetList = await readFile(
      new URL("SkinTargetList.tsx", COMPONENT_ROOT),
      "utf8",
    );

    assert.match(targetList, /href="\/shop\/skins"/);
  });
});
