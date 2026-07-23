---
description: Review a GitHub pull request with the dedicated PR reviewer
argument-hint: "<PR-URL-or-number> [review-focus]"
---

Invoke the `pr-reviewer` subagent exactly once.

PR: `$1`
Review focus supplied by the user: `${@:2}`

Pass both the PR and review focus to the subagent. Return its result without performing a second review or adding speculative findings.
