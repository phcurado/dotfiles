import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";

/* plan -> build -> review. LLM-mediated dispatch via pi-subagents.
 * /plan: dispatch planner.
 * /build: anchor jj change + bookmark, dispatch builder.
 * /review: dispatch reviewer with scoped jj diff ref. */

const PLAN = "workflow-plan";
const BUILD = "workflow-build";

type PlanState = { task: string };
type BuildState = { ref: string; bookmark: string; task: string };

function lastEntry<T>(
  ctx: ExtensionCommandContext,
  customType: string,
): T | null {
  const entries = ctx.sessionManager.getEntries();
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (e.type === "custom" && e.customType === customType) return e.data as T;
  }
  return null;
}

async function jj(
  pi: ExtensionAPI,
  cwd: string,
  ...args: string[]
): Promise<string> {
  const r = await pi.exec("jj", args, { cwd });
  if (r.code !== 0)
    throw new Error(
      `jj ${args.join(" ")}: ${r.stderr.trim() || r.stdout.trim()}`,
    );
  return r.stdout.trim();
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .slice(0, 5)
    .join("-")
    .slice(0, 30);
}

async function bookmarkAt(
  pi: ExtensionAPI,
  cwd: string,
  rev: string,
): Promise<string | null> {
  const out = await jj(
    pi,
    cwd,
    "log",
    "-r",
    rev,
    "-T",
    "bookmarks",
    "--no-graph",
  );
  return out.split(/\s+/).find((b) => b && !b.startsWith("main")) ?? null;
}

export default function (pi: ExtensionAPI) {
  pi.registerCommand("plan", {
    description: "Dispatch the planner subagent",
    handler: async (args: string) => {
      const task = args.trim() || "the current request";
      pi.appendEntry(PLAN, { task } satisfies PlanState);
      pi.sendUserMessage(
        `Invoke the planner subagent for: ${task}. ` +
          `Present its plan exactly as returned. ` +
          `User will run /build to implement or /plan again to refine.`,
      );
    },
  });

  pi.registerCommand("build", {
    description: "Anchor jj change + bookmark, dispatch builder subagent",
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const plan = lastEntry<PlanState>(ctx, PLAN);
      if (!plan) {
        ctx.ui.notify("No plan found. Run /plan first.", "warning");
        return;
      }
      const task = plan.task;

      let ref: string;
      let bookmark: string;
      try {
        await jj(pi, ctx.cwd, "new", "-m", `build: ${task}`);
        ref = await jj(
          pi,
          ctx.cwd,
          "log",
          "-r",
          "@",
          "-T",
          "change_id",
          "--no-graph",
        );
        bookmark = (await bookmarkAt(pi, ctx.cwd, "@-")) ?? slug(task);
        await jj(pi, ctx.cwd, "bookmark", "set", bookmark, "-r", "@");
      } catch (err) {
        ctx.ui.notify(String(err), "error");
        return;
      }
      pi.appendEntry(BUILD, { ref, bookmark, task } satisfies BuildState);
      ctx.ui.notify(`Anchored ${ref.slice(0, 12)} on ${bookmark}`, "info");

      const note = args.trim() ? ` Note: ${args.trim()}.` : "";
      pi.sendUserMessage(
        `Invoke the builder subagent to implement the approved plan for: ${task}.${note} ` +
          `Builder reads the plan from this conversation, implements, returns summary.`,
      );
    },
  });

  pi.registerCommand("review", {
    description: "Dispatch reviewer subagent against scoped jj diff",
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const build = lastEntry<BuildState>(ctx, BUILD);
      if (!build) {
        ctx.ui.notify("No build found. Run /build first.", "warning");
        return;
      }
      const focus = args.trim() ? ` Focus: ${args.trim()}.` : "";
      pi.sendUserMessage(
        `Invoke the reviewer subagent.${focus} Scoped diff: \`jj diff -r ${build.ref}\`.`,
      );
    },
  });
}
