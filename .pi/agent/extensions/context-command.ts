// Context usage dashboard.
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  Key,
  matchesKey,
  truncateToWidth,
  visibleWidth,
} from "@earendil-works/pi-tui";

type Row = { label: string; tokens: number; detail?: string };
type Signal = { level: "warning" | "info"; text: string };
type Report = {
  model: string;
  limit: number;
  measured: number;
  total: number;
  startup: number;
  messages: number;
  other: number;
  categories: Row[];
  loaded: Row[];
  byRole: Row[];
  toolUse: Row[];
  largest: Row[];
  signals: Signal[];
};

function tokens(value: unknown): number {
  if (value == null) return 0;
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return Math.ceil(text.length / 4);
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}

function pct(n: number, total: number): string {
  return total > 0 ? `${((n / total) * 100).toFixed(1)}%` : "0%";
}

function textContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return JSON.stringify(content ?? "");
  return content
    .map((part) => {
      if (part?.type === "text") return part.text ?? "";
      if (part?.type === "thinking") return part.thinking ?? "";
      if (part?.type === "toolCall")
        return `${part.name ?? "tool"} ${JSON.stringify(part.arguments ?? {})}`;
      if (part?.type === "image") return "[image]";
      return "";
    })
    .join("\n");
}

function compactPath(path: string): string {
  const home = process.env.HOME;
  return home && path.startsWith(home) ? path.replace(home, "~") : path;
}

function snippet(value: string, max = 64): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function top(rows: Row[], max: number): Row[] {
  return [...rows]
    .sort((a, b) => b.tokens - a.tokens || a.label.localeCompare(b.label))
    .slice(0, max);
}

function sum(rows: Row[]): number {
  return rows.reduce((total, row) => total + row.tokens, 0);
}

function activeToolNames(pi: ExtensionAPI): Set<string> {
  return new Set(
    pi
      .getActiveTools()
      .map((tool: any) => (typeof tool === "string" ? tool : tool.name))
      .filter(Boolean),
  );
}

function push(map: Map<string, number>, key: string, value: number) {
  map.set(key, (map.get(key) ?? 0) + value);
}

function buildSignals(report: Omit<Report, "signals">): Signal[] {
  const signals: Signal[] = [];
  const toolResult =
    report.byRole.find((row) => row.label === "toolResult")?.tokens ?? 0;
  const assistant =
    report.byRole.find((row) => row.label === "assistant")?.tokens ?? 0;
  const usedRatio = report.limit ? report.total / report.limit : 0;

  if (toolResult > report.total * 0.5)
    signals.push({
      level: "warning",
      text: "Tool results dominate context; avoid dumping long docs/logs unless needed.",
    });
  if (assistant > report.total * 0.25)
    signals.push({
      level: "warning",
      text: "Assistant messages are a large share; compact or start fresh after long planning.",
    });
  if (usedRatio > 0.75)
    signals.push({
      level: "warning",
      text: "Context is getting high; consider /compact or a fresh handoff soon.",
    });
  else if (usedRatio > 0.45)
    signals.push({
      level: "info",
      text: "Context is moderate; watch large reads/tool outputs.",
    });
  if (report.largest[0]?.tokens > report.total * 0.08)
    signals.push({
      level: "warning",
      text: "One or more entries are very large; targeted reads beat full-file/doc dumps.",
    });
  if (report.startup < report.total * 0.05)
    signals.push({
      level: "info",
      text: "Startup context is fine; loaded rules/skills are not the problem.",
    });

  return signals.length
    ? signals.slice(0, 4)
    : [
        {
          level: "info",
          text: "Context looks healthy; no obvious pressure point.",
        },
      ];
}

function buildReport(pi: ExtensionAPI, ctx: any): Report {
  const options = ctx.getSystemPromptOptions?.() ?? {};
  const usage = ctx.getContextUsage?.();
  const measured = usage?.tokens ?? 0;
  const limit =
    ctx.model?.contextWindow ??
    (usage?.percent ? Math.round((measured / usage.percent) * 100) : 0);
  const model = `${ctx.model?.provider ? `${ctx.model.provider}/` : ""}${ctx.model?.id ?? "unknown"}`;

  const systemRows: Row[] = [
    { label: "system prompt", tokens: tokens(ctx.getSystemPrompt?.() ?? "") },
  ];
  const memoryRows: Row[] = (options.contextFiles ?? []).map((file: any) => ({
    label: compactPath(file.path ?? file.filePath ?? "context file"),
    tokens: tokens(file.content ?? file.text ?? ""),
  }));
  const skillRows: Row[] = (options.skills ?? []).map((skill: any) => ({
    label: skill.name ?? "unknown skill",
    tokens: tokens(`${skill.name ?? ""}\n${skill.description ?? ""}`),
    detail: compactPath(skill.filePath ?? skill.sourceInfo?.path ?? ""),
  }));

  const active = activeToolNames(pi);
  const toolRows: Row[] = pi
    .getAllTools()
    .filter((tool: any) => active.size === 0 || active.has(tool.name))
    .map((tool: any) => ({
      label: tool.name,
      tokens: tokens(
        [tool.name, tool.description, ...(tool.promptGuidelines ?? [])]
          .filter(Boolean)
          .join("\n"),
      ),
      detail: tool.sourceInfo?.source ?? "tool",
    }));

  const byRole = new Map<string, number>();
  const toolUse = new Map<string, number>();
  const largest: Row[] = [];

  for (const entry of ctx.sessionManager.getBranch?.() ?? []) {
    if (entry.type !== "message") continue;
    const message = entry.message ?? {};
    const role = message.role ?? "message";
    const body = textContent(message.content ?? message);
    const n = tokens(
      role === "toolResult"
        ? `${message.toolName ?? "toolResult"}\n${body}`
        : body,
    );

    push(byRole, role, n);
    if (role === "toolResult" && message.toolName)
      push(toolUse, `${message.toolName} result`, n);
    if (role === "assistant" && Array.isArray(message.content)) {
      for (const part of message.content) {
        if (part?.type === "toolCall" && part.name)
          push(
            toolUse,
            part.name,
            tokens(part.arguments ?? {}) + tokens(part.name),
          );
      }
    }

    largest.push({
      label:
        role === "toolResult" && message.toolName
          ? `${message.toolName} result`
          : role,
      tokens: n,
      detail: snippet(body),
    });
  }

  const loaded = [
    {
      label: "AGENTS/context files",
      tokens: sum(memoryRows),
      detail: `${memoryRows.length} files`,
    },
    {
      label: "skills",
      tokens: sum(skillRows),
      detail: `${skillRows.length} loaded`,
    },
    {
      label: "tools",
      tokens: sum(toolRows),
      detail: `${toolRows.length} active`,
    },
    ...top(systemRows, 1),
  ].filter((row) => row.tokens > 0);

  const startup = sum(loaded);
  const messages = [...byRole.values()].reduce((total, n) => total + n, 0);
  const estimated = startup + messages;
  const total = Math.max(measured, estimated);
  const other = Math.max(0, total - estimated);

  const byRoleRows = [...byRole.entries()]
    .map(([label, n]) => ({ label, tokens: n }))
    .sort((a, b) => b.tokens - a.tokens);
  const reportWithoutSignals = {
    model,
    limit,
    measured,
    total,
    startup,
    messages,
    other,
    categories: [
      { label: "messages/tool output", tokens: messages },
      { label: "runtime overhead", tokens: other },
      { label: "startup context", tokens: startup },
    ].filter((row) => row.tokens > 0),
    loaded: top(loaded, 5),
    byRole: byRoleRows,
    toolUse: top(
      [...toolUse.entries()].map(([label, n]) => ({ label, tokens: n })),
      5,
    ),
    largest: top(largest, 6),
  };

  return {
    ...reportWithoutSignals,
    signals: buildSignals(reportWithoutSignals),
  };
}

function plainReport(report: Report): string {
  return [
    `Context · ${report.model}`,
    `${fmt(report.total)} / ${fmt(report.limit)} · ${pct(report.total, report.limit)} used · ${fmt(Math.max(0, report.limit - report.total))} free`,
    "",
    "Where it went",
    ...report.categories.map(
      (row) =>
        `  ${row.label}: ${fmt(row.tokens)} (${pct(row.tokens, report.total)})`,
    ),
    "",
    "Biggest offenders",
    ...report.largest.map(
      (row, i) =>
        `  ${i + 1}. ${row.label}: ${fmt(row.tokens)} · ${row.detail ?? ""}`,
    ),
    "",
    "Loaded at startup",
    ...report.loaded.map(
      (row) =>
        `  ${row.label}: ${fmt(row.tokens)}${row.detail ? ` · ${row.detail}` : ""}`,
    ),
    "",
    "Signals",
    ...report.signals.map((signal) => `  - ${signal.text}`),
  ].join("\n");
}

function fit(line: string, width: number): string {
  return visibleWidth(line) > width ? truncateToWidth(line, width) : line;
}

function bar(value: number, total: number, width: number): string {
  const cells = Math.max(12, Math.min(32, width));
  const used =
    total > 0
      ? Math.max(0, Math.min(cells, Math.round((value / total) * cells)))
      : 0;
  return `${"█".repeat(used)}${"░".repeat(cells - used)}`;
}

function dashboard(report: Report, theme: any, width: number): string[] {
  const w = Math.max(44, width - 2);
  const usedRatio = report.limit ? report.total / report.limit : 0;
  const ratioColor =
    usedRatio > 0.8 ? "error" : usedRatio > 0.5 ? "warning" : "success";
  const lines: string[] = [];

  const add = (line = "") => lines.push(fit(line, w));
  const muted = (s: string) => theme.fg("dim", s);
  const heading = (s: string) => add(theme.fg("accent", theme.bold(s)));
  const amount = (n: number, base = report.total) =>
    `${theme.fg("accent", fmt(n))} ${muted(pct(n, base))}`;
  const row = (label: string, n: number, detail = "") =>
    add(
      `  ${theme.fg("text", label.padEnd(22).slice(0, 22))} ${amount(n).padEnd(20)}${detail ? muted(`  ${detail}`) : ""}`,
    );

  add(
    `${theme.fg("accent", theme.bold("Context"))} ${muted("·")} ${theme.fg("text", report.model)}`,
  );
  add(
    `${theme.fg("text", `${fmt(report.total)} / ${fmt(report.limit)}`)}  ${theme.fg(ratioColor, `${pct(report.total, report.limit)} used`)}  ${muted(`${fmt(Math.max(0, report.limit - report.total))} free`)}`,
  );
  add(theme.fg(ratioColor, bar(report.total, report.limit, Math.floor(w / 2))));
  add("");

  heading("Where it went");
  for (const item of report.categories) row(item.label, item.tokens);
  add("");

  heading("Biggest offenders");
  for (const [index, item] of report.largest.entries())
    row(`${index + 1}. ${item.label}`, item.tokens, item.detail);
  add("");

  heading("Loaded at startup");
  for (const item of report.loaded) row(item.label, item.tokens, item.detail);
  if (report.startup < report.total * 0.03)
    add(muted("  startup is small; hidden details omitted"));
  add("");

  heading("Signals");
  for (const signal of report.signals) {
    const color = signal.level === "warning" ? "warning" : "success";
    add(`  ${theme.fg(color, "•")} ${theme.fg("text", signal.text)}`);
  }
  add("");
  add(muted("Esc/Enter close"));

  return lines;
}

export default function (pi: ExtensionAPI) {
  if (process.env.PI_SUBAGENT_CHILD === "1") return;

  pi.registerCommand("context", {
    description: "Show what is consuming the context window for this session",
    handler: async (_args, ctx) => {
      const report = buildReport(pi, ctx);
      if (!ctx.hasUI || ctx.mode !== "tui") {
        console.log(plainReport(report));
        return;
      }

      await ctx.ui.custom((_tui, theme, _keybindings, done) => ({
        render(width: number) {
          return dashboard(report, theme, width);
        },
        invalidate() {},
        handleInput(data: string) {
          if (
            matchesKey(data, Key.escape) ||
            matchesKey(data, Key.enter) ||
            matchesKey(data, Key.ctrl("c"))
          )
            done(undefined);
        },
      }));
    },
  });
}
