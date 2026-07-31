/**
 * 課金導線の計測。
 *
 * 目的は「どこで落ちているか」を数字にすること。UIを直しても
 * 良くなったのか分からない状態を終わらせるためのもので、
 * 個人の行動を追うためのものではない。
 *
 * 設計上の約束:
 * - 名前はサーバの列挙と一致させる。ズレたものはサーバが 400 で弾く
 *   （黙って捨てると「そのステップでは誰も落ちていない」という
 *   もっともらしい集計が出る）
 * - **計測の失敗でアプリを止めない**。送信は捨て置きで、例外は外に出さない
 * - 画面表示の計測は1セッション1回。再レンダーで水増しすると、
 *   到達率の分母が壊れて判断を誤る
 */
export const FUNNEL_EVENTS = [
  "SUMMON_VIEWED",
  "SUMMON_EXECUTED",
  "PITY_REACHED",
  "SHOP_VIEWED",
  "RUNE_SHOP_VIEWED",
  "PASS_VIEWED",
  "CHECKOUT_STARTED",
  "CHECKOUT_COMPLETED",
] as const;

export type FunnelEventName = (typeof FUNNEL_EVENTS)[number];

export type FunnelEventPayload = {
  name: FunnelEventName;
  occurredAt: string;
  properties: Record<string, string>;
};

/** サーバ側の上限と同じ。超える分は送る前に落とす。 */
export const FUNNEL_BATCH_LIMIT = 50;
export const FUNNEL_PROPERTY_KEY_LIMIT = 8;
export const FUNNEL_PROPERTY_VALUE_LENGTH = 120;

/**
 * 値を上限に収める。サーバは超過を拒否するので、
 * 送る前にこちらで落とす（1件の長さでバッチ全体を失わない）。
 */
export function normalizeProperties(
  properties: Record<string, string | number | boolean | null | undefined>,
): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value == null) continue;
    if (Object.keys(normalized).length >= FUNNEL_PROPERTY_KEY_LIMIT) break;
    normalized[key] = String(value).slice(0, FUNNEL_PROPERTY_VALUE_LENGTH);
  }
  return normalized;
}

type Sender = (payload: { events: FunnelEventPayload[] }) => void;

export type FunnelTracker = {
  /** 未送信の件数（テストと診断のため）。 */
  readonly pending: number;
  flush: () => void;
  /** 1セッション1回だけ送る。画面表示など、繰り返し発火しうるもの向け。 */
  trackOnce: (name: FunnelEventName, properties?: Record<string, string>) => void;
  track: (name: FunnelEventName, properties?: Record<string, string>) => void;
};

/**
 * 送信は呼び出し側が渡す。ブラウザAPIに触らないので、そのままテストできる。
 */
export function createFunnelTracker(options: {
  now?: () => Date;
  send: Sender;
}): FunnelTracker {
  const now = options.now ?? (() => new Date());
  const queue: FunnelEventPayload[] = [];
  const sentOnce = new Set<string>();

  const flush = () => {
    if (queue.length === 0) return;
    const batch = queue.splice(0, FUNNEL_BATCH_LIMIT);
    try {
      options.send({ events: batch });
    } catch {
      // 計測の失敗でアプリを止めない。再送もしない（欠測より事故のほうが高い）。
    }
  };

  const track: FunnelTracker["track"] = (name, properties = {}) => {
    queue.push({ name, occurredAt: now().toISOString(), properties });
    if (queue.length >= FUNNEL_BATCH_LIMIT) flush();
  };

  return {
    flush,
    get pending() {
      return queue.length;
    },
    track,
    trackOnce: (name, properties = {}) => {
      if (sentOnce.has(name)) return;
      sentOnce.add(name);
      track(name, properties);
    },
  };
}
