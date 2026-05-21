import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

/* Hybrid workflow, manually gated. Each command runs one phase and stops, so
 * you review the result (and switch the model yourself if you want) before
 * running the next one.
 *
 * Plan and review run as pi-subagents (own context/model). Build runs in the
 * main session so pi-show-diffs stays live.
 *
 *   /plan [task]  -> planner subagent, presents the plan, stops
 *   (you review; switch model if you want)
 *   /build        -> implement the approved plan in the main session
 *   /review       -> reviewer subagent on the changes */

export default function (pi: ExtensionAPI) {
  pi.registerCommand("plan", {
    description: "Run the planner subagent and present the plan (stops for your review)",
    handler: async (args: string, _ctx: ExtensionCommandContext) => {
      const task = args.trim() || "the current request";
      pi.sendUserMessage(
        `Use the planner subagent to produce an implementation plan for: ${task}. ` +
          `Show me the plan, then stop — do not implement. I will review it and run /build when ready.`,
      );
    },
  });

  pi.registerCommand("build", {
    description: "Implement the approved plan in the main session, step by step",
    handler: async (args: string, _ctx: ExtensionCommandContext) => {
      const note = args.trim() ? ` Note: ${args.trim()}.` : "";
      pi.sendUserMessage(
        `Implement the approved plan here in the main session, one logical step at a time so I see each diff.${note} ` +
          `When done, summarize what changed. I will run /review when ready.`,
      );
    },
  });

  pi.registerCommand("review", {
    description: "Run the reviewer subagent on the current changes",
    handler: async (args: string, _ctx: ExtensionCommandContext) => {
      const focus = args.trim() ? ` Focus: ${args.trim()}.` : "";
      pi.sendUserMessage(
        `Use the reviewer subagent to review the current uncommitted changes (git diff) against the plan and request.${focus}`,
      );
    },
  });
}
