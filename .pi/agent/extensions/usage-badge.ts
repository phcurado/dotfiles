import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  const render = (ctx: ExtensionContext) => {
    const u = ctx.getContextUsage();
    if (!u) return;
    const theme = ctx.ui.theme;
    const known = u.maxTokens && u.maxTokens > 0;

    if (!known) {
      const label = `${(u.tokens / 1000).toFixed(1)}k/?`;
      ctx.ui.setStatus("usage", theme.fg("dim", label));
      return;
    }

    const max = u.maxTokens;
    const pct = Math.min(100, Math.round((u.tokens / max) * 100));
    const filled = Math.round(pct / 10);
    const bar = "█".repeat(filled) + "░".repeat(10 - filled);
    const color = pct < 50 ? "success" : pct < 80 ? "warning" : "error";
    const label = `${(u.tokens / 1000).toFixed(1)}k/${(max / 1000).toFixed(0)}k`;
    ctx.ui.setStatus("usage", theme.fg(color, `${bar} ${pct}% ${label}`));
  };

  pi.on("session_start", (_e, ctx) => render(ctx));
  pi.on("turn_end", (_e, ctx) => render(ctx));
  pi.on("message_update", (_e, ctx) => render(ctx));
}
