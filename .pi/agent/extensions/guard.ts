/**
 * Guard Extension
 *
 * 1. Permission gate — confirms before running dangerous bash commands.
 * 2. Protected paths — blocks writes/edits to sensitive paths.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/* ── Dangerous command patterns ── */
const dangerousPatterns: RegExp[] = [
  /\brm\s+(-rf?|--recursive)/i,
  /\bsudo\b/i,
  /\b(chmod|chown)\b.*777/i,
  /\bgit\s+push\s+--force/i,
  /\bgit\s+push\s+-f\b/i,
  /\bgit\s+reset\s+--hard\b/i,
  /\bdocker\s+(rm|prune|system\s+prune)\b.*(-f|--force)/i,
  /\b>:.*\/dev\/(sd[a-z]|nvme|disk)/i,
  /\bdd\s+if=/i,
  /\bmkfs\./i,
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

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event, ctx) => {
    /* ── Bash gate ── */
    if (event.toolName === "bash") {
      const command = event.input.command as string;
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
      const path = event.input.path as string;
      const isProtected = protectedPathFragments.some((f) => path.includes(f));

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
