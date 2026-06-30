import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export default function (pi: ExtensionAPI) {
  async function withBlocked<T>(label: string, fn: () => Promise<T>): Promise<T> {
    pi.events.emit("herdr:blocked", { active: true, label });
    try {
      return await fn();
    } finally {
      pi.events.emit("herdr:blocked", { active: false, label });
    }
  }

  pi.registerTool({
    name: "ask_user",
    label: "Ask user",
    description:
      "Ask the user a clarifying question via TUI. Use when intent is ambiguous, multiple options exist, or a destructive action needs explicit approval. Returns user's answer as text.",
    parameters: Type.Object({
      question: Type.String({ description: "Question to show the user" }),
      kind: Type.Optional(
        Type.Union(
          [Type.Literal("select"), Type.Literal("confirm"), Type.Literal("input")],
          { description: "Prompt style. Default: input." },
        ),
      ),
      options: Type.Optional(
        Type.Array(Type.String(), {
          description: "Options for select kind. Required when kind=select.",
        }),
      ),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!ctx.hasUI) {
        return {
          content: [{ type: "text", text: "No UI available. Proceed with best guess." }],
          details: { reason: "no-ui" },
        };
      }

      const kind = params.kind ?? "input";

      if (kind === "confirm") {
        const ok = await withBlocked("approval", () => ctx.ui.confirm("Question", params.question));
        return {
          content: [{ type: "text", text: ok ? "yes" : "no" }],
          details: { kind, answer: ok ? "yes" : "no" },
        };
      }

      if (kind === "select") {
        const opts = params.options ?? [];
        if (opts.length === 0) {
          return {
            content: [{ type: "text", text: "ERROR: select kind requires options." }],
            details: { error: "missing-options" },
          };
        }
        const choice = await withBlocked("approval", () => ctx.ui.select(params.question, opts));
        return {
          content: [{ type: "text", text: choice ?? "(cancelled)" }],
          details: { kind, answer: choice ?? null },
        };
      }

      const answer = await withBlocked("approval", () => ctx.ui.input(params.question));
      return {
        content: [{ type: "text", text: answer ?? "(cancelled)" }],
        details: { kind, answer: answer ?? null },
      };
    },
  });
}
