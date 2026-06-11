import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execFile } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";

const BASE_URL = "http://127.0.0.1:8888";
const COMPOSE_FILE = join(homedir(), ".config", "searxng", "docker-compose.yml");

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async () => {
    try {
      if ((await fetch(`${BASE_URL}/healthz`, { signal: AbortSignal.timeout(1500) })).ok) return;
    } catch {
      // not up → start it
    }
    execFile("docker", ["compose", "-f", COMPOSE_FILE, "up", "-d"], () => {});
  });

  pi.registerTool({
    name: "web_search",
    label: "Web search",
    description:
      "Search the web via local SearxNG. Returns ranked results (title, URL, snippet). "
      + "Use for current info, docs, or facts not in the codebase.",
    parameters: Type.Object({
      query: Type.String({ description: "Search query" }),
      maxResults: Type.Optional(Type.Number({ description: "Max results (default 8)", minimum: 1, maximum: 20 })),
    }),
    async execute(_id, params, signal) {
      const url = `${BASE_URL}/search?q=${encodeURIComponent(params.query)}&format=json`;
      let res: Response;
      try {
        res = await fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]) });
      } catch (e) {
        return { content: [{ type: "text", text: `SearxNG unreachable at ${BASE_URL} (${String(e)})` }] };
      }
      if (!res.ok) {
        return { content: [{ type: "text", text: `SearxNG returned HTTP ${res.status}` }] };
      }
      const data = (await res.json()) as { results?: { title?: string; url?: string; content?: string }[] };
      const results = (data.results ?? []).slice(0, params.maxResults ?? 8);
      if (!results.length) return { content: [{ type: "text", text: "No results." }] };
      return {
        content: [{
          type: "text",
          text: results
            .map((r, i) => `${i + 1}. ${r.title ?? "(no title)"}\n   ${r.url ?? ""}\n   ${(r.content ?? "").trim()}`)
            .join("\n\n"),
        }],
      };
    },
  });
}
