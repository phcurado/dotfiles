import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES,
  formatSize,
  keyHint,
  truncateHead,
} from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import { execFile } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { basename, join } from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);

const BASE_URL = "http://127.0.0.1:8888";
const COMPOSE_FILE = join(homedir(), ".config", "searxng", "docker-compose.yml");
const USER_AGENT = "pi-web-search/1.0 (+https://pi.dev)";

type SearchResult = { title?: string; url?: string; content?: string };

type SearchDetails = {
  results: SearchResult[];
};

type FetchResult = {
  url: string;
  contentType: string;
  title?: string;
  text: string;
};

type FetchDetails = {
  url: string;
  contentType: string;
  title?: string;
  lines: number;
  bytes: number;
};

function withTimeout(signal: AbortSignal | undefined, ms: number): AbortSignal {
  return signal
    ? AbortSignal.any([signal, AbortSignal.timeout(ms)])
    : AbortSignal.timeout(ms);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function healthy(signal?: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/healthz`, { signal: withTimeout(signal, 1500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function startSearxng(): Promise<void> {
  await exec("docker", ["compose", "-f", COMPOSE_FILE, "up", "-d"]);
}

async function ensureSearxng(signal?: AbortSignal): Promise<boolean> {
  if (await healthy(signal)) return true;

  try {
    await startSearxng();
  } catch {
    return false;
  }

  for (let i = 0; i < 12; i++) {
    if (await healthy(signal)) return true;
    await sleep(500);
  }

  return false;
}

function decodeEntities(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_match, entity: string) => {
    const key = entity.toLowerCase();
    if (key[0] === "#") {
      const code = key[1] === "x" ? Number.parseInt(key.slice(2), 16) : Number.parseInt(key.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    }
    return named[key] ?? "";
  });
}

function htmlToText(html: string): { title?: string; text: string } {
  const title = decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "") || undefined;
  const withoutNoise = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const withBreaks = withoutNoise
    .replace(/<\/(p|div|section|article|header|footer|main|aside|li|ul|ol|table|tr|h[1-6]|pre|blockquote)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  const text = decodeEntities(withBreaks)
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { title, text };
}

function safeName(url: string): string {
  try {
    const parsed = new URL(url);
    const base = basename(parsed.pathname) || parsed.hostname;
    return base.replace(/[^a-z0-9._-]+/gi, "-").slice(0, 80) || "page";
  } catch {
    return "page";
  }
}

async function saveFullOutput(url: string, text: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "pi-web-fetch-"));
  const path = join(dir, `${safeName(url)}.txt`);
  await writeFile(path, text, "utf8");
  return path;
}

async function fetchPage(url: string, signal?: AbortSignal): Promise<FetchResult> {
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http(s) URLs are supported.");
  }

  const res = await fetch(parsed.toString(), {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/json,text/plain;q=0.9,*/*;q=0.8",
      "User-Agent": USER_AGENT,
    },
    redirect: "follow",
    signal: withTimeout(signal, 20000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

  const contentType = res.headers.get("content-type")?.split(";")[0]?.toLowerCase() ?? "unknown";
  if (/^(image|audio|video)\//.test(contentType) || contentType === "application/pdf" || contentType === "application/octet-stream") {
    throw new Error(`Unsupported non-text content type: ${contentType}`);
  }

  const raw = await res.text();
  if (contentType.includes("html") || raw.trimStart().startsWith("<!DOCTYPE") || raw.includes("<html")) {
    const { title, text } = htmlToText(raw);
    return { url: res.url, contentType, title, text };
  }

  if (contentType.includes("json")) {
    try {
      return { url: res.url, contentType, text: JSON.stringify(JSON.parse(raw), null, 2) };
    } catch {
      return { url: res.url, contentType, text: raw.trim() };
    }
  }

  return { url: res.url, contentType, text: raw.trim() };
}

async function formatFetchResult(result: FetchResult): Promise<string> {
  const truncation = truncateHead(result.text, {
    maxLines: DEFAULT_MAX_LINES,
    maxBytes: DEFAULT_MAX_BYTES,
  });

  const header = [
    `URL: ${result.url}`,
    `Content-Type: ${result.contentType}`,
    result.title ? `Title: ${result.title}` : undefined,
  ].filter(Boolean) as string[];

  if (!truncation.truncated) {
    return `${header.join("\n")}\n\n${truncation.content}`;
  }

  const fullPath = await saveFullOutput(result.url, result.text);
  return `${header.join("\n")}\nFull output: ${fullPath}\nTruncated: ${truncation.outputLines}/${truncation.totalLines} lines, ${formatSize(truncation.outputBytes)}/${formatSize(truncation.totalBytes)}\n\n${truncation.content}`;
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "web_search",
    label: "Web search",
    description:
      "Search the web via local SearXNG. Returns ranked results (title, URL, snippet). "
      + "Use for current info, docs, or facts not in the codebase. Use web_fetch on a result URL when page content is needed.",
    parameters: Type.Object({
      query: Type.String({ description: "Search query" }),
      maxResults: Type.Optional(Type.Number({ description: "Max results (default 8)", minimum: 1, maximum: 20 })),
      categories: Type.Optional(
        Type.Union(
          [Type.Literal("general"), Type.Literal("it"), Type.Literal("news"), Type.Literal("science")],
          { description: "SearXNG category. Use 'it' for code/dev topics, 'news' for current events." },
        ),
      ),
    }),
    async execute(_id, params, signal) {
      if (!(await ensureSearxng(signal))) {
        return { content: [{ type: "text", text: `SearXNG unreachable at ${BASE_URL}. Check Docker and ${COMPOSE_FILE}.` }] };
      }

      const cat = params.categories ? `&categories=${params.categories}` : "";
      const url = `${BASE_URL}/search?q=${encodeURIComponent(params.query)}${cat}&format=json`;
      let res: Response;
      try {
        res = await fetch(url, { signal: withTimeout(signal, 15000) });
      } catch (e) {
        return { content: [{ type: "text", text: `SearXNG unreachable at ${BASE_URL} (${String(e)})` }] };
      }
      if (!res.ok) {
        return { content: [{ type: "text", text: `SearXNG returned HTTP ${res.status}` }] };
      }
      const data = (await res.json()) as { results?: SearchResult[] };
      const results = (data.results ?? []).slice(0, params.maxResults ?? 8);
      if (!results.length) return { content: [{ type: "text", text: "No results." }] };
      return {
        content: [{
          type: "text",
          text: results
            .map((r, i) => `${i + 1}. ${r.title ?? "(no title)"}\n   ${r.url ?? ""}\n   ${(r.content ?? "").trim()}`)
            .join("\n\n"),
        }],
        details: { results } satisfies SearchDetails,
      };
    },
    renderCall(args, theme) {
      let text = theme.fg("toolTitle", theme.bold("web_search "));
      text += theme.fg("muted", `"${args.query}"`);
      if (args.categories) text += ` ${theme.fg("dim", args.categories)}`;
      return new Text(text, 0, 0);
    },
    renderResult(result, { expanded }, theme) {
      const details = result.details as SearchDetails | undefined;
      if (!details) {
        const content = result.content[0];
        return new Text(content?.type === "text" ? content.text : "", 0, 0);
      }

      const count = details.results.length;
      let text = theme.fg("success", `${count} result${count === 1 ? "" : "s"}`);
      if (!expanded) {
        text += ` ${theme.fg("dim", `(${keyHint("app.tools.expand", "to expand")})`)}`;
        return new Text(text, 0, 0);
      }

      for (const [index, item] of details.results.entries()) {
        text += `\n\n${theme.fg("accent", `${index + 1}. ${item.title ?? "(no title)"}`)}`;
        if (item.url) text += `\n${theme.fg("dim", item.url)}`;
        if (item.content?.trim()) text += `\n${theme.fg("muted", item.content.trim())}`;
      }
      return new Text(text, 0, 0);
    },
  });

  pi.registerTool({
    name: "web_fetch",
    label: "Web fetch",
    description:
      "Fetch and extract readable text from an HTTP(S) page. Use after web_search when snippets are insufficient. "
      + "Returns truncated text and saves full extracted output to a temp file when needed.",
    parameters: Type.Object({
      url: Type.String({ description: "HTTP(S) URL to fetch" }),
    }),
    async execute(_id, params, signal) {
      try {
        const result = await fetchPage(params.url, signal);
        if (!result.text) return { content: [{ type: "text", text: "Fetched page but extracted no text." }] };
        return {
          content: [{ type: "text", text: await formatFetchResult(result) }],
          details: {
            url: result.url,
            contentType: result.contentType,
            title: result.title,
            lines: result.text.split("\n").length,
            bytes: Buffer.byteLength(result.text, "utf8"),
          } satisfies FetchDetails,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `web_fetch failed: ${message}` }] };
      }
    },
    renderCall(args, theme) {
      return new Text(
        theme.fg("toolTitle", theme.bold("web_fetch ")) + theme.fg("muted", args.url),
        0,
        0,
      );
    },
    renderResult(result, { expanded }, theme) {
      const details = result.details as FetchDetails | undefined;
      const content = result.content[0];
      const output = content?.type === "text" ? content.text : "";
      if (!details || expanded) return new Text(output, 0, 0);

      const label = details.title ?? details.url;
      const summary = `${details.lines.toLocaleString()} lines · ${formatSize(details.bytes)} · ${details.contentType}`;
      const text = theme.fg("success", `Fetched ${label}`)
        + `\n${theme.fg("dim", `${summary} (${keyHint("app.tools.expand", "to expand")})`)}`;
      return new Text(text, 0, 0);
    },
  });
}
