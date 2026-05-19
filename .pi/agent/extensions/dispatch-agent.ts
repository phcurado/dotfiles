import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
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

function dirs(cwd: string) {
  return [
    join(cwd, ".pi/agent/agents"),
    join(cwd, ".pi/agents"),
    join(homedir(), ".pi/agent/agents"),
  ];
}

function parse(file: string): Agent | null {
  if (!existsSync(file)) return null;
  const raw = readFileSync(file, "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const fm: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }

  if (!fm.name) return null;
  return {
    name: fm.name,
    description: fm.description ?? "",
    model: fm.model ?? "claude-opus-4-7",
    tools: fm.tools ?? "read,grep,find,ls",
    thinking: fm.thinking ?? "off",
    prompt: match[2].trim(),
  };
}

function getAgent(cwd: string, name: string): Agent | null {
  if (!SAFE_NAME.test(name)) return null;
  for (const dir of dirs(cwd)) {
    const agent = parse(join(dir, `${name}.md`));
    if (agent) return agent;
  }
  return null;
}

function allAgents(cwd: string): Agent[] {
  const seen = new Set<string>();
  const agents: Agent[] = [];
  for (const dir of dirs(cwd)) {
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
      const agent = parse(join(dir, file));
      if (!agent || seen.has(agent.name)) continue;
      seen.add(agent.name);
      agents.push(agent);
    }
  }
  return agents;
}

function run(agent: Agent, task: string, cwd: string, signal?: AbortSignal): Promise<string> {
  return new Promise((resolve) => {
    const args = [
      "-p",
      "--no-extensions",
      "--no-session",
      "--model", agent.model,
      "--tools", agent.tools,
      "--thinking", agent.thinking,
      "--append-system-prompt", agent.prompt,
      task,
    ];

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
      resolve(stdout || `Agent ${agent.name} exited with code ${code}. ${stderr}`);
    });
    proc.on("error", (e) => resolve(`Agent ${agent.name} failed: ${e.message}`));
  });
}

function taskText(task: string, files?: string[], notes?: string) {
  const list = files?.length ? files.map((f) => `- ${f}`).join("\n") : "- none";
  return [task, "", "Files:", list, notes ? `\nNotes:\n${notes}` : ""].join("\n");
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "list_agents",
    label: "List agents",
    description: "List markdown agents.",
    parameters: Type.Object({}),
    async execute(_id, _params, _signal, _update, ctx) {
      const text = allAgents(ctx.cwd)
        .map((a) => `- ${a.name}: ${a.description} (${a.model}, ${a.thinking})`)
        .join("\n") || "No agents found.";
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
      const text = await run(agent, taskText(params.task, params.files, params.notes), ctx.cwd, signal);
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
      const text = await run(agent, taskText(params.task, params.files, params.notes), ctx.cwd, signal);
      return { content: [{ type: "text", text }], details: { agent: agent.name, model: agent.model } };
    },
  });
}
