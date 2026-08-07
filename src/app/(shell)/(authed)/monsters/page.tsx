"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { mutate } from "swr";

import { CommemorativePlate } from "@/components/commemorative/CommemorativePlate";
import { ConsoleTopbar } from "@/components/ConsoleTopbar";
import { InlineActionResult } from "@/components/InlineActionResult";
import {
  awakeningPathLabel,
  EvolutionConfirmModal,
  resolveConsumedItem,
  type EvolutionActionRequest,
} from "@/components/monsters/EvolutionConfirmModal";
import { TermLoading } from "@/components/TermLoading";
import { MonsterVisual } from "@/components/MonsterVisual";
import { RARITY_COLOR } from "@/constants/rarity";
import { useAuth } from "@/hooks/useAuth";
import { useHero } from "@/hooks/useHero";
import { useInventory } from "@/hooks/useInventory";
import { useMonsters } from "@/hooks/useMonsters";
import { usePartner } from "@/hooks/usePartner";
import { useSkinCatalog } from "@/hooks/useSkinCatalog";
import { useMyCommemorativeMints } from "@/hooks/useCommemorativeMints";
import { matchMintToOwnedMonster } from "@/lib/commemorativeMint";
import { buildAcquisitionHint, buildDexProgress } from "@/lib/dexProgress";
import { buildPrRef } from "@/lib/prUrl";
import {
  canEvolveMonster,
  canLevelUpMonster,
  getMonsterLevelUpCost,
  isMonsterAwakened,
  MONSTER_EVOLUTION_LEVEL,
  MONSTER_MAX_LEVEL,
} from "@/lib/monsterProgression";
import type { CommemorativeMintPlate } from "@/types/commemorativeMint";
import type { Monster } from "@/types/monster";

type RarityKey = "SSR" | "SR" | "R" | "N";
type FilterKey = "all" | RarityKey;

/*
 * グループは N→SSR の昇順。以前は SSR が先頭で、開いた瞬間の最上段が
 * 未所持 SSR の「???」列になりがちだった（自分の収集より欠けが先に見える）。
 * 所持数の多い N 帯から並べ、「自分の資産 → 次の目標」の順で読めるようにする。
 * 絞り込みボタンもグループの並びと同じ順に揃える。
 */
const RARITY_GROUPS: RarityKey[] = ["N", "R", "SR", "SSR"];
const FILTERS: FilterKey[] = ["all", "N", "R", "SR", "SSR"];

/** MATERIALS 帯に並べる素材の数。超えた分は件数だけ添えて黙って落とさない。 */
const MATERIALS_PREVIEW_COUNT = 6;

/** カード内に出す操作結果（対象モンスターの隣に表示する）。 */
type CardActionResult = {
  detail?: string;
  monsterId: string;
  title: string;
  tone: "success" | "error";
};

/** 進化段階（活動由来）。formStage から派生。 */
function evolutionStage(monster: Monster): number {
  switch (monster.formStage) {
    case "EVO":
      return 1;
    case "AWAKENED":
    case "BERSERK":
      return 2;
    case "AWAKENED_FINAL":
    case "BERSERK_FINAL":
      return 3;
    default:
      return 0;
  }
}

function RarityChip({ rarity }: { rarity: RarityKey }) {
  const c = RARITY_COLOR[rarity];
  return (
    <span
      className="inline-flex rounded-[2px] border px-[7px] py-px text-[9.5px] font-bold tracking-[0.1em]"
      style={{ color: c, background: `${c}1f`, borderColor: `${c}66` }}
    >
      {rarity}
    </span>
  );
}

export default function MonstersPage() {
  const { isAuthenticated } = useAuth();
  const { monsters, ownedDegraded, loading, error, refetch } = useMonsters();
  const { partnerId, setPartner } = usePartner();
  const { ownedSkins, skins: skinCatalog } = useSkinCatalog(isAuthenticated);
  const {
    items: inventoryItems,
    loading: inventoryLoading,
    error: inventoryError,
    refetch: refetchInventory,
  } = useInventory(isAuthenticated);
  // スキンが1つも無いモンスターに「スキンを見る」を出すと空棚に送ることになる。
  const slugsWithSkins = useMemo(
    () => new Set(skinCatalog.map((skin) => skin.monsterSlug)),
    [skinCatalog],
  );
  const { refetch: refetchHero } = useHero(isAuthenticated);
  // githubId (auth/status の応答) を待たず、最初のリクエスト波に乗せる
  const { mints } = useMyCommemorativeMints(isAuthenticated);
  const [filter, setFilter] = useState<FilterKey>("all");
  /*
   * 操作結果はページ上部ではなく、操作したカードの中に出す（Wave 1）。
   * グリッド下方のカードを操作したとき、画面外の最上部に真実が出ても
   * 誰にも読まれない。結果は最後の1件だけ保持し、次の操作で置き換える。
   */
  const [cardResult, setCardResult] = useState<CardActionResult | null>(null);
  const [levelingUp, setLevelingUp] = useState<string | null>(null);
  const [evolving, setEvolving] = useState<string | null>(null);
  const [changingPath, setChangingPath] = useState<string | null>(null);
  /*
   * 進化・路線変更はアイテムを消費し、進化は結果もランダムに分岐する。
   * 以前はボタン即実行だったため、消費と分岐を事前開示する確認モーダルを挟む。
   */
  const [pendingAction, setPendingAction] = useState<EvolutionActionRequest | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // インベントリが読めている間だけ、モーダルで残数を実数として扱う。
  const inventoryKnown = !inventoryLoading && inventoryError == null;
  const confirmInFlight =
    pendingAction != null &&
    (evolving === pendingAction.monster.id || changingPath === pendingAction.monster.id);

  async function postMonsterAction(
    monsterId: string,
    action: "level-up" | "evolve" | "change-path",
  ): Promise<
    { ok: true; body: Record<string, unknown> } | { ok: false; message: string }
  > {
    try {
      const res = await fetch(`/api/monsters/${monsterId}/${action}`, {
        method: "POST",
      });
      const body = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        return {
          ok: false,
          message: typeof body.error === "string" ? body.error : `Error ${res.status}`,
        };
      }
      return { ok: true, body };
    } catch {
      return { ok: false, message: "Network error" };
    }
  }

  async function refreshAfterAction(options: { inventoryChanged: boolean }) {
    await Promise.all([
      refetch(),
      refetchHero(),
      mutate("/api/billing/wallet"),
      // 輝石・証を消費したあとは MATERIALS 帯と次回モーダルの残数も追従させる。
      options.inventoryChanged ? refetchInventory() : Promise.resolve(),
    ]);
  }

  async function handleLevelUp(monster: Monster) {
    setLevelingUp(monster.id);
    setCardResult(null);
    const result = await postMonsterAction(monster.id, "level-up");
    if (result.ok) {
      await refreshAfterAction({ inventoryChanged: false });
      setCardResult({
        monsterId: monster.id,
        tone: "success",
        title: `Lv.${result.body.newLevel ?? "?"} に上昇`,
        detail: `${monster.attributeName ?? "soul"} 残り ${result.body.soulsRemaining ?? "?"}`,
      });
    } else {
      setCardResult({
        monsterId: monster.id,
        tone: "error",
        title: "レベルアップできませんでした",
        detail: result.message,
      });
    }
    setLevelingUp(null);
  }

  function openConfirm(request: EvolutionActionRequest) {
    setConfirmError(null);
    setPendingAction(request);
  }

  function cancelConfirm() {
    if (confirmInFlight) return;
    setPendingAction(null);
    setConfirmError(null);
  }

  async function confirmPendingAction() {
    if (pendingAction == null || confirmInFlight) return;
    const { kind, monster } = pendingAction;
    // 成功後の表示に使う消費アイテム名は、実行前の状態から確定させておく
    // （路線変更は実行後に awakeningState が反転し、逆の証を指してしまうため）。
    const consumed = resolveConsumedItem(pendingAction, inventoryItems, inventoryKnown);
    const setBusy = kind === "evolve" ? setEvolving : setChangingPath;
    setBusy(monster.id);
    setConfirmError(null);
    setCardResult(null);
    const result = await postMonsterAction(monster.id, kind);
    if (result.ok) {
      await refreshAfterAction({ inventoryChanged: true });
      setPendingAction(null);
      if (kind === "evolve") {
        setCardResult({
          monsterId: monster.id,
          tone: "success",
          title: `進化結果：${awakeningPathLabel(result.body.awakeningState)}`,
          detail: `${consumed?.name ?? "進化の輝石"} ×1 消費 — 残り ${result.body.evolutionStonesRemaining ?? "?"}`,
        });
      } else {
        setCardResult({
          monsterId: monster.id,
          tone: "success",
          title: `路線変更：${awakeningPathLabel(result.body.awakeningState)}`,
          detail: `${consumed?.name ?? "証"} ×1 消費 — 残り ${result.body.itemRemaining ?? "?"}`,
        });
      }
    } else {
      // 失敗はモーダル内に出し、ユーザーが文脈を保ったまま再試行/中止できるようにする。
      setConfirmError(result.message);
    }
    setBusy(null);
  }

  async function handleSetPartner(monster: Monster) {
    setCardResult(null);
    try {
      await setPartner(monster.id);
    } catch (error) {
      setCardResult({
        monsterId: monster.id,
        tone: "error",
        title: "パートナーを設定できませんでした",
        detail:
          error instanceof Error ? error.message : "もう一度お試しください。",
      });
    }
  }

  // 「今の収穫」が分かるように、直近24時間に迎えたモンスターへ NEW を出す
  const recentlyAcquiredIds = useMemo(() => {
    const threshold = Date.now() - 24 * 60 * 60 * 1000;
    return new Set(
      monsters
        .filter((m) => {
          if (!m.acquiredAt) return false;
          const at = new Date(m.acquiredAt).getTime();
          return Number.isFinite(at) && at >= threshold;
        })
        .map((m) => m.id),
    );
  }, [monsters]);

  /*
   * 各グループ内の並びは 所持済み → NEW（24h以内に獲得）→ 未所持。
   * 以前は id 順で所持と未所持が混在し、自分の収集が飛び飛びに見えていた。
   * 長く連れている個体は先頭側で位置が安定し、新入りは所持と未所持の
   * 境目＝図鑑が伸びている場所に現れ、その先に次の目標（未所持）が続く。
   */
  const dex = useMemo(() => {
    const rank = (m: Monster) =>
      m.isOwned ? (recentlyAcquiredIds.has(m.id) ? 1 : 0) : 2;
    return [...monsters].sort(
      (a, b) => rank(a) - rank(b) || a.id.localeCompare(b.id),
    );
  }, [monsters, recentlyAcquiredIds]);

  // 装備中スキンのマスタリー（コスメ・琥珀）を monsterSlug で引けるようにする
  const cosmeticBySlug = useMemo(() => {
    const map = new Map<string, { masteryLevel: number; lineName: string; skinId: string }>();
    for (const skin of ownedSkins) {
      if (skin.equipped) {
        map.set(skin.monsterSlug, {
          masteryLevel: skin.masteryLevel,
          lineName: skin.lineName,
          skinId: skin.skinId,
        });
      }
    }
    return map;
  }, [ownedSkins]);

  const partnerMonster = dex.find((m) => m.id === partnerId) ?? null;
  const progress = buildDexProgress(dex);

  /*
   * 「次に埋まりやすい枠」: 未発見のうち PR マージで出会える枠は、日々の
   * 活動だけで埋まる（召喚や課金を要しない）ので埋まりやすさが違う。
   * prAcquirable は BE マスタ応答の必須フィールドのため、
   * 残数 − 召喚専用残数 がそのまま PR で出会える残数になる。
   * 表示するのは buildDexProgress 由来の実数のみ（推測値は出さない）。
   */
  const dexRemaining = progress.total - progress.discovered;
  const summonOnlyRemaining =
    progress.summonOnlyTotal - progress.summonOnlyDiscovered;
  const prAcquirableRemaining = dexRemaining - summonOnlyRemaining;
  const nextFillHint =
    dexRemaining === 0
      ? "COMPLETE — 全モンスター発見済み"
      : prAcquirableRemaining > 0
        ? `次に埋まりやすい枠: PR マージで出会える残り ${prAcquirableRemaining} 体`
        : `残り ${summonOnlyRemaining} 体はすべて召喚専用です`;

  const visibleGroups = RARITY_GROUPS.filter(
    (g) => filter === "all" || filter === g,
  ).map((g) => ({
    rarity: g,
    items: dex.filter((m) => m.rarity === g),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      <ConsoleTopbar command="cat dex/*.card --format=detailed" path="~/monsters" showWallet />
      <div className="px-4 py-5 md:px-9 md:py-6">
        {/* page header + filters */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold tracking-[-0.015em]">Monster Dex</h1>
            {/*
              "owned N instances" は撤去した。この一覧はマスタ1件＝1種で
              畳まれており（useMonsters が isOwned の真偽を載せるだけ）、
              個体数はどこにも無い。同じ discovered を2回、片方は誤った
              ラベルで出していた。
              所持の取得に失敗している間（ownedDegraded）は discovered が
              全部 0 に落ちるので、0 を事実として出さず "—" にする
              （home の species owned と同じ扱い）。
            */}
            <p className="mt-1.5 text-[12.5px] leading-7 text-text-dim">
              discovered{" "}
              <b className="text-accent">{ownedDegraded ? "—" : progress.discovered}</b>
              {" / "}
              {progress.total}
              {" · "}進化/覚醒＝<span className="text-accent">活動由来</span>
            </p>
            {/* 召喚でしか埋まらない枠は別に数える（働けば埋まる枠と行動が違う） */}
            {progress.summonOnlyTotal > 0 && (
              <p className="mt-0.5 text-[11px] text-text-faint">
                うち召喚専用{" "}
                <b className="tabular-nums text-rune">
                  {ownedDegraded ? "—" : progress.summonOnlyDiscovered}
                </b>
                {" / "}
                {progress.summonOnlyTotal}
              </p>
            )}
            {/* 図鑑進捗バー: 数の羅列より「あとどれくらいか」を一目で読めるように。
                所持が読めていないときは 0% のバーが「1体も持っていない」と
                読めてしまうので、バーごと出さない */}
            {progress.total > 0 && !ownedDegraded && (
              <div className="mt-2.5 max-w-[340px]">
                <div className="h-1.5 overflow-hidden rounded-[2px] bg-bg-elev-2">
                  <div
                    aria-label={`図鑑進捗 ${progress.discovered} / ${progress.total}`}
                    aria-valuemax={progress.total}
                    aria-valuemin={0}
                    aria-valuenow={progress.discovered}
                    className="h-full bg-accent"
                    role="progressbar"
                    style={{
                      width: `${(progress.discovered / progress.total) * 100}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-text-faint">{nextFillHint}</p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="レアリティで絞り込み">
            {FILTERS.map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(f)}
                  className={[
                    // 指で狙う前提の最小高さ（従来は約28pxで、隣のボタンと誤爆しやすかった）
                    "inline-flex min-h-9 items-center rounded-[4px] border px-3 text-[11px] transition-colors",
                    active
                      ? "border-accent/40 bg-accent/[0.08] text-accent"
                      : "border-line-strong text-text-dim hover:text-text",
                  ].join(" ")}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {/* 素材（育成の燃料）— 詳細は /items */}
        {inventoryItems.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[4px] border border-line bg-bg-elev px-3.5 py-2 text-[11px]">
            <span className="text-[9px] uppercase tracking-[0.12em] text-text-faint">MATERIALS</span>
            {inventoryItems.slice(0, MATERIALS_PREVIEW_COUNT).map((item) => (
              <span className="text-text-dim" key={item.itemId}>
                {item.name}
                <span className="ml-1 tabular-nums text-text">×{item.quantity}</span>
              </span>
            ))}
            {/* 7件目以降を黙って落とさない（活動ログの「直近N件 / 取得済みN件」と同じ方針） */}
            {inventoryItems.length > MATERIALS_PREVIEW_COUNT && (
              <span className="text-text-faint">
                他{inventoryItems.length - MATERIALS_PREVIEW_COUNT}件
              </span>
            )}
            <Link
              className="ml-auto text-[10px] text-text-faint underline underline-offset-4 hover:text-accent"
              href="/items"
            >
              インベントリ →
            </Link>
          </div>
        )}

        {/* FAVORITE / partner banner */}
        <div
          className="mt-4 flex items-center gap-3 rounded-[4px] border px-3.5 py-2.5 text-[12px]"
          style={{
            background: partnerMonster
              ? `${RARITY_COLOR[partnerMonster.rarity]}14`
              : "var(--bg-elev)",
            borderColor: partnerMonster
              ? `${RARITY_COLOR[partnerMonster.rarity]}88`
              : "var(--line)",
          }}
        >
          {partnerMonster ? (
            <>
              <span className="shrink-0 text-[10px] uppercase tracking-[0.12em] text-text-faint">
                FAVORITE / 連れている
              </span>
              <MonsterVisual
                artworkByStage={partnerMonster.artworkByStage}
                assetUrl={partnerMonster.assetUrl}
                className="size-7 shrink-0"
                formStage={partnerMonster.formStage}
                id={partnerMonster.id}
                awakeningState={partnerMonster.awakeningState}
                level={partnerMonster.level}
                name={partnerMonster.name}
                sizes="28px"
              />
              <b
                className="shrink-0 whitespace-nowrap"
                style={{ color: RARITY_COLOR[partnerMonster.rarity] }}
              >
                {partnerMonster.name}
              </b>
              <span className="ml-auto min-w-0 truncate text-[10px] text-text-faint">
                カードをクリックで変更（獲得済みのみ）
              </span>
            </>
          ) : (
            <span className="text-text-faint">
              モンスターカードをクリックしてパートナー（連れ歩き）に設定できます。
            </span>
          )}
        </div>

        {/* messages */}
        {loading && <TermLoading className="mt-4" lines={["query dex --all", "join dex --owned"]} />}
        {error && <p className="mt-4 text-[13px] text-pink">error: {error}</p>}
        {ownedDegraded && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded border border-pink/30 bg-pink/10 px-3 py-2 text-[12px] text-pink">
            <span>所持情報を取得できませんでした — 所持状態・レベルは現在正しく表示されていません。</span>
            <button className="text-text underline underline-offset-4" onClick={() => void refetch()} type="button">
              再読み込み
            </button>
          </div>
        )}
        {/*
          操作の成否はここ（ページ上部）ではなく、操作したカードの中に出す。
          MonsterCard 内の InlineActionResult を参照。
        */}

        {/* grouped dex */}
        <div className="mt-4 space-y-2">
          {visibleGroups.map(({ rarity, items }) => {
            const got = items.filter((m) => m.isOwned).length;
            return (
              <section key={rarity} aria-label={`${rarity} monsters`}>
                <div className="mb-3.5 mt-8 flex items-center gap-2.5">
                  <RarityChip rarity={rarity} />
                  <span className="text-[11px] tabular-nums text-text-dim">
                    {got}/{items.length} discovered
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-r from-line to-transparent" />
                </div>
                <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-4">
                  {items.map((m) => (
                    <MonsterCard
                      key={m.id}
                      monster={m}
                      isPartner={m.id === partnerId}
                      cosmetic={m.slug ? (cosmeticBySlug.get(m.slug) ?? null) : null}
                      hasPurchasableSkin={m.slug ? slugsWithSkins.has(m.slug) : false}
                      isRecent={recentlyAcquiredIds.has(m.id)}
                      mint={matchMintToOwnedMonster(mints, m.ownedMonsterId)}
                      busy={{
                        levelingUp: levelingUp === m.id,
                        evolving: evolving === m.id,
                        changingPath: changingPath === m.id,
                      }}
                      result={
                        cardResult != null && cardResult.monsterId === m.id
                          ? cardResult
                          : null
                      }
                      onSetPartner={() => void handleSetPartner(m)}
                      onLevelUp={() => void handleLevelUp(m)}
                      onEvolve={() => openConfirm({ kind: "evolve", monster: m })}
                      onChangePath={() =>
                        openConfirm({ kind: "change-path", monster: m })
                      }
                    />
                  ))}
                </div>
              </section>
            );
          })}
          {/* 絞り込みで空になったときに行き止まりにしない。どの条件で空なのかを
              言い、そこから戻る手段（絞り込み解除）を同じ場所に置く。
              ConsoleEmptyState は href 前提なので、様式だけ合わせたボタンにする */}
          {!loading && visibleGroups.length === 0 && (
            <div className="mt-8 border border-dashed border-line-strong bg-bg-elev px-5 py-12 text-center">
              <p className="text-[12px] text-text-dim">
                {filter === "all"
                  ? "表示できるモンスターがいません。"
                  : `レアリティ ${filter} に該当するモンスターがいません。`}
              </p>
              {filter !== "all" && (
                <button
                  className="mt-3 inline-flex min-h-9 items-center rounded-[4px] border border-accent/40 bg-accent/[0.08] px-4 text-[12px] font-semibold text-accent transition-[filter] hover:brightness-110"
                  onClick={() => setFilter("all")}
                  type="button"
                >
                  絞り込みを解除 →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 進化・路線変更の確認（消費・残数・分岐を実行前に開示） */}
      {pendingAction && (
        <EvolutionConfirmModal
          error={confirmError}
          inFlight={confirmInFlight}
          inventoryKnown={inventoryKnown}
          items={inventoryItems}
          onCancel={cancelConfirm}
          onConfirm={() => void confirmPendingAction()}
          request={pendingAction}
        />
      )}
    </>
  );
}

function MonsterCard({
  monster: m,
  isPartner,
  cosmetic,
  hasPurchasableSkin,
  isRecent,
  mint,
  busy,
  result,
  onSetPartner,
  onLevelUp,
  onEvolve,
  onChangePath,
}: {
  monster: Monster;
  isPartner: boolean;
  cosmetic: { masteryLevel: number; lineName: string; skinId: string } | null;
  hasPurchasableSkin: boolean;
  isRecent: boolean;
  mint: CommemorativeMintPlate | undefined;
  busy: { levelingUp: boolean; evolving: boolean; changingPath: boolean };
  /** このカードへの直近操作の結果。操作したボタンの隣に表示する。 */
  result: CardActionResult | null;
  onSetPartner: () => void;
  onLevelUp: () => void;
  onEvolve: () => void;
  onChangePath: () => void;
}) {
  const c = RARITY_COLOR[m.rarity];
  const awakened = isMonsterAwakened(m);
  const berserk = m.awakeningState === "BERSERK";
  const evoStage = evolutionStage(m);
  const canEvolve = canEvolveMonster(m);
  const canLevelUp = canLevelUpMonster(m);
  const levelUpCost = getMonsterLevelUpCost(m.level);
  const acquisitionHint = buildAcquisitionHint(m);
  /*
   * 出自PR（どの仕事から仲間になったか）。repositoryFullName と prNumber が
   * 揃った個体だけ組める。BE 未対応・召喚出身・欠損データでは null になり、
   * 行ごと出さない（推測して埋めない）。
   */
  const originPr = m.isOwned
    ? buildPrRef(m.acquisition?.repositoryFullName, m.acquisition?.prNumber)
    : null;

  // art tint by activity state (green evolution / gold awaken / pink berserk)
  const artBorder = berserk
    ? "rgba(255,123,114,0.55)"
    : awakened
      ? "var(--grade-5)"
      : m.isOwned
        ? "var(--line)"
        : "var(--line)";
  const artShadow = berserk
    ? "inset 0 0 22px rgba(255,123,114,0.2)"
    : awakened
      ? "inset 0 0 22px rgba(255,240,192,0.26)"
      : "none";

  return (
    <div
      onClick={m.isOwned && !isPartner ? onSetPartner : undefined}
      className="relative rounded-[8px] p-3 transition-colors"
      style={{
        background: m.isOwned ? "var(--bg-elev)" : "var(--bg-elev-2)",
        borderStyle: m.isOwned ? "solid" : "dashed",
        borderWidth: isPartner ? 2 : 1,
        borderColor: isPartner ? c : m.isOwned ? `${c}66` : "var(--line-strong)",
        opacity: m.isOwned ? 1 : 0.5,
        boxShadow: isPartner
          ? `0 0 0 1px ${c}, 0 8px 24px rgba(0,0,0,0.4)`
          : m.isOwned && m.rarity === "SSR"
            ? `inset 0 0 22px ${c}1a`
            : "none",
        cursor: m.isOwned ? "pointer" : "not-allowed",
      }}
    >
      {isRecent && (
        <span className="absolute -top-2.5 left-2.5 rounded-[2px] border border-accent/50 bg-bg px-1.5 py-0.5 text-[9px] font-extrabold tracking-[0.1em] text-accent">
          NEW
        </span>
      )}
      {isPartner && (
        <span
          className="absolute -top-2.5 right-2.5 rounded-[2px] px-2 py-0.5 text-[9px] font-bold tracking-[0.1em]"
          style={{ background: c, color: "#0b0f0d" }}
        >
          ★ FAVORITE
        </span>
      )}

      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] text-text-faint">#{m.id.slice(0, 8)}</span>
        <RarityChip rarity={m.rarity} />
      </div>

      {/* portrait */}
      <div
        className="relative flex items-center justify-center overflow-hidden rounded-[5px] border text-[54px]"
        style={{
          aspectRatio: "1 / 0.72",
          background: m.isOwned
            ? `radial-gradient(circle at 50% 42%, ${c}29 0%, transparent 68%), var(--bg-elev-2)`
            : "var(--bg-elev-2)",
          borderColor: artBorder,
          boxShadow: artShadow,
        }}
      >
        {m.isOwned ? (
          <MonsterVisual
            artworkByStage={m.artworkByStage}
            assetUrl={m.assetUrl}
            className="size-full"
            formStage={m.formStage}
            id={m.id}
            awakeningState={m.awakeningState}
            level={m.level}
            name={m.name}
            sizes="160px"
          />
        ) : (
          <span className="text-text-faint">?</span>
        )}
      </div>

      {/* name */}
      <div
        className="mt-2.5 text-[13px] font-semibold"
        style={{ color: m.isOwned ? "var(--text)" : "var(--text-faint)" }}
      >
        {m.isOwned ? m.name : "???"}
      </div>

      {/* meta */}
      <div className="mt-0.5 text-[10px] leading-6 text-text-faint">
        status:{" "}
        {m.isOwned ? (
          <span className="text-accent">caught · {m.attributeName ?? "soul"} × {m.soulCount}</span>
        ) : (
          <span className="text-pink">not_found</span>
        )}
      </div>

      {/*
        未所持の枠に「どうすれば埋まるのか」を出す（JS-7）。
        召喚専用は琥珀＋限定召喚への導線、PRで取れるものは緑で導線なし。
        prAcquirable が未取得のあいだは何も出さない（推測しない）。
      */}
      {acquisitionHint && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={`inline-flex items-center rounded-[2px] border px-[7px] py-px text-[9px] font-bold tracking-[0.08em] ${
              acquisitionHint.paid
                ? "border-rune-border bg-rune-bg text-rune"
                : "border-accent/30 bg-accent/[0.08] text-accent"
            }`}
          >
            {acquisitionHint.text}
          </span>
          {acquisitionHint.route && (
            <Link
              className="text-[10px] text-rune underline underline-offset-2 hover:brightness-125"
              href={acquisitionHint.route.href}
              onClick={(event) => event.stopPropagation()}
            >
              {acquisitionHint.route.label} →
            </Link>
          )}
        </div>
      )}

      {/* activity-derived badges (green fame / gold awaken / pink berserk) */}
      {m.isOwned && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          <span
            className="inline-flex items-center gap-1 rounded-[2px] border border-accent/30 bg-accent/[0.08] px-[7px] py-px text-[9px] font-bold tracking-[0.08em] text-accent"
          >
            Lv.{m.level}
            {evoStage > 0 && <> · 進化{"★".repeat(evoStage)}</>}
          </span>
          {awakened && !berserk && (
            <span className="inline-flex items-center rounded-[2px] border border-grade-5/40 bg-grade-5/[0.08] px-[7px] py-px text-[9px] font-bold tracking-[0.08em] text-grade-5">
              覚醒
            </span>
          )}
          {berserk && (
            <span className="inline-flex items-center rounded-[2px] border border-pink/40 bg-pink/[0.08] px-[7px] py-px text-[9px] font-bold tracking-[0.08em] text-pink">
              暴走
            </span>
          )}
          {cosmetic && (
            <Link
              href={`/forge?skin=${encodeURIComponent(cosmetic.skinId)}`}
              onClick={(event) => event.stopPropagation()}
              title={`${cosmetic.lineName} スキン装備（コスメ・見た目のみ）— 工房で深化`}
              className="inline-flex items-center rounded-[2px] border border-rune-border bg-rune-bg px-[7px] py-px text-[9px] font-bold tracking-[0.08em] text-rune hover:brightness-125"
            >
              ⚒ St{cosmetic.masteryLevel} · COSMETIC
            </Link>
          )}
        </div>
      )}

      {/* management actions (real functionality, kept subtle) */}
      {m.isOwned && (
        <div className="mt-2 space-y-1" onClick={(e) => e.stopPropagation()}>
          {/*
            パートナー設定はカード全体の onClick にしか無く、キーボード・
            スクリーンリーダーからは到達できなかった（div の onClick）。
            10px のキャプションで説明するより、実体のあるボタンを置く。
            マウスのカードクリックはそのまま残す。
          */}
          {!isPartner && (
            <button
              className="w-full rounded border border-line-strong px-2 py-1 text-[10px] text-text-dim transition-colors hover:text-text"
              onClick={onSetPartner}
              type="button"
            >
              ★ 連れる
            </button>
          )}
          {canLevelUp && (
            <button
              type="button"
              onClick={onLevelUp}
              disabled={m.soulCount < levelUpCost || busy.levelingUp}
              className="w-full rounded border border-accent/40 px-2 py-1 text-[10px] text-accent transition-opacity hover:bg-accent/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {busy.levelingUp ? "…" : `Lv UP (${levelUpCost} ${m.attributeName ?? "soul"})`}
            </button>
          )}
          {canEvolve && (
            <button
              type="button"
              onClick={onEvolve}
              disabled={busy.evolving}
              className="w-full rounded border border-purple/40 px-2 py-1 text-[10px] text-purple transition-opacity hover:bg-purple/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {busy.evolving ? "…" : `進化 (Lv${MONSTER_EVOLUTION_LEVEL}+)`}
            </button>
          )}
          {awakened && (
            <button
              type="button"
              onClick={onChangePath}
              disabled={busy.changingPath}
              className="w-full rounded border border-line-strong px-2 py-1 text-[10px] text-text-dim transition-opacity hover:text-text disabled:cursor-not-allowed disabled:opacity-30"
            >
              {busy.changingPath ? "…" : "路線変更"}
            </button>
          )}
          {!canLevelUp && !canEvolve && m.level >= MONSTER_MAX_LEVEL && (
            <div className="rounded border border-line py-1 text-center text-[10px] font-bold tracking-widest text-text-faint">
              Lv.{MONSTER_MAX_LEVEL}
            </div>
          )}
          {/* 操作結果は操作したボタンの真下に出す（ページ上部で叫ばない） */}
          {result && (
            <InlineActionResult title={result.title} tone={result.tone}>
              {result.detail}
            </InlineActionResult>
          )}
        </div>
      )}

      {/*
        出自PR: フッター位置に1行だけ・faint（カードの情報密度を守る）。
        owner/repo 形式を検証できたときだけ GitHub へのリンクにする
        （home の活動ログと同じ検証 = lib/prUrl）。prTitle は tooltip で補足。
      */}
      {originPr && (
        <div
          className="mt-2 truncate text-[10px] leading-4 text-text-faint"
          title={m.acquisition?.prTitle ?? undefined}
        >
          {originPr.url ? (
            <a
              className="underline-offset-2 hover:text-accent hover:underline"
              href={originPr.url}
              onClick={(event) => event.stopPropagation()}
              rel="noreferrer noopener"
              target="_blank"
            >
              {originPr.label}
            </a>
          ) : (
            <span>{originPr.label}</span>
          )}
          {" より仲間になった"}
        </div>
      )}

      {/*
        愛着が湧いた相棒の隣に棚を置く（demand-first）。
        既にスキンを着せている相棒こそ次を見たい層なので、cosmetic の有無では隠さない。
        ただしそのモンスターのスキンが1つも無いなら出さない（空棚への導線は嘘のアフォーダンス）。
      */}
      {m.isOwned && m.slug && hasPurchasableSkin && (
        <Link
          className="mt-2 block rounded border border-rune-border bg-rune-bg px-2 py-1 text-center text-[10px] text-rune transition-[filter] hover:brightness-125"
          href={`/shop/skins?monster=${encodeURIComponent(m.slug)}`}
          onClick={(event) => event.stopPropagation()}
        >
          ◨ {cosmetic ? "別のスキンを見る" : "このモンスターのスキンを見る"}
        </Link>
      )}

      {mint && <CommemorativePlate className="mt-3" plate={mint} />}
    </div>
  );
}
