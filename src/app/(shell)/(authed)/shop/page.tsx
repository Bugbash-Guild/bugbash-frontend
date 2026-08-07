"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { mutate } from "swr";

import { useTrackScreenView } from "@/hooks/useFunnelTracking";
import { useAuth } from "@/hooks/useAuth";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import { useShop } from "@/hooks/useShop";
import { useInventory } from "@/hooks/useInventory";
import { usePurchase } from "@/hooks/usePurchase";
import { ItemVisual } from "@/components/ItemVisual";
import { LegalFooter } from "@/components/LegalFooter";
import { ConsoleTopbar } from "@/components/ConsoleTopbar";
import { ConsoleEmptyState } from "@/components/ConsoleEmptyState";
import { InlineActionResult } from "@/components/InlineActionResult";
import { TermLoading } from "@/components/TermLoading";
import { ShopTabs } from "@/components/ShopTabs";
import { ShopSectionList } from "@/components/shop/ShopSectionList";
import {
  buildShopPurchasePresentation,
  formatShopCurrencyAmount,
  isShopPurchaseBlocked,
  mapShopPurchaseErrorMessage,
  shopBalanceForCurrency,
} from "@/lib/shopPresentation";
import { findShopTab } from "@/lib/shopNav";
import { buildShopSections } from "@/lib/shopSections";
import type { ShopItem } from "@/types/shop";

const ITEMS_TAB = findShopTab("items");

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

  const [selected, setSelected] = useState<ShopItem | null>(null);
  const [successFlash, setSuccessFlash] = useState<string | null>(null);
  const selectedPresentation = selected
    ? buildShopPurchasePresentation(selected, { guildCoinBalance, runeBalance })
    : null;
  // 確認モーダルの「現在の残高 → 購入後の残高」。残高が未取得（null）の間は
  // 計算せず「—」で示す（分かっていない値を断定しない）。
  const selectedBalance = selected
    ? shopBalanceForCurrency(selected.currency, { guildCoinBalance, runeBalance })
    : null;
  // 用途で区切り、組み合わせ商品（属性×サイズ）は1つに畳む
  const sections = useMemo(() => buildShopSections(items), [items]);


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

  return (
    <>
      <ConsoleTopbar command="./browse --shop-items" path="~/shop" showWallet />
      <div className="px-4 py-5 md:px-9 md:py-6 min-h-screen">
        {/*
          この画面だけ見出しが無く、タブのラベルだけが手掛かりだった。
          何を買う場所で何を支払うのかを、他のショップ画面と同じ形で述べる。
        */}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[20px] font-semibold text-text">{ITEMS_TAB.label}</h1>
            <p className="mt-1 max-w-2xl text-[12px] leading-6 text-text-dim">
              {ITEMS_TAB.purpose}
              <span className="ml-2 text-text-faint">支払い: {ITEMS_TAB.cost}</span>
            </p>
          </div>
          <ShopTabs current="items" />
        </div>

        {successFlash && (
          /*
            以前は3秒で消えるフラッシュだけで、買ったアイテムをどこで使うのかに
            繋がっていなかった（購入 → 何も起きない → 離脱）。
            消さずに次の行動への導線を残す。
          */
          <div className="mb-4">
            <InlineActionResult
              action={{ href: "/monsters", label: "相棒に使う" }}
              title="購入しました"
              tone="success"
            >
              {successFlash}
            </InlineActionResult>
          </div>
        )}

        {loading ? (
          <TermLoading lines={["query shop.items --currency=all"]} />
        ) : items.length === 0 ? (
          <ConsoleEmptyState
            action={{ href: "/summon", label: "召喚へ" }}
            glyph="▣"
            message="現在販売中のアイテムはありません。入荷までお待ちください。"
          />
        ) : (
          <ShopSectionList
            balances={{ guildCoinBalance, runeBalance }}
            onSelect={setSelected}
            sections={sections}
          />
        )}

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
                  <Link className="ml-3 text-text underline-offset-4 hover:underline" href="/shop/runes">
                    ルーンを購入する
                  </Link>
                )}
              </div>
            )}

            {purchaseError && (
              <div className="mb-3 px-3 py-2 bg-pink/10 border border-pink/30 rounded text-[12px] text-pink">
                {mapShopPurchaseErrorMessage(
                  selected,
                  { guildCoinBalance, runeBalance },
                  purchaseError.status,
                )}
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
