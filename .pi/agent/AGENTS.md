# Global rules

## Version control & safety

- If `.jj/` exists, prefer jj over git.
- Propose mutating or outward-facing commands (installs, pushes, deletes); let me run them, don't auto-run.

## Scope — only what was asked

- Implement only what was requested, nothing more. Don't combine separate ideas unless asked. If it feels complex, stop and reassess.
- Before adding validation, fallbacks, timers, background behavior, UI plumbing, config files, or abstractions, ask "Did the user ask for this?" If not, don't.
- Do the minimal fix. Mention optional extras separately; don't apply unless asked.

## Editing

- Keep config files minimal: no banner comments, don't restate defaults.
- Inspect the relevant implementation before advising or editing; follow the proven pattern, don't approximate.
- Remove defensive code for impossible states (not work-in-progress) rather than keeping it.

## Debugging

- Verify the latest change is actually in effect before debugging.
- Change one narrow thing at a time; preserve partially working code unless told to remove it.

## Output

- Terse: no preamble or closing summary unless asked.
