import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("all commemorative plates render the provenance-aware achievement label", async () => {
  const plate = await readFile(
    new URL("../components/commemorative/CommemorativePlate.tsx", import.meta.url),
    "utf8",
  );
  const mintPage = await readFile(
    new URL("../app/mints/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(plate, /engraving\.achievedLabel/);
  assert.doesNotMatch(plate, /ACHIEVED\s*\//);
  assert.match(mintPage, /achievedAtEstimated:\s*offer\.achievedAtEstimated/);
  assert.doesNotMatch(mintPage, /new Date\(0\)/);
});
