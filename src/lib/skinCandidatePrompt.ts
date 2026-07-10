import type { AppendixASkinStage } from "./gameAssetSkinValidation";

type BuildSkinCandidatePromptOptions = {
  candidateNumber: number;
  houseStyleLock: string;
  monsterSlug: string;
  stage: AppendixASkinStage;
  theme: string;
};

const HOUSE_STYLE_HEADING = "## BugBash House Style Lock";

const SILHOUETTE_EVOLUTION_REFERENCES = [
  "base: parent=none",
  "evo: parent=base",
  "awakened: parent=evo",
  "awakened-final: parent=awakened",
  "berserk: parent=evo",
  "berserk-final: parent=berserk",
];

export function extractHouseStyleLock(markdown: string): string {
  const headingIndex = markdown.indexOf(HOUSE_STYLE_HEADING);
  if (headingIndex === -1) {
    throw new Error("BugBash House Style Lock is missing from the style guide");
  }

  const section = markdown.slice(headingIndex + HOUSE_STYLE_HEADING.length);
  const match = /^\s*```text\s*\n([\s\S]*?)\n```/u.exec(section);
  const styleLock = match?.[1].trim();
  if (!styleLock) {
    throw new Error("BugBash House Style Lock is missing from the style guide");
  }
  return styleLock;
}

export function buildSkinCandidatePrompt({
  candidateNumber,
  houseStyleLock,
  monsterSlug,
  stage,
  theme,
}: BuildSkinCandidatePromptOptions): string {
  const silhouetteTable = SILHOUETTE_EVOLUTION_REFERENCES.map(
    (line) =>
      `- ${line}; body_plan=preserve the matching stage reference; ` +
      "shape_delta_from_parent=preserve the structural delta shown by the parent and stage references; " +
      "posture/locomotion=preserve the stage reference; " +
      "main_structure=preserve the stage reference; " +
      "core_position=preserve the stage reference; " +
      "IT_anatomy=preserve the lineage's integrated engineering anatomy",
  ).join("\n");

  return `${houseStyleLock}

Create one production-ready skin candidate for an existing BugBash Guild monster.
Owner-approved skin theme: ${theme}
Target monster lineage: ${monsterSlug}
Target stage: ${stage}
Candidate variation: ${candidateNumber}

The generator request includes the complete six-stage reference lineage. Treat those images as authoritative. Preserve the same living species, face, stage-specific naked body silhouette, body architecture, posture, locomotion, core position, IT anatomy, camera angle, safe padding, and visual baseline. This is a skin variation of the referenced monster, not a new character or a redesigned evolution.

When generatedCandidateImagesByStage contains earlier forms, use those ancestor images as the authoritative reference for this candidate variation's skin materials, pattern language, palette, and theme continuity. Do not borrow generated images from the other evolution branch.

Integrate the approved theme into materials, anatomy, armor, cores, and stage role. Do not express the theme as pasted symbols, labels, or a color-only recolor. Make this candidate visibly distinct from the other candidate variations while keeping the same lineage and stage identity.

Silhouette evolution reference table:
${silhouetteTable}

Output contract:
- One isolated full-body monster on a transparent background.
- PNG 1254x1254 RGBA with real alpha transparency.
- Keep the natural BugBash 3/4 mascot angle and look slightly toward the left.
- Keep all body parts inside the canvas with generous, stage-consistent padding.
- No name text, arrows, UI, card frame, or watermark.
- No contact sheet, extra character, floor, cast shadow, or decorative background.
- The current stage reference is the primary identity and silhouette reference; the other five references preserve lineage consistency.
`;
}
