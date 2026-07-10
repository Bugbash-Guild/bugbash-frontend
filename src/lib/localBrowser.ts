import { spawn } from "node:child_process";

type LocalBrowserOpenPlan = {
  args: string[];
  command: string;
};

function assertLoopbackReviewUrl(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Browser target must be a loopback HTTP review URL");
  }
  if (
    parsed.protocol !== "http:" ||
    (parsed.hostname !== "127.0.0.1" && parsed.hostname !== "localhost")
  ) {
    throw new Error("Browser target must be a loopback HTTP review URL");
  }
}

export function planLocalBrowserOpen(
  url: string,
  platform: NodeJS.Platform = process.platform,
): LocalBrowserOpenPlan {
  assertLoopbackReviewUrl(url);
  if (platform === "darwin") return { args: [url], command: "open" };
  if (platform === "win32") {
    return { args: ["/c", "start", "", url], command: "cmd" };
  }
  return { args: [url], command: "xdg-open" };
}

export function openLocalBrowser(url: string): Promise<boolean> {
  const plan = planLocalBrowserOpen(url);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (opened: boolean) => {
      if (settled) return;
      settled = true;
      resolve(opened);
    };

    try {
      const child = spawn(plan.command, plan.args, {
        detached: true,
        shell: false,
        stdio: "ignore",
        windowsHide: true,
      });
      child.once("error", () => finish(false));
      child.once("spawn", () => {
        child.unref();
        finish(true);
      });
    } catch {
      finish(false);
    }
  });
}
