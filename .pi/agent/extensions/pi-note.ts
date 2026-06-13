import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { mkdir, writeFile, access } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";

const CONFIG_PATH = join(homedir(), ".pi", "agent", "pi-note.json");

function config(): { vault: string; dailyDir: string } {
  try {
    const c = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
    return { vault: c.vault ?? "", dailyDir: c.dailyDir ?? "01.Journal/Daily" };
  } catch {
    return { vault: "", dailyDir: "01.Journal/Daily" };
  }
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function (pi: ExtensionAPI) {
  if (process.env.PI_SUBAGENT_CHILD === "1") return;

  pi.on("before_agent_start", async (event) => {
    const { vault, dailyDir } = config();
    if (!vault) return;
    const daily = join(vault, dailyDir, `${isoDate(new Date())}.md`);
    const rules =
      `Personal notes vault: ${vault} (today's daily note: ${daily}). When the user asks to save/log/note `
      + "something, write polished markdown into a fitting folder there with the write tool — ls to see the "
      + "PARA folders, match a neighbor note's style, fix grammar/structure, never paste raw input or invent facts.";
    return { systemPrompt: `${event.systemPrompt}\n\n${rules}` };
  });

  pi.registerCommand("note", {
    description: "Capture the current discussion as a note (/note [hint])",
    handler: async (args: string) => {
      pi.sendUserMessage(
        "Save the key takeaway from our discussion as a markdown note in my vault: pick or create a fitting "
        + "folder, match a neighbor note's style, polish it, and write the file with the write tool. "
        + (args.trim() ? `Focus: ${args.trim()}` : ""),
      );
    },
  });

  pi.on("session_start", async (_event, ctx) => {
    if (!ctx.hasUI) return;
    let { vault, dailyDir } = config();

    if (!vault) {
      const v = await ctx.ui.input("Notes vault — absolute path (blank to skip):");
      if (!v?.trim()) return;
      const d = await ctx.ui.input("Daily notes dir [01.Journal/Daily]:");
      vault = v.trim();
      dailyDir = d?.trim() || "01.Journal/Daily";
      await mkdir(dirname(CONFIG_PATH), { recursive: true });
      await writeFile(CONFIG_PATH, JSON.stringify({ vault, dailyDir }, null, 2) + "\n", "utf8");
    }

    const iso = isoDate(new Date());
    const daily = join(vault, dailyDir, `${iso}.md`);
    const exists = await access(daily).then(() => true).catch(() => false);
    if (exists) return; // today's note already exists

    const plan = await ctx.ui.input("What will you do today? (blank to skip)");
    if (!plan?.trim()) return;
    pi.sendUserMessage(
      `Create today's daily note by writing this file with the write tool: ${daily}\n`
      + "Rewrite my input into clean, well-phrased items (fix grammar/casing, don't copy verbatim), one per "
      + 'line. Mark things I already did (past tense) with "- [x]"; still-to-do with "- [ ]". Use exactly:\n\n'
      + "---\ntags: [dailyNote]\n---\n"
      + `# ${iso}\n\n## Tasks\n- [x] <done>\n- [ ] <todo>\n\n## Notes\n\n`
      + `My input: ${plan.trim()}`,
    );
  });
}
