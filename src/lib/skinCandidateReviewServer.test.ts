import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { APPENDIX_A_SKIN_STAGES } from "./gameAssetSkinValidation";
import type { SkinCandidateCatalogue } from "./skinCandidateReview";
import { createSkinCandidateReviewServer } from "./skinCandidateReviewServer";

async function createCatalogue(): Promise<SkinCandidateCatalogue> {
  const candidateDir = await mkdtemp(
    path.join(os.tmpdir(), "bugbash-review-server-"),
  );
  const entries = await Promise.all(
    APPENDIX_A_SKIN_STAGES.map(async (stage) => {
      const stageDir = path.join(candidateDir, stage);
      const filePath = path.join(stageDir, "candidate-a.png");
      await mkdir(stageDir, { recursive: true });
      await writeFile(filePath, `image-${stage}`);
      return [stage, [{ filePath, id: "candidate-a.png", stage }]] as const;
    }),
  );

  return {
    byStage: Object.fromEntries(entries) as SkinCandidateCatalogue["byStage"],
    candidateDir,
  };
}

async function withServer(
  server: ReturnType<typeof createSkinCandidateReviewServer>,
  run: (baseUrl: string) => Promise<void>,
) {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address() as AddressInfo;

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function completeSelections() {
  return Object.fromEntries(
    APPENDIX_A_SKIN_STAGES.map((stage) => [stage, "candidate-a.png"]),
  );
}

describe("skin candidate review server", () => {
  it("serves only discovered candidate files", async () => {
    const catalogue = await createCatalogue();
    const server = createSkinCandidateReviewServer({
      catalogue,
      finalize: async () => ({
        assetBasePath: "monsters/token-mimic/skins/kernel-panic",
        copies: [],
        stagedKeys: [],
      }),
      html: "<!doctype html><title>review</title>",
      reviewToken: "secret",
    });

    await withServer(server, async (baseUrl) => {
      const page = await fetch(baseUrl);
      assert.equal(page.status, 200);
      assert.match(await page.text(), /review/);

      const image = await fetch(`${baseUrl}/candidate/base/candidate-a.png`);
      assert.equal(image.status, 200);
      assert.equal(image.headers.get("content-type"), "image/png");
      assert.equal(await image.text(), "image-base");

      const traversal = await fetch(
        `${baseUrl}/candidate/base/${encodeURIComponent("../candidate-a.png")}`,
      );
      assert.equal(traversal.status, 404);
    });
  });

  it("requires the review token and accepts a complete selection only once", async () => {
    const catalogue = await createCatalogue();
    let finalizeCalls = 0;
    const server = createSkinCandidateReviewServer({
      catalogue,
      finalize: async () => {
        finalizeCalls += 1;
        return {
          assetBasePath: "monsters/token-mimic/skins/kernel-panic",
          copies: [],
          stagedKeys: ["monsters/token-mimic/skins/kernel-panic/base.png"],
        };
      },
      html: "review",
      reviewToken: "secret",
    });

    await withServer(server, async (baseUrl) => {
      const unauthorized = await fetch(`${baseUrl}/approve`, {
        body: JSON.stringify({ selections: completeSelections() }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      assert.equal(unauthorized.status, 403);

      const incomplete = await fetch(`${baseUrl}/approve`, {
        body: JSON.stringify({ selections: { base: "candidate-a.png" } }),
        headers: {
          "content-type": "application/json",
          "x-review-token": "secret",
        },
        method: "POST",
      });
      assert.equal(incomplete.status, 400);

      const approved = await fetch(`${baseUrl}/approve`, {
        body: JSON.stringify({ selections: completeSelections() }),
        headers: {
          "content-type": "application/json",
          "x-review-token": "secret",
        },
        method: "POST",
      });
      assert.equal(approved.status, 200);
      assert.deepEqual(await approved.json(), {
        assetBasePath: "monsters/token-mimic/skins/kernel-panic",
        stagedKeys: ["monsters/token-mimic/skins/kernel-panic/base.png"],
        status: "completed",
      });

      const repeated = await fetch(`${baseUrl}/approve`, {
        body: JSON.stringify({ selections: completeSelections() }),
        headers: {
          "content-type": "application/json",
          "x-review-token": "secret",
        },
        method: "POST",
      });
      assert.equal(repeated.status, 409);
      assert.equal(finalizeCalls, 1);
    });
  });

  it("rejects a second approval while the first approval is running", async () => {
    const catalogue = await createCatalogue();
    let releaseFinalize: (() => void) | undefined;
    let markStarted: (() => void) | undefined;
    const finalizeStarted = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    const finalizeReleased = new Promise<void>((resolve) => {
      releaseFinalize = resolve;
    });
    const server = createSkinCandidateReviewServer({
      catalogue,
      finalize: async () => {
        markStarted?.();
        await finalizeReleased;
        return {
          assetBasePath: "monsters/token-mimic/skins/kernel-panic",
          copies: [],
          stagedKeys: [],
        };
      },
      html: "review",
      reviewToken: "secret",
    });
    const approvalRequest = {
      body: JSON.stringify({ selections: completeSelections() }),
      headers: {
        "content-type": "application/json",
        "x-review-token": "secret",
      },
      method: "POST",
    };

    await withServer(server, async (baseUrl) => {
      const firstApproval = fetch(`${baseUrl}/approve`, approvalRequest);
      await finalizeStarted;

      const overlappingApproval = await fetch(
        `${baseUrl}/approve`,
        approvalRequest,
      );
      assert.equal(overlappingApproval.status, 409);

      releaseFinalize?.();
      assert.equal((await firstApproval).status, 200);
    });
  });
});
