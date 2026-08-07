import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildPrRef, buildPrUrl } from "./prUrl";

describe("buildPrUrl", () => {
  it("builds a GitHub PR URL only for verified owner/repo names", () => {
    assert.equal(
      buildPrUrl("octo-org/bug.bash_repo", 123),
      "https://github.com/octo-org/bug.bash_repo/pull/123",
    );
  });

  it("refuses malformed repository names instead of linking to a wrong page", () => {
    // webhook payload の欠損で "" が届くケースが実在する
    assert.equal(buildPrUrl("", 1), null);
    assert.equal(buildPrUrl("no-slash", 1), null);
    assert.equal(buildPrUrl("a/b/c", 1), null);
    assert.equal(buildPrUrl("owner/repo name", 1), null);
  });

  it("refuses non-finite PR numbers", () => {
    assert.equal(buildPrUrl("owner/repo", Number.NaN), null);
    assert.equal(buildPrUrl("owner/repo", Number.POSITIVE_INFINITY), null);
  });
});

describe("buildPrRef", () => {
  it("returns label and URL when both fields are present and valid", () => {
    assert.deepEqual(buildPrRef("owner/repo", 42), {
      label: "owner/repo#42",
      url: "https://github.com/owner/repo/pull/42",
    });
  });

  it("keeps the textual label even when the URL cannot be verified", () => {
    // 形式検証に落ちてもテキスト表示はできる（リンクだけ諦める）
    assert.deepEqual(buildPrRef("weird repo name", 7), {
      label: "weird repo name#7",
      url: null,
    });
  });

  it("returns null when either field is missing — nothing is guessed", () => {
    assert.equal(buildPrRef(null, 42), null);
    assert.equal(buildPrRef(undefined, 42), null);
    assert.equal(buildPrRef("", 42), null);
    assert.equal(buildPrRef("   ", 42), null);
    assert.equal(buildPrRef("owner/repo", null), null);
    assert.equal(buildPrRef("owner/repo", undefined), null);
    assert.equal(buildPrRef("owner/repo", Number.NaN), null);
  });
});
