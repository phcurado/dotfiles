import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { getSettingsListTheme } from "@earendil-works/pi-coding-agent";
import { Container, type SettingItem, SettingsList, Spacer, Text } from "@earendil-works/pi-tui";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

type Config = { vault: string; dailyDir: string };

const CONFIG_PATH = join(homedir(), ".pi", "agent", "pi-note.json");
const DEFAULT_CONFIG: Config = { vault: "", dailyDir: "" };

function loadConfig(): Config {
  try {
    const c = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
    return { vault: c.vault ?? "", dailyDir: c.dailyDir ?? "" };
  } catch {
    return DEFAULT_CONFIG;
  }
}

async function saveConfig(cfg: Config) {
  await mkdir(dirname(CONFIG_PATH), { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2) + "\n", "utf8");
}

function compactPath(path: string): string {
  const home = homedir();
  return path.startsWith(home) ? path.replace(home, "~") : path;
}

async function showSettings(ctx: ExtensionCommandContext) {
  await ctx.ui.custom((tui, theme, _kb, done) => {
    let cfg = loadConfig();
    let settings: SettingsList;
    const items: SettingItem[] = [
      {
        id: "vault",
        label: "Notes vault",
        currentValue: cfg.vault ? compactPath(cfg.vault) : "unset",
        values: ["change"],
        description: "Absolute path to your notes vault.",
      },
      {
        id: "dailyDir",
        label: "Daily notes dir",
        currentValue: cfg.dailyDir || "unset",
        values: ["change"],
        description: "Relative folder inside the vault for /daily.",
      },
    ];

    async function setValue(id: string) {
      const previous = id === "vault" ? (cfg.vault ? compactPath(cfg.vault) : "unset") : (cfg.dailyDir || "unset");
      const prompt = id === "vault"
        ? `Notes vault absolute path (${cfg.vault || "unset"}):`
        : `Daily notes dir (${cfg.dailyDir || "unset"}):`;
      const value = await ctx.ui.input(prompt);
      if (!value?.trim()) {
        settings.updateValue(id, previous);
        tui.requestRender();
        return;
      }

      cfg = id === "vault" ? { ...cfg, vault: value.trim() } : { ...cfg, dailyDir: value.trim() };
      settings.updateValue(id, id === "vault" ? compactPath(cfg.vault) : cfg.dailyDir);
      await saveConfig(cfg);
      tui.requestRender();
    }

    const container = new Container();
    container.addChild(new Text(theme.fg("accent", theme.bold("pi-note settings")), 0, 0));
    container.addChild(new Text(`${theme.fg("dim", "Config:")} ${CONFIG_PATH}`, 0, 0));
    container.addChild(new Spacer(1));

    settings = new SettingsList(
      items,
      Math.min(items.length + 2, 12),
      getSettingsListTheme(),
      (id) => void setValue(id),
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

async function ensureVault(ctx: ExtensionCommandContext): Promise<Config | undefined> {
  const cfg = loadConfig();
  if (cfg.vault) return cfg;
  await showSettings(ctx);
  const next = loadConfig();
  return next.vault ? next : undefined;
}

async function ensureDailyConfig(ctx: ExtensionCommandContext): Promise<Config | undefined> {
  const cfg = loadConfig();
  if (cfg.vault && cfg.dailyDir) return cfg;
  await showSettings(ctx);
  const next = loadConfig();
  return next.vault && next.dailyDir ? next : undefined;
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sendNoteCapture(pi: ExtensionAPI, hint: string) {
  pi.sendUserMessage(
    "Save the key takeaway from our discussion as a markdown note in my vault: pick or create a fitting "
    + "folder, match a neighbor note's style, polish it, and write the file with the write tool. "
    + (hint.trim() ? `Focus: ${hint.trim()}` : ""),
  );
}

export default function (pi: ExtensionAPI) {
  if (process.env.PI_SUBAGENT_CHILD === "1") return;

  pi.on("before_agent_start", async (event) => {
    const { vault } = loadConfig();
    if (!vault) return;
    const rules =
      `Personal notes vault: ${vault}. When the user asks to save/log/note something, write polished markdown `
      + "into a fitting folder there with the write tool — ls to see the PARA folders, match a neighbor note's "
      + "style, fix grammar/structure, never paste raw input or invent facts.";
    return { systemPrompt: `${event.systemPrompt}\n\n${rules}` };
  });

  pi.registerCommand("note", {
    description: "Configure pi-note, or capture with /note <hint>",
    handler: async (args: string, ctx) => {
      if (args.trim()) {
        const cfg = await ensureVault(ctx);
        if (!cfg) return;
        sendNoteCapture(pi, args);
        return;
      }

      await showSettings(ctx);
    },
  });

  pi.registerCommand("daily", {
    description: "Create today's daily note (/daily [tasks])",
    handler: async (args: string, ctx) => {
      const cfg = await ensureDailyConfig(ctx);
      if (!cfg) return;

      const plan = args.trim() || await ctx.ui.input("What will you do today? (blank to skip)");
      if (!plan?.trim()) return;

      const iso = isoDate(new Date());
      const daily = join(cfg.vault, cfg.dailyDir, `${iso}.md`);
      pi.sendUserMessage(
        `Create today's daily note by writing this file with the write tool: ${daily}\n`
        + "Rewrite my input into clean, well-phrased items (fix grammar/casing, don't copy verbatim), one per "
        + 'line. Mark things I already did (past tense) with "- [x]"; still-to-do with "- [ ]". Use exactly:\n\n'
        + "---\ntags: [dailyNote]\n---\n"
        + `# ${iso}\n\n## Tasks\n- [x] <done>\n- [ ] <todo>\n\n## Notes\n\n`
        + `My input: ${plan.trim()}`,
      );
    },
  });
}
