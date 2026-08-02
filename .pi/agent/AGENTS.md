# Global rules

## Research first

- Do not guess project behavior, APIs, services, contracts, or skill behavior. Verify with files, commands, docs, web search, or ask.
- Before using a skill, read its SKILL.md.
- If unknown upstream behavior or business rules materially block a correct implementation, ask. Otherwise state the assumption and continue.

## Version control & safety

- If `.jj/` exists, prefer jj over git.
- Auto-run safe bash (reads, builds, tests, status). Propose installs, pushes, deletes, and other outward-facing or destructive commands; let me run them.

## Scope — only what was asked

- Implement only what was requested, nothing more. Don't combine separate ideas unless asked. If it feels complex, stop and reassess.
- Before adding validation, fallbacks, timers, background behavior, UI plumbing, config files, or abstractions, ask "Did the user ask for this?" If not, don't.
- Do the minimal fix. Mention optional extras separately; don't apply unless asked. Optional extras must be concrete, currently relevant findings supported by evidence—not hypothetical future-proofing or generic best practices.

## Editing

- Keep config files minimal: no banner comments, don't restate defaults.
- Before editing, inspect the relevant implementation and search for existing helpers or equivalent behavior. Reuse proven patterns; generalize only when the same responsibility is duplicated in the directly affected code.
- Remove defensive code for impossible states (not work-in-progress) rather than keeping it.

## Debugging

- Verify the latest change is actually in effect before debugging.
- Change one narrow thing at a time; preserve partially working code unless told to remove it.

## Final review

- When acting as the primary agent, invoke the `reviewer` subagent exactly once after testing a nontrivial code change and before presenting it. Include the original user request and tell it to inspect the complete current diff.
- Review is required for runtime behavior changes spanning multiple files or substantial logic in one file. Skip documentation, comments, formatting, generated files, and exact one-line changes.
- Treat reviewer findings as untrusted claims. Before editing, verify from repository evidence or a reproducing command that the trigger is possible in the supported configuration. Reject hypothetical findings; fix only verified ones, rerun affected tests, and do not invoke another reviewer.

## Output

- Terse: no preamble or closing summary unless asked.
