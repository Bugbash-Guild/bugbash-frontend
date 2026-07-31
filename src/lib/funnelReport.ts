/**
 * 課金導線の集計を、読める形に整える。
 *
 * 数字を並べるだけでは「で、どこを直すのか」に答えられない。
 * ここでは **落ち幅が最大の1区間** を特定できるところまでを担う。
 *
 * 「まだ誰も来ていない」を「誰も進んでいない」と言わないことを最優先する。
 * サーバは分母0のとき percent を null で返すので、それを 0% に潰さない。
 */
export type FunnelStep = {
  eventCount: number;
  heroCount: number;
  name: string;
};

export type FunnelConversion = {
  /** from を通った人数（ログイン済みのみ）。率だけだと母数が見えない。 */
  fromHeroCount: number;
  from: string;
  percent: number | null;
  /** from と to の両方を通った人数。 */
  reachedHeroCount: number;
  to: string;
};

export type FunnelSummary = {
  conversions: FunnelConversion[];
  days: number;
  steps: FunnelStep[];
};

/** 表示名。イベント名のままだと運用中に読めない。 */
export const FUNNEL_STEP_LABEL: Record<string, string> = {
  CHECKOUT_COMPLETED: "決済完了",
  CHECKOUT_STARTED: "決済開始",
  PASS_VIEWED: "パスを見た",
  PITY_REACHED: "天井に到達",
  RUNE_SHOP_VIEWED: "ルーン購入を見た",
  SHOP_VIEWED: "ショップを見た",
  SUMMON_EXECUTED: "召喚した",
  SUMMON_VIEWED: "召喚画面を見た",
};

export function funnelStepLabel(name: string): string {
  // 知らない名前でも捨てずに出す。出さないと「計測されていない」と
  // 「表示していない」の区別がつかない。
  return FUNNEL_STEP_LABEL[name] ?? name;
}

export function formatConversionPercent(percent: number | null): string {
  if (percent == null) return "—";
  return `${percent.toFixed(1)}%`;
}

export type FunnelBottleneck = {
  conversion: FunnelConversion;
  /** 失っている人数。率だけだと母数1人の100%落ちが最悪に見える。 */
  lostHeroes: number;
};

/** 「88人中24人」。率だけを出さないための添え物。 */
export function formatConversionPopulation(conversion: FunnelConversion): string {
  return `${conversion.fromHeroCount.toLocaleString("ja-JP")}人中 ${conversion.reachedHeroCount.toLocaleString("ja-JP")}人`;
}

/**
 * いちばん人数を失っている区間。
 *
 * 率ではなく**人数**で選ぶ。率で選ぶと、2人中2人が落ちた区間が
 * 1,000人中400人が落ちた区間より深刻に見えてしまう。
 *
 * @returns 判断材料が無ければ null（計測前・全ステップ0など）
 */
export function findFunnelBottleneck(summary: FunnelSummary): FunnelBottleneck | null {
  let worst: FunnelBottleneck | null = null;
  for (const conversion of summary.conversions) {
    if (conversion.percent == null) continue;
    // 「前段を通ったのに後段へ進まなかった人」。段階ごとの総人数の差ではない
    // （前段を通らずに後段へ来た人が混ざると、失った人数が過小に見える）。
    const lostHeroes = conversion.fromHeroCount - conversion.reachedHeroCount;
    if (lostHeroes <= 0) continue;
    if (worst == null || lostHeroes > worst.lostHeroes) {
      worst = { conversion, lostHeroes };
    }
  }
  return worst;
}

/** 計測が始まっていないのか、本当に0なのか。 */
export function hasAnyFunnelData(summary: FunnelSummary): boolean {
  return summary.steps.some((step) => step.eventCount > 0);
}
