import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

describe("Vercel deployment ignore policy", () => {
  it("keeps bulky generated and source game assets out of preview functions", async () => {
    const ignoreFile = await readFile(".vercelignore", "utf8");
    const ignoredPaths = ignoreFile
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));

    assert.ok(ignoredPaths.includes("game-assets/source/**"));
    assert.ok(ignoredPaths.includes("dist/game-assets/**"));
  });
});
