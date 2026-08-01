import { RARITY_ORDER } from "@/constants/rarity";
import type {
  Activity,
  CoinDetail,
  ItemDetail,
  MonsterDetail,
  XpDetail,
} from "@/types/activity";

/**
 * 未読報酬モーダルの表示モデル。
 *
 * 従来は activities.flatMap(a => a.rewards) を1列に並べていたため、
 * 5PR × 4種 = 20行がフラットに続き、
 *  - どのモンスターがどのPRから来たのか分からない
 *  - SSRのモンスターと「+10 魂」が同じ重さ
 *  - PRが増えると行が線形に増えて CLAIM が画面外へ出る
 * という状態だった。ここでは **PR単位に束ね、合計を先に出し、件数を打ち切る**。
 *
 * 打ち切ったことは hiddenCount として表に出す（黙って削らない）。
 */
export type RewardTotals = {
  coin: number;
  /** 素材アイテムの合計個数（進化の輝石など）。 */
  itemCount: number;
  monsterCount: number;
  soul: number;
  xp: number;
};

/** ドロップした素材と、その回で得た個数。 */
export type RewardItem = ItemDetail & { quantity: number };

export type RewardEntry = {
  coin: number;
  /** コインの内訳（BEが分解した値。無ければ null）。 */
  coinDetail: CoinDetail | null;
  id: number;
  /** このPRで拾った素材（進化の輝石など）。 */
  items: RewardItem[];
  /** このPRで到達したレベル（上がっていなければ null）。 */
  levelAfter: number | null;
  monsters: MonsterDetail[];
  prNumber: number | null;
  repositoryName: string | null;
  soul: number;
  title: string | null;
  xp: number;
};

export type RewardSummary = {
  entries: RewardEntry[];
  /** entries に載せなかった件数（0 なら全件表示）。 */
  hiddenCount: number;
  /** いずれかのPRでレベルが上がったか。 */
  leveledUp: boolean;
  /** 到達した最高レベル（上がっていなければ null）。 */
  maxLevelAfter: number | null;
  prCount: number;
  totals: RewardTotals;
};

/** 1度に並べるPRの上限。超えた分は件数だけ出す。 */
export const REWARD_ENTRY_LIMIT = 5;

function isXpDetail(d: unknown): d is XpDetail {
  return (
    typeof d === "object" && d !== null && "levelBefore" in d && "levelAfter" in d
  );
}

function isMonsterDetail(d: unknown): d is MonsterDetail {
  return typeof d === "object" && d !== null && "name" in d && "emoji" in d;
}

function isCoinDetail(d: unknown): d is CoinDetail {
  return (
    typeof d === "object" &&
    d !== null &&
    "base" in d &&
    "streakBonus" in d &&
    "dailyPolicyPercent" in d
  );
}

function isItemDetail(d: unknown): d is ItemDetail {
  return typeof d === "object" && d !== null && "itemId" in d && "name" in d;
}

function metadataOf(activity: Activity) {
  // metadata は型上必須だが実際には欠けて届くことがある（#143）。
  const m = (activity.metadata ?? {}) as {
    prNumber?: number;
    repositoryFullName?: string;
    title?: string;
  };
  const repo = typeof m.repositoryFullName === "string" ? m.repositoryFullName : null;
  return {
    prNumber: Number.isFinite(m.prNumber) ? (m.prNumber as number) : null,
    repositoryName: repo ? (repo.split("/").at(-1) ?? repo) : null,
    title: typeof m.title === "string" && m.title !== "" ? m.title : null,
  };
}

function entryOf(activity: Activity): RewardEntry {
  const rewards = activity.rewards ?? [];
  let coin = 0;
  let soul = 0;
  let xp = 0;
  let levelAfter: number | null = null;
  let coinDetail: CoinDetail | null = null;
  const monsters: MonsterDetail[] = [];
  const items: RewardItem[] = [];

  for (const reward of rewards) {
    const quantity = Number.isFinite(reward.quantity) ? reward.quantity : 0;
    switch (reward.rewardType) {
      case "coin":
        coin += quantity;
        if (isCoinDetail(reward.detail)) coinDetail = reward.detail;
        break;
      case "item":
        if (isItemDetail(reward.detail)) {
          items.push({ ...reward.detail, quantity });
        }
        break;
      case "soul":
        soul += quantity;
        break;
      case "xp":
        xp += quantity;
        if (isXpDetail(reward.detail) && reward.detail.levelAfter > reward.detail.levelBefore) {
          levelAfter = Math.max(levelAfter ?? 0, reward.detail.levelAfter);
        }
        break;
      case "monster":
        if (isMonsterDetail(reward.detail)) monsters.push(reward.detail);
        break;
    }
  }

  return {
    coin,
    coinDetail,
    id: activity.id,
    items,
    levelAfter,
    monsters,
    soul,
    xp,
    ...metadataOf(activity),
  };
}

/** レアリティの高い順。同順位は元の順序を保つ。 */
function byRarity(a: MonsterDetail, b: MonsterDetail): number {
  return (RARITY_ORDER[a.rarity] ?? 99) - (RARITY_ORDER[b.rarity] ?? 99);
}

export function buildRewardSummary(
  activities: Activity[],
  limit: number = REWARD_ENTRY_LIMIT,
): RewardSummary {
  const all = activities.map(entryOf);

  const totals = all.reduce<RewardTotals>(
    (acc, e) => ({
      coin: acc.coin + e.coin,
      itemCount:
        acc.itemCount + e.items.reduce((sum, item) => sum + item.quantity, 0),
      monsterCount: acc.monsterCount + e.monsters.length,
      soul: acc.soul + e.soul,
      xp: acc.xp + e.xp,
    }),
    { coin: 0, itemCount: 0, monsterCount: 0, soul: 0, xp: 0 },
  );

  const levels = all.map((e) => e.levelAfter).filter((l): l is number => l != null);

  const shown = all.slice(0, Math.max(0, limit)).map((e) => ({
    ...e,
    monsters: [...e.monsters].sort(byRarity),
  }));

  return {
    entries: shown,
    hiddenCount: Math.max(0, all.length - shown.length),
    leveledUp: levels.length > 0,
    maxLevelAfter: levels.length > 0 ? Math.max(...levels) : null,
    prCount: all.length,
    totals,
  };
}

/**
 * コインの内訳を人が読める形にする。0 の項目は出さない。
 * 何も乗っていない（基本のみ）なら内訳を出す意味がないので null。
 */
export function formatCoinBreakdown(detail: CoinDetail | null): string | null {
  if (detail == null) return null;
  const parts: string[] = [];
  if (detail.largePrBonus > 0) {
    parts.push(`大規模PR +${detail.largePrBonus.toLocaleString("ja-JP")}`);
  }
  if (detail.streakBonus > 0) {
    parts.push(`ストリーク +${detail.streakBonus.toLocaleString("ja-JP")}`);
  }
  if (parts.length === 0) return null;
  return `基本 ${detail.base.toLocaleString("ja-JP")} · ${parts.join(" · ")}`;
}

/**
 * 同日のPR本数による減衰の注記。減衰していないときは null。
 *
 * この減衰はこれまでどこにも開示されておらず、数字が合わない理由が
 * 分からない状態だった。減衰した回だけ、その場で理由を述べる。
 */
export function formatDailyPolicyNote(detail: CoinDetail | null): string | null {
  if (detail == null) return null;
  const percent = detail.dailyPolicyPercent;
  if (!Number.isFinite(percent) || percent >= 100) return null;
  if (percent <= 0) {
    return "同日のマージ本数が多いため、このPRでは資源が付与されていません";
  }
  return `同日のマージ本数が多いため、資源が ${percent}% になっています`;
}

/** 合計行に出す「+N XP · +N ギルドコイン · …」。0 の項目は出さない。 */
export function formatRewardTotals(totals: RewardTotals): string[] {
  const parts: string[] = [];
  if (totals.xp > 0) parts.push(`+${totals.xp.toLocaleString("ja-JP")} XP`);
  if (totals.coin > 0)
    parts.push(`+${totals.coin.toLocaleString("ja-JP")} ギルドコイン`);
  if (totals.soul > 0) parts.push(`+${totals.soul.toLocaleString("ja-JP")} 魂`);
  if (totals.itemCount > 0)
    parts.push(`素材 ${totals.itemCount.toLocaleString("ja-JP")} 個`);
  if (totals.monsterCount > 0)
    parts.push(`${totals.monsterCount.toLocaleString("ja-JP")} 体`);
  return parts;
}
