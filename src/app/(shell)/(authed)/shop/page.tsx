"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { mutate } from "swr";

import { useTrackScreenView } from "@/hooks/useFunnelTracking";
import { useAuth } from "@/hooks/useAuth";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import { useRuneProducts } from "@/hooks/useRuneProducts";
import { useShop } from "@/hooks/useShop";
import { useInventory } from "@/hooks/useInventory";
import { usePurchase } from "@/hooks/usePurchase";
import { useSubscriptionPlan } from "@/hooks/useSubscriptionPlan";
import { ItemVisual } from "@/components/ItemVisual";
import { LegalFooter } from "@/components/LegalFooter";
import { ConsoleTopbar } from "@/components/ConsoleTopbar";
import { InlineActionResult } from "@/components/InlineActionResult";
import { TermLoading } from "@/components/TermLoading";
import { RuneChargeSection } from "@/components/shop/RuneChargeSection";
import { uniformUnitPriceJpy } from "@/lib/billing/runeConversion";
import {
  buildShopPurchasePresentation,
  formatShopCurrencyAmount,
  isShopPurchaseBlocked,
  mapShopPurchaseErrorMessage,
  shopBalanceForCurrency,
  type ShopBalances,
} from "@/lib/shopPresentation";
import {
  buildShopSections,
  type ShopVariantGroup,
  variantItemsForAttribute,
} from "@/lib/shopSections";
import type { ShopItem } from "@/types/shop";

/**
 * ショップは1枚。
 *
 * 以前は RUNES / ITEMS / SKINS / PASS の4タブ構成で、買い物の前に
 * 「どのタブに何があるか」という構造を学ばせていた。ここでは上から
 * チャージ → ルーンの使い道 → コインの使い道 → パス の1本にする。
 * 在庫0のスキンはタブごと消えた（カタログは /shop/skins に残り、
 * 図鑑・フォージの導線から辿れる）。
 *
 * 数字の規律は従来どおり: 表示する価格・換算・上限はすべて API の実値で、
 * 取れないときはその行ごと出さない。
 */

function SectionHeading({
  eyebrow,
  id,
  title,
}: {
  eyebrow: string;
  id: string;
  title: string;
}) {
  return (
    <div className="flex items-baseline gap-2.5">
      <span aria-hidden className="text-[10px] tracking-[0.14em] text-text-faint">
        {eyebrow}
      </span>
      <h2 className="text-[13px] font-semibold text-text" id={id}>
        {title}
      </h2>
    </div>
  );
}

function PriceTag({ balances, item }: { balances: ShopBalances; item: ShopItem }) {
  const presentation = buildShopPurchasePresentation(item, balances);
  return (
    <span
      className={`text-[13px] font-semibold tabular-nums ${
        presentation.affordability === "insufficient" ? "text-pink" : "text-text"
      }`}
    >
      {presentation.priceLabel}
    </span>
  );
}

function ItemRow({
  balances,
  item,
  onSelect,
}: {
  balances: ShopBalances;
  item: ShopItem;
  onSelect: (item: ShopItem) => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-3 border-t border-line px-4 py-3 text-left transition-colors first:border-t-0 hover:bg-bg-elev-2"
      onClick={() => onSelect(item)}
      type="button"
    >
      <ItemVisual
        alt={item.name}
        assetUrl={item.assetUrl}
        className="size-8 shrink-0"
        sizes="32px"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-text">{item.name}</span>
        {item.description && (
          <span className="block truncate text-[11px] text-text-faint">{item.description}</span>
        )}
      </span>
      <PriceTag balances={balances} item={item} />
    </button>
  );
}

/**
 * 属性魂パック。API の 6属性 × 3サイズ = 18商品を、
 * 「属性チップ + サイズ行」の1カードに畳む（畳み方は shopSections）。
 */
function AttributePackCard({
  balances,
  group,
  onSelect,
}: {
  balances: ShopBalances;
  group: ShopVariantGroup;
  onSelect: (item: ShopItem) => void;
}) {
  const [attribute, setAttribute] = useState(group.attributes[0]?.value ?? "");
  const rows = variantItemsForAttribute(group, attribute);
  const selectedLabel =
    group.attributes.find((a) => a.value === attribute)?.label ?? attribute;

  return (
    <div className="flex flex-col gap-3 border border-line bg-bg-elev p-4">
      <h3 className="text-[13px] font-semibold text-text">{group.title}</h3>

      <div aria-label="属性を選ぶ" className="flex flex-wrap gap-1.5" role="group">
        {group.attributes.map((a) => {
          const active = a.value === attribute;
          return (
            <button
              aria-pressed={active}
              className={`border px-2.5 py-1 text-[12px] transition-colors ${
                active
                  ? "border-rune-border bg-rune-bg text-rune"
                  : "border-line text-text-dim hover:border-line-strong hover:text-text"
              }`}
              key={a.value}
              onClick={() => setAttribute(a.value)}
              type="button"
            >
              {a.label}
            </button>
          );
        })}
      </div>

      <div className="-mx-4 -mb-4 mt-auto border-t border-line">
        {rows.length === 0 ? (
          <p className="px-4 py-3 text-[12px] text-text-faint">
            {selectedLabel}の在庫がありません。
          </p>
        ) : (
          rows.map(({ item, size }) => (
            <button
              className="flex w-full items-center gap-3 border-t border-line px-4 py-2.5 text-left transition-colors first:border-t-0 hover:bg-bg-elev-2"
              key={item.itemId}
              onClick={() => onSelect(item)}
              type="button"
            >
              <span className="w-10 shrink-0 text-[13px] font-semibold text-text">
                {size.label}
              </span>
              <span className="min-w-0 flex-1 truncate text-[11px] text-text-faint">
                {item.description || item.name}
              </span>
              <PriceTag balances={balances} item={item} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  useTrackScreenView("SHOP_VIEWED");
  const { isAuthenticated } = useAuth();
  const {
    items,
    guildCoinBalance,
    runeBalance,
    loading,
    refetch: refetchShop,
  } = useShop(isAuthenticated);
  const { refetch: refetchInventory } = useInventory(isAuthenticated);
  const { purchase, loading: purchasing, error: purchaseError, reset: resetPurchase } = usePurchase();
  /*
   * SWR キーは RuneChargeSection と同じ（/api/billing/rune-products）なので
   * fetch は1本。ここでは見出しの単価宣言と限定召喚カードの表示条件に使う。
   */
  const {
    limitedHardPityPull,
    limitedSingleCostRune,
    products: runeProducts,
  } = useRuneProducts(isAuthenticated);
  const { plan } = useSubscriptionPlan();

  const [selected, setSelected] = useState<ShopItem | null>(null);
  const [successFlash, setSuccessFlash] = useState<string | null>(null);
  const balances: ShopBalances = { guildCoinBalance, runeBalance };
  const selectedPresentation = selected
    ? buildShopPurchasePresentation(selected, balances)
    : null;
  // 確認モーダルの「現在の残高 → 購入後の残高」。残高が未取得（null）の間は
  // 計算せず「—」で示す（分かっていない値を断定しない）。
  const selectedBalance = selected
    ? shopBalanceForCurrency(selected.currency, balances)
    : null;

  /*
   * 全パックが同一の整数単価のときだけ「1ルーン = ¥N」を宣言する。
   * 定数のハードコードではなく実際の商品データから検証する — BEが単価を
   * 変えたら、この行は嘘をつく前に消える（コードが裏付けない数字を表示しない）。
   */
  const uniformRateJpy = useMemo(() => uniformUnitPriceJpy(runeProducts), [runeProducts]);

  // 用途で区切り、組み合わせ商品（属性×サイズ）は1つに畳む
  const sections = useMemo(() => buildShopSections(items), [items]);
  const variantGroups = useMemo(() => sections.flatMap((s) => s.variantGroups), [sections]);
  const soloItems = useMemo(() => sections.flatMap((s) => s.items), [sections]);
  // ルーン建ての単独商品（現状は無いが、増えたときはルーンの段に出す）
  const runeSoloItems = useMemo(
    () => soloItems.filter((item) => item.currency === "RUNE"),
    [soloItems],
  );
  /*
   * コイン建ての単独商品は畳んでおく。輝石・証・ランダム魂パックは
   * どれも通常召喚の結果を個別に買う位置づけで、主役は召喚のほう。
   */
  const coinItems = useMemo(
    () => soloItems.filter((item) => item.currency !== "RUNE"),
    [soloItems],
  );
  const coinSummaryNames = useMemo(() => {
    const names = coinItems.slice(0, 3).map((item) => item.name);
    return names.join("・") + (coinItems.length > 3 ? " ほか" : "");
  }, [coinItems]);

  function closeModal() {
    if (purchasing) return;
    setSelected(null);
    resetPurchase();
  }

  // Esc の自前ハンドラは共通フックへ集約（Tab 循環と背後のスクロールロックも同時に入る）。
  // open は描画条件と同じ式にする。ずれると、出ていないモーダルのために背後が固まる。
  const purchasePanelRef = useModalDismiss({
    // 購入処理中は閉じない（closeModal の既存ガードと同じ条件）
    dismissible: !purchasing,
    onDismiss: closeModal,
    open: selected != null && selectedPresentation != null,
  });

  async function handleConfirm() {
    if (!selected) return;
    try {
      const res = await purchase(selected.itemId);
      setSelected(null);
      resetPurchase();
      setSuccessFlash(`${res.itemName}（所持: ${res.itemQuantity}）`);
      await Promise.all([refetchShop(), refetchInventory(), mutate("/api/billing/wallet")]);
    } catch {
      // エラーは usePurchase の error state からモーダル内に表示される
    }
  }

  function scrollToCharge() {
    closeModal();
    document.getElementById("charge")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <ConsoleTopbar command="./shop" path="~/shop" showWallet />
      <div className="min-h-screen px-4 py-5 md:px-9 md:py-6">
        <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="text-[20px] font-semibold text-text">ショップ</h1>
          {/* 単価宣言。実データで全SKU同一の整数単価と確認できたときだけ出る */}
          {uniformRateJpy != null && (
            <p className="text-[12px] text-text-dim">
              1ルーン = ¥{uniformRateJpy.toLocaleString("ja-JP")}（全パック同一単価・税込）
            </p>
          )}
        </div>

        {successFlash && (
          /*
            以前は3秒で消えるフラッシュだけで、買ったアイテムをどこで使うのかに
            繋がっていなかった（購入 → 何も起きない → 離脱）。
            消さずに次の行動への導線を残す。
          */
          <div className="mb-5">
            <InlineActionResult
              action={{ href: "/monsters", label: "相棒に使う" }}
              title="購入しました"
              tone="success"
            >
              {successFlash}
            </InlineActionResult>
          </div>
        )}

        <div className="flex flex-col gap-8">
          <RuneChargeSection isAuthenticated={isAuthenticated} />

          <section aria-labelledby="spend-heading" className="flex flex-col gap-2.5">
            <SectionHeading eyebrow="SPEND" id="spend-heading" title="ルーンでできること" />

            {loading ? (
              <TermLoading lines={["query shop.items --currency=all"]} />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                  {variantGroups.map((group) => (
                    <AttributePackCard
                      balances={balances}
                      group={group}
                      key={group.key}
                      onSelect={setSelected}
                    />
                  ))}

                  {/* 記念鋳造。価格は解禁ごとの画面が実値で述べるので、ここでは言わない */}
                  <div className="flex flex-col gap-2 border border-line bg-bg-elev p-4">
                    <h3 className="text-[13px] font-semibold text-text">記念鋳造</h3>
                    <p className="text-[11px] leading-6 text-text-dim">
                      実績の瞬間を記念プレートにします。実績そのものは無料で、購入権に期限はありません。
                    </p>
                    <div className="mt-auto flex justify-end">
                      <Link
                        className="text-[11px] text-accent underline-offset-4 hover:underline"
                        href="/mints"
                      >
                        解禁済みを見る →
                      </Link>
                    </div>
                  </div>

                  {/* 限定召喚。開催の根拠（開示APIの正のコスト）が取れた時だけ出す */}
                  {limitedSingleCostRune != null && (
                    <div className="flex flex-col gap-2 border border-line bg-bg-elev p-4">
                      <h3 className="text-[13px] font-semibold text-text">限定召喚</h3>
                      <p className="text-[11px] leading-6 text-text-dim">
                        限定モンスターの召喚。確率は全て開示
                        {limitedHardPityPull != null &&
                          `、天井${limitedHardPityPull.toLocaleString("ja-JP")}回（持ち越しあり）`}
                        、復刻あり。
                      </p>
                      <div className="mt-auto flex items-baseline justify-between gap-3">
                        <span className="text-[11px] text-text-dim">
                          {limitedSingleCostRune.toLocaleString("ja-JP")}ルーン/回
                          {uniformRateJpy != null &&
                            `（¥${(limitedSingleCostRune * uniformRateJpy).toLocaleString("ja-JP")}）`}
                        </span>
                        <Link
                          className="text-[11px] text-accent underline-offset-4 hover:underline"
                          href="/summon/limited"
                        >
                          召喚へ →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {runeSoloItems.length > 0 && (
                  <div className="border border-line bg-bg-elev">
                    {runeSoloItems.map((item) => (
                      <ItemRow
                        balances={balances}
                        item={item}
                        key={item.itemId}
                        onSelect={setSelected}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          <section aria-labelledby="coins-heading" className="flex flex-col gap-2.5">
            <SectionHeading eyebrow="COINS" id="coins-heading" title="コインのつかいみち" />

            {/*
              コイン建てSKUは召喚結果の単品売りで、召喚に対して割高になる設計
              （docs/superpowers/specs/2026-08-07-shop-economy-analysis.md）。
              その事実を隠して並べるより、先に召喚を薦めて単品は畳んでおく。
            */}
            <div className="flex flex-wrap items-center gap-3 border border-line bg-bg-elev px-4 py-3.5">
              <p className="text-[12px] text-text">
                コインのいちばん効率のいい使い道は通常召喚です。
              </p>
              <div className="ml-auto">
                <Link
                  className="inline-block border border-accent px-4 py-1.5 text-[11px] text-accent transition-colors hover:bg-accent hover:text-bg"
                  href="/summon"
                >
                  通常召喚へ →
                </Link>
              </div>
            </div>

            {loading ? null : coinItems.length > 0 ? (
              <details className="group border border-line">
                <summary className="cursor-pointer list-none px-4 py-2.5 text-[11px] text-text-faint transition-colors hover:text-text-dim [&::-webkit-details-marker]:hidden">
                  <span aria-hidden className="group-open:hidden">▸</span>
                  <span aria-hidden className="hidden group-open:inline">▾</span>
                  <span className="ml-2">その他のアイテム（{coinSummaryNames}）</span>
                </summary>
                <div className="border-t border-line bg-bg-elev">
                  {coinItems.map((item) => (
                    <ItemRow
                      balances={balances}
                      item={item}
                      key={item.itemId}
                      onSelect={setSelected}
                    />
                  ))}
                </div>
              </details>
            ) : (
              <p className="text-[11px] text-text-faint">
                現在コインで買える単品アイテムはありません。
              </p>
            )}
          </section>

          {/* パス（課金圏は琥珀）。価格・特典の数値はサーバの実値のみ */}
          <section
            aria-labelledby="pass-heading"
            className="flex flex-wrap items-center gap-4 border border-gold/40 bg-bg-elev-2 px-4 py-4"
          >
            <div className="min-w-0">
              <h2 className="text-[13px] font-semibold text-gold" id="pass-heading">
                冒険者パス
                {plan != null && (
                  <span className="ml-2 text-[11px] font-normal text-text-dim">
                    ¥{plan.priceJpyTaxIncluded.toLocaleString("ja-JP")}/月（税込）
                  </span>
                )}
              </h2>
              <p className="mt-1 text-[11px] leading-5 text-text-dim">
                {plan != null
                  ? `毎月${plan.monthlyRuneGrant.toLocaleString("ja-JP")}ルーン ・ PRマージ時の相棒魂×${plan.partnerSoulMultiplier} ・ 天井短縮。`
                  : "継続特典つきの月額プランです。"}
                確率は変えず、保証までの回数だけ短くします。
              </p>
            </div>
            <div className="ml-auto">
              <Link
                className="inline-block border border-gold px-4 py-1.5 text-[11px] text-gold transition-colors hover:bg-gold hover:text-bg"
                href="/pass"
              >
                くわしく →
              </Link>
            </div>
          </section>
        </div>

        <LegalFooter />
      </div>

      {/* purchase confirm modal */}
      {selected && selectedPresentation && (
        <div
          role="presentation"
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
          onClick={closeModal}
        >
          {/* dialog はオーバーレイではなくパネル（中身の箱）が名乗る */}
          <div
            ref={purchasePanelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shop-purchase-title"
            className="bg-bg-elev border border-line rounded-lg w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <ItemVisual
                alt={selected.name}
                assetUrl={selected.assetUrl}
                className="size-8"
                sizes="32px"
              />
              <div>
                <div id="shop-purchase-title" className="text-[14px] text-text font-semibold">
                  {selected.name} を購入しますか?
                </div>
                <div className="text-[11px] text-text-faint">
                  {formatShopCurrencyAmount(selected.currency, selected.price)} を消費します
                </div>
              </div>
            </div>
            <div className="text-[12px] text-text-dim mb-3">{selected.description}</div>

            {/* 押す前に「引いた後いくら残るか」まで開示する */}
            <div className="mb-3 border-y border-line py-2.5 text-[12px] text-text-dim">
              <div className="flex justify-between gap-3">
                <span>現在の残高</span>
                <span className="text-text">
                  {selectedBalance != null
                    ? formatShopCurrencyAmount(selected.currency, selectedBalance)
                    : "—"}
                </span>
              </div>
              <div className="mt-1 flex justify-between gap-3">
                <span>購入後の残高</span>
                <span className="text-text">
                  {selectedBalance != null && selectedBalance >= selected.price
                    ? formatShopCurrencyAmount(selected.currency, selectedBalance - selected.price)
                    : "—"}
                </span>
              </div>
            </div>

            {selectedPresentation.cosmeticNotice && (
              <div className="mb-3 border border-accent/30 bg-accent/10 px-3 py-2 text-[12px] leading-5 text-accent">
                {selectedPresentation.cosmeticNotice}
              </div>
            )}

            {selectedPresentation.insufficientMessage && (
              <div className="mb-3 border border-pink/30 bg-pink/10 px-3 py-2 text-[12px] leading-5 text-pink">
                {selectedPresentation.insufficientMessage}
                {selectedPresentation.showRuneTopUpLink && (
                  /* チャージ売り場は同じページの先頭に居る。遷移せず連れて行く */
                  <button
                    className="ml-3 text-text underline-offset-4 hover:underline"
                    onClick={scrollToCharge}
                    type="button"
                  >
                    ルーンをチャージする
                  </button>
                )}
              </div>
            )}

            {purchaseError && (
              <div className="mb-3 px-3 py-2 bg-pink/10 border border-pink/30 rounded text-[12px] text-pink">
                {mapShopPurchaseErrorMessage(selected, balances, purchaseError.status)}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              {/* 初期フォーカスはキャンセル側に。残高が減る操作を Enter 連打で走らせない */}
              <button
                data-autofocus
                onClick={closeModal}
                disabled={purchasing}
                className="px-3 py-1.5 text-[12px] text-text-dim border border-line rounded hover:bg-bg-elev-2"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirm}
                disabled={purchasing || isShopPurchaseBlocked(selectedPresentation)}
                className="px-3 py-1.5 text-[12px] text-bg bg-accent rounded hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {purchasing ? "購入中…" : "購入する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
