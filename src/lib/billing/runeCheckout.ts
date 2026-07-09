import type { CreateCheckoutRequest, RuneProduct } from "@/types/billing";

export const CHECKOUT_IDEMPOTENCY_KEY_PREFIX = "bb.checkout.";

type CheckoutStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

export type RuneProductCard = {
  bonusText: string;
  firstPurchaseOnly: boolean;
  id: string;
  price: string;
  runeText: string;
  unitPrice: string;
};

export type CheckoutErrorAction = "ageGate" | "login" | "none";

export type CheckoutErrorPresentation = {
  action: CheckoutErrorAction;
  message: string;
};

export function formatJpy(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}（税込）`;
}

export function formatRuneUnitPrice(product: RuneProduct): string {
  const unitPrice = product.priceJpyTaxIncluded / product.totalRune;
  return `¥${unitPrice.toFixed(1)}/ルーン`;
}

export function buildRuneProductCards(products: RuneProduct[]): RuneProductCard[] {
  return [...products]
    .sort((a, b) => Number(b.firstPurchaseOnly) - Number(a.firstPurchaseOnly))
    .map((product) => ({
      bonusText: `${product.runeAmount.toLocaleString("ja-JP")} + ボーナス${product.bonusRune.toLocaleString(
        "ja-JP",
      )}`,
      firstPurchaseOnly: product.firstPurchaseOnly,
      id: product.id,
      price: formatJpy(product.priceJpyTaxIncluded),
      runeText: `${product.totalRune.toLocaleString("ja-JP")}ルーン`,
      unitPrice: formatRuneUnitPrice(product),
    }));
}

export function checkoutIdempotencyStorageKey(productId: string): string {
  return `${CHECKOUT_IDEMPOTENCY_KEY_PREFIX}${productId}`;
}

export function readCheckoutIdempotencyKey(
  storage: CheckoutStorage,
  productId: string,
): string | null {
  return storage.getItem(checkoutIdempotencyStorageKey(productId));
}

export function getOrCreateCheckoutIdempotencyKey(
  storage: CheckoutStorage,
  productId: string,
  createId: () => string,
): string {
  const existing = readCheckoutIdempotencyKey(storage, productId);
  if (existing) return existing;

  const created = createId();
  storage.setItem(checkoutIdempotencyStorageKey(productId), created);
  return created;
}

export function clearCheckoutIdempotencyKey(
  storage: CheckoutStorage,
  productId: string,
): void {
  storage.removeItem(checkoutIdempotencyStorageKey(productId));
}

export function buildCheckoutRequest(
  runeProductId: string,
  idempotencyKey: string,
): CreateCheckoutRequest {
  return { idempotencyKey, runeProductId };
}

export function mapBillingCheckoutError(
  status: number,
  errorMessage: string,
): CheckoutErrorPresentation {
  if (status === 401) {
    return {
      action: "login",
      message: "セッションが切れました。再度ログインしてください。",
    };
  }

  const normalized = errorMessage.toLowerCase();
  if (normalized.includes("age") || errorMessage.includes("年齢")) {
    return {
      action: "ageGate",
      message: "購入には年齢確認が必要です。",
    };
  }

  if (
    normalized.includes("limit") ||
    normalized.includes("cap") ||
    errorMessage.includes("上限")
  ) {
    return {
      action: "none",
      message: "30日間の購入上限を超えるため購入できません。上限は毎日少しずつ回復します。",
    };
  }

  if (
    normalized.includes("first") ||
    errorMessage.includes("初回購入") ||
    errorMessage.includes("購入済")
  ) {
    return {
      action: "none",
      message: "初回限定パックはお一人様1回までです。",
    };
  }

  return {
    action: "none",
    message: "一時的なエラーが発生しました。時間をおいて再度お試しください。",
  };
}

export async function readBillingErrorMessage(response: Response): Promise<string> {
  const body = await response.text();
  if (!body) return "";

  try {
    const parsed = JSON.parse(body) as { error?: unknown };
    return typeof parsed.error === "string" ? parsed.error : body;
  } catch {
    return body;
  }
}
