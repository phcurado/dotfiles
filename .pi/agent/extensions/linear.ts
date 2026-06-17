import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { getSettingsListTheme } from "@earendil-works/pi-coding-agent";
import { Container, type SettingItem, SettingsList, Spacer, Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const LINEAR_API_URL = "https://api.linear.app/graphql";
const CONFIG_PATH = join(homedir(), ".pi", "agent", "linear.json");

type Config = { apiKey?: string };

type LinearIssue = {
  id: string;
  identifier: string;
  title: string;
  description?: string | null;
  url: string;
  branchName?: string;
  priorityLabel?: string;
  createdAt?: string;
  updatedAt?: string;
  team?: { key: string; name: string };
  state?: { name: string; type?: string };
  assignee?: { name?: string | null; email?: string | null } | null;
  project?: { name: string } | null;
  labels?: { nodes?: { name: string }[] };
  comments?: { nodes?: { id: string; body: string; createdAt: string; user?: { name?: string | null } | null }[] };
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

const issueFields = `
  id
  identifier
  title
  description
  url
  branchName
  priorityLabel
  createdAt
  updatedAt
  team { key name }
  state { name type }
  assignee { name email }
  project { name }
  labels(first: 20) { nodes { name } }
`;

function withTimeout(signal: AbortSignal | undefined, ms = 15000) {
  return AbortSignal.any(signal ? [signal, AbortSignal.timeout(ms)] : [AbortSignal.timeout(ms)]);
}

function loadConfig(): Config {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as Config;
  } catch {
    return {};
  }
}

async function saveConfig(config: Config) {
  await mkdir(dirname(CONFIG_PATH), { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", "utf8");
}

function masked(value: string | undefined) {
  if (!value) return "unset";
  return value.length <= 8 ? "set" : `${value.slice(0, 7)}…${value.slice(-4)}`;
}

async function showSettings(ctx: ExtensionCommandContext, getConfig: () => Config, setConfig: (config: Config) => void) {
  await ctx.ui.custom((tui, theme, _kb, done) => {
    const config = getConfig();
    let settings: SettingsList;
    const items: SettingItem[] = [
      {
        id: "apiKey",
        label: "API key",
        currentValue: masked(config.apiKey),
        values: ["change"],
        description: "Personal Linear API key. Stored in ~/.pi/agent/linear.json.",
      },
    ];

    const container = new Container();
    container.addChild(new Text(theme.fg("accent", theme.bold("Linear settings")), 0, 0));
    container.addChild(new Text(`${theme.fg("dim", "Config:")} ${CONFIG_PATH}`, 0, 0));
    container.addChild(new Spacer(1));

    settings = new SettingsList(
      items,
      Math.min(items.length + 2, 12),
      getSettingsListTheme(),
      () => {
        void (async () => {
          const current = getConfig();
          const apiKey = await ctx.ui.input(`Linear API key (${masked(current.apiKey)}):`);
          if (!apiKey?.trim()) {
            settings.updateValue("apiKey", masked(current.apiKey));
            tui.requestRender();
            return;
          }
          const next = { ...current, apiKey: apiKey.trim() };
          setConfig(next);
          settings.updateValue("apiKey", masked(next.apiKey));
          await saveConfig(next);
          tui.requestRender();
          done(undefined);
        })();
      },
      () => done(undefined),
    );
    container.addChild(settings);
    container.addChild(new Spacer(1));

    return {
      render: (w) => container.render(w),
      invalidate: () => container.invalidate(),
      handleInput: (data) => {
        settings.handleInput?.(data);
        tui.requestRender();
      },
    };
  });
}

function getLinearApiKey() {
  const cfg = loadConfig();
  const apiKey = process.env.LINEAR_API_KEY || cfg.apiKey;
  if (!apiKey) throw new Error(`Linear API key not found. Add it to ${CONFIG_PATH}.`);
  return apiKey;
}

async function linearGraphQL<T>(query: string, variables: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const apiKey = getLinearApiKey();

  const response = await fetch(LINEAR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
    signal: withTimeout(signal),
  });

  const payload = (await response.json()) as GraphQLResponse<T>;
  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.map((error) => error.message).join("; ") || `Linear HTTP ${response.status}`);
  }
  if (!payload.data) throw new Error("Linear returned no data.");
  return payload.data;
}

function short(text: string | null | undefined, max = 3000) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function formatIssue(issue: LinearIssue, includeDescription = false) {
  const labels = issue.labels?.nodes?.map((label) => label.name).join(", ") || "none";
  const assignee = issue.assignee?.name || issue.assignee?.email || "unassigned";
  const lines = [
    `${issue.identifier}: ${issue.title}`,
    issue.url,
    `State: ${issue.state?.name ?? "unknown"}${issue.state?.type ? ` (${issue.state.type})` : ""}`,
    `Team: ${issue.team?.key ?? "?"} — ${issue.team?.name ?? "unknown"}`,
    `Assignee: ${assignee}`,
    `Priority: ${issue.priorityLabel ?? "unknown"}`,
    `Project: ${issue.project?.name ?? "none"}`,
    `Labels: ${labels}`,
    issue.branchName ? `Branch: ${issue.branchName}` : undefined,
    issue.updatedAt ? `Updated: ${issue.updatedAt}` : undefined,
  ].filter(Boolean) as string[];

  if (includeDescription && issue.description) {
    lines.push("", short(issue.description));
  }

  if (issue.comments?.nodes?.length) {
    lines.push("", "Recent comments:");
    for (const comment of issue.comments.nodes) {
      lines.push(`- ${comment.user?.name ?? "Unknown"} at ${comment.createdAt}: ${short(comment.body, 600)}`);
    }
  }

  return lines.join("\n");
}

async function getIssue(idOrIdentifier: string, signal?: AbortSignal) {
  const data = await linearGraphQL<{ issue: LinearIssue | null }>(
    `query GetIssue($id: String!) {
      issue(id: $id) {
        ${issueFields}
        comments(first: 5) { nodes { id body createdAt user { name } } }
      }
    }`,
    { id: idOrIdentifier },
    signal,
  );
  return data.issue;
}

export default function (pi: ExtensionAPI) {
  let config = loadConfig();

  pi.registerCommand("linear", {
    description: "Configure Linear integration",
    handler: async (_args, ctx) => {
      await showSettings(ctx, () => config, (next) => {
        config = next;
      });
    },
  });

  pi.registerTool({
    name: "linear_viewer",
    label: "Linear viewer",
    description: "Check the authenticated Linear user. Requires ~/.pi/agent/linear.json.",
    promptSnippet: "Check Linear API authentication and current user",
    parameters: Type.Object({}),
    async execute(_id, _params, signal) {
      const data = await linearGraphQL<{ viewer: { id: string; name?: string | null; email?: string | null } }>(
        "query Viewer { viewer { id name email } }",
        {},
        signal,
      );
      return { content: [{ type: "text", text: `Linear user: ${data.viewer.name ?? "unknown"} <${data.viewer.email ?? "unknown"}> (${data.viewer.id})` }] };
    },
  });

  pi.registerTool({
    name: "linear_list_teams",
    label: "Linear teams",
    description: "List Linear teams available to the API key. Requires ~/.pi/agent/linear.json.",
    promptSnippet: "List Linear teams available to the API key",
    parameters: Type.Object({
      limit: Type.Optional(Type.Number({ description: "Max teams to return (default 50)", minimum: 1, maximum: 100 })),
    }),
    async execute(_id, params, signal) {
      const data = await linearGraphQL<{ teams: { nodes: { id: string; key: string; name: string }[] } }>(
        "query Teams($first: Int) { teams(first: $first) { nodes { id key name } } }",
        { first: params.limit ?? 50 },
        signal,
      );
      const text = data.teams.nodes.map((team) => `${team.key}: ${team.name} (${team.id})`).join("\n") || "No teams found.";
      return { content: [{ type: "text", text }] };
    },
  });

  pi.registerTool({
    name: "linear_get_issue",
    label: "Linear issue",
    description: "Fetch a Linear issue by UUID or identifier like ENG-123. Requires ~/.pi/agent/linear.json.",
    promptSnippet: "Fetch a Linear issue by UUID or identifier like ENG-123",
    parameters: Type.Object({
      id: Type.String({ description: "Linear issue UUID or identifier, e.g. ENG-123" }),
    }),
    async execute(_id, params, signal) {
      const issue = await getIssue(params.id, signal);
      return { content: [{ type: "text", text: issue ? formatIssue(issue, true) : `Issue not found: ${params.id}` }] };
    },
  });

  pi.registerTool({
    name: "linear_search_issues",
    label: "Linear search",
    description: "Search Linear issues by text. Optionally pass a Linear team ID. Requires ~/.pi/agent/linear.json.",
    promptSnippet: "Search Linear issues by text",
    parameters: Type.Object({
      query: Type.String({ description: "Search text" }),
      teamId: Type.Optional(Type.String({ description: "Optional Linear team UUID, not team key" })),
      limit: Type.Optional(Type.Number({ description: "Max issues to return (default 10)", minimum: 1, maximum: 50 })),
    }),
    async execute(_id, params, signal) {
      const data = await linearGraphQL<{ searchIssues: { nodes: LinearIssue[] } }>(
        `query SearchIssues($term: String!, $first: Int, $teamId: String) {
          searchIssues(term: $term, first: $first, teamId: $teamId) { nodes { ${issueFields} } }
        }`,
        { term: params.query, first: params.limit ?? 10, teamId: params.teamId },
        signal,
      );
      const issues = data.searchIssues.nodes;
      const text = issues.length ? issues.map((issue) => formatIssue(issue)).join("\n\n---\n\n") : "No issues found.";
      return { content: [{ type: "text", text }] };
    },
  });
}
