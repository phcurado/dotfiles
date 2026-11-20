import type { AgentToolResult, ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { createEditToolDefinition, createWriteToolDefinition } from "@earendil-works/pi-coding-agent";
import { constants } from "node:fs";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { homedir, tmpdir } from "node:os";
import { basename, extname, join, relative } from "node:path";

const REVIEW_SCRIPT = join(homedir(), ".config/nvim/lua/review.lua");
// Local to this machine; not part of the dotfiles.
const STATE_PATH = join(homedir(), ".pi/agent/review-state.json");

type Save = (path: string, content: string) => Promise<void>;

async function readText(path: string): Promise<string> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "";
    throw error;
  }
}

async function loadEnabled(): Promise<boolean> {
  try {
    return JSON.parse(await readFile(STATE_PATH, "utf8")).enabled !== false;
  } catch {
    return true;
  }
}

function tempName(prefix: string, displayPath: string): string {
  const base = basename(displayPath) || "file";
  const ext = extname(base);
  const stem = ext ? base.slice(0, -ext.length) : base;
  return `${prefix}-${stem}${ext || ".txt"}`;
}

async function reviewInEditor(
  ctx: ExtensionContext,
  displayPath: string,
  original: string,
  proposed: string,
): Promise<string | null> {
  const dir = await mkdtemp(join(tmpdir(), "pi-review-"));
  const originalFile = join(dir, tempName("original", displayPath));
  const proposedFile = join(dir, tempName("proposed", displayPath));
  const decisionFile = join(dir, "decision");

  try {
    await writeFile(originalFile, original, "utf8");
    await writeFile(proposedFile, proposed, "utf8");
    let spawnError: Error | undefined;
    const status = await ctx.ui.custom<number | null>((tui, _theme, _kb, done) => {
      tui.stop();
      try {
        const result = spawnSync("nvim", ["-d", originalFile, proposedFile, "-S", REVIEW_SCRIPT], {
          stdio: "inherit",
          env: {
            ...process.env,
            PI_REVIEW_PATH: displayPath,
            PI_REVIEW_ORIGINAL: originalFile,
            PI_REVIEW_PROPOSED: proposedFile,
            PI_REVIEW_DECISION: decisionFile,
          },
        });
        spawnError = result.error;
        done(result.status);
      } catch (error) {
        spawnError = error instanceof Error ? error : new Error(String(error));
        done(null);
      } finally {
        tui.start();
        tui.requestRender(true);
      }
      return { render: () => [], invalidate: () => {} };
    });
    if (spawnError) throw spawnError;
    if (status !== 0) return null;
    const approved = (await readText(decisionFile)).trim() === "approve";
    if (!approved && !await ctx.ui.confirm("Apply reviewed change?", displayPath)) return null;
    return await readFile(proposedFile, "utf8");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function reviewChange(
  ctx: ExtensionContext,
  displayPath: string,
  original: string,
  proposed: string,
): Promise<string | null> {
  if (ctx.mode === "tui") return reviewInEditor(ctx, displayPath, original, proposed);
  return (await ctx.ui.editor(`Review proposed content: ${displayPath}`, proposed)) ?? null;
}

// Pi's own edit and write tools compute the final file content (including fuzzy
// matching and line endings) and call `save` with it; the review happens there.
export default function (pi: ExtensionAPI) {
  if (process.env.PI_SUBAGENT_CHILD === "1") return;

  let enabled = true;
  let cancelled = false;
  let reviewQueue: Promise<unknown> = Promise.resolve();

  function showStatus(ctx: ExtensionContext) {
    ctx.ui.setStatus("review", enabled ? "review on" : "review off");
  }

  pi.on("session_start", async (_event, ctx) => {
    cancelled = false;
    enabled = await loadEnabled();
    showStatus(ctx);
  });
  pi.on("before_agent_start", (event) => {
    if (event.messageType === "user") cancelled = false;
  });

  pi.registerCommand("review", {
    description: "Review edits in Neovim: /review on, /review off, or /review to toggle",
    handler: async (args, ctx) => {
      const arg = args.trim();
      if (arg && arg !== "on" && arg !== "off") {
        ctx.ui.notify("Usage: /review [on|off]", "error");
        return;
      }
      enabled = arg ? arg === "on" : !enabled;
      await writeFile(STATE_PATH, JSON.stringify({ enabled }) + "\n", "utf8");
      showStatus(ctx);
    },
  });

  async function review(ctx: ExtensionContext, signal: AbortSignal | undefined, path: string, proposed: string) {
    // Nobody can approve without a UI (print mode, background runs), so the change goes through.
    if (!enabled || !ctx.hasUI) return proposed;
    // Pi can run queued tool calls even after the run was aborted.
    if (cancelled || signal?.aborted) throw new Error("review: run cancelled; remaining edits skipped");

    const displayPath = relative(ctx.cwd, path);
    const original = await readText(path);
    let accepted: string | null;
    pi.events.emit("pi:approval", { active: true });
    try {
      accepted = await reviewChange(ctx, displayPath, original, proposed);
    } finally {
      pi.events.emit("pi:approval", { active: false });
    }

    if (accepted === null) {
      cancelled = true;
      ctx.abort();
      pi.sendMessage({
        customType: "review-cancelled",
        content: `User cancelled review of ${displayPath}. Skip remaining edits; do not retry unless asked.`,
        display: false,
      }, { triggerTurn: false });
      throw new Error("review: cancelled by user");
    }
    return accepted;
  }

  async function runReviewed<T>(
    ctx: ExtensionContext,
    signal: AbortSignal | undefined,
    execute: (save: Save) => Promise<AgentToolResult<T>>,
  ): Promise<AgentToolResult<T>> {
    let changedByUser = false;
    const result = await execute(async (path, proposed) => {
      // One review at a time, even when the model sends several edits at once.
      const pending = reviewQueue.then(() => review(ctx, signal, path, proposed));
      reviewQueue = pending.catch(() => {});
      const accepted = await pending;
      changedByUser = accepted !== proposed;
      await writeFile(path, accepted, "utf8");
    });
    if (changedByUser)
      result.content.push({
        type: "text",
        text: "The user changed this edit before approving it. Re-read the file before editing it again.",
      });
    return result;
  }

  pi.registerTool({
    ...createEditToolDefinition(process.cwd()),
    execute: (id, params, signal, onUpdate, ctx) =>
      runReviewed(ctx, signal, (save) =>
        createEditToolDefinition(ctx.cwd, {
          operations: {
            readFile: (path) => readFile(path),
            access: (path) => access(path, constants.R_OK | constants.W_OK),
            writeFile: save,
          },
        }).execute(id, params, signal, onUpdate, ctx)),
  });

  pi.registerTool({
    ...createWriteToolDefinition(process.cwd()),
    execute: (id, params, signal, onUpdate, ctx) =>
      runReviewed(ctx, signal, (save) =>
        createWriteToolDefinition(ctx.cwd, {
          operations: {
            mkdir: async (dir) => { await mkdir(dir, { recursive: true }); },
            writeFile: save,
          },
        }).execute(id, params, signal, onUpdate, ctx)),
  });
}
