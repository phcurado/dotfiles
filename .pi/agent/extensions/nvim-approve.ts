import type {
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { getSettingsListTheme } from "@earendil-works/pi-coding-agent";
import { Container, type SettingItem, SettingsList, Spacer, Text } from "@earendil-works/pi-tui";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, extname, join, resolve } from "node:path";

const CONFIG_PATH = resolve(homedir(), ".pi/agent/nvim-approve.json");

type Config = { enabled: boolean; editor: string };
type Edit = { oldText: string; newText: string };

const DEFAULT_CONFIG: Config = {
  enabled: false,
  editor: process.env.VISUAL || process.env.EDITOR || "nvim",
};

function loadConfig(): Config {
  try {
    return {
      ...DEFAULT_CONFIG,
      ...JSON.parse(readFileSync(CONFIG_PATH, "utf8")),
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
  } catch {
    return "";
  }
}

function cleanPath(path: string): string {
  return path.startsWith("@") ? path.slice(1) : path;
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
  return (
    command
      .match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)
      ?.map((part) => part.replace(/^['"]|['"]$/g, "")) ?? ["nvim"]
  );
}

function vimString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function tempName(prefix: string, displayPath: string): string {
  const base = basename(displayPath) || "file";
  const ext = extname(base);
  const stem = ext ? base.slice(0, -ext.length) : base;
  return `${prefix}-${stem}${ext || ".txt"}`;
}

function tmuxValue(target: string, format: string): string {
  return spawnSync("tmux", ["display-message", "-p", "-t", target, format], {
    encoding: "utf8",
  }).stdout.trim();
}

function isTmuxWindowZoomed(pane: string): boolean {
  return tmuxValue(pane, "#{window_zoomed_flag}") === "1";
}

function activeTmuxPane(window: string): string {
  return spawnSync("tmux", ["list-panes", "-t", window, "-F", "#{pane_id}|#{pane_active}"], {
    encoding: "utf8",
  }).stdout
    .split("\n")
    .map((line) => line.split("|"))
    .find(([, active]) => active === "1")?.[0] ?? "";
}

function runReviewEditor(
  config: Config,
  originalFile: string,
  proposedFile: string,
  scriptFile: string,
) {
  const [cmd, ...args] = parseEditor(config.editor);
  const editorArgs = [...args, "-d", originalFile, proposedFile, "-S", scriptFile];

  const tmuxPane = process.env.TMUX_PANE;
  if (!process.env.TMUX || !tmuxPane || cmd === "tmux") {
    return spawnSync(cmd, editorArgs, { stdio: "inherit" });
  }

  const homeWindow = tmuxValue(tmuxPane, "#{@agent_sidebar_home}");
  const currentWindow = tmuxValue(tmuxPane, "#{window_id}");
  const hidden = Boolean(homeWindow && homeWindow !== currentWindow);

  spawnSync("tmux", ["set-option", "-p", "-t", tmuxPane, "@pi_approval", "1"], {
    stdio: "ignore",
  });

  if (hidden) {
    try {
      return spawnSync(cmd, editorArgs, { stdio: "inherit" });
    } finally {
      spawnSync("tmux", ["set-option", "-u", "-p", "-t", tmuxPane, "@pi_approval"], {
        stdio: "ignore",
      });
    }
  }

  const activeBefore = activeTmuxPane(currentWindow);
  const zoomedBefore = isTmuxWindowZoomed(currentWindow);
  const alreadyZoomedHere = zoomedBefore && activeBefore === tmuxPane;

  if (zoomedBefore && activeBefore && activeBefore !== tmuxPane) {
    spawnSync("tmux", ["resize-pane", "-Z", "-t", activeBefore], { stdio: "ignore" });
  }

  spawnSync("tmux", ["select-pane", "-t", tmuxPane], { stdio: "ignore" });
  if (!alreadyZoomedHere) {
    spawnSync("tmux", ["resize-pane", "-Z", "-t", tmuxPane], { stdio: "ignore" });
  }

  try {
    return spawnSync(cmd, editorArgs, { stdio: "inherit" });
  } finally {
    if (!alreadyZoomedHere && isTmuxWindowZoomed(tmuxPane)) {
      spawnSync("tmux", ["resize-pane", "-Z", "-t", tmuxPane], { stdio: "ignore" });
    }

    spawnSync("tmux", ["set-option", "-u", "-p", "-t", tmuxPane, "@pi_approval"], {
      stdio: "ignore",
    });

    if (activeBefore && activeBefore !== tmuxPane) {
      spawnSync("tmux", ["select-pane", "-t", activeBefore], { stdio: "ignore" });
      if (zoomedBefore) {
        spawnSync("tmux", ["resize-pane", "-Z", "-t", activeBefore], { stdio: "ignore" });
      }
    }
  }
}

async function reviewInNvim(
  config: Config,
  displayPath: string,
  original: string,
  proposed: string,
): Promise<string | null> {
  const dir = await mkdtemp(join(tmpdir(), "pi-approve-"));
  const originalFile = join(dir, tempName("original", displayPath));
  const proposedFile = join(dir, tempName("proposed", displayPath));
  const approvedFile = join(dir, "approved");
  const scriptFile = join(dir, "review.vim");

  await writeFile(originalFile, original, "utf8");
  await writeFile(proposedFile, proposed, "utf8");
  await writeFile(
    scriptFile,
    [
      "set shortmess+=I",
      "set termguicolors",
      "let g:disable_autoformat = v:true",
      "set diffopt=internal,filler,closeoff,vertical,context:6,linematch:40,algorithm:histogram",
      "highlight DiffAdd guibg=#263f31 guifg=NONE",
      "highlight DiffDelete guibg=#4a252b guifg=NONE",
      "highlight DiffChange guibg=#27364a guifg=NONE",
      "highlight DiffText guibg=#31533a guifg=NONE gui=bold",
      "highlight Folded guibg=#1f2335 guifg=#8c94b8",
      `let g:pi_display_path = ${vimString(displayPath)}`,
      `let g:pi_approve_file = ${vimString(approvedFile)}`,
      `let g:pi_proposed_file = ${vimString(proposedFile)}`,
      "set title",
      "let &titlestring = 'Pi approve: ' . g:pi_display_path",
      "set laststatus=2",
      "let mapleader = ' '",
      "function! PiApprove()",
      "  let l:buf = bufnr(g:pi_proposed_file)",
      "  if l:buf <= 0",
      "    echoerr 'PiApprove: proposed buffer not found'",
      "    return",
      "  endif",
      "  call setbufvar(l:buf, '&readonly', 0)",
      "  call setbufvar(l:buf, '&modifiable', 1)",
      "  execute 'buffer ' . l:buf",
      "  silent noautocmd write!",
      "  call writefile(['ok'], g:pi_approve_file)",
      "  qall!",
      "endfunction",
      "augroup PiApprove",
      "  autocmd!",
      `  execute 'autocmd BufWritePost ' . fnameescape(g:pi_proposed_file) . ' call writefile([\"ok\"], g:pi_approve_file) | qa!'`,
      "  autocmd VimResized * wincmd =",
      "augroup END",
      "command! Approve call PiApprove()",
      "command! Cancel qa!",
      "cnoreabbrev x call PiApprove()",
      "cnoreabbrev q qa!",
      "windo let b:disable_autoformat = v:true",
      "windo nnoremap <buffer> <silent> <nowait> <Space>a :call PiApprove()<CR>",
      "windo nnoremap <buffer> <silent> <nowait> <Space>q :qa!<CR>",
      "windo nnoremap <buffer> <silent> <nowait> ga :call PiApprove()<CR>",
      "windo nnoremap <buffer> <silent> <nowait> gq :qa!<CR>",
      "windo setlocal foldmethod=diff foldlevel=0",
      "wincmd h",
      "setlocal readonly nomodifiable",
      "let &l:statusline = ' ORIGINAL  %{g:pi_display_path} %=Space+a/ga approve  Space+q/gq cancel'",
      "if exists('&winbar')",
      "  let &l:winbar = 'ORIGINAL  %{g:pi_display_path}'",
      "endif",
      "wincmd l",
      "setlocal noreadonly modifiable modified",
      "let &l:statusline = ' PROPOSED (editable)  %{g:pi_display_path} %=Space+a/ga approve  Space+q/gq cancel'",
      "if exists('&winbar')",
      "  let &l:winbar = 'PROPOSED (editable)  %{g:pi_display_path}'",
      "endif",
      "diffupdate",
      "wincmd =",
      "normal! ]czz",
      `echo ${vimString(`Review ${displayPath}: Space+a/ga approve, Space+q/gq cancel. :w/:x in right pane also approves.`)}`,
    ].join("\n") + "\n",
    "utf8",
  );

  const result = runReviewEditor(
    config,
    originalFile,
    proposedFile,
    scriptFile,
  );

  if (result.error || result.status !== 0 || !existsSync(approvedFile)) {
    await rm(dir, { recursive: true, force: true });
    return null;
  }

  const accepted = await readFile(proposedFile, "utf8");
  await rm(dir, { recursive: true, force: true });
  return accepted;
}

async function review(
  ctx: ExtensionContext,
  config: Config,
  displayPath: string,
  original: string,
  proposed: string,
): Promise<string | null> {
  if (!ctx.hasUI) return null;
  if (ctx.mode === "tui")
    return reviewInNvim(config, displayPath, original, proposed);
  return (
    (await ctx.ui.editor(
      `Review proposed content: ${displayPath}`,
      proposed,
    )) ?? null
  );
}

async function showSettings(ctx: ExtensionContext, getConfig: () => Config, setConfig: (config: Config) => void) {
  await ctx.ui.custom((tui, theme, _kb, done) => {
    const config = getConfig();
    let settings: SettingsList;
    const items: SettingItem[] = [
      {
        id: "enabled",
        label: "Auto-approve",
        currentValue: config.enabled ? "on" : "off",
        values: ["on", "off"],
        description: "When on, file changes open in nvim for approval before applying.",
      },
      {
        id: "editor",
        label: "Editor",
        currentValue: config.editor,
        values: ["change"],
        description: "Editor command used for review.",
      },
    ];

    const container = new Container();
    container.addChild(new Text(theme.fg("accent", theme.bold("nvim-approve settings")), 0, 0));
    container.addChild(new Text(`${theme.fg("dim", "Config:")} ${CONFIG_PATH}`, 0, 0));
    container.addChild(new Spacer(1));

    settings = new SettingsList(
      items,
      Math.min(items.length + 2, 12),
      getSettingsListTheme(),
      (id, value) => {
        void (async () => {
          const current = getConfig();
          if (id === "enabled") {
            const next = { ...current, enabled: value === "on" };
            setConfig(next);
            await saveConfig(next);
            return;
          }

          const editor = await ctx.ui.input(`Editor command (${current.editor}):`);
          if (!editor?.trim()) {
            settings.updateValue("editor", current.editor);
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
      render: (w) => container.render(w),
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

  pi.registerCommand("nvim-approve", {
    description: "Configure nvim approval for edit/write tools",
    handler: async (_args, ctx) => {
      await showSettings(ctx, () => config, (next) => {
        config = next;
      });
    },
  });

  pi.on("tool_call", async (event, ctx) => {
    if (!config.enabled) return undefined;
    if (event.toolName !== "edit" && event.toolName !== "write")
      return undefined;

    const input = event.input as Record<string, unknown>;
    if (typeof input.path !== "string") return undefined;

    const displayPath = cleanPath(input.path);
    const absPath = resolve(ctx.cwd, displayPath);
    const original = await readText(absPath);

    let proposed: string;
    try {
      if (event.toolName === "write") {
        if (typeof input.content !== "string")
          return {
            block: true,
            reason: "nvim-approve: write content is not a string",
          };
        proposed = input.content;
      } else {
        const edits = input.edits as Edit[] | undefined;
        if (!Array.isArray(edits))
          return {
            block: true,
            reason: "nvim-approve: edit input has no edits array",
          };
        proposed = applyEdits(original, edits);
      }
    } catch (error) {
      return {
        block: true,
        reason: `nvim-approve: preview failed (${error instanceof Error ? error.message : String(error)})`,
      };
    }

    const accepted = await review(ctx, config, displayPath, original, proposed);
    if (accepted === null) {
      ctx.abort();
      return { block: true, reason: "nvim-approve: cancelled" };
    }

    if (event.toolName === "write") {
      input.content = accepted;
    } else if (accepted !== proposed) {
      const replacement = compactReplacement(original, accepted);
      if (replacement.length === 0)
        return { block: true, reason: "nvim-approve: no accepted changes" };
      input.edits = replacement;
    }

    return undefined;
  });
}
