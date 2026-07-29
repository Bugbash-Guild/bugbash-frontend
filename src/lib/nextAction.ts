/**
 * 「いま、できること」の行を組み立てる。
 *
 * 通貨ごとに1行。事実（何回ぶんあるか）と行き先だけを持ち、
 * 期限・カウントダウン・煽り文句は持たない。
 *
 * ルーン側を出すのは収益導線のため。限定召喚はルーンの最大の吸収先なのに
 * 入口が召喚ページ内の1リンクだけ（単線）だったので、
 * サイドバーを増やさずに home からの経路を1本増やす。
 */
export type NextActionCurrency = "coin" | "rune";

export type NextActionRow = {
  count: number;
  currency: NextActionCurrency;
  href: string;
  /** 「N ぶんの◯◯があります」の◯◯にあたる通貨の呼び名。 */
  currencyLabel: string;
  /** 何を引けるか。 */
  subject: string;
};

const DEFS: Record<
  NextActionCurrency,
  { currencyLabel: string; href: string; subject: string }
> = {
  coin: {
    currencyLabel: "ギルドコイン",
    href: "/summon",
    subject: "召喚",
  },
  rune: {
    currencyLabel: "ルーン",
    href: "/summon/limited",
    subject: "限定召喚",
  },
};

function rowFor(
  currency: NextActionCurrency,
  balance: number | null | undefined,
  cost: number | null | undefined,
): NextActionRow | null {
  if (!Number.isFinite(balance ?? NaN) || !Number.isFinite(cost ?? NaN)) {
    return null;
  }
  if ((cost as number) <= 0) return null;
  const count = Math.floor((balance as number) / (cost as number));
  if (count < 1) return null;
  return { count, currency, ...DEFS[currency] };
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
