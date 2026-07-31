import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createFunnelTracker,
  FUNNEL_BATCH_LIMIT,
  FUNNEL_PROPERTY_KEY_LIMIT,
  normalizeProperties,
  type FunnelEventPayload,
} from "./analytics";

function recorder() {
  const batches: FunnelEventPayload[][] = [];
  return {
    batches,
    send: (payload: { events: FunnelEventPayload[] }) => batches.push(payload.events),
    get sent() {
      return batches.flat();
    },
  };
}

const now = () => new Date("2026-07-31T00:00:00.000Z");

describe("createFunnelTracker", () => {
  it("holds events until flushed, then sends them as one batch", () => {
    const sink = recorder();
    const tracker = createFunnelTracker({ now, send: sink.send });

    tracker.track("SUMMON_VIEWED");
    tracker.track("SUMMON_EXECUTED", { kind: "ten" });
    assert.equal(sink.batches.length, 0, "溜めている間は送らない");
    assert.equal(tracker.pending, 2);

    tracker.flush();
    assert.equal(sink.batches.length, 1);
    assert.deepEqual(
      sink.sent.map((e) => e.name),
      ["SUMMON_VIEWED", "SUMMON_EXECUTED"],
    );
    assert.equal(sink.sent[1]?.properties.kind, "ten");
    assert.equal(sink.sent[0]?.occurredAt, "2026-07-31T00:00:00.000Z");
  });

  it("sends a page view only once per session", () => {
    // 再レンダーで水増しすると到達率の分母が壊れる。
    const sink = recorder();
    const tracker = createFunnelTracker({ now, send: sink.send });

    tracker.trackOnce("SHOP_VIEWED");
    tracker.trackOnce("SHOP_VIEWED");
    tracker.trackOnce("SHOP_VIEWED");
    tracker.flush();

    assert.equal(sink.sent.length, 1);
  });

  it("still records repeated actions, unlike page views", () => {
    const sink = recorder();
    const tracker = createFunnelTracker({ now, send: sink.send });

    tracker.track("SUMMON_EXECUTED");
    tracker.track("SUMMON_EXECUTED");
    tracker.flush();

    assert.equal(sink.sent.length, 2, "召喚を2回したなら2件");
  });

  it("flushes on its own once the batch limit is reached", () => {
    const sink = recorder();
    const tracker = createFunnelTracker({ now, send: sink.send });

    for (let i = 0; i < FUNNEL_BATCH_LIMIT; i += 1) tracker.track("SUMMON_EXECUTED");

    assert.equal(sink.batches.length, 1, "上限で自動的に送る（無限に溜めない）");
    assert.equal(tracker.pending, 0);
  });

  it("never lets a failed send escape into the app", () => {
    // 計測が落ちて画面が壊れるのは本末転倒。
    const tracker = createFunnelTracker({
      now,
      send: () => {
        throw new Error("network down");
      },
    });

    tracker.track("CHECKOUT_STARTED");
    assert.doesNotThrow(() => tracker.flush());
  });

  it("does nothing when there is nothing to send", () => {
    const sink = recorder();
    const tracker = createFunnelTracker({ now, send: sink.send });

    tracker.flush();

    assert.equal(sink.batches.length, 0);
  });
});

describe("normalizeProperties", () => {
  it("drops nullish values and stringifies the rest", () => {
    assert.deepEqual(
      normalizeProperties({ count: 3, missing: null, ok: true, skipped: undefined }),
      { count: "3", ok: "true" },
    );
  });

  it("trims values and keys to what the server accepts", () => {
    // サーバは超過を拒否する。送る前に落として、1件の長さでバッチを失わない。
    const long = normalizeProperties({ note: "x".repeat(500) });
    assert.equal(long.note?.length, 120);

    const many = normalizeProperties(
      Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`k${i}`, "v"])),
    );
    assert.equal(Object.keys(many).length, FUNNEL_PROPERTY_KEY_LIMIT);
  });
});
