import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

const STATE_ENTRY = "caveman-level";
const LEVELS = ["off", "lite", "full", "ultra"] as const;
type Level = (typeof LEVELS)[number];

function isLevel(v: unknown): v is Level {
  return typeof v === "string" && LEVELS.includes(v as Level);
}

function buildPrompt(level: Level): string {
  const rules: Record<Level, string> = {
    off: "",
    lite:
      "Be concise. Drop pleasantries and filler. Fragments OK.",
    full:
      "Respond terse. Keep technical substance, drop fluff.\n"
      + "Rules:\n"
      + "- Drop articles (a/an/the), filler (just/really/basically/actually/simply).\n"
      + "- Drop pleasantries (sure/of course/happy to) and hedging.\n"
      + "- Fragments OK. Short synonyms.\n"
      + "- Technical terms exact. Code blocks unchanged.\n"
      + "\n### Auto-Clarity\n"
      + "Drop caveman for: security warnings, irreversible action confirmations, multi-step ordered sequences, user repeats or asks clarify. Resume after.\n"
      + "\n### Boundaries\n"
      + "Code, commits, PRs: write normal. Only compress prose.",
    ultra:
      "One-line max per response. No explanations unless asked. No tool call summaries.",
  };
  return rules[level];
}

export default function (pi: ExtensionAPI) {
  let level: Level = "full";

  pi.on("session_start", async (_event, ctx) => {
    for (const entry of ctx.sessionManager.getEntries()) {
      if (entry.type === "custom" && entry.customType === STATE_ENTRY) {
        const data = entry.data as { level?: unknown } | undefined;
        if (isLevel(data?.level)) level = data.level;
      }
    }
  });

  pi.on("before_agent_start", async (event) => {
    if (level === "off") return;
    return { systemPrompt: `${event.systemPrompt}\n\n${buildPrompt(level)}` };
  });

  pi.registerCommand("caveman", {
    description: "Set caveman level: /caveman [off|lite|full|ultra]",
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const arg = args.trim().toLowerCase();
      if (arg === "" || arg === "status") {
        ctx.ui.notify(`caveman: ${level}`, "info");
        return;
      }
      if (!isLevel(arg)) {
        ctx.ui.notify(`Usage: /caveman [off|lite|full|ultra]`, "error");
        return;
      }
      level = arg;
      ctx.appendEntry(STATE_ENTRY, { level });
      ctx.ui.notify(`caveman: ${level}`, "success");
    },
  });
}
