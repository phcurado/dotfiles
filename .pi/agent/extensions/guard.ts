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
  truncateToWidth,
  visibleWidth,
  wrapTextWithAnsi,
} from "@earendil-works/pi-tui";

/* ── Dangerous command patterns ── */
const wrappers =
  "sudo|doas|xargs|env|exec|command|nohup|time|nice|eval|then|do|else";
// Global options before a subcommand: `git -C dir`, `jj --repository x`.
const globalOpts = String.raw`(?:\s+-\S+(?:\s+(?:"[^"]*"|'[^']*'|[^\s"'-]\S*))?)*`;
// Rest of the current simple command, ending at whitespace.
const rest = String.raw`[^;&|\n]*\s`;

const tool = (name: string, sub: string, flags = "i") =>
  new RegExp(String.raw`\b${name}${globalOpts}\s+${sub}`, flags);

// `names` in command position: start, after a separator, or after sudo/xargs/sh -c/….
const command = (names: string) =>
  new RegExp(
    String.raw`(?:^|[;&|({\n\`]|\b(?:${wrappers})\s+(?:-\S+\s+(?:[^\s-]\S*\s+)?)*|\b(?:sh|bash|zsh)\s+-\w*c\s+)["']?\s*(?:\w+=\S*\s+)*\\?(?:\S*\/)?(?:${names})(?=[\s;&|)"']|$)`,
    "i",
  );

const dangerousPatterns: RegExp[] = [
  command("rm|rmdir|unlink"),
  /\bfind\b[^;&|\n]*\s-(?:delete|exec(?:dir)?\s+(?:\S*\/)?(?:rm|rmdir|unlink))\b/i,
  /\b(?:npm|pnpm)\s+(?:install|i|add|update|upgrade|uninstall|remove)\b/i,
  /\byarn\s+(?:install|add|up|remove)\b/i,
  /\b(?:pip3?|uv\s+pip)\s+(?:install|uninstall)\b/i,
  /\bcargo\s+(?:install|uninstall)\b/i,
  /\bbrew\s+(?:install|upgrade|uninstall|remove)\b/i,
  /\b(?:pacman|paru|yay)\s+[^\n;&|]*(?:-[a-z]*[SR][a-z]*|--sync|--remove)\b/,
  /\bmise\s+(?:install|use|upgrade|uninstall)\b/i,
  /\b(?:curl|wget)\b[^\n;]*\|\s*(?:sh|bash|zsh)\b/i,
  /\b(?:sh|bash|zsh|eval|source)\b[^;&|\n]*(?:\$\(|<\()\s*(?:curl|wget)\b/i,
  /\bsudo\b/i,
  /\b(chmod|chown)\b.*777/i,
  tool("git", String.raw`push\b`),
  tool("git", String.raw`reset\b${rest}--hard\b`),
  tool("git", String.raw`clean\b${rest}-(?:-force\b|[a-z]*[fdx])`),
  tool(
    "git",
    String.raw`checkout\b${rest}(?:--(?=\s|$)|--force\b|-[a-z]*f\b|\.(?:\/\S*)?(?=[\s;&|)]|$))`,
  ),
  tool("git", String.raw`switch\b${rest}(?:--force|--discard-changes|-[a-z]*f)\b`),
  tool("git", String.raw`branch\b${rest}-[a-zA-Z]*D\b`, ""),
  tool("git", String.raw`restore\b`),
  tool("git", String.raw`stash\s+(?:drop|clear)\b`),
  tool("jj", String.raw`git\s+push\b`),
  tool("jj", String.raw`(?:abandon|restore|undo)\b`),
  tool("jj", String.raw`op(?:eration)?\s+(?:abandon|restore|revert)\b`),
  tool("jj", String.raw`(?:bookmark|b)\s+(?:delete|d|forget|f)\b`),
  tool("docker", String.raw`(?:volume|image|system|container|network)\s+prune\b`),
  tool("docker", String.raw`volume\s+rm\b`),
  tool("docker", String.raw`(?:(?:container|image)\s+)?rmi?\b${rest}(?:--force|-[a-z]*f)\b`),
  new RegExp(
    String.raw`\bdocker(?:-compose|${globalOpts}\s+compose)\b${rest}down\b${rest}(?:--volumes|-[a-z]*v)\b`,
    "i",
  ),
  /(^|[\s;&|])>{1,2}\s*\/dev\/(?:sd[a-z]|nvme\d+n\d+|disk\d+)/i,
  /\bdd\b[^\n;&|]*\bof=\/dev\/(?:sd[a-z]|nvme\d+n\d+|disk\d+)/i,
  /\bmkfs\./i,
  /\b(?:fdisk|parted|wipefs)\b[^\n;&|]*\/dev\/(?:sd[a-z]|nvme\d+n\d+|disk\d+)/i,
  /\bcryptsetup\b[^\n;&|]*\bluksFormat\b/i,
];

/* ── Protected paths ── */
const protectedPathPatterns: RegExp[] = [
  /(?:^|\/)\.env(?:\.(?!(?:example|sample|template)$)[^/]+)?$/i,
  /(?:^|\/)(?:\.git|\.ssh|\.gnupg|\.config\/sops|\.aws|\.kube)(?:\/|$)/i,
  /(?:^|\/)(?:keys|age)\.txt$/i,
  /(?:^|\/)\.pi\/agent\/auth\.json$/i,
  /(?:^|[/_.-])credentials(?:\.(?:json|toml|ya?ml))?$/i,
  /(?:^|\/)id_(?:rsa|ed25519|ecdsa)[^/]*$/i,
];

// Pi must not edit dependencies, but deleting node_modules for a clean reinstall only needs the rm prompt.
const editOnlyProtected = /(?:^|\/)node_modules(?:\/|$)/i;

function isProtectedPath(path: string): boolean {
  return protectedPathPatterns.some((pattern) => pattern.test(path));
}

const leadingWord = new RegExp(String.raw`^(?:${wrappers})$|^-|^\w+=`);
const writesAnyArg =
  /^(?:rm|rmdir|unlink|shred|mv|touch|mkdir|chmod|chown|truncate|tee)$/;
const writesLastArg = /^(?:cp|ln|rsync|install)$/;

/** Paths a bash command writes: redirect targets and write-command arguments. */
function bashWriteTargets(command: string): string[] {
  const targets = [
    ...command.matchAll(/(?<![-=<>])>>?[|&]?\s*["']?([^\s;&|<>()"']+)/g),
  ].map((match) => match[1]);
  for (const segment of command.match(/(?:"[^"]*"|'[^']*'|[^;&|\n()`"'])+/g) ??
    []) {
    const words = (segment.match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map((word) =>
      word.replace(/["']/g, ""),
    );
    while (words.length > 1 && leadingWord.test(words[0])) words.shift();
    const [cmd = "", ...args] = words;
    const name = cmd.slice(cmd.lastIndexOf("/") + 1);
    const paths = args.filter((arg) => !arg.startsWith("-"));
    const inPlace =
      /^(?:sed|perl)$/.test(name) &&
      args.some((arg) => /^(?:-[a-z]*i|--in-place)/i.test(arg));
    if (name === "dd") {
      targets.push(
        ...args.filter((arg) => arg.startsWith("of=")).map((arg) => arg.slice(3)),
      );
    } else if (writesLastArg.test(name)) {
      targets.push(...paths.slice(-1));
    } else if (writesAnyArg.test(name) || inPlace) {
      targets.push(...paths);
    }
  }
  return targets;
}

/* ── Confirmation prompt ── */
const promptTitle = "Run this dangerous command?";
const maxPromptLines = 10;

function capLines(lines: string[]): string[] {
  if (lines.length <= maxPromptLines) return lines;
  return [
    ...lines.slice(0, maxPromptLines),
    `… (${lines.length - maxPromptLines} more lines)`,
  ];
}

function commandBox(command: string, width: number, theme: any): string[] {
  const maxInner = Math.max(1, width - 6);
  const wrapped = capLines(wrapTextWithAnsi(command, maxInner));
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
  if (ctx.mode !== "tui") {
    return ctx.ui.confirm(promptTitle, capLines(command.split("\n")).join("\n"));
  }

  const result = await ctx.ui.custom<"yes" | "no" | null>(
    (tui, theme, _kb, done) => {
      let selected: "yes" | "no" = "no";
      const choose = (value: "yes" | "no") => done(value);
      const option = (value: "yes" | "no", label: string) => {
        const prefix = selected === value ? theme.fg("accent", "→") : " ";
        const text = selected === value ? theme.fg("accent", label) : label;
        return `${prefix} ${text}`;
      };

      return {
        render(width: number) {
          return [
            theme.fg("warning", theme.bold(promptTitle)),
            "",
            ...commandBox(command, width, theme),
            "",
            option("yes", "1. Yes"),
            option("no", "2. No"),
            "",
          ].map((line) => truncateToWidth(line, width));
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
    { blocked: { kind: "permission", message: promptTitle } },
  );

  return result === "yes";
}

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event, ctx) => {
    /* ── Bash gate ── */
    if (event.toolName === "bash") {
      const command = event.input.command;
      if (typeof command !== "string") return undefined;

      const target = bashWriteTargets(command).find(isProtectedPath);
      if (target) {
        if (ctx.hasUI) {
          ctx.ui.notify(
            `Blocked bash write to protected path: ${target}`,
            "warning",
          );
        }
        return {
          block: true,
          reason: `Bash command writes to protected path ${target}`,
        };
      }

      const isDangerous = dangerousPatterns.some((p) => p.test(command));

      if (isDangerous) {
        if (!ctx.hasUI) {
          return {
            block: true,
            reason: "Dangerous command blocked (no UI for confirmation)",
          };
        }

        pi.events.emit("pi:approval", { active: true });
        try {
          if (!(await confirmDangerousCommand(ctx, command))) {
            // Stop the whole run so the user can rethink the approach with the model.
            ctx.abort();
            return { block: true, reason: "Denied by user" };
          }
        } finally {
          pi.events.emit("pi:approval", { active: false });
        }
      }
      return undefined;
    }

    /* ── Protected paths gate ── */
    if (event.toolName === "write" || event.toolName === "edit") {
      const path = event.input.path;
      if (typeof path !== "string") return undefined;

      if (isProtectedPath(path) || editOnlyProtected.test(path)) {
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
