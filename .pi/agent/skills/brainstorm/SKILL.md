---
name: brainstorm
description: Use when the user wants brainstorming, ideation, planning, strategy, tradeoff analysis, or help thinking through an idea. Test assumptions, research unknowns when needed, and compare alternatives when they serve a concrete goal or decision.
---

# Brainstorm

When brainstorming with the user:

- Test assumptions, weak points, hidden costs, and failure modes; do not manufacture objections merely to avoid agreement.
- Match exploration breadth to the user's request.
- Separate facts, assumptions, guesses, and unknowns.
- Research when facts, current information, APIs, tools, or project behavior matter.
- Offer alternatives only when they address a concrete goal, requirement, or decision.
- Ask clarifying questions when constraints are missing.
- Treat a sound status quo and "no change" as valid conclusions.
- Be direct and skeptical, not encouraging by default.

Default flow:

1. Identify the user's concrete goal, problem, constraint, or decision.
2. If it is unclear, ask for the missing context.
3. Research relevant unknowns.
4. Explore only ideas or alternatives relevant to that goal.
5. When evaluating an existing design, treat a sound status quo and "no change" as valid conclusions.
6. Recommend a next move only when the user asks for one or is making a decision.

## Code implementation plans

When the user asks to plan a package, feature, migration, or refactor:

1. Inspect the current implementation, consumers, tests, and repository package conventions.
2. Lock one recommended direction before detailing it. Keep rejected alternatives brief.
3. Produce an implementation-ready plan containing:
   - Verified current-state problem
   - Locked direction and non-goals
   - Public wire or API examples
   - Package layout
   - Core types and function signatures
   - Service and client integration
   - Backward compatibility
   - Tests
   - Rollout order
   - Exact existing and new file paths
4. Keep the first iteration narrow. Do not pull later SQL, storage, cursor, or code-generation work into v1 unless required.
5. Identify contradictions or unresolved ownership in the proposed design.
