import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { createServer, type Server } from "node:net";
import { chmodSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

type NvimRequest = {
  prompt?: string;
  cwd?: string;
  file?: string;
  relativeFile?: string;
  filetype?: string;
  cursor?: { line: number; column: number };
  range?: { startLine: number; endLine: number };
  text?: string;
};

function tmuxPane(): string | undefined {
  return process.env.TMUX_PANE || undefined;
}

function setPaneOption(name: string, value?: string) {
  const pane = tmuxPane();
  if (!process.env.TMUX || !pane) return;

  const args = value === undefined
    ? ["set-option", "-u", "-p", "-t", pane, name]
    : ["set-option", "-p", "-t", pane, name, value];

  spawnSync("tmux", args, { stdio: "ignore" });
}

function codeFence(text: string): string {
  const runs = text.match(/`{3,}/g) ?? [];
  const longest = runs.reduce((max, run) => Math.max(max, run.length), 2);
  return "`".repeat(longest + 1);
}

function formatRequest(request: NvimRequest): string {
  const file = request.relativeFile || request.file || "unknown";
  const cursor = request.cursor
    ? `${request.cursor.line}:${request.cursor.column}`
    : "unknown";
  const range = request.range
    ? `${request.range.startLine}-${request.range.endLine}`
    : "unknown";
  const fence = codeFence(request.text || "");
  const openingFence = request.filetype ? `${fence}${request.filetype}` : fence;

  return [
    "Neovim context:",
    `File: ${file}`,
    `Range: ${range}`,
    `Cursor: ${cursor}`,
    request.cwd ? `Cwd: ${request.cwd}` : undefined,
    "",
    openingFence,
    request.text || "",
    fence,
    "",
    "Request:",
    request.prompt || "Please review this selection.",
  ].filter((line) => line !== undefined).join("\n");
}

export default function (pi: ExtensionAPI) {
  if (process.env.PI_SUBAGENT_CHILD === "1") return;

  let ctx: ExtensionContext | undefined;
  let server: Server | undefined;
  let socketPath: string | undefined;

  function stopServer() {
    server?.close();
    server = undefined;

    if (socketPath) {
      rmSync(socketPath, { force: true });
      socketPath = undefined;
    }

    setPaneOption("@pi_nvim_bridge_socket");
    setPaneOption("@pi_nvim_bridge");
  }

  function startServer() {
    stopServer();
    if (!process.env.TMUX || !tmuxPane()) return;

    socketPath = join("/tmp", `pi-nvim-${process.pid}-${Date.now()}.sock`);
    rmSync(socketPath, { force: true });

    server = createServer((socket) => {
      let body = "";
      socket.setEncoding("utf8");
      socket.on("data", (chunk) => {
        body += chunk;
      });
      socket.on("end", () => {
        try {
          const request = JSON.parse(body.trim()) as NvimRequest;
          const message = formatRequest(request);
          const options = ctx?.isIdle() ? undefined : { deliverAs: "followUp" as const };
          pi.sendUserMessage(message, options);
          socket.end(JSON.stringify({ ok: true }) + "\n");
        } catch (error) {
          socket.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }) + "\n");
        }
      });
    });

    server.listen(socketPath, () => {
      if (!socketPath) return;
      chmodSync(socketPath, 0o600);
      setPaneOption("@pi_nvim_bridge", "1");
      setPaneOption("@pi_nvim_bridge_socket", socketPath);
    });
  }

  pi.on("session_start", async (_event, nextCtx) => {
    ctx = nextCtx;
    startServer();
  });

  pi.on("session_shutdown", async () => {
    ctx = undefined;
    stopServer();
  });
}
