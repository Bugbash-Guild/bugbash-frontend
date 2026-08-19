import Link from "next/link";

/**
 * 資金不足の案内。コインとルーンで非対称にするのが核心（D-1 系統分離）:
 * - coin（名声通貨・獲得のみ）: 購入導線を出さない。「PRをマージして集める」
 * - rune（課金通貨）: /shop への導線を出す
 * ボタン側は非表示にせず disabled + 本コンポーネントで理由を明示する。
 */
export function BalanceShortfall({
  currency,
  required,
  balance,
}: {
  currency: "coin" | "rune";
  required?: number;
  balance?: number;
}) {
  const amounts =
    required != null && balance != null ? (
      <>
        （必要 {required.toLocaleString("ja-JP")} / 残高 {balance.toLocaleString("ja-JP")}）
      </>
    ) : null;

  if (currency === "coin") {
    return (
      <p className="rounded-[4px] border border-line bg-bg-elev-2 px-3 py-2 text-[11px] leading-5 text-text-dim">
        🪙 ギルドコインが足りません{amounts}。PR をマージして集めましょう（購入はできません）。
      </p>
    );
  }

  return (
    <p className="rounded-[4px] border border-rune-border bg-rune-bg px-3 py-2 text-[11px] leading-5 text-rune">
      💎 ルーンが足りません{amounts}。{" "}
      <Link className="text-text underline underline-offset-4 hover:text-rune" href="/shop">
        ルーンを購入する →
      </Link>
    </p>
  );
}
