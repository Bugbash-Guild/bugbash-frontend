import { readFile } from "node:fs/promises";
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";

import type { SkinAssetIntakeResult } from "./skinAssetIntake";
import {
  planSkinSelection,
  type SkinCandidateCatalogue,
  type SkinStageSelections,
} from "./skinCandidateReview";
import { resolveSkinReviewCandidate } from "./skinCandidateReviewPage";

type CreateSkinCandidateReviewServerOptions = {
  catalogue: SkinCandidateCatalogue;
  finalize: (selections: SkinStageSelections) => Promise<SkinAssetIntakeResult>;
  html: string;
  reviewToken: string;
};

type ApprovalState = "idle" | "running" | "completed";

const MAX_APPROVAL_BODY_BYTES = 64 * 1024;

class RequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function sendJson(
  response: ServerResponse,
  status: number,
  body: Record<string, unknown>,
) {
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
  });
  response.end(`${JSON.stringify(body)}\n`);
}

function sendHtml(response: ServerResponse, html: string) {
  response.writeHead(200, {
    "cache-control": "no-store",
    "content-security-policy": [
      "default-src 'none'",
      "img-src 'self'",
      "style-src 'unsafe-inline'",
      "script-src 'unsafe-inline'",
      "connect-src 'self'",
      "form-action 'self'",
      "base-uri 'none'",
      "frame-ancestors 'none'",
    ].join("; "),
    "content-type": "text/html; charset=utf-8",
    "x-content-type-options": "nosniff",
  });
  response.end(html);
}

function decodeCandidatePath(pathname: string): [string, string] | null {
  const match = /^\/candidate\/([^/]+)\/([^/]+)$/.exec(pathname);
  if (!match) return null;

  try {
    return [decodeURIComponent(match[1]), decodeURIComponent(match[2])];
  } catch {
    return null;
  }
}

async function readApprovalSelections(
  request: IncomingMessage,
): Promise<SkinStageSelections> {
  if (!request.headers["content-type"]?.startsWith("application/json")) {
    throw new RequestError(415, "Approval requires application/json");
  }

  const chunks: Buffer[] = [];
  let byteLength = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    byteLength += buffer.byteLength;
    if (byteLength > MAX_APPROVAL_BODY_BYTES) {
      throw new RequestError(413, "Approval request is too large");
    }
    chunks.push(buffer);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new RequestError(400, "Approval request must be valid JSON");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("selections" in parsed) ||
    typeof parsed.selections !== "object" ||
    parsed.selections === null ||
    Array.isArray(parsed.selections)
  ) {
    throw new RequestError(400, "Approval request must include selections");
  }

  return parsed.selections as SkinStageSelections;
}

export function createSkinCandidateReviewServer({
  catalogue,
  finalize,
  html,
  reviewToken,
}: CreateSkinCandidateReviewServerOptions): Server {
  let approvalState: ApprovalState = "idle";

  return createServer(async (request, response) => {
    const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;

    if (request.method === "GET" && pathname === "/") {
      sendHtml(response, html);
      return;
    }

    if (request.method === "GET") {
      const candidatePath = decodeCandidatePath(pathname);
      if (candidatePath) {
        const candidate = resolveSkinReviewCandidate(
          catalogue,
          candidatePath[0],
          candidatePath[1],
        );
        if (!candidate) {
          sendJson(response, 404, { error: "Candidate not found" });
          return;
        }

        try {
          const image = await readFile(candidate.filePath);
          response.writeHead(200, {
            "cache-control": "no-store",
            "content-length": image.byteLength,
            "content-type": "image/png",
            "x-content-type-options": "nosniff",
          });
          response.end(image);
        } catch {
          sendJson(response, 500, {
            error: "Candidate image could not be read",
          });
        }
        return;
      }
    }

    if (request.method === "POST" && pathname === "/approve") {
      if (request.headers["x-review-token"] !== reviewToken) {
        sendJson(response, 403, { error: "Invalid review token" });
        return;
      }
      if (approvalState !== "idle") {
        sendJson(response, 409, { error: "Approval has already started" });
        return;
      }

      let selections: SkinStageSelections;
      try {
        selections = await readApprovalSelections(request);
        planSkinSelection(catalogue, selections);
      } catch (error) {
        const status = error instanceof RequestError ? error.status : 400;
        const message =
          error instanceof Error ? error.message : "Invalid approval";
        sendJson(response, status, { error: message });
        return;
      }

      if (approvalState !== "idle") {
        sendJson(response, 409, { error: "Approval has already started" });
        return;
      }
      approvalState = "running";

      try {
        const result = await finalize(selections);
        approvalState = "completed";
        sendJson(response, 200, {
          assetBasePath: result.assetBasePath,
          stagedKeys: result.stagedKeys,
          status: "completed",
        });
      } catch (error) {
        approvalState = "idle";
        sendJson(response, 500, {
          error: error instanceof Error ? error.message : "Approval failed",
        });
      }
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  });
}
