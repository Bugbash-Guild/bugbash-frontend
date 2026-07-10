import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { planLocalBrowserOpen } from "./localBrowser";

describe("local browser launcher", () => {
  it("uses a shell-free platform command for the localhost review URL", () => {
    const url = "http://127.0.0.1:4173";

    assert.deepEqual(planLocalBrowserOpen(url, "darwin"), {
      args: [url],
      command: "open",
    });
    assert.deepEqual(planLocalBrowserOpen(url, "linux"), {
      args: [url],
      command: "xdg-open",
    });
    assert.deepEqual(planLocalBrowserOpen(url, "win32"), {
      args: ["/c", "start", "", url],
      command: "cmd",
    });
  });

  it("refuses to open a non-loopback URL", () => {
    assert.throws(
      () => planLocalBrowserOpen("https://example.com/review", "darwin"),
      /loopback HTTP review URL/,
    );
  });
});
