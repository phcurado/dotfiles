import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { spawnSync } from "node:child_process";

// Publishes Pi's state (working, idle, waiting for approval) to tpane through a tmux pane option.
export default function (pi: ExtensionAPI) {
  const pane = process.env.TMUX_PANE;
  if (!process.env.TMUX || !pane || process.env.PI_SUBAGENT_CHILD === "1") return;

  let working = false;
  let approvals = 0;
  let unsubscribe: (() => void) | undefined;

  function setState(value?: string) {
    const args = value === undefined
      ? ["set-option", "-u", "-p", "-t", pane, "@tpane_push_state"]
      : ["set-option", "-p", "-t", pane, "@tpane_push_state", value];
    spawnSync("tmux", args, { stdio: "ignore" });
  }

  function publish() {
    setState(approvals > 0 ? "approval" : working ? "working" : "idle");
  }

  pi.on("session_start", (_event, ctx) => {
    working = !ctx.isIdle();
    approvals = 0;
    unsubscribe = pi.events.on("pi:approval", (data) => {
      approvals = Math.max(0, approvals + ((data as { active: boolean }).active ? 1 : -1));
      publish();
    });
    publish();
  });

  pi.on("agent_start", () => {
    working = true;
    publish();
  });

  pi.on("agent_settled", () => {
    working = false;
    publish();
  });

  pi.on("session_shutdown", () => {
    unsubscribe?.();
    unsubscribe = undefined;
    setState();
  });
}
