import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { spawn } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

type Agent = {
  name: string;
  description: string;
  model: string;
  tools: string;
  thinking: string;
  prompt: string;
};

const SAFE_NAME = /^[A-Za-z0-9_-]+$/;

function agentDirs(cwd: string) {
  return [join(cwd, ".pi/agent/agents"), join(cwd, ".pi/agents"), join(homedir(), ".pi/agent/agents")];
}

function parseAgent(file: string): Agent | null {
  if (!existsSync(file)) return null;
  const raw = readFileSync(file, "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  const fm: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  if (!fm.name || !fm.model) return null;
  return {
    name: fm.name,
    description: fm.description ?? "",
    model: fm.model,
    tools: fm.tools ?? "read,grep,find,ls",
    thinking: fm.thinking ?? "off",
    prompt: match[2].trim(),
  };
}

function getAgent(cwd: string, name: string): Agent | null {
  if (!SAFE_NAME.test(name)) return null;
  for (const dir of agentDirs(cwd)) {
    const agent = parseAgent(join(dir, `${name}.md`));
    if (agent) return agent;
  }
  return null;
}

function allAgents(cwd: string): Agent[] {
  const seen = new Set<string>();
  const agents: Agent[] = [];
  for (const dir of agentDirs(cwd)) {
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
      const agent = parseAgent(join(dir, file));
      if (!agent || seen.has(agent.name)) continue;
      seen.add(agent.name);
      agents.push(agent);
    }
  }
  return agents;
}

function run(agent: Agent, text: string, cwd: string, signal?: AbortSignal): Promise<string> {
  return new Promise((resolve) => {
    const args = ["-p", "--no-extensions", "--no-session", "--model", agent.model, "--tools", agent.tools, "--thinking", agent.thinking, "--append-system-prompt", agent.prompt, text];
    const proc = spawn("pi", args, { cwd, env: process.env, stdio: ["ignore", "pipe", "pipe"] });
    const out: string[] = [];
    const err: string[] = [];
    proc.stdout?.setEncoding("utf8");
    proc.stderr?.setEncoding("utf8");
    proc.stdout?.on("data", (d) => out.push(d));
    proc.stderr?.on("data", (d) => err.push(d));
    signal?.addEventListener("abort", () => proc.kill("SIGTERM"));
    proc.on("close", (code) => {
      const stdout = out.join("").trim();
      const stderr = err.join("").trim();
      resolve(stdout || `Agent ${agent.name} exited (${code}). ${stderr}`);
    });
    proc.on("error", (e) => resolve(`Agent ${agent.name} failed: ${e.message}`));
  });
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "list_agents",
    label: "List agents",
    description: "List markdown agents.",
    parameters: Type.Object({}),
    async execute(_id, _params, _signal, _update, ctx) {
      const text = allAgents(ctx.cwd).map((a) => `- ${a.name}: ${a.description} (${a.model}, ${a.thinking})`).join("\n") || "No agents found.";
      return { content: [{ type: "text", text }] };
    },
  });

  pi.registerTool({
    name: "dispatch_agent",
    label: "Dispatch agent",
    description: "Run .pi/agent/agents/<agent>.md in a pi subprocess.",
    parameters: Type.Object({
      agent: Type.String(),
      task: Type.String(),
      files: Type.Optional(Type.Array(Type.String())),
      notes: Type.Optional(Type.String()),
    }),
    async execute(_id, params, signal, _update, ctx) {
      const agent = getAgent(ctx.cwd, params.agent);
      if (!agent) return { content: [{ type: "text", text: `Agent not found: ${params.agent}` }] };
      if (ctx.hasUI) ctx.ui.notify(`${agent.name} (${agent.model}) running…`, "info");
      const taskText = [params.task, "", "Files:", params.files?.length ? params.files.map((f) => `- ${f}`).join("\n") : "- none", params.notes ? `\nNotes:\n${params.notes}` : ""].join("\n");
      const text = await run(agent, taskText, ctx.cwd, signal);
      return { content: [{ type: "text", text }], details: { agent: agent.name, model: agent.model } };
    },
  });

  pi.registerTool({
    name: "request_build",
    label: "Request build",
    description: "Run builder.md.",
    parameters: Type.Object({
      task: Type.String(),
      files: Type.Optional(Type.Array(Type.String())),
      notes: Type.Optional(Type.String()),
    }),
    async execute(_id, params, signal, _update, ctx) {
      const agent = getAgent(ctx.cwd, "builder");
      if (!agent) return { content: [{ type: "text", text: "builder.md not found" }] };
      if (ctx.hasUI) ctx.ui.notify(`builder (${agent.model}) running…`, "info");
      const taskText = [params.task, "", "Files:", params.files?.length ? params.files.map((f) => `- ${f}`).join("\n") : "- none", params.notes ? `\nNotes:\n${params.notes}` : ""].join("\n");
      const text = await run(agent, taskText, ctx.cwd, signal);
      return { content: [{ type: "text", text }], details: { agent: agent.name, model: agent.model } };
    },
  });

  pi.registerTool({
    name: "request_review",
    label: "Request review",
    description: "Spawn the reviewer agent (read-only) on the current changes. Call when implementation appears complete. Returns review text. Reviewer cannot edit files.",
    parameters: Type.Object({
      goal: Type.String({ description: "User goal in 1-2 sentences." }),
      summary: Type.String({ description: "What was implemented. 3-6 bullets." }),
      files: Type.Array(Type.String(), { description: "Files changed or relevant." }),
      notes: Type.Optional(Type.String({ description: "Anything else the reviewer should know." })),
    }),
    async execute(_id, params, signal, _update, ctx) {
      const agent = getAgent(ctx.cwd, "reviewer");
      if (!agent) return { content: [{ type: "text", text: "reviewer.md not found" }] };
      const filesBlock = params.files.length ? params.files.map((f) => `- ${f}`).join("\n") : "- (none listed)";
      const taskText = [`Goal: ${params.goal}`, "", "Implementation summary:", params.summary, "", "Files:", filesBlock, params.notes ? `\nNotes:\n${params.notes}` : "", "", "Review per your system prompt."].join("\n");
      if (ctx.hasUI) ctx.ui.notify(`Reviewer (${agent.model}) running…`, "info");
      const text = await run(agent, taskText, ctx.cwd, signal);
      return { content: [{ type: "text", text }], details: { model: agent.model, files: params.files } };
    },
  });

  pi.registerCommand("review", {
    description: "Run the reviewer agent on current session work",
    handler: async (_args: string, ctx: ExtensionCommandContext) => {
      const agent = getAgent(ctx.cwd, "reviewer");
      if (!agent) { ctx.ui.notify("reviewer.md not found", "error"); return; }
      if (ctx.hasUI) ctx.ui.notify(`Reviewer (${agent.model}) running…`, "info");
      const text = await run(agent, "Review the work from this session.", ctx.cwd);
      ctx.ui.notify("Review complete", "info");
    },
  });
}
