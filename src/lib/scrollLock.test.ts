import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createScrollLock, type LockableElement } from "./scrollLock";

function element(overflow = ""): LockableElement {
  return { style: { overflow } };
}

describe("createScrollLock", () => {
  it("locks on the first acquire and restores on the last release", () => {
    const lock = createScrollLock();
    const body = element("auto");

    const release = lock.acquire(body);
    assert.equal(body.style.overflow, "hidden");

    release();
    assert.equal(body.style.overflow, "auto");
    assert.equal(lock.count(), 0);
  });

  it("keeps the page locked while a second modal is still open", () => {
    // /pass の年齢確認 → 解約確認のように2枚重なる画面が実在する。
    // 1枚目が閉じただけで背後が動き出さないこと。
    const lock = createScrollLock();
    const body = element("auto");

    const releaseFirst = lock.acquire(body);
    const releaseSecond = lock.acquire(body);
    assert.equal(lock.count(), 2);

    releaseFirst();
    assert.equal(body.style.overflow, "hidden", "2枚目が開いている間は解除しない");

    releaseSecond();
    assert.equal(body.style.overflow, "auto");
  });

  it("never double-decrements when the same release runs twice", () => {
    // React 18 StrictMode は effect のクリーンアップを2回流しうる
    const lock = createScrollLock();
    const body = element("auto");

    const release = lock.acquire(body);
    const releaseOther = lock.acquire(body);
    release();
    release();

    assert.equal(lock.count(), 1, "カウントが負に振れていない");
    assert.equal(body.style.overflow, "hidden");

    releaseOther();
    assert.equal(body.style.overflow, "auto");
  });

  it("does not restore a borrowed 'hidden' as the original value", () => {
    // 2枚目が元の値を覚えると "hidden" を復元してしまい、全部閉じても戻らない
    const lock = createScrollLock();
    const body = element("");

    const first = lock.acquire(body);
    const second = lock.acquire(body);
    second();
    first();

    assert.equal(body.style.overflow, "");
  });
});
