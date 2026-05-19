import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { basename } from "node:path";

function cavemanLevel(ctx: ExtensionContext): string | null {
  let level: string | null = null;
  for (const entry of ctx.sessionManager.getEntries()) {
    if (entry.type === "custom" && entry.customType === "caveman-level") {
      const d = entry.data as { level?: unknown } | undefined;
      if (typeof d?.level === "string") level = d.level;
    }
  }
  return level && level !== "off" ? level : null;
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.setFooter((_tui, theme, footerData) => ({
      dispose: () => {},
      invalidate() {},
      render(width: number): string[] {
        const model = ctx.model?.id ?? "no-model";
        const effort = pi.getThinkingLevel();
        const cwd = basename(ctx.cwd);
        const branch = footerData.getGitBranch();
        const usage = ctx.getContextUsage();
        const pct = usage && usage.percent !== null ? Math.round(usage.percent) : 0;
        const tokens = usage?.tokens ?? 0;
        const filled = Math.max(0, Math.min(10, Math.round(pct / 10)));
        const bar = "█".repeat(filled) + "░".repeat(10 - filled);
        const tokK = tokens >= 1000 ? `${(tokens / 1000).toFixed(0)}k` : `${tokens}`;

        const leftParts = [theme.fg("accent", cwd)];
        if (branch) leftParts.push(theme.fg("dim", `⎇ ${branch}`));
        leftParts.push(theme.fg("dim", `${model} • ${effort}`));

        const cv = cavemanLevel(ctx);
        if (cv) leftParts.push(theme.fg("dim", `cv:${cv}`));

        const left = " " + leftParts.join(theme.fg("dim", "  "));
        const pctColor = pct < 50 ? "success" : pct < 80 ? "warning" : "error";
        const right = `${theme.fg("dim", tokK)} ${theme.fg(pctColor, `${bar} ${pct}%`)} `;
        const pad = " ".repeat(Math.max(1, width - visibleWidth(left) - visibleWidth(right)));
        return [truncateToWidth(left + pad + right, width)];
      },
    }));
  });
}
