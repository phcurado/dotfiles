import type { ContextUsage, ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { basename } from "node:path";

const exec = promisify(execFile);

type FooterTheme = {
  fg(c: "accent" | "dim" | "success" | "warning" | "error", t: string): string;
};
let jjLabel = "";
let ins = 0;
let del = 0;
let isJj = false;
let repoCwd = "";
let lastRefresh = 0;
const REFRESH_DEBOUNCE = 300;

async function out(cmd: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await exec(cmd, args, { cwd: repoCwd, env: { ...process.env, LC_ALL: "C" } });
    return stdout.trim();
  } catch {
    return "";
  }
}

function parseDiff(s: string): [number, number] {
  const i = s.match(/(\d+) insertion/);
  const d = s.match(/(\d+) deletion/);
  return [i ? +i[1] : 0, d ? +d[1] : 0];
}

async function refresh(): Promise<void> {
  if (isJj) {
    const base = ["--ignore-working-copy", "--no-pager"];
    const tmpl = ["-n", "1", "--no-graph", "--color", "never", "-T"];
    const bm = await out("jj", [...base, "log", "-r", "latest(bookmarks() & ::@)", ...tmpl, "bookmarks"]);
    jjLabel = bm || (await out("jj", [...base, "log", "-r", "@", ...tmpl, "change_id.shortest(8)"]));
    [ins, del] = parseDiff(await out("jj", [...base, "diff", "-r", "@", "--stat"]));
  } else {
    [ins, del] = parseDiff(await out("git", ["diff", "--shortstat", "HEAD"]));
  }
}

function toK(n: number): string {
  return n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`;
}

function buildLeft(cwd: string, vcs: string | null | undefined, model: string, effort: string, t: FooterTheme): string {
  const segs = [t.fg("accent", cwd)];
  if (vcs) {
    const diff = ins || del ? ` ${t.fg("success", `+${ins}`)}${t.fg("dim", "/")}${t.fg("error", `-${del}`)}` : "";
    segs.push(t.fg("dim", vcs) + diff);
  }
  segs.push(t.fg("dim", model), t.fg("dim", effort));
  return " " + segs.join(t.fg("dim", " · "));
}

function buildRight(usage: ContextUsage | undefined, limit: number, cost: number, t: FooterTheme): string {
  const pct = usage?.percent == null ? "?" : Math.round(usage.percent);
  const tokens = usage?.tokens == null ? "?" : toK(usage.tokens);
  const pctColor = pct === "?" ? "dim" : pct < 50 ? "success" : pct < 80 ? "warning" : "error";
  const tok = limit > 0 ? `${tokens}/${toK(limit)}` : tokens;
  return (
    [t.fg("dim", `$${cost.toFixed(2)}`), t.fg("dim", tok), t.fg(pctColor, `${pct}%`)].join(t.fg("dim", " · ")) + " "
  );
}

function compose(width: number, left: string, right: string): string {
  const pad = " ".repeat(Math.max(1, width - visibleWidth(left) - visibleWidth(right)));
  return truncateToWidth(left + pad + right, width);
}

export default function (pi: ExtensionAPI) {
  if (process.env.PI_SUBAGENT_CHILD === "1") return;

  pi.on("turn_end", async () => {
    await refresh();
  });

  pi.on("tool_execution_end", async (event) => {
    if (event.toolName === "bash" || event.toolName === "write" || event.toolName === "edit") {
      const now = Date.now();
      if (now - lastRefresh < REFRESH_DEBOUNCE) return;
      lastRefresh = now;
      await refresh();
    }
  });

  pi.on("session_start", async (_event, ctx) => {
    repoCwd = ctx.cwd;
    isJj = Boolean(await out("jj", ["--ignore-working-copy", "root"]));
    await refresh();

    let cachedSessionId: string | undefined;
    let cachedLeafId: string | null | undefined;
    let sessionCost = 0;

    ctx.ui.setFooter((_tui, theme, footerData) => ({
      dispose: () => {},
      invalidate() {},
      render(width: number): string[] {
        const sessionId = ctx.sessionManager.getSessionId();
        const leafId = ctx.sessionManager.getLeafId();
        if (sessionId !== cachedSessionId || leafId !== cachedLeafId) {
          // Match Pi's cumulative total, including entries before compaction and on other branches.
          sessionCost = 0;
          for (const entry of ctx.sessionManager.getEntries()) {
            if (entry.type === "message") {
              if (entry.message.role === "assistant" || entry.message.role === "toolResult") {
                sessionCost += entry.message.usage?.cost.total ?? 0;
              }
            } else if (entry.type === "usage" || entry.type === "compaction" || entry.type === "branch_summary") {
              sessionCost += entry.usage?.cost.total ?? 0;
            }
          }
          cachedSessionId = sessionId;
          cachedLeafId = leafId;
        }
        const usage = ctx.getContextUsage();
        const limit = usage?.contextWindow ?? ctx.model?.contextWindow ?? 0;
        const vcs = isJj ? jjLabel : footerData.getGitBranch();
        const model = ctx.model ? `${ctx.model.provider}/${ctx.model.id}` : "no-model";
        const left = buildLeft(basename(ctx.cwd), vcs, model, pi.getThinkingLevel(), theme);
        const right = buildRight(usage, limit, sessionCost, theme);
        return [compose(width, left, right)];
      },
    }));
  });
}
