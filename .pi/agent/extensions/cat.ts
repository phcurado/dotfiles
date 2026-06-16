import type {
  ExtensionAPI,
  ExtensionContext,
  WorkingIndicatorOptions,
} from "@earendil-works/pi-coding-agent";
import { randomInt } from "node:crypto";

let enabled = true;
let timer: ReturnType<typeof setInterval> | undefined;
let startedAt = 0;
let tokens = 0;
let providerTokens = 0;
let intervalMs = 0;
let lastStable: number | null = null;
let phrase = "Thinking...";
let events: Array<{ time: number; tokens: number }> = [];
let animFrom: number | null = null;
let animTarget: number | null = null;
let animStarted = 0;

const frames = [" ", " ", " ", " ", " "];
const phrases = [
  "Thinking...",
  "Pondering...",
  "Reading...",
  "Analyzing...",
  "Reasoning...",
  "Exploring...",
  "Drafting...",
  "Checking...",
  "Considering...",
  "Working through it...",
];

const WINDOW_MS = 1000; // sliding window for live speed
const MAX_TOK_S = 500; // burst guard: ignore implausible spikes
const ANIM_MS = 1800; // speed smoothing duration
const RENDER_MS = 250; // render tick while streaming
const FRAME_MIN_MS = 50; // fastest cat frame interval
const FRAME_MAX_MS = 250; // slowest cat frame interval
const FRAME_IDLE_MS = 167; // cat frame interval when idle / unknown speed
const FRAME_SCALE = 6000; // tok/s → frame interval scale

function choosePhrase(): void {
  let next = phrase;
  while (next === phrase) next = phrases[randomInt(phrases.length)];
  phrase = next;
}

function estimate(text: string): number {
  return text.match(/\w+|[^\s\w]/g)?.length ?? 0;
}

function record(n: number): void {
  if (n <= 0) return;
  tokens += n;
  events.push({ time: Date.now(), tokens: n });
}

function speed(): number | null {
  const now = Date.now();
  const elapsed = now - startedAt;
  if (elapsed < WINDOW_MS || tokens <= 0) return lastStable;

  const windowStart = now - WINDOW_MS;
  while (events.length && events[0].time < windowStart) events.shift();

  let count = 0;
  let first = now;
  for (const event of events) {
    count += event.tokens;
    first = Math.min(first, event.time);
  }

  const span = count > 0 ? now - first : elapsed;
  const value = (count || tokens) / (span / 1000);
  if (Number.isFinite(value) && value > 0 && value <= MAX_TOK_S) lastStable = value;
  return lastStable;
}

function animated(target: number | null): number | null {
  const now = Date.now();
  if (target === null) {
    animFrom = null;
    animTarget = null;
    return null;
  }
  if (animTarget === null || animFrom === null) {
    animFrom = target;
    animTarget = target;
    animStarted = now;
    return target;
  }
  if (Math.abs(target - animTarget) >= 0.05) {
    animFrom = value(now);
    animTarget = target;
    animStarted = now;
  }
  return value(now);
}

function value(now = Date.now()): number | null {
  if (animTarget === null) return null;
  if (animFrom === null) return animTarget;
  const progress = Math.max(0, Math.min(1, (now - animStarted) / ANIM_MS));
  return animFrom + (animTarget - animFrom) * progress;
}

function delay(s: number | null): number {
  return s === null
    ? FRAME_IDLE_MS
    : Math.max(FRAME_MIN_MS, Math.min(FRAME_MAX_MS, Math.round(FRAME_SCALE / s)));
}

function render(ctx: ExtensionContext): void {
  if (!ctx.hasUI || !enabled) return;

  const raw = speed();
  const shown = animated(raw);
  const text =
    shown === null
      ? ctx.ui.theme.fg("muted", phrase)
      : `${ctx.ui.theme.fg("muted", phrase)}  ${ctx.ui.theme.fg("accent", "✦")} ${ctx.ui.theme.fg("accent", shown.toFixed(1))} ${ctx.ui.theme.fg("dim", "tokens/s")}`;
  ctx.ui.setWorkingMessage(text);

  const next = delay(raw);
  if (Math.abs(next - intervalMs) < 10) return;
  const indicator: WorkingIndicatorOptions = {
    frames: frames.map((frame) => ctx.ui.theme.fg("accent", frame)),
    intervalMs: next,
  };
  ctx.ui.setWorkingIndicator(indicator);
  intervalMs = next;
}

function renderIdle(ctx: ExtensionContext): void {
  if (!ctx.hasUI || !enabled) return;
  const indicator: WorkingIndicatorOptions = {
    frames: frames.map((frame) => ctx.ui.theme.fg("accent", frame)),
    intervalMs: FRAME_IDLE_MS,
  };
  ctx.ui.setWorkingIndicator(indicator);
  intervalMs = FRAME_IDLE_MS;
}

function stopTimer(): void {
  if (timer) clearInterval(timer);
  timer = undefined;
}

function reset(): void {
  tokens = 0;
  providerTokens = 0;
  intervalMs = 0;
  lastStable = null;
  events = [];
  animFrom = null;
  animTarget = null;
}

export default function (pi: ExtensionAPI): void {
  if (process.env.PI_SUBAGENT_CHILD === "1") return;

  pi.on("session_start", (_event, ctx) => {
    renderIdle(ctx);
  });

  pi.on("message_start", (event, ctx) => {
    if (!enabled || event.message.role !== "assistant") return;
    choosePhrase();
    reset();
    startedAt = Date.now();
    render(ctx);
    stopTimer();
    timer = setInterval(() => render(ctx), RENDER_MS);
    timer.unref?.();
  });

  pi.on("message_update", (event) => {
    if (!enabled || event.message.role !== "assistant") return;
    const update = event.assistantMessageEvent as {
      type?: string;
      delta?: string;
      partial?: { usage?: { output?: number } };
    };
    if (update.type !== "text_delta" && update.type !== "thinking_delta")
      return;
    const output = update.partial?.usage?.output;
    if (typeof output === "number" && output > providerTokens) {
      record(output - providerTokens);
      providerTokens = output;
    } else {
      record(estimate(update.delta ?? ""));
    }
  });

  pi.on("message_end", (event, ctx) => {
    if (event.message.role !== "assistant") return;
    stopTimer();
    render(ctx);
  });

  pi.on("agent_end", (_event, ctx) => {
    stopTimer();
    if (ctx.hasUI) ctx.ui.setWorkingMessage();
  });

  pi.on("session_shutdown", (_event, ctx) => {
    stopTimer();
    if (!ctx.hasUI) return;
    ctx.ui.setWorkingMessage();
    ctx.ui.setWorkingIndicator();
  });

  pi.registerCommand("cat", {
    description: "Toggle RunCat working indicator",
    handler: async (_args, ctx) => {
      enabled = !enabled;
      if (enabled) render(ctx);
      else {
        stopTimer();
        ctx.ui.setWorkingMessage();
        ctx.ui.setWorkingIndicator();
      }
      ctx.ui.notify(`RunCat ${enabled ? "enabled" : "disabled"}`, "info");
    },
  });
}
