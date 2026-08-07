"use client";

import Link from "next/link";
import { useEffect } from "react";
import { FiX } from "react-icons/fi";

import { ItemVisual } from "@/components/ItemVisual";
import type { InventoryItem } from "@/types/inventory";
import type { Monster } from "@/types/monster";

/** 進化系操作の確認リクエスト。カードのボタン押下からページ経由で渡ってくる。 */
export type EvolutionActionRequest = {
  kind: "evolve" | "change-path";
  monster: Monster;
};

/**
 * 消費アイテムの開示内容。
 * quantity はインベントリが正常取得できているときだけ実数。
 * 取得できていない間は null（＝「断定しない」。0 と偽って実行を塞がない）。
 */
export type ConsumedItemDisclosure = {
  assetUrl: string | null;
  itemId: string;
  name: string;
  quantity: number | null;
};

/*
 * itemId と表示名の対応は BE の正に一致させている:
 * - EvolveMonsterUseCase: evolution-stone を 1 個消費（Lv50 以上・NORMAL のみ）
 * - ChangeEvolutionPathUseCase: AWAKENED→BERSERK は abyss-proof、
 *   BERSERK→AWAKENED は purification-proof を 1 個消費
 * - 名称は ShopItemsTable シード（進化の輝石 / 深淵の証 / 浄化の証）
 * 表示名はインベントリ応答があればそちらを優先し、未所持で一覧に
 * 含まれないときのフォールバックとしてのみこの定数を使う。
 */
const EVOLUTION_STONE_ID = "evolution-stone";
const PROOF_BY_CURRENT_STATE = {
  AWAKENED: "abyss-proof",
  BERSERK: "purification-proof",
} as const;
const FALLBACK_ITEM_NAME: Record<string, string> = {
  "abyss-proof": "深淵の証",
  [EVOLUTION_STONE_ID]: "進化の輝石",
  "purification-proof": "浄化の証",
};

/** 覚醒状態の表示名。未知の値はそのまま見せる（推測して別の名前を付けない）。 */
export function awakeningPathLabel(value: unknown): string {
  if (value === "AWAKENED") return "覚醒";
  if (value === "BERSERK") return "暴走";
  return typeof value === "string" && value !== "" ? value : "?";
}

function consumedItemIdFor(request: EvolutionActionRequest): string | null {
  if (request.kind === "evolve") return EVOLUTION_STONE_ID;
  const state = request.monster.awakeningState;
  if (state === "AWAKENED" || state === "BERSERK") {
    return PROOF_BY_CURRENT_STATE[state];
  }
  // NORMAL は路線変更の対象外（カード側もボタンを出さない）。
  return null;
}

/**
 * この操作で消費するアイテムを、インベントリの実データと突き合わせて解決する。
 * ページ側も成功メッセージ（○○ を 1 個消費）で同じ名前を使うため export している。
 */
export function resolveConsumedItem(
  request: EvolutionActionRequest,
  items: InventoryItem[],
  inventoryKnown: boolean,
): ConsumedItemDisclosure | null {
  const itemId = consumedItemIdFor(request);
  if (itemId == null) return null;
  const owned = items.find((item) => item.itemId === itemId);
  return {
    assetUrl: owned?.assetUrl ?? null,
    itemId,
    name: owned?.name ?? FALLBACK_ITEM_NAME[itemId] ?? itemId,
    // インベントリが読めているのに一覧に無い＝所持 0。読めていない間は断定しない。
    quantity: inventoryKnown ? (owned?.quantity ?? 0) : null,
  };
}

function PathChip({ path }: { path: "AWAKENED" | "BERSERK" }) {
  // 配色はカードの覚醒/暴走バッジと同じ（gold系=覚醒 / pink=暴走）。
  const classes =
    path === "AWAKENED"
      ? "border-grade-5/40 bg-grade-5/[0.08] text-grade-5"
      : "border-pink/40 bg-pink/[0.08] text-pink";
  return (
    <span
      className={`inline-flex items-center rounded-[2px] border px-2 py-0.5 text-[10px] font-bold tracking-[0.08em] ${classes}`}
    >
      {awakeningPathLabel(path)}
    </span>
  );
}

type EvolutionConfirmModalProps = {
  error: string | null;
  inFlight: boolean;
  /** インベントリが正常取得できているか。false の間は残数を「—」で出す。 */
  inventoryKnown: boolean;
  items: InventoryItem[];
  onCancel: () => void;
  onConfirm: () => void;
  request: EvolutionActionRequest;
};

/**
 * 進化・路線変更の確認モーダル。
 *
 * どちらもアイテムを消費する不可逆寄りの操作なのに、以前はボタン即実行だった。
 * 「何を何個消費し、使ったら何個残り、結果がどう分岐するか」を実行前に
 * すべて開示し、キャンセルできるようにする（Wave 1・倫理規律）。
 * 見た目と作法は既存の確認モーダル（BadgeCosmeticConfirmModal / shop の
 * 購入確認）を踏襲: 背景クリックと Esc で閉じる・実行中は閉じられない。
 */
export function EvolutionConfirmModal({
  error,
  inFlight,
  inventoryKnown,
  items,
  onCancel,
  onConfirm,
  request,
}: EvolutionConfirmModalProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !inFlight) onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [inFlight, onCancel]);

  const { kind, monster } = request;
  const consumed = resolveConsumedItem(request, items, inventoryKnown);
  // 対象外の状態（NORMAL への路線変更など）で開かれたら何も出さない。
  if (consumed == null) return null;

  const shortage = consumed.quantity != null && consumed.quantity < 1;
  const currentState = monster.awakeningState;
  const nextState: "AWAKENED" | "BERSERK" | null =
    kind === "change-path"
      ? currentState === "AWAKENED"
        ? "BERSERK"
        : currentState === "BERSERK"
          ? "AWAKENED"
          : null
      : null;
  // 路線を戻すときに消費する証（= 変更後の状態から変更するときの消費アイテム）。
  const reverseItemId = nextState ? PROOF_BY_CURRENT_STATE[nextState] : null;
  const reverseItemName = reverseItemId
    ? (items.find((item) => item.itemId === reverseItemId)?.name ??
      FALLBACK_ITEM_NAME[reverseItemId])
    : null;

  return (
    <div
      aria-labelledby="evolution-confirm-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={() => {
        if (!inFlight) onCancel();
      }}
      role="dialog"
    >
      <div
        className="w-full max-w-md border border-purple/50 bg-bg-elev shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-purple">
              {kind === "evolve" ? "EVOLUTION CONFIRM" : "PATH CHANGE CONFIRM"}
            </div>
            <h2
              className="mt-1 text-[15px] font-semibold text-text"
              id="evolution-confirm-title"
            >
              {kind === "evolve"
                ? `${monster.name} を進化させますか？`
                : `${monster.name} の路線を変更しますか？`}
            </h2>
          </div>
          <button
            aria-label="確認画面を閉じる"
            className="flex size-9 items-center justify-center text-text-dim hover:text-text disabled:opacity-50"
            disabled={inFlight}
            onClick={onCancel}
            type="button"
          >
            <FiX aria-hidden size={18} />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {/* 結果の開示（実行前に「何が起こるか」を全部言う） */}
          <div className="border border-line bg-bg p-3">
            <div className="flex items-center justify-between gap-2 text-[12px]">
              <span className="font-semibold text-text">{monster.name}</span>
              <span className="text-text-dim">Lv.{monster.level}</span>
            </div>
            {kind === "evolve" ? (
              <>
                {/*
                  50% / 50% は BE 実装の事実
                  （EvolutionPathSelectorConfig: Random.nextBoolean() →
                  AWAKENED / BERSERK）。BE がセレクタを差し替えて確率を
                  変えた場合は、この表記も必ず追従させること。
                  確認できない確率をここに書いてはならない。
                */}
                <p className="mt-2 text-[11px] text-text-dim">
                  進化結果は選べません。ランダムに分岐します:
                </p>
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-text-dim">
                  <PathChip path="AWAKENED" />
                  <span className="tabular-nums">50%</span>
                  <span className="text-text-faint">/</span>
                  <PathChip path="BERSERK" />
                  <span className="tabular-nums">50%</span>
                </div>
                <p className="mt-2 text-[11px] leading-5 text-text-faint">
                  分岐した路線は、あとから「路線変更」（証アイテムを消費）で
                  切り替えられます。
                </p>
              </>
            ) : (
              nextState && (
                <>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-text-dim">
                    {currentState === "AWAKENED" || currentState === "BERSERK" ? (
                      <PathChip path={currentState} />
                    ) : null}
                    <span aria-hidden>→</span>
                    <PathChip path={nextState} />
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-text-faint">
                    結果はランダムではなく、必ず
                    {awakeningPathLabel(nextState)}になります。
                    {reverseItemName &&
                      `元に戻す場合は ${reverseItemName} ×1 が別途必要です。`}
                  </p>
                </>
              )
            )}
          </div>

          {/* 消費の開示: アイテム名・個数・使用後の残数 */}
          <dl className="space-y-2 text-[11px]">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-text-faint">消費するアイテム</dt>
              <dd className="flex items-center gap-1.5 text-text">
                <ItemVisual
                  alt={consumed.name}
                  assetUrl={consumed.assetUrl}
                  className="size-5"
                  sizes="20px"
                />
                {consumed.name}
                <span className="text-text-dim">×1</span>
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-text-faint">現在の所持数</dt>
              <dd className="tabular-nums text-text">
                {consumed.quantity ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-text-faint">使用後の残数</dt>
              <dd className="tabular-nums text-text">
                {consumed.quantity != null
                  ? Math.max(0, consumed.quantity - 1)
                  : "—"}
              </dd>
            </div>
          </dl>

          {/* 不足していれば実行前に言う（押してからサーバーエラーで知らせない） */}
          {shortage && (
            <div className="border border-pink/30 bg-pink/10 px-3 py-3 text-[11px] leading-5 text-pink">
              <p>
                {consumed.name} が不足しています（必要: 1 / 所持:{" "}
                {consumed.quantity}）。
              </p>
              <Link
                className="mt-2 inline-block text-text underline underline-offset-4"
                href="/shop"
              >
                育成アイテムショップで入手 →
              </Link>
            </div>
          )}

          {/* 残数が読めない間は 0 と断定せず、実行は塞がない（判定はサーバーが行う） */}
          {consumed.quantity == null && (
            <p className="text-[10px] leading-4 text-text-faint">
              所持数を確認できませんでした。不足している場合は実行時にエラーになります。
            </p>
          )}

          {error && (
            <div className="border border-pink/30 bg-pink/10 px-3 py-3 text-[11px] leading-5 text-pink">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              className="border border-line px-3 py-2 text-[12px] text-text-dim hover:bg-bg-elev-2 disabled:opacity-50"
              disabled={inFlight}
              onClick={onCancel}
              type="button"
            >
              キャンセル
            </button>
            <button
              className="flex min-w-28 items-center justify-center gap-2 bg-purple px-3 py-2 text-[12px] font-semibold text-bg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={inFlight || shortage}
              onClick={onConfirm}
              type="button"
            >
              {inFlight && (
                <span className="size-3.5 animate-spin rounded-full border border-bg border-t-transparent" />
              )}
              {inFlight
                ? "実行中…"
                : kind === "evolve"
                  ? "進化する"
                  : "路線変更する"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
