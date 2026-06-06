/**
 * thinking-box — wrap pi's thinking blocks in a styled Box with border.
 *
 * Uses the message_end hook to intercept assistant messages with thinking
 * content, strip thinking from the original message, and re-emit it as
 * custom "thinking-box" messages with a Box wrapper.
 *
 * Inspired by pi-tool-display's thinking-label.ts and user-message-box-native.ts.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { getMarkdownTheme } from "@earendil-works/pi-coding-agent";
import { Box, Markdown, Spacer, Text } from "@earendil-works/pi-tui";

const CUSTOM_TYPE = "thinking-box";

/** Prevent recursive handling when our own custom messages fire message_end. */
let handling = false;

/** Cached theme reference, captured on session_start. */
let cachedTheme: {
	fg: (color: string, text: string) => string;
	bg: (color: string, text: string) => string;
	italic: (text: string) => string;
	bold: (text: string) => string;
} | undefined;

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		cachedTheme = ctx?.ui?.theme as typeof cachedTheme;
	});

	// ── Custom renderer for thinking-box messages ──

	pi.registerMessageRenderer(CUSTOM_TYPE, (message, _options, activeTheme) => {
		const t = activeTheme || cachedTheme;
		const thinkingText = (message.content as string) || "";
		const mdTheme = getMarkdownTheme();

		if (!t) {
			const box = new Box(1, 1);
			box.addChild(new Text(thinkingText, 0, 0));
			return box;
		}

		// Label: "Thinking" in italic thinkingText color
		const label = new Text(
			t.fg("thinkingText", t.italic(t.bold("Thinking"))),
			0,
			0,
		);

		// Body: italic markdown in thinkingText color
		const body = new Markdown(thinkingText, 0, 0, mdTheme, {
			color: (text: string) => t.fg("thinkingText", text),
			italic: true,
		});

		const box = new Box(1, 1, (text: string) => t.bg("toolPendingBg", text));
		box.addChild(label);
		box.addChild(new Spacer(1));
		box.addChild(body);

		return box;
	});

	// ── Intercept assistant messages that carry thinking blocks ──

	pi.on("message_end", async (event, _ctx) => {
		if (handling) return;

		const msg = event.message as {
			role?: string;
			content?: { type: string; thinking?: string; text?: string }[];
		};

		if (msg?.role !== "assistant") return;
		if (!Array.isArray(msg?.content)) return;

		// Collect thinking blocks and non-thinking content
		const thinkingBlocks: string[] = [];
		const filteredContent = msg.content.filter((block) => {
			if (block?.type === "thinking" && block?.thinking?.trim()) {
				thinkingBlocks.push(block.thinking.trim());
				return false;
			}
			return true;
		});

		if (thinkingBlocks.length === 0) return;

		handling = true;

		try {
			// Emit each thinking block as a boxed custom message
			for (const thinking of thinkingBlocks) {
				pi.sendMessage(
					{
						customType: CUSTOM_TYPE,
						content: thinking,
						display: true,
					},
					{ triggerTurn: false },
				);
			}

			// Return modified message with thinking blocks stripped out
			return {
				message: { ...msg, content: filteredContent },
			} as { message: typeof event.message };
		} finally {
			handling = false;
		}
	});
}
