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
  /** 限定召喚の天井回数（パス未加入の基準値）。未対応・未開催なら null。 */
  limitedHardPityPull: number | null;
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
    const embedded = (key: string): number | null =>
      data
        .map((item) =>
          typeof item === "object" && item != null
            ? asPositiveNumber((item as Record<string, unknown>)[key])
            : null,
        )
        .find((value) => value != null) ?? null;
    return {
      limitedSingleCostRune: embedded("limitedSingleCostRune"),
      limitedHardPityPull: embedded("limitedHardPityPull"),
      products: data as RuneProduct[],
    };
  }

  if (typeof data === "object" && data != null) {
    const record = data as {
      limitedHardPityPull?: unknown;
      limitedSingleCostRune?: unknown;
      products?: unknown;
    };
    return {
      limitedSingleCostRune: asPositiveNumber(record.limitedSingleCostRune),
      limitedHardPityPull: asPositiveNumber(record.limitedHardPityPull),
      products: Array.isArray(record.products) ? (record.products as RuneProduct[]) : [],
    };
  }

  // 契約外の応答。ここで受け止めないと呼び出し側の .map が throw して白画面になる。
  return { limitedSingleCostRune: null, limitedHardPityPull: null, products: [] };
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
 * 換算の表示文。事実の言い換えのみ — 「お得」などの評価語は使わない。
 *
 * 割り切れるとき（円固定後のSKUは全て30の倍数）は「約」を付けない。
 * 端数が出るときだけ切り捨てて「約」を付ける — 実際に引ける回数より
 * 多くも少なくも見せない。
 */
export function buildLimitedSummonEquivalentText(
  runeAmount: number,
  limitedSingleCostRune: number | null | undefined,
): string | null {
  const count = calcLimitedSummonEquivalent(runeAmount, limitedSingleCostRune);
  if (count == null) return null;
  const cost = asPositiveNumber(limitedSingleCostRune);
  const exact = cost != null && runeAmount % cost === 0;
  return `限定召喚 ${exact ? "" : "約"}${count.toLocaleString("ja-JP")}回ぶん`;
}

/**
 * 全商品が同一の整数単価（円/ルーン）で売られているとき、その単価を返す。
 *
 * 「1ルーン=¥3」の表示は**この関数が商品データから検証できたときだけ**出す。
 * 定数のハードコードだとBE側の価格変更と食い違ったまま表示され続けるため、
 * 表示の根拠を常にAPIの実データに置く（コードが裏付けない数字を表示しない）。
 */
export function uniformUnitPriceJpy(products: RuneProduct[]): number | null {
  if (products.length === 0) return null;
  const units = products.map(unitPriceOf);
  const first = units[0];
  if (first == null || !Number.isInteger(first)) return null;
  return units.every((unit) => unit === first) ? first : null;
}

/**
 * 「天井1回分ちょうど」の商品か。
 * totalRune が（1回コスト × 天井回数）に一致する事実のみで判定する。
 * どちらかが取得できなければ判定しない（でっち上げない）。
 */
export function isExactPityPack(
  product: RuneProduct,
  limitedSingleCostRune: number | null | undefined,
  limitedHardPityPull: number | null | undefined,
): boolean {
  const cost = asPositiveNumber(limitedSingleCostRune);
  const pity = asPositiveNumber(limitedHardPityPull);
  if (cost == null || pity == null) return false;
  return product.totalRune === cost * pity;
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
  const max = Math.max(...priced.map((entry) => entry.unit));
  // 全商品が同一単価（円固定後の正常状態）なら「最安」という比較は成立しない
  if (min === max) return new Set();
  return new Set(priced.filter((entry) => entry.unit === min).map((entry) => entry.id));
}
