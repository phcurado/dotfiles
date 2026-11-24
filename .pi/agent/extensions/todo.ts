import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { Text, truncateToWidth } from "@earendil-works/pi-tui";
import { Type } from "typebox";

type Status = "pending" | "in_progress" | "completed";
interface Todo {
	id: number;
	text: string;
	status: Status;
}
interface TodoDetails {
	todos: Todo[];
	nextId: number;
	error?: string;
}

const TodoParams = Type.Object({
	action: StringEnum(["list", "add", "update", "clear"] as const),
	text: Type.Optional(Type.String({ description: "Task text (add or update)" })),
	id: Type.Optional(Type.Number({ description: "Task ID (update)" })),
	status: Type.Optional(StringEnum(["pending", "in_progress", "completed"] as const)),
});

function taskLine(todo: Todo, theme: Theme): string {
	const text = todo.text.replace(/\s+/g, " ");
	switch (todo.status) {
		case "completed":
			return `  ${theme.fg("success", "✓")} ${theme.fg("dim", theme.strikethrough(text))}`;
		case "in_progress":
			return `  ${theme.fg("accent", "▸")} ${theme.fg("accent", theme.bold(text))}`;
		case "pending":
			return `  ${theme.fg("dim", "○")} ${theme.fg("muted", text)}`;
	}
}

const hidden = { render: () => [], invalidate() {} };

export default function (pi: ExtensionAPI) {
	let todos: Todo[] = [];
	let nextId = 1;
	let expanded = true;

	const refresh = (ctx: ExtensionContext) => {
		if (ctx.mode !== "tui") return;
		if (todos.length === 0) {
			ctx.ui.setWidget("todos", undefined);
			return;
		}
		ctx.ui.setWidget("todos", (_tui, theme) => ({
			render(width) {
				const completed = todos.filter((todo) => todo.status === "completed").length;
				const heading = theme.fg("muted", `${expanded ? "▾" : "▸"} Tasks · ${completed}/${todos.length} done`);
				const hint = theme.fg("dim", " · ctrl+shift+t");
				const visible = expanded ? todos : todos.filter((todo) => todo.status === "in_progress");
				return [heading + hint, ...visible.map((todo) => taskLine(todo, theme))]
					.map((line) => truncateToWidth(line, width));
			},
			invalidate() {},
		}));
	};

	const reconstruct = (ctx: ExtensionContext) => {
		todos = [];
		nextId = 1;
		for (const entry of ctx.sessionManager.getBranch()) {
			if (entry.type !== "message") continue;
			const msg = entry.message;
			if (msg.role !== "toolResult" || msg.toolName !== "todo") continue;
			// Older sessions stored a boolean instead of a status.
			const details = msg.details as { todos: (Todo & { done?: boolean })[]; nextId: number } | undefined;
			if (!details) continue;
			todos = details.todos.map((todo) => ({
				id: todo.id,
				text: todo.text,
				status: todo.status ?? (todo.done ? "completed" : "pending"),
			}));
			nextId = details.nextId;
		}
		refresh(ctx);
	};

	pi.on("session_start", (_event, ctx) => reconstruct(ctx));
	pi.on("session_tree", (_event, ctx) => reconstruct(ctx));

	pi.registerTool({
		name: "todo",
		label: "Tasks",
		description: "Manage the persistent task list. Actions: list, add (text, optional status), update (id, status and/or text), clear.",
		exposure: "model-only",
		executionMode: "sequential",
		promptGuidelines: ["Use todo for multi-step work. Set a task to in_progress when starting it and completed when finished. Leave completed tasks visible; clear only when replacing the list for a new task."],
		parameters: TodoParams,
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			let error: string | undefined;
			switch (params.action) {
				case "list":
					break;
				case "add":
					if (!params.text?.trim()) error = "text required for add";
					else todos.push({ id: nextId++, text: params.text.trim(), status: params.status ?? "pending" });
					break;
				case "update": {
					const todo = todos.find((todo) => todo.id === params.id);
					if (params.id === undefined) error = "id required for update";
					else if (!todo) error = `Task #${params.id} not found`;
					else if (params.text !== undefined && !params.text.trim()) {
						error = "Task text cannot be empty";
					} else if (params.text === undefined && params.status === undefined) {
						error = "text or status required for update";
					} else {
						if (params.text !== undefined) todo.text = params.text.trim();
						if (params.status !== undefined) todo.status = params.status;
					}
					break;
				}
				case "clear":
					todos = [];
					nextId = 1;
					break;
			}
			refresh(ctx);
			return {
				content: [{ type: "text", text: error ?? (todos.map((todo) => `#${todo.id} [${todo.status}] ${todo.text}`).join("\n") || "No tasks") }],
				details: { todos: todos.map((todo) => ({ ...todo })), nextId, error } satisfies TodoDetails,
				isError: !!error,
			};
		},
		renderShell: "self",
		renderCall: () => hidden,
		renderResult(result, _options, theme) {
			const error = (result.details as TodoDetails | undefined)?.error;
			return error ? new Text(theme.fg("error", error), 0, 0) : hidden;
		},
	});

	const togglePanel = (ctx: ExtensionContext) => {
		expanded = !expanded;
		refresh(ctx);
	};
	pi.registerCommand("todos", {
		description: "Collapse or expand the task panel",
		handler: async (_args, ctx) => togglePanel(ctx),
	});
	pi.registerShortcut("ctrl+shift+t", {
		description: "Collapse or expand the task panel",
		handler: async (ctx) => togglePanel(ctx),
	});
}
