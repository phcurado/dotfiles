import type {
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { getSettingsListTheme } from "@earendil-works/pi-coding-agent";
import { Container, type SettingItem, SettingsList, Spacer, Text } from "@earendil-works/pi-tui";
import { readFileSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CONFIG_PATH = resolve(homedir(), ".pi/agent/review.json");

type Config = { autoApprove: boolean; editor?: string };
type Edit = { oldText: string; newText: string };

const DEFAULT_CONFIG: Config = {
  autoApprove: false,
};

function loadConfig(): Config {
  try {
    const raw = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
    return {
      autoApprove:
        typeof raw.autoApprove === "boolean"
          ? raw.autoApprove
          : DEFAULT_CONFIG.autoApprove,
      editor:
        typeof raw.editor === "string" && raw.editor.trim()
          ? raw.editor
          : undefined,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

async function saveConfig(config: Config) {
  await mkdir(dirname(CONFIG_PATH), { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", "utf8");
}

async function readText(path: string): Promise<string> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "";
    throw error;
  }
}

function cleanPath(path: string): string {
  return path.startsWith("@") ? path.slice(1) : path;
}

function resolveToolPath(path: string, cwd: string): string {
  const normalized = cleanPath(path).replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, " ");
  if (normalized === "~") return homedir();
  if (normalized.startsWith("~/")) return join(homedir(), normalized.slice(2));
  if (normalized.startsWith("file://")) return fileURLToPath(normalized);
  return resolve(cwd, normalized);
}

function normalizeToLf(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function normalizeEditableContent(text: string): string {
  return normalizeToLf(text.startsWith("\uFEFF") ? text.slice(1) : text);
}

function applyEdits(original: string, edits: Edit[]): string {
  const ranges: Array<{ start: number; end: number; newText: string }> = [];

  for (const edit of edits) {
    const start = original.indexOf(edit.oldText);
    if (start === -1) throw new Error("oldText not found");
    if (original.indexOf(edit.oldText, start + edit.oldText.length) !== -1)
      throw new Error("oldText is not unique");
    ranges.push({
      start,
      end: start + edit.oldText.length,
      newText: edit.newText,
    });
  }

  ranges.sort((a, b) => a.start - b.start);
  for (let i = 1; i < ranges.length; i++) {
    if (ranges[i].start < ranges[i - 1].end)
      throw new Error("edit ranges overlap");
  }

  let out = "";
  let cursor = 0;
  for (const range of ranges) {
    out += original.slice(cursor, range.start) + range.newText;
    cursor = range.end;
  }
  return out + original.slice(cursor);
}

function compactReplacement(original: string, accepted: string): Edit[] {
  if (original === accepted) return [];

  let start = 0;
  while (
    start < original.length &&
    start < accepted.length &&
    original[start] === accepted[start]
  )
    start++;

  let endOriginal = original.length;
  let endAccepted = accepted.length;
  while (
    endOriginal > start &&
    endAccepted > start &&
    original[endOriginal - 1] === accepted[endAccepted - 1]
  ) {
    endOriginal--;
    endAccepted--;
  }

  start = original.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const originalLineEnd = original.indexOf("\n", endOriginal);
  const acceptedLineEnd = accepted.indexOf("\n", endAccepted);
  endOriginal = originalLineEnd === -1 ? original.length : originalLineEnd + 1;
  endAccepted = acceptedLineEnd === -1 ? accepted.length : acceptedLineEnd + 1;

  const oldText = original.slice(start, endOriginal);
  const newText = accepted.slice(start, endAccepted);
  const first = oldText ? original.indexOf(oldText) : -1;
  const unique =
    oldText &&
    first !== -1 &&
    original.indexOf(oldText, first + oldText.length) === -1;

  return unique
    ? [{ oldText, newText }]
    : [{ oldText: original, newText: accepted }];
}

function parseEditor(command: string): string[] {
  return command
    .match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)
    ?.map((part) => part.replace(/^["']|["']$/g, "")) ?? [];
}

function editorInvocation(config: Config, originalFile: string, proposedFile: string) {
  if (!config.editor) throw new Error(`Configure an editor command in ${CONFIG_PATH}`);
  const [command, ...args] = parseEditor(config.editor);
  if (!command) throw new Error(`Configure an editor command in ${CONFIG_PATH}`);
  if (!args.some((arg) => arg.includes("{original}")))
    throw new Error("Editor command must include {original}");
  if (!args.some((arg) => arg.includes("{proposed}")))
    throw new Error("Editor command must include {proposed}");

  return {
    command,
    args: args.map((arg) => arg
      .replaceAll("{original}", originalFile)
      .replaceAll("{proposed}", proposedFile)),
  };
}

function tempName(prefix: string, displayPath: string): string {
  const base = basename(displayPath) || "file";
  const ext = extname(base);
  const stem = ext ? base.slice(0, -ext.length) : base;
  return `${prefix}-${stem}${ext || ".txt"}`;
}

async function reviewInEditor(
  ctx: ExtensionContext,
  config: Config,
  displayPath: string,
  original: string,
  proposed: string,
): Promise<string | null> {
  const dir = await mkdtemp(join(tmpdir(), "pi-review-"));
  const originalFile = join(dir, tempName("original", displayPath));
  const proposedFile = join(dir, tempName("proposed", displayPath));
  const decisionFile = join(dir, "decision");

  try {
    await writeFile(originalFile, original, "utf8");
    await writeFile(proposedFile, proposed, "utf8");
    const { command, args } = editorInvocation(config, originalFile, proposedFile);
    let spawnError: Error | undefined;
    const status = await ctx.ui.custom<number | null>((tui, _theme, _kb, done) => {
      tui.stop();
      try {
        const result = spawnSync(command, args, {
          stdio: "inherit",
          env: {
            ...process.env,
            PI_REVIEW_PATH: displayPath,
            PI_REVIEW_ORIGINAL: originalFile,
            PI_REVIEW_PROPOSED: proposedFile,
            PI_REVIEW_DECISION: decisionFile,
          },
        });
        spawnError = result.error;
        done(result.status);
      } catch (error) {
        spawnError = error instanceof Error ? error : new Error(String(error));
        done(null);
      } finally {
        tui.start();
        tui.requestRender(true);
      }
      return { render: () => [], invalidate: () => {} };
    });
    if (spawnError) throw spawnError;
    if (status !== 0) return null;
    const approved = (await readText(decisionFile)).trim() === "approve";
    if (!approved && !await ctx.ui.confirm("Apply reviewed change?", displayPath)) return null;
    return await readFile(proposedFile, "utf8");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function reviewChange(
  ctx: ExtensionContext,
  config: Config,
  displayPath: string,
  original: string,
  proposed: string,
): Promise<string | null> {
  if (!ctx.hasUI) return null;
  if (ctx.mode === "tui")
    return reviewInEditor(ctx, config, displayPath, original, proposed);
  return (
    (await ctx.ui.editor(
      `Review proposed content: ${displayPath}`,
      proposed,
    )) ?? null
  );
}

async function showSettings(
  ctx: ExtensionContext,
  getConfig: () => Config,
  setConfig: (config: Config) => void,
) {
  await ctx.ui.custom((tui, theme, _kb, done) => {
    const config = getConfig();
    let settings: SettingsList;
    const items: SettingItem[] = [
      {
        id: "autoApprove",
        label: "Auto-approve",
        currentValue: config.autoApprove ? "on" : "off",
        values: ["on", "off"],
        description: "When on, edit/write changes apply directly.",
      },
      {
        id: "editor",
        label: "Editor",
        currentValue: config.editor ?? "not configured",
        values: ["change"],
        description: "Command containing {original} and {proposed} placeholders.",
      },
    ];

    const container = new Container();
    container.addChild(new Text(theme.fg("accent", theme.bold("review settings")), 0, 0));
    container.addChild(new Text(`${theme.fg("dim", "Config:")} ${CONFIG_PATH}`, 0, 0));
    container.addChild(new Spacer(1));

    settings = new SettingsList(
      items,
      Math.min(items.length + 2, 12),
      getSettingsListTheme(),
      (id, value) => {
        void (async () => {
          const current = getConfig();
          if (id === "autoApprove") {
            const next = { ...current, autoApprove: value === "on" };
            setConfig(next);
            await saveConfig(next);
            return;
          }

          const editor = await ctx.ui.input(
            "Editor command with {original} and {proposed}:",
            current.editor,
          );
          if (!editor?.trim()) {
            settings.updateValue("editor", current.editor ?? "not configured");
            tui.requestRender();
            return;
          }
          const next = { ...current, editor: editor.trim() };
          setConfig(next);
          settings.updateValue("editor", next.editor);
          await saveConfig(next);
          tui.requestRender();
        })();
      },
      () => done(undefined),
    );
    container.addChild(settings);
    container.addChild(new Spacer(1));

    return {
      render: (width) => container.render(width),
      invalidate: () => container.invalidate(),
      handleInput: (data) => {
        settings.handleInput?.(data);
        tui.requestRender();
      },
    };
  });
}

export default function (pi: ExtensionAPI) {
  if (process.env.PI_SUBAGENT_CHILD === "1") return;

  let config = loadConfig();

  pi.registerCommand("review", {
    description: "Configure the edit/write review gate",
    handler: async (_args, ctx) => {
      await showSettings(ctx, () => config, (next) => {
        config = next;
      });
    },
  });

  pi.on("tool_call", async (event, ctx) => {
    if (config.autoApprove) return undefined;
    if (event.toolName !== "edit" && event.toolName !== "write")
      return undefined;

    const input = event.input as Record<string, unknown>;
    if (typeof input.path !== "string") return undefined;

    const displayPath = cleanPath(input.path);
    const absPath = resolveToolPath(input.path, ctx.cwd);
    const original = await readText(absPath);
    let reviewOriginal = original;

    let proposed: string;
    try {
      if (event.toolName === "write") {
        if (typeof input.content !== "string")
          return {
            block: true,
            reason: "review: write content is not a string",
          };
        proposed = input.content;
      } else {
        const edits = input.edits as Edit[] | undefined;
        if (!Array.isArray(edits))
          return {
            block: true,
            reason: "review: edit input has no edits array",
          };
        reviewOriginal = normalizeEditableContent(original);
        proposed = applyEdits(
          reviewOriginal,
          edits.map((edit) => ({
            oldText: normalizeToLf(edit.oldText),
            newText: normalizeToLf(edit.newText),
          })),
        );
      }
    } catch (error) {
      return {
        block: true,
        reason: `review: preview failed (${error instanceof Error ? error.message : String(error)})`,
      };
    }

    let accepted: string | null;
    try {
      accepted = await reviewChange(ctx, config, displayPath, reviewOriginal, proposed);
    } catch (error) {
      return {
        block: true,
        reason: `review: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    if (accepted === null) {
      ctx.abort();
      return { block: true, reason: "review: cancelled" };
    }

    if (event.toolName === "write") {
      input.content = accepted;
    } else if (accepted !== proposed) {
      const replacement = compactReplacement(reviewOriginal, accepted);
      if (replacement.length === 0)
        return { block: true, reason: "review: no accepted changes" };
      input.edits = replacement;
    }

    return undefined;
  });
}
