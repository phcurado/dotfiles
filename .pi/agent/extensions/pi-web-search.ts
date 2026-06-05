import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execFile } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";

const BASE_URL = process.env.SEARXNG_URL ?? "http://127.0.0.1:8888";
const COMPOSE_FILE = join(
  homedir(),
  ".config",
  "searxng",
  "docker-compose.yml",
);

type SearxResult = { title?: string; url?: string; content?: string };

async function isUp(): Promise<boolean> {
  try {
    return (await fetch(`${BASE_URL}/healthz`)).ok;
  } catch {
    return false;
  }
}

function startContainer(): Promise<void> {
  return new Promise((resolve) => {
    execFile("docker", ["compose", "-f", COMPOSE_FILE, "up", "-d"], () =>
      resolve(),
    );
  });
}

async function waitUp(timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isUp()) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    if (await isUp()) return;
    await startContainer();
    if (!ctx.hasUI) return;
    const ok = await waitUp(8000);
    ctx.ui.notify(
      ok ? "SearxNG ready" : "SearxNG didn't start — is Docker running?",
      ok ? "info" : "warning",
    );
  });

  pi.registerTool({
    name: "web_search",
    label: "Web search",
    description:
      "Search the web via local SearxNG. Returns ranked results (title, URL, snippet). " +
      "Use for current information, docs, or facts not available in the codebase.",
    parameters: Type.Object({
      query: Type.String({ description: "Search query" }),
      maxResults: Type.Optional(
        Type.Number({
          description: "Max results (default 8)",
          minimum: 1,
          maximum: 20,
        }),
      ),
    }),
    async execute(_id, params, signal) {
      const url = `${BASE_URL}/search?q=${encodeURIComponent(params.query)}&format=json`;

      let res: Response;
      try {
        res = await fetch(url, { signal });
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `ERROR: SearxNG unreachable at ${BASE_URL} (${String(e)})`,
            },
          ],
          details: { error: "unreachable" },
        };
      }
      if (!res.ok) {
        return {
          content: [
            {
              type: "text",
              text: `ERROR: SearxNG returned HTTP ${res.status}`,
            },
          ],
          details: { error: "bad-status", status: res.status },
        };
      }

      const data = (await res.json()) as { results?: SearxResult[] };
      const results = (data.results ?? []).slice(0, params.maxResults ?? 8);
      if (results.length === 0) {
        return {
          content: [{ type: "text", text: "No results." }],
          details: { count: 0 },
        };
      }

      const text = results
        .map(
          (r, i) =>
            `${i + 1}. ${r.title ?? "(no title)"}\n   ${r.url ?? ""}\n   ${(r.content ?? "").trim()}`,
        )
        .join("\n\n");
      return {
        content: [{ type: "text", text }],
        details: { count: results.length },
      };
    },
  });
}
