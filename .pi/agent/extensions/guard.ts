/**
 * Guard Extension
 *
 * 1. Permission gate — confirms before running dangerous bash commands.
 * 2. Protected paths — blocks writes/edits to sensitive paths.
 */

import type {
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import {
  Key,
  matchesKey,
  visibleWidth,
  wrapTextWithAnsi,
} from "@earendil-works/pi-tui";

/* ── Dangerous command patterns ── */
const dangerousPatterns: RegExp[] = [
  /\brm\b[^\n;&|]*(?:-[a-z]*r[a-z]*|--recursive)\b/i,
  /\bsudo\b/i,
  /\b(chmod|chown)\b.*777/i,
  /\bgit\s+push\b[^\n;&|]*(?:--force|-f\b)/i,
  /\bgit\s+push\b[^\n;&|]*--force-with-lease\b/i,
  /\bgit\s+reset\s+--hard\b/i,
  /\bgit\s+clean\b[^\n;&|]*-[a-z]*[fdx][a-z]*/i,
  /\bgit\s+checkout\b[^\n;&|]*(?:--\s|\.\s*$)/i,
  /\bgit\s+restore\b/i,
  /\bgit\s+stash\s+(?:drop|clear)\b/i,
  /\bjj\s+abandon\b/i,
  /\bjj\s+op\s+(?:undo|restore)\b/i,
  /\bjj\s+bookmark\s+(?:delete|forget)\b/i,
  /\bjj\s+git\s+push\b[^\n;&|]*--deleted\b/i,
  /\bdocker\s+(rm|prune|system\s+prune)\b.*(?:-[a-z]*f[a-z]*|--force)/i,
  /(^|[\s;&|])>{1,2}\s*\/dev\/(?:sd[a-z]|nvme\d+n\d+|disk\d+)/i,
  /\bdd\b[^\n;&|]*\bof=\/dev\/(?:sd[a-z]|nvme\d+n\d+|disk\d+)/i,
  /\bmkfs\./i,
  /\b(?:fdisk|parted|wipefs)\b[^\n;&|]*\/dev\/(?:sd[a-z]|nvme\d+n\d+|disk\d+)/i,
  /\bcryptsetup\b[^\n;&|]*\bluksFormat\b/i,
];

/* ── Protected path fragments ── */
const protectedPathFragments: string[] = [
  ".env",
  ".git/",
  "node_modules/",
  ".ssh/",
  ".gnupg/",
  ".config/sops/",
  ".aws/",
  ".kube/",
  "keys.txt",
  "age.txt",
  ".pi/agent/auth.json",
  "credentials",
  "id_rsa",
  "id_ed25519",
  "id_ecdsa",
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const protectedPathPattern = new RegExp(
  protectedPathFragments.map(escapeRegExp).join("|"),
  "i",
);

const protectedPathRedirectionPattern = new RegExp(
  String.raw`(^|[\s;&|])\d*>{1,2}\s*["']?[^\s"';&|]*(?:${protectedPathFragments
    .map(escapeRegExp)
    .join("|")})`,
  "i",
);

const protectedPathWritePatterns: RegExp[] = [
  /\b(?:rm|mv|cp|touch|mkdir|rmdir|chmod|chown|install|ln|rsync|truncate)\b/i,
  /\b(?:sed|perl)\b[^\n;&|]*\s-i(?:\s|$)/i,
  /\btee\b/i,
  /\bdd\b[^\n;&|]*\bof=/i,
];

function touchesProtectedPath(value: string): boolean {
  return protectedPathPattern.test(value);
}

function mutatesProtectedPath(command: string): boolean {
  if (protectedPathRedirectionPattern.test(command)) return true;
  if (!touchesProtectedPath(command)) return false;
  return protectedPathWritePatterns.some((pattern) => pattern.test(command));
}

function commandBox(command: string, width: number, theme: any): string[] {
  const maxInner = Math.max(1, width - 6);
  const wrapped = wrapTextWithAnsi(command, maxInner);
  const inner = Math.min(maxInner, Math.max(...wrapped.map(visibleWidth), 1));
  const border = theme.fg("dim", `  ┌${"─".repeat(inner + 2)}┐`);
  const lines = wrapped.map((line) => {
    const pad = " ".repeat(Math.max(0, inner - visibleWidth(line)));
    return `  ${theme.fg("dim", "│")} ${line}${pad} ${theme.fg("dim", "│")}`;
  });
  return [border, ...lines, theme.fg("dim", `  └${"─".repeat(inner + 2)}┘`)];
}

async function confirmDangerousCommand(
  ctx: ExtensionContext,
  command: string,
): Promise<boolean> {
  if (!ctx.hasUI) return false;

  if (ctx.mode !== "tui") {
    const choice = await ctx.ui.select("Run this dangerous command?", [
      "Yes",
      "No",
    ]);
    return choice === "Yes";
  }

  const result = await ctx.ui.custom<"yes" | "no" | null>(
    (tui, theme, _kb, done) => {
      let selected: "yes" | "no" = "yes";
      const choose = (value: "yes" | "no") => done(value);
      const option = (value: "yes" | "no", label: string) => {
        const prefix = selected === value ? theme.fg("accent", "→") : " ";
        const text = selected === value ? theme.fg("accent", label) : label;
        return `${prefix} ${text}`;
      };

      return {
        render(width: number) {
          return [
            theme.fg("warning", theme.bold("Run this dangerous command?")),
            "",
            ...commandBox(command, width, theme),
            "",
            option("yes", "1. Yes"),
            option("no", "2. No"),
            "",
          ];
        },
        invalidate() {},
        handleInput(data: string) {
          if (data === "1" || data.toLowerCase() === "y") return choose("yes");
          if (
            data === "2" ||
            data.toLowerCase() === "n" ||
            matchesKey(data, Key.escape)
          )
            return choose("no");
          if (matchesKey(data, Key.enter) || data === " ")
            return choose(selected);
          if (matchesKey(data, Key.up) || matchesKey(data, Key.down))
            selected = selected === "yes" ? "no" : "yes";
          tui.requestRender();
        },
      };
    },
  );

  return result === "yes";
}

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event, ctx) => {
    /* ── Bash gate ── */
    if (event.toolName === "bash") {
      const command = event.input.command;
      if (typeof command !== "string") return undefined;

      if (mutatesProtectedPath(command)) {
        if (ctx.hasUI) {
          ctx.ui.notify(
            `Blocked bash write to protected path: ${command}`,
            "warning",
          );
        }
        return { block: true, reason: "Bash command mutates a protected path" };
      }

      const isDangerous = dangerousPatterns.some((p) => p.test(command));

      if (isDangerous) {
        if (!ctx.hasUI) {
          return {
            block: true,
            reason: "Dangerous command blocked (no UI for confirmation)",
          };
        }

        if (!(await confirmDangerousCommand(ctx, command))) {
          ctx.abort();
          return { block: true, reason: "Denied by user" };
        }
      }
      return undefined;
    }

    /* ── Protected paths gate ── */
    if (event.toolName === "write" || event.toolName === "edit") {
      const path = event.input.path;
      if (typeof path !== "string") return undefined;
      const isProtected = touchesProtectedPath(path);

      if (isProtected) {
        if (ctx.hasUI) {
          ctx.ui.notify(
            `Blocked ${event.toolName} to protected path: ${path}`,
            "warning",
          );
        }
        return { block: true, reason: `Path "${path}" is protected` };
      }

      return undefined;
    }

    return undefined;
  });
}
