"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ConsoleEmptyState } from "@/components/ConsoleEmptyState";
import { ConsoleTopbar } from "@/components/ConsoleTopbar";
import { TermLoading } from "@/components/TermLoading";
import { ItemVisual } from "@/components/ItemVisual";
import { useAuth } from "@/hooks/useAuth";
import { useInventory } from "@/hooks/useInventory";
import { useUseItem } from "@/hooks/useUseItem";
import type { InventoryItem, UseItemResponse } from "@/types/inventory";

/*
 * 棚のマス数。BE に持ち物の上限は無い（在庫は種類ごとの行で、容量の概念が無い）ため、
 * これは「棚の見た目」であって容量ではない。容量として読ませないよう、
 * 見出しでも "N slots" とは言わない（存在しない上限を示唆しない）。
 * 狭幅6列 / sm以上9列 のどちらでも端数が出ないよう 18 の倍数で刻む。
 */
const SLOT_GRID_STEP = 18;
const MIN_STORAGE_SLOTS = 36;

const CATEGORY_LABEL: Record<InventoryItem["category"], string> = {
  EVOLUTION: "evolution",
  SOUL_PACK: "soul pack",
};

// 通貨マーク（💎）は付けない: InventoryItem に購入通貨の情報がなく、
// SOUL_PACK はコインでも買えるため category からは判定できない
// （コイン由来のアイテムに課金通貨マークが付く誤表示になっていた）。
// BE に購入通貨フラグが来るまで区別表示自体を行わない。

export default function ItemsPage() {
  const { isAuthenticated } = useAuth();
  const { items, loading, error, refetch } = useInventory(isAuthenticated);
  const { consume, loading: useLoading, error: useError, reset: resetUseError } = useUseItem();
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [useResult, setUseResult] = useState<UseItemResponse | null>(null);
  const [refetching, setRefetching] = useState(false);
  const activeItemIdRef = useRef<string | null>(null);
  // 狭幅では SELECTED パネルがグリッドの下に回り込む。スロットを押しても
  // 画面内は選択枠が動くだけで、名前も説明も USE ボタンも画面外にある。
  const detailPanelRef = useRef<HTMLDivElement | null>(null);


  async function handleUseItem(itemId: string) {
    resetUseError();
    setUseResult(null);
    activeItemIdRef.current = itemId;
    const result = await consume(itemId).catch(() => null);
    if (result && activeItemIdRef.current === itemId) {
      setUseResult(result);
      setRefetching(true);
      try {
        await refetch();
      } finally {
        setRefetching(false);
      }
    }
  }

  function selectSlot(idx: number) {
    setSelectedIdx(idx);
    setUseResult(null);
    resetUseError();
    activeItemIdRef.current = null;
    // 既に見えているときは "nearest" が何もしないので、PC の横並びでは無害。
    detailPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const storageCount = Math.max(
    MIN_STORAGE_SLOTS,
    Math.ceil(items.length / SLOT_GRID_STEP) * SLOT_GRID_STEP,
  );
  const occupied = items.length;
  const selectedItem = items[selectedIdx] ?? null;

  // ホットキー（issue #128）: 1–9 で先頭9スロットを選択、E で選択アイテムを使用
  // （使用可能な SOUL_PACK のみ）。ホットバー枠は STORAGE 1行目の複製で
  // 実機能が無かったため撤去済み。キー操作だけを残している。
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }
      if (event.key >= "1" && event.key <= "9") {
        const idx = Number(event.key) - 1;
        if (items[idx]) selectSlot(idx);
        return;
      }
      if (event.key === "e" || event.key === "E") {
        const item = items[selectedIdx];
        if (
          item &&
          item.category === "SOUL_PACK" &&
          item.quantity > 0 &&
          !useLoading &&
          !refetching
        ) {
          void handleUseItem(item.itemId);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, selectedIdx, useLoading, refetching]);

  return (
    <>
      <ConsoleTopbar command="inv --grid" path="~/items" showWallet />
      <div className="px-4 py-5 md:px-9 md:py-6">
        {/* page header */}
        <div className="mb-4">
          <h1 className="text-[28px] font-semibold tracking-[-0.015em]">Inventory</h1>
          {/* 旧: "27 slots · 3 occupied"。上限が無いのに容量があるように読めた
              （所持が増えると slots 側も勝手に増えていた）。実数だけ言う */}
          <p className="mt-1.5 text-[12.5px] text-text-dim">
            <b className="text-accent">{occupied}</b> 種類を所持
          </p>
        </div>

        {loading && <TermLoading className="mb-4" lines={["query inventory --grid"]} />}
        {/* 他画面（図鑑・ランキング・工房）と同じく、失敗をその場でやり直せるようにする */}
        {error && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded border border-pink/30 bg-pink/10 px-3 py-2 text-[12px] text-pink">
            <span>持ち物を読み込めませんでした。</span>
            <button
              className="text-text underline underline-offset-4 hover:text-accent"
              onClick={() => void refetch()}
              type="button"
            >
              再読み込み
            </button>
          </div>
        )}

        {/* 空スロットの壁を無言で見せない。何を入れる場所かと入手先を案内する。 */}
        {!loading && !error && occupied === 0 && (
          <ConsoleEmptyState
            action={{ href: "/summon", label: "召喚で素材を引く" }}
            className="mb-4"
            glyph="🎒"
            message="持ち物はまだ空です。魂や進化の素材を集めて、相棒モンスターの育成に使いましょう。"
          />
        )}

        {/* layout: grid + selected panel */}
        <div className="grid grid-cols-1 items-start gap-[18px] xl:grid-cols-[minmax(0,1fr)_260px]">
          {/* LEFT: storage（ホットバーは1行目の複製で実機能なしのため置かない） */}
          <div className="min-w-0 rounded-[6px] border border-line bg-bg-elev">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
              <span className="text-[10px] uppercase tracking-[0.12em] text-text-faint">STORAGE</span>
              <span className="text-[10px] text-text-faint">
                {/* ホットキーは USE ボタンの [E] にしか出ておらず、1–9 は誰にも見えていなかった。
                    物理キーボードが前提の幅でだけ案内する */}
                <span className="hidden sm:inline">[1]–[9] 選択 · [E] 使用 · </span>
                {occupied} 種類
              </span>
            </div>
            <div className="p-3.5">
              {/* 9列固定だと 360px 幅で1マス約29px（指で狙うには小さい）。
                  狭幅は6列に落として、どちらの列数でも端数の出ないマス数にしている */}
              <div className="grid grid-cols-6 gap-[5px] sm:grid-cols-9">
                {Array.from({ length: storageCount }).map((_, idx) => (
                  <Slot
                    key={idx}
                    item={items[idx] ?? null}
                    selected={selectedIdx === idx}
                    onSelect={() => selectSlot(idx)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: selected item detail panel */}
          <div className="rounded-[6px] border border-line bg-bg-elev" ref={detailPanelRef}>
            <div className="border-b border-line px-4 py-2.5">
              <span className="text-[10px] uppercase tracking-[0.12em] text-text-faint">SELECTED</span>
            </div>
            <div className="p-4">
              {selectedItem ? (
                <>
                  <div
                    className="flex aspect-square max-h-[150px] w-full items-center justify-center rounded-[5px] border border-line text-[64px]"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 40%, rgba(126,231,135,0.08) 0%, transparent 70%), var(--bg-elev-2)",
                    }}
                  >
                    <ItemVisual
                      alt={selectedItem.name}
                      assetUrl={selectedItem.assetUrl}
                      className="size-full"
                      imageClassName="p-3"
                      sizes="220px"
                    />
                  </div>

                  <div className="mt-3 text-[14px] font-semibold leading-tight">
                    {selectedItem.name}
                  </div>

                  <p className="mt-1.5 text-[11px] leading-relaxed text-text-dim">
                    {selectedItem.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[11px] text-text-faint">
                    <span>
                      kind: <span className="text-text">{CATEGORY_LABEL[selectedItem.category]}</span>
                    </span>
                    <span>
                      qty: <span className="tabular-nums text-accent">×{selectedItem.quantity}</span>
                    </span>
                  </div>

                  {selectedItem.category === "SOUL_PACK" ? (
                    <div className="mt-3.5 space-y-2">
                      <button
                        type="button"
                        disabled={useLoading || refetching || selectedItem.quantity === 0}
                        onClick={() => handleUseItem(selectedItem.itemId)}
                        className="w-full rounded-[4px] border border-accent bg-accent py-2 text-[12px] font-bold tracking-[0.05em] text-bg transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {useLoading ? "使用中…" : "USE [E]"}
                      </button>

                      {useResult && (
                        <div
                          role="status"
                          aria-live="polite"
                          className="space-y-1 rounded-[4px] border border-accent/20 bg-accent/[0.06] p-2.5 text-[11px]"
                        >
                          <div className="font-bold text-accent">使用しました</div>
                          {/* 桁区切りは他画面のXP・残高と揃える */}
                          <div className="text-text-faint">
                            <span className="capitalize">{useResult.attribute}</span> 属性に{" "}
                            <span className="text-accent">
                              +{useResult.soulsAdded.toLocaleString("ja-JP")}
                            </span>{" "}
                            ソウル付与
                          </div>
                          <div className="text-text-faint">
                            合計:{" "}
                            <span className="text-text">
                              {useResult.soulsAfter.toLocaleString("ja-JP")}
                            </span>{" "}
                            ソウル
                          </div>
                          {/* 魂を使った直後を行き止まりにしない。次の一歩へ。 */}
                          <Link
                            className="inline-block pt-0.5 text-text underline underline-offset-4 hover:text-accent"
                            href="/monsters"
                          >
                            相棒のレベルアップへ →
                          </Link>
                        </div>
                      )}

                      {useError && (
                        <div
                          role="alert"
                          aria-live="assertive"
                          className="rounded-[4px] border border-pink/20 bg-pink/[0.06] p-2.5 text-[11px] text-pink"
                        >
                          {useError.message}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3.5 rounded-[4px] border border-line bg-bg-elev-2 p-2.5 text-[11px] leading-relaxed text-text-faint">
                      このアイテムは{" "}
                      <Link className="text-accent underline underline-offset-2" href="/monsters">
                        モンスター画面
                      </Link>{" "}
                      で進化・覚醒に使用します。
                    </p>
                  )}
                </>
              ) : (
                <div className="text-[11px] leading-relaxed text-text-faint">
                  no item selected
                  <br />
                  <span className="opacity-60">click a slot to inspect</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Slot({
  item,
  selected,
  onSelect,
}: {
  item: InventoryItem | null;
  selected: boolean;
  onSelect: () => void;
}) {
  if (!item) {
    return (
      <div
        aria-hidden
        className="aspect-square rounded-[4px] border border-dashed border-line"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${item.name} ×${item.quantity}`}
      aria-pressed={selected}
      className="relative flex aspect-square items-center justify-center rounded-[4px] border transition-shadow"
      style={{
        background: selected ? "var(--bg-elev)" : "var(--bg-elev-2)",
        borderColor: selected ? "rgba(126,231,135,0.55)" : "var(--line)",
        boxShadow: selected
          ? "0 0 0 2px rgba(126,231,135,0.15), inset 0 0 12px rgba(126,231,135,0.14)"
          : "none",
      }}
    >
      <ItemVisual
        alt={item.name}
        assetUrl={item.assetUrl}
        className="size-full"
        imageClassName="p-1"
        sizes="48px"
      />
      <span
        className="pointer-events-none absolute bottom-0.5 right-1 text-[10px] font-bold leading-none tabular-nums text-text"
        style={{ textShadow: "1px 1px 0 #000" }}
      >
        {item.quantity}
      </span>
    </button>
  );
}
