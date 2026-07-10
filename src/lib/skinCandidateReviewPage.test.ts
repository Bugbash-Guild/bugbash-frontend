import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { APPENDIX_A_SKIN_STAGES } from "./gameAssetSkinValidation";
import type { SkinCandidateCatalogue } from "./skinCandidateReview";
import {
  renderSkinCandidateReviewPage,
  resolveSkinReviewCandidate,
} from "./skinCandidateReviewPage";

function createCatalogue(): SkinCandidateCatalogue {
  return {
    byStage: Object.fromEntries(
      APPENDIX_A_SKIN_STAGES.map((stage) => [
        stage,
        [
          {
            filePath: `/private/candidates/${stage}/candidate-a.png`,
            id: "candidate-a.png",
            stage,
          },
          {
            filePath: `/private/candidates/${stage}/candidate-b.png`,
            id: "candidate-b.png",
            stage,
          },
        ],
      ]),
    ) as SkinCandidateCatalogue["byStage"],
    candidateDir: "/private/candidates",
  };
}

describe("skin candidate review page", () => {
  it("renders every Appendix A stage without exposing filesystem paths", () => {
    const html = renderSkinCandidateReviewPage({
      catalogue: createCatalogue(),
      monsterSlug: "token-mimic",
      publish: true,
      reviewToken: "review-token",
      skinId: "kernel-panic",
    });

    for (const stage of APPENDIX_A_SKIN_STAGES) {
      assert.match(html, new RegExp(`data-stage="${stage}"`));
      assert.match(html, new RegExp(`/candidate/${stage}/candidate-a\\.png`));
    }
    assert.match(html, /token-mimic/);
    assert.match(html, /kernel-panic/);
    assert.match(html, /R2 公開/);
    assert.equal(html.includes("/private/candidates"), false);
  });

  it("resolves image requests only from the discovered catalogue", () => {
    const catalogue = createCatalogue();

    assert.equal(
      resolveSkinReviewCandidate(catalogue, "base", "candidate-a.png")
        ?.filePath,
      "/private/candidates/base/candidate-a.png",
    );
    assert.equal(
      resolveSkinReviewCandidate(catalogue, "base", "../candidate-a.png"),
      null,
    );
    assert.equal(
      resolveSkinReviewCandidate(catalogue, "unknown", "candidate-a.png"),
      null,
    );
  });
});
