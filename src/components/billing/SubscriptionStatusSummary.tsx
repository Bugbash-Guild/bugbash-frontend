import { toPassStatusPresentation } from "@/lib/billing/subscriptionPass";
import type { SubscriptionStatus } from "@/types/billing";

type SubscriptionStatusSummaryProps = {
  loading: boolean;
  subscription: SubscriptionStatus;
};

export function SubscriptionStatusSummary({
  loading,
  subscription,
}: SubscriptionStatusSummaryProps) {
  const presentation = toPassStatusPresentation(subscription);

  if (loading) {
    return <div className="mt-4 h-24 border border-line bg-bg" />;
  }

  return (
    <>
      <dl className="mt-4 space-y-3 text-[12px]">
        <div className="flex justify-between gap-3">
          <dt className="text-text-faint">プラン</dt>
          <dd className="text-right text-text">
            {subscription.plan ?? "未加入"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-text-faint">ステータス</dt>
          <dd className="text-right text-text">{presentation.statusLabel}</dd>
        </div>
        {presentation.periodEndText && (
          <div className="flex justify-between gap-3">
            <dt className="text-text-faint">期間</dt>
            <dd className="max-w-64 text-right text-text">
              {presentation.periodEndText}
            </dd>
          </div>
        )}
      </dl>

      {subscription.cancelScheduled && (
        <div className="mt-4 border border-gold/40 bg-gold/10 px-3 py-2 text-[12px] leading-5 text-gold">
          {presentation.periodEndText}
        </div>
      )}
    </>
  );
}
