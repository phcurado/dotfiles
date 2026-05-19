import type { ExtensionAPI, ExtensionCommandContext, ExtensionContext } from "@earendil-works/pi-coding-agent";

type Level = "off" | "lite" | "full" | "ultra";
const LEVELS: Level[] = ["off", "lite", "full", "ultra"];
const STATE_ENTRY = "caveman-level";

const FRAMES = [
  "\x1b[38;5;196m⠠\x1b[38;5;208m⠄\x1b[0m",
  "\x1b[38;5;208m⠔\x1b[38;5;220m⠂\x1b[0m",
  "\x1b[38;5;220m⠊\x1b[38;5;230m⠑\x1b[0m",
  "\x1b[38;5;230m⠑\x1b[38;5;220m⠊\x1b[0m",
  "\x1b[38;5;220m⠂\x1b[38;5;208m⠔\x1b[0m",
  "\x1b[38;5;208m⠄\x1b[38;5;196m⠠\x1b[0m",
];

const INTERVAL: Record<Exclude<Level, "off">, number> = {
  lite: 300,
  full: 200,
  ultra: 100,
};

const BASE_RULES = `## Caveman Mode — Active

Respond terse. Keep technical substance, drop fluff.

### Persistence
Active every response. No drift. Resume after auto-clarity blocks.
Off only when user types \`stop caveman\`, \`normal mode\`, or \`/caveman off\`.

### Rules
- Drop articles (a/an/the), filler (just/really/basically/actually/simply).
- Drop pleasantries (sure/of course/happy to) and hedging.
- Fragments OK. Short synonyms.
- Technical terms exact. Code blocks unchanged. Errors quoted exact.

### Auto-Clarity
Drop caveman for: security warnings, irreversible action confirmations, multi-step ordered sequences, user repeats or asks clarify.
Resume after clear part done.

### Boundaries
Code, commits, PRs: write normal. Only compress prose.`;

const INTENSITY: Record<Exclude<Level, "off">, string> = {
  lite: `### Intensity: Lite
Trim filler and hedging. Keep articles and full sentences. Professional but tight.`,
  full: `### Intensity: Full
Drop articles. Fragments OK. Short synonyms. Classic caveman.`,
  ultra: `### Intensity: Ultra
Abbreviate common terms (DB/auth/config/req/res/fn/impl). Strip conjunctions. Use arrows for causality (X -> Y).`,
};

function buildPrompt(level: Exclude<Level, "off">): string {
  return `${BASE_RULES}\n\n${INTENSITY[level]}`;
}

function isLevel(v: unknown): v is Level {
  return typeof v === "string" && (LEVELS as string[]).includes(v);
}

export default function caveman(pi: ExtensionAPI) {
  let level: Level = "full";
  let active = false;
  let frame = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  let lastCtx: ExtensionContext | undefined;

  const render = () => {
    if (!lastCtx) return;
    lastCtx.ui.setStatus("caveman", undefined);
  };

  const startAnim = () => {
    if (level === "off") return;
    stopAnim();
    timer = setInterval(() => {
      frame = (frame + 1) % FRAMES.length;
      render();
    }, INTERVAL[level]);
  };

  const stopAnim = () => {
    if (timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };

  pi.on("session_start", async (_event, ctx) => {
    lastCtx = ctx;
    for (const entry of ctx.sessionManager.getEntries()) {
      if (entry.type === "custom" && entry.customType === STATE_ENTRY) {
        const data = entry.data as { level?: unknown } | undefined;
        if (isLevel(data?.level)) level = data.level;
      }
    }
    render();
  });

  pi.on("before_agent_start", async (event) => {
    if (level === "off") return;
    return {
      systemPrompt: `${event.systemPrompt}\n\n${buildPrompt(level)}`,
    };
  });

  pi.on("agent_start", async (_event, ctx) => {
    lastCtx = ctx;
    active = true;
    startAnim();
    render();
  });

  pi.on("agent_end", async (_event, ctx) => {
    lastCtx = ctx;
    active = false;
    stopAnim();
    render();
  });

  pi.on("session_shutdown", async () => {
    stopAnim();
  });

  pi.registerCommand("caveman", {
    description: "Toggle caveman mode. Usage: /caveman [off|lite|full|ultra]",
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      lastCtx = ctx;
      const arg = args.trim().toLowerCase();
      if (arg === "" || arg === "status") {
        ctx.ui.notify(`caveman level: ${level}`, "info");
        return;
      }
      if (!isLevel(arg)) {
        ctx.ui.notify(`unknown level: ${arg}. use ${LEVELS.join("|")}`, "error");
        return;
      }
      level = arg;
      pi.appendEntry(STATE_ENTRY, { level });
      stopAnim();
      if (active) startAnim();
      render();
      ctx.ui.notify(`caveman -> ${level}`, "success");
    },
  });
}
