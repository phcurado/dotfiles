import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

type ActiveModel = NonNullable<ExtensionCommandContext["model"]>;

const REVIEW_PROMPT = "Review the work from this session.";
const REVIEW_SYSTEM_PROMPT = `You are reviewing the work from this Pi session.

Rules:
- Consider the full conversation context, decisions, requirements, and files discussed.
- Do not rely only on git diff; changes may already be committed or partially staged.
- Inspect relevant files if needed.
- Do not edit files.
- Focus on bugs, regressions, edge cases, overengineering, security, maintainability, and whether the implementation matches the discussion.
- Be concise.
- Separate must-fix from nice-to-have.
- Include exact file paths and line references when possible.
- Mention if no issues found.`;

export default function (pi: ExtensionAPI) {
  let restoreModel: ActiveModel | undefined;
  let reviewActive = false;

  pi.on("before_agent_start", async (event) => {
    if (!reviewActive) return;

    return {
      systemPrompt: `${event.systemPrompt}\n\n${REVIEW_SYSTEM_PROMPT}`,
    };
  });

  pi.on("agent_end", async (_event, ctx) => {
    if (!restoreModel) return;

    const model = restoreModel;
    restoreModel = undefined;
    reviewActive = false;

    const restored = await pi.setModel(model);
    if (restored) {
      ctx.ui.notify(`Review complete. Switched back to ${model.provider}/${model.id}`, "info");
    } else {
      ctx.ui.notify(`Review complete, but could not switch back to ${model.provider}/${model.id}`, "warning");
    }
  });

  pi.registerCommand("review", {
    description: "Switch to Codex for a one-shot session review, then switch back",
    handler: async (_args: string, ctx: ExtensionCommandContext) => {
      const previousModel = ctx.model;
      const reviewModel = ctx.modelRegistry.find("openai-codex", "gpt-5.5");
      if (!reviewModel) {
        ctx.ui.notify("Codex model not found: openai-codex/gpt-5.5", "error");
        return;
      }

      const ok = await pi.setModel(reviewModel);
      if (!ok) {
        ctx.ui.notify("Could not switch to Codex", "error");
        return;
      }

      restoreModel = previousModel;
      reviewActive = true;
      pi.sendUserMessage(REVIEW_PROMPT);
    },
  });
}
