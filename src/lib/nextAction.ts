/**
 * 「いま、できること / 次の目標」の行を組み立てる。
 *
 * 通貨ごとに1行。事実（何回ぶんあるか・あといくら足りないか）と行き先だけを
 * 持ち、期限・カウントダウン・煽り文句は持たない。
 *
 * ルーン側を出すのは収益導線のため。限定召喚はルーンの最大の吸収先なのに
 * 入口が召喚ページ内の1リンクだけ（単線）だったので、
 * サイドバーを増やさずに home からの経路を1本増やす。
 */
export type NextActionCurrency = "coin" | "rune";

type NextActionBase = {
  currency: NextActionCurrency;
  /** 「N ぶんの◯◯があります」の◯◯にあたる通貨の呼び名。 */
  currencyLabel: string;
  href: string;
  /** 何を引けるか。 */
  subject: string;
};

/** 残高がコストに届いている＝いま引ける。 */
export type NextActionReadyRow = NextActionBase & {
  count: number;
  kind: "ready";
};

/**
 * 残高がコストに届かない＝距離の事実だけを述べる行。
 *
 * コイン（名声通貨・獲得のみ）にだけ出す。ルーンの不足額を home で
 * 数え上げると「あと N ルーン買えば」という購入圧になるため、
 * ルーンは従来どおり行ごと出さない（BalanceShortfall と同じ
 * コイン/ルーン非対称）。
 */
export type NextActionDistanceRow = NextActionBase & {
  kind: "distance";
  /** 不足額（コスト − 残高）。 */
  shortfall: number;
};

export type NextActionRow = NextActionDistanceRow | NextActionReadyRow;

const DEFS: Record<
  NextActionCurrency,
  {
    currencyLabel: string;
    href: string;
    /** 残高不足のとき距離行を出すか（コインのみ true）。 */
    showsDistance: boolean;
    subject: string;
  }
> = {
  coin: {
    currencyLabel: "ギルドコイン",
    href: "/summon",
    showsDistance: true,
    subject: "召喚",
  },
  rune: {
    currencyLabel: "ルーン",
    href: "/summon/limited",
    showsDistance: false,
    subject: "限定召喚",
  },
};

function rowFor(
  currency: NextActionCurrency,
  balance: number | null | undefined,
  cost: number | null | undefined,
): NextActionRow | null {
  // 残高・コストのどちらかが未取得なら、回数も距離も計算できない（仮置きしない）。
  if (!Number.isFinite(balance ?? NaN) || !Number.isFinite(cost ?? NaN)) {
    return null;
  }
  if ((cost as number) <= 0) return null;
  const { showsDistance, ...def } = DEFS[currency];
  const count = Math.floor((balance as number) / (cost as number));
  if (count >= 1) return { count, currency, kind: "ready", ...def };
  if (!showsDistance) return null;
  return {
    currency,
    kind: "distance",
    shortfall: (cost as number) - (balance as number),
    ...def,
  };
}

export function buildNextActions(input: {
  guildCoinBalance: number | null | undefined;
  limitedPullCost: number | null | undefined;
  normalPullCost: number | null | undefined;
  runeBalance: number | null | undefined;
}): NextActionRow[] {
  return [
    rowFor("coin", input.guildCoinBalance, input.normalPullCost),
    rowFor("rune", input.runeBalance, input.limitedPullCost),
  ].filter((row): row is NextActionRow => row !== null);
}
