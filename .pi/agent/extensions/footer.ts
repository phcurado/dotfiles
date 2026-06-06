import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { basename, join } from "node:path";

const exec = promisify(execFile);

type FooterTheme = {
  fg(c: "accent" | "dim" | "success" | "warning" | "error", t: string): string;
};
type ContextUsage = { percent: number | null; tokens?: number | null } | null | undefined;

let sessionCost = 0;
let jjLabel = "";
let ins = 0;
let del = 0;
let isJj = false;
let repoCwd = "";

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

function buildRight(usage: ContextUsage, limit: number, cost: number, t: FooterTheme): string {
  const pct = usage && usage.percent !== null ? Math.round(usage.percent) : 0;
  const tokens = usage?.tokens ?? 0;
  const pctColor = pct < 50 ? "success" : pct < 80 ? "warning" : "error";
  const tok = limit > 0 ? `${toK(tokens)}/${toK(limit)}` : toK(tokens);
  return (
    [t.fg("dim", `$${cost.toFixed(2)}`), t.fg("dim", tok), t.fg(pctColor, `${pct}%`)].join(t.fg("dim", " · ")) + " "
  );
}

function compose(width: number, left: string, right: string): string {
  const pad = " ".repeat(Math.max(1, width - visibleWidth(left) - visibleWidth(right)));
  return truncateToWidth(left + pad + right, width);
}

export default function (pi: ExtensionAPI) {
  pi.on("message_end", async (event) => {
    if (event.message?.role !== "assistant") return;
    const c = event.message.usage?.cost;
    if (c) sessionCost += c.total ?? ((c.input ?? 0) + (c.output ?? 0) + (c.cacheRead ?? 0) + (c.cacheWrite ?? 0));
  });

  pi.on("turn_end", async () => {
    await refresh();
  });

  pi.on("session_start", async (_event, ctx) => {
    repoCwd = ctx.cwd;
    sessionCost = 0;
    isJj = existsSync(join(ctx.cwd, ".jj"));
    await refresh();

    ctx.ui.setFooter((_tui, theme, footerData) => ({
      dispose: () => {},
      invalidate() {},
      render(width: number): string[] {
        const usage = ctx.getContextUsage();
        const limit =
          ctx.model?.contextWindow ?? (usage && usage.percent ? Math.round((usage.tokens ?? 0) / usage.percent * 100) : 0);
        const vcs = isJj ? jjLabel : footerData.getGitBranch();
        const left = buildLeft(basename(ctx.cwd), vcs, ctx.model?.id ?? "no-model", pi.getThinkingLevel(), theme);
        const right = buildRight(usage, limit, sessionCost, theme);
        return [compose(width, left, right)];
      },
    }));
  });
}
