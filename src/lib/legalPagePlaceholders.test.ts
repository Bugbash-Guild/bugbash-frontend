import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { legalFooterLinks, legalPages } from "./legalPages";

describe("legal page placeholders", () => {
  it("defines the required billing legal pages without final legal copy", () => {
    assert.deepEqual(
      legalPages.map((page) => page.href),
      ["/legal/tokushoho", "/legal/prepaid", "/legal/terms"],
    );

    for (const page of legalPages) {
      assert.equal(page.reviewStatus, "弁護士レビュー中");
      assert.ok(page.sections.length > 0);
      assert.ok(
        page.sections.every((section) =>
          section.rows.every((row) => row.value === "弁護士レビュー後に掲載予定"),
        ),
      );
    }
  });

  it("keeps draft legal document placeholders out of public page data", () => {
    const serialized = JSON.stringify(legalPages);

    assert.equal(serialized.includes("【要記入"), false);
    assert.equal(serialized.includes("【要法務"), false);
    assert.equal(serialized.includes("株式会社bocek"), false);
    assert.equal(serialized.includes("KOMOJU"), false);
  });

  it("exposes footer links to the required legal pages", () => {
    assert.deepEqual(legalFooterLinks, [
      { href: "/legal/tokushoho", label: "特定商取引法に基づく表示" },
      { href: "/legal/prepaid", label: "資金決済法に基づく表示" },
      { href: "/legal/terms", label: "利用規約" },
    ]);
  });
});
