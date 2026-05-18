import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  const render = (ctx: ExtensionContext) => {
    const u = ctx.getContextUsage();
    if (!u) return;
    const theme = ctx.ui.theme;

    if (u.tokens === null || u.percent === null) {
      ctx.ui.setStatus("usage", theme.fg("dim", "context: ?"));
      return;
    }

    const max = u.contextWindow;
    const pct = Math.min(100, Math.max(0, Math.round(u.percent)));
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
