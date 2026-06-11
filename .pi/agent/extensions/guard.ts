/**
 * Guard Extension
 *
 * 1. Permission gate — confirms before running dangerous bash commands.
 * 2. Protected paths — blocks writes/edits to sensitive paths.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

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

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event, ctx) => {
    /* ── Bash gate ── */
    if (event.toolName === "bash") {
      const command = event.input.command;
      if (typeof command !== "string") return undefined;

      if (mutatesProtectedPath(command)) {
        if (ctx.hasUI) {
          ctx.ui.notify(`Blocked bash write to protected path: ${command}`, "warning");
        }
        return { block: true, reason: "Bash command mutates a protected path" };
      }

      const isDangerous = dangerousPatterns.some((p) => p.test(command));

      if (isDangerous) {
        if (!ctx.hasUI) {
          return { block: true, reason: "Dangerous command blocked (no UI for confirmation)" };
        }

        const choice = await ctx.ui.select(
          `⚠️  Dangerous command:\n\n  ${command}\n\nAllow?`,
          ["No", "Yes"],
        );

        if (choice !== "Yes") {
          return { block: true, reason: "Blocked by user" };
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
          ctx.ui.notify(`Blocked ${event.toolName} to protected path: ${path}`, "warning");
        }
        return { block: true, reason: `Path "${path}" is protected` };
      }

      return undefined;
    }

    return undefined;
  });
}
