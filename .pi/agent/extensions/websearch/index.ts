/**
 * WebSearch Extension
 *
 * Provides web_search and web_fetch tools for pi.
 * - web_search: queries DuckDuckGo (HTML endpoint, no API key)
 * - web_fetch: fetches a URL and returns cleaned text content
 *
 * Auto-discovered from ~/.pi/agent/extensions/websearch/
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

// ─── DuckDuckGo HTML scraper (no external deps) ────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

async function duckDuckGoSearch(
  query: string,
  limit: number,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; PiWebSearch/1.0; +https://github.com/earendil-works/pi-coding-agent)",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `DuckDuckGo returned ${response.status}: ${response.statusText}`,
    );
  }

  const html = await response.text();

  // Parse individual result blocks: each .result div wraps a title link + snippet
  return parseDuckDuckGoHtml(html, limit);
}

function parseDuckDuckGoHtml(html: string, limit: number): SearchResult[] {
  const results: SearchResult[] = [];

  // Split on result block boundaries
  // DuckDuckGo HTML results look like:
  // <div class="result">
  //   <a class="result__a" href="...">Title</a>
  //   <a class="result__snippet">Snippet...</a>
  //   <span class="result__url">url</span>
  // </div>

  // Regex to capture each result block
  const resultBlockRe =
    /<div\s+class="(?:[^"]*\s)?result(\s[^"]*)?">([\s\S]*?)<\/div>\s*(?=<div\s+class="(?:[^"]*\s)?result|\s*<\/div>\s*<div\s+class="nav-link|$)/gi;

  let match;
  while ((match = resultBlockRe.exec(html)) !== null) {
    if (results.length >= limit) break;

    const block = match[2];

    // Extract URL from result__a href attribute
    const urlMatch = block.match(
      /<a[^>]*\sclass="(?:[^"]*\s)?result__a(\s[^"]*)?"[^>]*\shref="([^"]*)"/i,
    );
    // Fallback: any href in the block
    const urlFallback = block.match(/href="([^"]*)"/i);

    // Extract title from <a class="...result__a..."> text
    const titleMatch = block.match(
      /<a[^>]*\sclass="(?:[^"]*\s)?result__a(\s[^"]*)?"[^>]*>([\s\S]*?)<\/a>/i,
    );
    // Fallback: first link text
    const titleFallback = block.match(/<a[^>]*>([\s\S]*?)<\/a>/i);

    // Extract snippet from result__snippet
    const snippetMatch = block.match(
      /<a[^>]*\sclass="(?:[^"]*\s)?result__snippet(\s[^"]*)?"[^>]*>([\s\S]*?)<\/a>/i,
    );
    // Fallback: any text after links
    const snippetFallback = block.match(
      /<\/a>\s*([\s\S]*?)(?=<a\s|<div|<span|$)/i,
    );

    let rawUrl = urlMatch?.[2] ?? urlFallback?.[1] ?? "";
    const title =
      cleanHtml(titleMatch?.[2] ?? titleFallback?.[1] ?? "Untitled");
    const snippet = cleanHtml(
      snippetMatch?.[2] ?? snippetFallback?.[1]?.trim() ?? "",
    );

    // DuckDuckGo redirects through /l/?uddg=... - extract real URL
    if (rawUrl.includes("uddg=")) {
      const uddgMatch = rawUrl.match(/uddg=([^&]+)/);
      if (uddgMatch) {
        try {
          rawUrl = decodeURIComponent(uddgMatch[1]);
        } catch {
          // keep as-is
        }
      }
    }

    if (title && rawUrl) {
      results.push({ title, url: rawUrl, snippet });
    }
  }

  return results;
}

function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, "") // strip tags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Web page fetcher ──────────────────────────────────────────────────────

async function fetchPage(
  url: string,
  maxLength: number,
  signal?: AbortSignal,
): Promise<{ title: string; text: string; truncated: boolean }> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; PiWebSearch/1.0; +https://github.com/earendil-works/pi-coding-agent)",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
    );
  }

  const html = await response.text();

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = cleanHtml(titleMatch?.[1] ?? "No title");

  // Remove scripts, styles, and convert to text
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<[^>]*>/g, " ");

  text = cleanHtml(text);

  // Collapse whitespace further for readability
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  const truncated = text.length > maxLength;
  if (truncated) {
    text = text.slice(0, maxLength) + "\n... [truncated]";
  }

  return { title, text, truncated };
}

// ─── Format helpers ────────────────────────────────────────────────────────

function formatSearchResults(
  query: string,
  results: SearchResult[],
): string {
  if (results.length === 0) return `No results found for "${query}".`;

  return results
    .map((r, i) => {
      const snippet = r.snippet
        ? `  ${r.snippet.slice(0, 200)}`
        : "  (no snippet)";
      return `${i + 1}. **${r.title}**\n  ${r.url}\n${snippet}`;
    })
    .join("\n\n");
}

// ─── Extension entry point ─────────────────────────────────────────────────

export default function websearchExtension(pi: ExtensionAPI) {
  // ── web_search tool ────────────────────────────────────────────────────

  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description:
      "Search the web using DuckDuckGo. Returns titles, URLs, and snippets. " +
      "No API key required. Use when you need up-to-date information, " +
      "documentation lookups, or fact-checking. Results link to full pages " +
      "you can fetch with web_fetch.",
    promptSnippet:
      "Search the web via DuckDuckGo and return ranked results with titles, URLs, and snippets",
    promptGuidelines: [
      "Use web_search to find current information, documentation, or answers " +
      "the training data may not cover. Prefer web_search for recent events, " +
      "library version-specific docs, and real-world fact-checking.",
      "After web_search finds relevant pages, use web_fetch to retrieve full page content.",
    ],
    parameters: Type.Object({
      query: Type.String({
        description: "Search query. Be specific with technical terms.",
      }),
      limit: Type.Optional(
        Type.Number({
          description: "Max results to return (default: 5, max: 10)",
        }),
      ),
    }),

    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      const query = params.query.trim();
      if (!query) {
        return {
          content: [{ type: "text", text: "Error: query is empty." }],
          details: { error: "empty-query" },
        };
      }

      const limit = Math.min(params.limit ?? 5, 10);

      try {
        const results = await duckDuckGoSearch(query, limit, signal);
        const formatted = formatSearchResults(query, results);

        return {
          content: [{ type: "text", text: formatted }],
          details: {
            query,
            results,
            count: results.length,
            backend: "duckduckgo",
          },
        };
      } catch (err: any) {
        const msg = err.name === "AbortError"
          ? "Search aborted."
          : `Search error: ${err.message}`;
        return {
          content: [{ type: "text", text: msg }],
          details: { error: err.message },
          isError: true,
        };
      }
    },
  });

  // ── web_fetch tool ─────────────────────────────────────────────────────

  pi.registerTool({
    name: "web_fetch",
    label: "Web Fetch",
    description:
      "Fetch the content of a web page and return cleaned text. " +
      "Strips HTML, scripts, and styles. Use after web_search to read full " +
      "pages. Respects robots.txt conventions via User-Agent.",
    promptSnippet:
      "Fetch a URL and return cleaned text content (HTML stripped)",
    promptGuidelines: [
      "Use web_fetch after web_search to retrieve full page content from " +
      "promising results. Fetch one page at a time to avoid rate-limiting.",
      "web_fetch returns plain text up to 50KB. For pages that are larger, " +
      "focus your query or look for a more specific sub-page.",
    ],
    parameters: Type.Object({
      url: Type.String({
        description: "URL to fetch. Must be a full URL starting with http:// or https://.",
      }),
      maxLength: Type.Optional(
        Type.Number({
          description:
            "Max characters to return (default: 50000, i.e. 50KB)",
        }),
      ),
    }),

    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      let url = params.url.trim();
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
      }

      const maxLength = params.maxLength ?? 50_000;

      try {
        const { title, text, truncated } = await fetchPage(
          url,
          maxLength,
          signal,
        );
        const header = `# ${title}\nURL: ${url}\n\n`;
        const content = header + text;
        const output = truncated
          ? content + "\n\n---\nContent was truncated. Use a more specific URL or reduce scope."
          : content;

        return {
          content: [{ type: "text", text: output }],
          details: {
            url,
            title,
            length: text.length,
            truncated,
          },
        };
      } catch (err: any) {
        const msg = err.name === "AbortError"
          ? "Fetch aborted."
          : `Fetch error: ${err.message}`;
        return {
          content: [{ type: "text", text: msg }],
          details: { error: err.message },
          isError: true,
        };
      }
    },
  });

  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("websearch: web_search + web_fetch ready", "info");
  });
}
