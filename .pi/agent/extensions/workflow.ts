import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

/* plan -> build -> review. jj only. Plan anchors a new jj change; review
 * diffs that change. No working-tree bleed. */

const STATE = "workflow-plan";
type Plan = { ref: string; task: string };

function lastPlan(ctx: ExtensionCommandContext): Plan | null {
  const entries = ctx.sessionManager.getEntries();
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (e.type === "custom" && e.customType === STATE) return e.data as Plan;
  }
  return null;
}

async function jj(pi: ExtensionAPI, cwd: string, ...args: string[]) {
  const r = await pi.exec("jj", args, { cwd });
  if (r.code !== 0) throw new Error(`jj ${args.join(" ")}: ${r.stderr.trim() || r.stdout.trim()}`);
  return r.stdout.trim();
}

export default function (pi: ExtensionAPI) {
  pi.registerCommand("plan", {
    description: "Anchor a jj change and run the planner subagent (stops for review)",
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const task = args.trim() || "the current request";
      try {
        await jj(pi, ctx.cwd, "new", "-m", `plan: ${task}`);
        const ref = await jj(pi, ctx.cwd, "log", "-r", "@", "-T", "change_id", "--no-graph");
        pi.appendEntry(STATE, { ref, task });
        ctx.ui.notify(`Anchored jj change ${ref.slice(0, 12)}`, "success");
      } catch (err) {
        ctx.ui.notify(String(err), "error");
        return;
      }
      pi.sendUserMessage(
        `Invoke the planner subagent for: ${task}. ` +
          `Present its plan exactly as returned, then append on a new line: ` +
          `"➜ /plan <refinement> to update · /build to implement". ` +
          `If user replies in free text, redirect them to /plan or /build and stop.`,
      );
    },
  });

  pi.registerCommand("build", {
    description: "Implement the plan in the main session, with optional auto-approve",
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const plan = lastPlan(ctx);
      if (!plan) {
        ctx.ui.notify("No plan found. Run /plan first.", "warning");
        return;
      }
      const auto = ctx.hasUI
        ? await ctx.ui.confirm("Auto-approve diffs?", "Press Shift+A on first diff to enable for the run.")
        : false;
      const note = args.trim() ? ` Note: ${args.trim()}.` : "";
      pi.sendUserMessage(
        `Implement the plan, one atomic step at a time.${note} ` +
          `${auto ? "User auto-approves diffs (Shift+A on first). Move fast." : "User gates each diff."} ` +
          `Summarize what changed when done.`,
      );
    },
  });

  pi.registerCommand("review", {
    description: "Reviewer subagent against the scoped jj diff",
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const plan = lastPlan(ctx);
      if (!plan) {
        ctx.ui.notify("No plan found. Run /plan first.", "warning");
        return;
      }
      const focus = args.trim() ? ` Focus: ${args.trim()}.` : "";
      pi.sendUserMessage(
        `Invoke the reviewer subagent.${focus} Scoped diff: \`jj diff -r ${plan.ref}\`.`,
      );
    },
  });
}
