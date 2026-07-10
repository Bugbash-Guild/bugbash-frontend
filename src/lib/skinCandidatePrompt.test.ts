import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildSkinCandidatePrompt,
  extractHouseStyleLock,
} from "./skinCandidatePrompt";

describe("skin candidate prompts", () => {
  it("extracts the house style lock from its canonical guide section", () => {
    const guide = `
# Monster Style Guide

## BugBash House Style Lock

\`\`\`text
BugBash Guild house style:
Keep the monster collectible.
\`\`\`

## Next section
`;

    assert.equal(
      extractHouseStyleLock(guide),
      "BugBash Guild house style:\nKeep the monster collectible.",
    );
    assert.throws(
      () => extractHouseStyleLock("# Monster Style Guide"),
      /BugBash House Style Lock is missing/,
    );
  });

  it("builds a production prompt anchored to the complete reference lineage", () => {
    const prompt = buildSkinCandidatePrompt({
      candidateNumber: 2,
      houseStyleLock: "BugBash Guild house style:\nKeep it collectible.",
      monsterSlug: "token-mimic",
      stage: "berserk-final",
      theme: "Kernel Panic",
    });

    assert.ok(prompt.startsWith("BugBash Guild house style:"));
    assert.match(prompt, /Owner-approved skin theme: Kernel Panic/);
    assert.match(prompt, /Target monster lineage: token-mimic/);
    assert.match(prompt, /Target stage: berserk-final/);
    assert.match(prompt, /Candidate variation: 2/);
    assert.match(prompt, /base: parent=none/);
    assert.match(prompt, /awakened: parent=evo/);
    assert.match(prompt, /berserk-final: parent=berserk/);
    assert.match(prompt, /body_plan/);
    assert.match(prompt, /shape_delta_from_parent/);
    assert.match(prompt, /posture\/locomotion/);
    assert.match(prompt, /main_structure/);
    assert.match(prompt, /core_position/);
    assert.match(prompt, /IT_anatomy/);
    assert.match(prompt, /PNG 1254x1254 RGBA/);
    assert.match(prompt, /transparent background/);
    assert.match(prompt, /No name text, arrows, UI, card frame, or watermark/);
  });
});
