import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

interface AgentDef {
  name: string;
  description: string;
  model: string;
  tools: string;
  systemPrompt: string;
}

function parseAgent(filePath: string): AgentDef | null {
  if (!existsSync(filePath)) return null;
  const raw = readFileSync(filePath, "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  const fm: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) fm[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  if (!fm.name) return null;
  return {
    name: fm.name,
    description: fm.description ?? "",
    model: fm.model ?? "openai-codex/gpt-5.5",
    tools: fm.tools ?? "read,grep,find,ls",
    systemPrompt: match[2].trim(),
  };
}

function findReviewerFile(cwd: string): string | null {
  const candidates = [
    join(cwd, ".pi", "agent", "agents", "reviewer.md"),
    join(cwd, ".pi", "agents", "reviewer.md"),
    join(homedir(), ".pi", "agent", "agents", "reviewer.md"),
  ];
  for (const p of candidates) if (existsSync(p)) return resolve(p);
  return null;
}

function runReviewer(agent: AgentDef, task: string, cwd: string, signal: AbortSignal | undefined): Promise<string> {
  return new Promise((resolveP) => {
    const args = [
      "-p",
      "--no-extensions",
      "--no-session",
      "--model", agent.model,
      "--tools", agent.tools,
      "--thinking", "off",
      "--append-system-prompt", agent.systemPrompt,
      task,
    ];
    const proc = spawn("pi", args, { cwd, env: process.env, stdio: ["ignore", "pipe", "pipe"] });
    const out: string[] = [];
    const err: string[] = [];
    proc.stdout!.setEncoding("utf8");
    proc.stderr!.setEncoding("utf8");
    proc.stdout!.on("data", (d) => out.push(d));
    proc.stderr!.on("data", (d) => err.push(d));
    if (signal) signal.addEventListener("abort", () => proc.kill("SIGTERM"));
    proc.on("close", (code) => {
      const text = out.join("").trim();
      if (text) resolveP(text);
      else resolveP(`Reviewer exited with code ${code}. ${err.join("").trim()}`);
    });
    proc.on("error", (e) => resolveP(`Reviewer spawn failed: ${e.message}`));
  });
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "request_review",
    label: "Request review",
    description:
      "Spawn the reviewer agent (read-only) on the current changes. Call when implementation appears complete. Returns review text. Reviewer cannot edit files.",
    parameters: Type.Object({
      goal: Type.String({ description: "User goal in 1-2 sentences." }),
      summary: Type.String({ description: "What was implemented. 3-6 bullets." }),
      files: Type.Array(Type.String(), { description: "Files changed or relevant." }),
      notes: Type.Optional(Type.String({ description: "Anything else the reviewer should know." })),
    }),
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      const file = findReviewerFile(ctx.cwd);
      if (!file) {
        return {
          content: [{ type: "text", text: "ERROR: reviewer.md not found in .pi/agent/agents/." }],
          details: { error: "missing-reviewer" },
        };
      }
      const agent = parseAgent(file);
      if (!agent) {
        return {
          content: [{ type: "text", text: `ERROR: failed to parse ${file}` }],
          details: { error: "parse-failed" },
        };
      }

      const filesBlock = params.files.length ? params.files.map((f) => `- ${f}`).join("\n") : "- (none listed)";
      const task = [
        `Goal: ${params.goal}`,
        ``,
        `Implementation summary:`,
        params.summary,
        ``,
        `Files:`,
        filesBlock,
        params.notes ? `\nNotes:\n${params.notes}` : "",
        ``,
        `Review per your system prompt.`,
      ].join("\n");

      if (ctx.hasUI) ctx.ui.notify(`Reviewer (${agent.model}) running…`, "info");

      const reviewText = await runReviewer(agent, task, ctx.cwd, signal);

      return {
        content: [{ type: "text", text: reviewText }],
        details: { model: agent.model, files: params.files },
      };
    },
  });
}
