import {
  APPENDIX_A_SKIN_STAGES,
  type AppendixASkinStage,
} from "./gameAssetSkinValidation";
import type {
  SkinCandidateCatalogue,
  SkinReviewCandidate,
} from "./skinCandidateReview";

type RenderSkinCandidateReviewPageOptions = {
  catalogue: SkinCandidateCatalogue;
  monsterSlug: string;
  publish: boolean;
  reviewToken: string;
  skinId: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function candidateUrl(stage: AppendixASkinStage, id: string): string {
  return `/candidate/${encodeURIComponent(stage)}/${encodeURIComponent(id)}`;
}

export function resolveSkinReviewCandidate(
  catalogue: SkinCandidateCatalogue,
  stageValue: string,
  candidateId: string,
): SkinReviewCandidate | null {
  const stage = APPENDIX_A_SKIN_STAGES.find(
    (entry): entry is AppendixASkinStage => entry === stageValue,
  );
  if (!stage) return null;

  return (
    catalogue.byStage[stage].find(
      (candidate) => candidate.id === candidateId,
    ) ?? null
  );
}

export function renderSkinCandidateReviewPage({
  catalogue,
  monsterSlug,
  publish,
  reviewToken,
  skinId,
}: RenderSkinCandidateReviewPageOptions): string {
  const stages = APPENDIX_A_SKIN_STAGES.map((stage) => {
    const candidates = catalogue.byStage[stage]
      .map(
        (candidate, index) => `
          <label class="candidate">
            <input
              type="radio"
              name="${stage}"
              value="${escapeHtml(candidate.id)}"
              aria-label="${stage} ${index + 1}"
            >
            <span class="candidate-body">
              <span class="candidate-image">
                <img
                  src="${candidateUrl(stage, candidate.id)}"
                  alt="${stage} candidate ${index + 1}"
                  width="1254"
                  height="1254"
                >
              </span>
              <span class="candidate-footer">
                <span class="candidate-name">${escapeHtml(candidate.id.replace(/\.png$/, ""))}</span>
                <span class="candidate-mark" aria-hidden="true">&#10003;</span>
              </span>
            </span>
          </label>`,
      )
      .join("");

    return `
      <section class="stage" data-stage="${stage}" aria-labelledby="stage-${stage}">
        <div class="stage-heading">
          <h2 id="stage-${stage}">${stage}</h2>
          <span>${catalogue.byStage[stage].length}</span>
        </div>
        <div class="candidate-grid">${candidates}
        </div>
      </section>`;
  }).join("");

  const approveLabel = publish ? "承認して R2 公開" : "承認してビルド";
  const completionLabel = publish ? "R2 公開済み" : "ビルド済み";

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Skin Review - ${escapeHtml(monsterSlug)} / ${escapeHtml(skinId)}</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #111315;
      --surface: #191c1f;
      --surface-raised: #23272b;
      --line: #343a40;
      --muted: #a9b1b8;
      --text: #f4f6f8;
      --accent: #31c6d4;
      --accent-strong: #0b8792;
      --success: #71d49b;
      --warning: #f1bd5b;
      --danger: #ef7a7a;
    }
    * { box-sizing: border-box; letter-spacing: 0; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    button, input { font: inherit; }
    .toolbar {
      position: sticky;
      z-index: 10;
      top: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      min-height: 76px;
      padding: 12px clamp(18px, 4vw, 56px);
      border-bottom: 1px solid var(--line);
      background: rgba(17, 19, 21, 0.96);
      backdrop-filter: blur(12px);
    }
    .identity { min-width: 0; }
    .identity h1 {
      margin: 0 0 4px;
      font-size: 18px;
      line-height: 1.25;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 12px;
      color: var(--muted);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      line-height: 1.4;
      overflow-wrap: anywhere;
    }
    .actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      flex: 0 0 auto;
    }
    #progress {
      min-width: 42px;
      color: var(--warning);
      font-variant-numeric: tabular-nums;
      font-weight: 700;
      text-align: right;
    }
    #approve {
      min-height: 42px;
      padding: 9px 16px;
      border: 1px solid var(--accent);
      border-radius: 6px;
      background: var(--accent-strong);
      color: #fff;
      cursor: pointer;
      font-weight: 750;
    }
    #approve:disabled {
      border-color: var(--line);
      background: var(--surface-raised);
      color: #798188;
      cursor: not-allowed;
    }
    #approve:focus-visible,
    .candidate input:focus-visible + .candidate-body {
      outline: 3px solid var(--warning);
      outline-offset: 2px;
    }
    #status {
      min-height: 28px;
      padding: 7px clamp(18px, 4vw, 56px);
      border-bottom: 1px solid var(--line);
      color: var(--muted);
      font-size: 13px;
    }
    #status[data-state="working"] { color: var(--warning); }
    #status[data-state="success"] { color: var(--success); }
    #status[data-state="error"] { color: var(--danger); }
    .stage {
      padding: 28px clamp(18px, 4vw, 56px) 34px;
      border-bottom: 1px solid var(--line);
    }
    .stage:nth-child(even) { background: var(--surface); }
    .stage-heading {
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin-bottom: 16px;
    }
    .stage-heading h2 {
      margin: 0;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 16px;
      line-height: 1.3;
    }
    .stage-heading span {
      color: var(--muted);
      font-size: 12px;
    }
    .candidate-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(210px, 100%), 1fr));
      gap: 14px;
    }
    .candidate { min-width: 0; cursor: pointer; }
    .candidate input {
      position: absolute;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
    }
    .candidate-body {
      display: block;
      overflow: hidden;
      border: 2px solid transparent;
      border-radius: 6px;
      background: var(--surface-raised);
      transition: border-color 120ms ease, transform 120ms ease;
    }
    .candidate:hover .candidate-body {
      border-color: #69737b;
      transform: translateY(-2px);
    }
    .candidate input:checked + .candidate-body {
      border-color: var(--accent);
    }
    .candidate-image {
      display: block;
      aspect-ratio: 1;
      background: #edf1f4;
    }
    .candidate-image img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .candidate-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      min-height: 42px;
      padding: 8px 10px;
    }
    .candidate-name {
      min-width: 0;
      overflow: hidden;
      color: var(--muted);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 11px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .candidate-mark {
      display: grid;
      flex: 0 0 22px;
      width: 22px;
      height: 22px;
      place-items: center;
      border: 1px solid var(--line);
      border-radius: 50%;
      color: transparent;
      font-size: 13px;
    }
    .candidate input:checked + .candidate-body .candidate-mark {
      border-color: var(--accent);
      background: var(--accent);
      color: #071315;
    }
    @media (max-width: 680px) {
      .toolbar {
        position: static;
        align-items: stretch;
        flex-direction: column;
        gap: 12px;
      }
      .actions { justify-content: space-between; }
      #approve { flex: 1; }
      .candidate-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .candidate-name { font-size: 10px; }
    }
  </style>
</head>
<body>
  <form id="review-form">
    <header class="toolbar">
      <div class="identity">
        <h1>Skin Review</h1>
        <div class="meta">
          <span>${escapeHtml(monsterSlug)}</span>
          <span>${escapeHtml(skinId)}</span>
          <span>${publish ? "R2 公開" : "ローカルビルド"}</span>
        </div>
      </div>
      <div class="actions">
        <span id="progress" aria-live="polite">0 / ${APPENDIX_A_SKIN_STAGES.length}</span>
        <button id="approve" type="submit" disabled>${approveLabel}</button>
      </div>
    </header>
    <div id="status" role="status" aria-live="polite">選択待ち</div>
    <main>${stages}
    </main>
  </form>
  <script>
    (() => {
      const stages = ${JSON.stringify(APPENDIX_A_SKIN_STAGES)};
      const reviewToken = ${JSON.stringify(reviewToken)};
      const completionLabel = ${JSON.stringify(completionLabel)};
      const form = document.querySelector("#review-form");
      const approve = document.querySelector("#approve");
      const progress = document.querySelector("#progress");
      const status = document.querySelector("#status");
      let completed = false;

      const selections = () => Object.fromEntries(
        stages.flatMap((stage) => {
          const selected = form.querySelector(
            'input[name="' + stage + '"]:checked',
          );
          return selected ? [[stage, selected.value]] : [];
        }),
      );

      const update = () => {
        const count = Object.keys(selections()).length;
        progress.textContent = count + " / " + stages.length;
        approve.disabled = completed || count !== stages.length;
      };

      form.addEventListener("change", update);
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (approve.disabled || completed) return;

        approve.disabled = true;
        status.dataset.state = "working";
        status.textContent = "取り込みとビルドを実行中";

        try {
          const response = await fetch("/approve", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-review-token": reviewToken,
            },
            body: JSON.stringify({ selections: selections() }),
          });
          const payload = await response.json();
          if (!response.ok) throw new Error(payload.error || "承認に失敗しました");

          completed = true;
          form.querySelectorAll("input").forEach((input) => {
            input.disabled = true;
          });
          status.dataset.state = "success";
          status.textContent = completionLabel;
          approve.textContent = completionLabel;
        } catch (error) {
          status.dataset.state = "error";
          status.textContent = error instanceof Error ? error.message : String(error);
          update();
        }
      });
    })();
  </script>
</body>
</html>`;
}
