import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { basename } from "node:path";

type FooterTheme = {
  fg(color: "accent" | "dim" | "success" | "warning" | "error", text: string): string;
};

type ContextUsage = {
  percent: number | null;
  tokens?: number | null;
} | null | undefined;

function renderLeft(cwd: string, branch: string | null | undefined, model: string, effort: string, theme: FooterTheme): string {
  const parts = [theme.fg("accent", cwd)];
  if (branch) parts.push(theme.fg("dim", `⎇ ${branch}`));
  parts.push(theme.fg("dim", `${model} • ${effort}`));

  return " " + parts.join(theme.fg("dim", "  "));
}

function renderRight(usage: ContextUsage, theme: FooterTheme): string {
  const pct = usage && usage.percent !== null ? Math.round(usage.percent) : 0;
  const tokens = usage?.tokens ?? 0;
  const filled = Math.max(0, Math.min(10, Math.round(pct / 10)));
  const bar = "█".repeat(filled) + "░".repeat(10 - filled);
  const tokK = tokens >= 1000 ? `${(tokens / 1000).toFixed(0)}k` : `${tokens}`;
  const pctColor = pct < 50 ? "success" : pct < 80 ? "warning" : "error";

  return `${theme.fg("dim", tokK)} ${theme.fg(pctColor, `${bar} ${pct}%`)} `;
}

function renderFooter(width: number, left: string, right: string): string {
  const pad = " ".repeat(Math.max(1, width - visibleWidth(left) - visibleWidth(right)));
  return truncateToWidth(left + pad + right, width);
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.setFooter((_tui, theme, footerData) => ({
      dispose: () => {},
      invalidate() {},
      render(width: number): string[] {
        const left = renderLeft(
          basename(ctx.cwd),
          footerData.getGitBranch(),
          ctx.model?.id ?? "no-model",
          pi.getThinkingLevel(),
          theme,
        );
        const right = renderRight(ctx.getContextUsage(), theme);

        return [renderFooter(width, left, right)];
      },
    }));
  });
}
