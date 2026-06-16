# Global preferences

- If `.jj/` exists, prefer jj over git commands.
- Propose destructive or mutating commands (vcs push/abandon, rm, package installs) and let me run them.
- Keep config files minimal: no banner comments, don't restate defaults.
- Simplicity is a hard requirement, not a preference. Implement only what was requested.
- Before adding validation, fallback paths, timers, background behavior, UI plumbing, config files, or extra abstractions, ask: "Did the user explicitly ask for this?" If not, do not add it.
- If a change needs defensive code for impossible states in this repo/config, remove the defensive code instead of keeping it.
- When the user references existing work, inspect the relevant implementation before editing and follow the proven pattern instead of approximating.
- Do not combine separate ideas or features unless explicitly requested; identify the exact behavior the user wants first.
- Before debugging behavior, verify the latest change is actually in effect.
- Preserve partially working code while debugging unless the user explicitly asks to remove it; make one narrow change at a time.
- If the solution feels complex, stop and reassess before editing.
