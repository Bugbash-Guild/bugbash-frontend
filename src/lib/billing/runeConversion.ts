import type { RuneProduct } from "@/types/billing";

/**
 * ルーン商品一覧 API の受け皿。
 *
 * BE 未対応の環境は素の配列（RuneProduct[]）を返し、対応後は
 * `{ products, limitedSingleCostRune }` のオブジェクトになる。
 * デプロイ順が前後しても FE が壊れないよう、両方の形をここで畳む。
 */
export type RuneProductsPayload = {
  /** 限定召喚1回のルーンコスト。未対応・値が不正なら null（換算は非表示）。 */
  limitedSingleCostRune: number | null;
  products: RuneProduct[];
};

/** 正の有限数だけ通す。0・負数・NaN で割り算しないための関門。 */
function asPositiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

export function parseRuneProductsResponse(data: unknown): RuneProductsPayload {
  /*
    実BE形式: トップレベルは商品配列のまま、limitedSingleCostRune は各要素に
    同梱される（値は全要素で同一）。トップレベルをオブジェクトに変えると、
    デプロイ済みの旧FEがルーン棚を空表示にしてしまうため、BEは配列形を
    維持したまま要素へ同乗させる判断をした。未対応BEでは要素にフィールドが
    無く null になるだけ。
  */
  if (Array.isArray(data)) {
    const embedded =
      data
        .map((item) =>
          typeof item === "object" && item != null
            ? asPositiveNumber(
                (item as { limitedSingleCostRune?: unknown }).limitedSingleCostRune,
              )
            : null,
        )
        .find((value) => value != null) ?? null;
    return { limitedSingleCostRune: embedded, products: data as RuneProduct[] };
  }

  if (typeof data === "object" && data != null) {
    const record = data as { limitedSingleCostRune?: unknown; products?: unknown };
    return {
      limitedSingleCostRune: asPositiveNumber(record.limitedSingleCostRune),
      products: Array.isArray(record.products) ? (record.products as RuneProduct[]) : [],
    };
  }

  // 契約外の応答。ここで受け止めないと呼び出し側の .map が throw して白画面になる。
  return { limitedSingleCostRune: null, products: [] };
}

/**
 * ルーン量 → 限定召喚の回数換算。N = floor(ルーン量 / 1回コスト)。
 *
 * コストが取得できない・値が不正・結果が 0 回のときは null（表示しない）。
 * 端数は必ず切り捨てる — 実際に引ける回数より多く見せてはいけない。
 */
export function calcLimitedSummonEquivalent(
  runeAmount: number,
  limitedSingleCostRune: number | null | undefined,
): number | null {
  const cost = asPositiveNumber(limitedSingleCostRune);
  const amount = asPositiveNumber(runeAmount);
  if (cost == null || amount == null) return null;

  const count = Math.floor(amount / cost);
  return count >= 1 ? count : null;
}

/**
 * 換算の表示文。端数を切り捨てているため「約」を必ず付ける。
 * 事実の言い換えのみ — 「お得」などの評価語は使わない。
 */
export function buildLimitedSummonEquivalentText(
  runeAmount: number,
  limitedSingleCostRune: number | null | undefined,
): string | null {
  const count = calcLimitedSummonEquivalent(runeAmount, limitedSingleCostRune);
  if (count == null) return null;
  return `限定召喚 約${count.toLocaleString("ja-JP")}回ぶん`;
}

/** 円/ルーン。価格か付与量が不正なら null（比較から外す）。 */
function unitPriceOf(product: RuneProduct): number | null {
  const price = asPositiveNumber(product.priceJpyTaxIncluded);
  const total = asPositiveNumber(product.totalRune);
  if (price == null || total == null) return null;
  return price / total;
}

/**
 * 円/ルーンが最小の商品 id 群。「最安単価」バッジの対象。
 *
 * 実価格から計算した事実だけを言うためのもの。比較対象が1つしか無ければ
 * 「最安」という比較表現は成立しないので空を返す。同率最安は全て返す。
 */
export function findCheapestRuneProductIds(products: RuneProduct[]): Set<string> {
  const priced = products.flatMap((product) => {
    const unit = unitPriceOf(product);
    return unit == null ? [] : [{ id: product.id, unit }];
  });
  if (priced.length < 2) return new Set();

  const min = Math.min(...priced.map((entry) => entry.unit));
  return new Set(priced.filter((entry) => entry.unit === min).map((entry) => entry.id));
}
