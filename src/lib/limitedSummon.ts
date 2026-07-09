import type {
  LimitedSummonResponse,
  SummonDisclosureResponse,
  SummonHistoryEntry,
  SummonHistoryResponse,
} from "@/types/summon";

export type LimitedPullCount = 1 | 10;

export type LimitedPullConfirmation = {
  balanceLabel: string;
  canAfford: boolean;
  cost: number;
  costLabel: string;
  pullCount: LimitedPullCount;
};

export type LimitedSummonErrorPresentation = {
  message: string;
  needsHistoryCheck: boolean;
  showRuneTopUpLink: boolean;
};

export class LimitedSummonHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "LimitedSummonHttpError";
  }
}

const formatRunes = (amount: number): string =>
  `${amount.toLocaleString("ja-JP")}ルーン`;

export function getFeaturedLimitedItem(disclosure: SummonDisclosureResponse) {
  return disclosure.items.find((item) => item.rarity === "SSR") ?? null;
}

export function buildLimitedPullConfirmation(
  disclosure: SummonDisclosureResponse,
  runeBalance: number,
  pullCount: LimitedPullCount,
): LimitedPullConfirmation | null {
  if (pullCount === 10 && disclosure.tenPullCost == null) return null;
  const cost =
    pullCount === 10 ? disclosure.tenPullCost! : disclosure.singlePullCost;

  return {
    balanceLabel: formatRunes(runeBalance),
    canAfford: runeBalance >= cost,
    cost,
    costLabel: formatRunes(cost),
    pullCount,
  };
}

export function buildLimitedStockPolicyCopy(stockPolicy: string): string {
  if (stockPolicy === "SEASONAL_RERUN") {
    return "このバナーはシーズン復刻予定です。";
  }
  if (stockPolicy === "UNLIMITED") {
    return "このバナーに在庫数の制限はありません。";
  }
  return "提供条件は提供割合をご確認ください。";
}

export function mapLimitedSummonPullError(
  status: number | null,
  errorMessage: string,
): LimitedSummonErrorPresentation {
  if (status === null) {
    return {
      message: "召喚結果を確認しています。",
      needsHistoryCheck: true,
      showRuneTopUpLink: false,
    };
  }
  if (status === 401) {
    return {
      message: "セッションが切れました。再度ログインしてください。",
      needsHistoryCheck: false,
      showRuneTopUpLink: false,
    };
  }

  const normalized = errorMessage.toLowerCase();
  if (
    status === 422 &&
    (normalized.includes("rune") ||
      normalized.includes("balance") ||
      normalized.includes("insufficient") ||
      errorMessage.includes("ルーン") ||
      errorMessage.includes("残高"))
  ) {
    return {
      message: "ルーンが足りません。",
      needsHistoryCheck: false,
      showRuneTopUpLink: true,
    };
  }

  return {
    message: "限定召喚を実行できませんでした。時間をおいてお試しください。",
    needsHistoryCheck: false,
    showRuneTopUpLink: false,
  };
}

export async function pullLimitedSummon(
  fetcher: typeof fetch,
  pullCount: LimitedPullCount,
): Promise<LimitedSummonResponse> {
  const endpoint =
    pullCount === 10
      ? "/api/summon/limited/pull10"
      : "/api/summon/limited/pull";
  const response = await fetcher(endpoint, { method: "POST" });
  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => ({ error: `HTTP ${response.status}` }));
    const message =
      (body as { error?: string }).error ?? `HTTP ${response.status}`;
    throw new LimitedSummonHttpError(response.status, message);
  }
  return response.json() as Promise<LimitedSummonResponse>;
}

export function createLimitedSummonExecutor(fetcher: typeof fetch) {
  let inFlight: Promise<LimitedSummonResponse> | null = null;

  return (pullCount: LimitedPullCount): Promise<LimitedSummonResponse> => {
    if (inFlight) return inFlight;

    const request = pullLimitedSummon(fetcher, pullCount);
    const tracked = request.finally(() => {
      if (inFlight === tracked) inFlight = null;
    });
    inFlight = tracked;
    return tracked;
  };
}

export async function fetchLimitedSummonHistory(
  fetcher: typeof fetch,
): Promise<SummonHistoryEntry[]> {
  const response = await fetcher(
    "/api/summon/history?poolKey=LIMITED&limit=10",
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new LimitedSummonHttpError(
      response.status,
      "限定召喚履歴を取得できませんでした。",
    );
  }
  const history = (await response.json()) as SummonHistoryResponse;
  return history.entries;
}

const historyKey = (entry: SummonHistoryEntry): string =>
  [entry.itemId, entry.rarity, entry.assetUrl ?? "", entry.pulledAt].join(
    "\u0000",
  );

export function findAddedLimitedHistoryEntries(
  before: SummonHistoryEntry[],
  after: SummonHistoryEntry[],
  expectedCount: LimitedPullCount,
): SummonHistoryEntry[] | null {
  const remainingBefore = new Map<string, number>();
  for (const entry of before) {
    const key = historyKey(entry);
    remainingBefore.set(key, (remainingBefore.get(key) ?? 0) + 1);
  }

  const added = after.filter((entry) => {
    const key = historyKey(entry);
    const remaining = remainingBefore.get(key) ?? 0;
    if (remaining === 0) return true;
    remainingBefore.set(key, remaining - 1);
    return false;
  });

  return added.length >= expectedCount ? added.slice(0, expectedCount) : null;
}
