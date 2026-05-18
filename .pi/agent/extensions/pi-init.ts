import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { existsSync } from "node:fs";
import { join } from "node:path";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("init", {
    description: "Inspect current project and create AGENTS.md if missing",
    handler: async (_args: string, ctx: ExtensionCommandContext) => {
      const target = join(ctx.cwd, "AGENTS.md");

      if (existsSync(target)) {
        ctx.ui.notify("AGENTS.md already exists", "info");
        return;
      }

      pi.sendUserMessage(`Inspect this project and create an AGENTS.md if missing.

Requirements:
- Read README and relevant project files first.
- Infer stack, common commands, conventions, and gotchas from the repo.
- Keep AGENTS.md concise and useful for coding agents.
- Include only facts supported by files you inspected.
- Before writing, show proposed content and ask for approval.
- Do not overwrite existing files.`);
    },
  });
}
