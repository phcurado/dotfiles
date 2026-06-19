---
name: structural-search
description: Syntax-aware code search and refactoring with ast-grep. Use for precise structural follow-up after broad discovery, or when the user asks for a specific code shape/codemod such as function calls, imports, hooks, JSX, Lua API calls, or API migrations. Do not use as the first pass for broad inventories, plain text, docs, configs, logs, or fuzzy discovery.
---

# Structural Search

Use `ast-grep` only when syntax awareness gives a clear advantage.

## Decision rule

Start with `rg` unless you can already write the exact AST pattern you need.

Use `rg` for broad recall:
- finding all likely locations
- inventories across mixed styles
- names, strings, comments, docs, configs, logs
- unfamiliar code where you need examples before choosing a pattern

Use `ast-grep` for precise structural follow-up:
- matching one known code shape
- ignoring comments and strings
- finding multi-line calls or declarations reliably
- refactoring/codemodding one syntactic form
- checking a specific API usage pattern after `rg` found representative examples

## Examples

Broad inventory: use `rg` first.

```bash
rg -n 'vim\.keymap\.set|keys\s*=|keymaps\s*=' .config/nvim
```

Precise follow-up: use `ast-grep`.

```bash
ast-grep --lang lua --pattern 'vim.keymap.set($$$)' .config/nvim
ast-grep --lang ts --pattern 'console.log($$$)' src
ast-grep --lang tsx --pattern 'useEffect($FN, [])' src
ast-grep --lang ts --pattern 'import { $$$ } from "$MOD"' src
```

## Workflow

1. If the request is broad, run `rg` first to find examples and variants.
2. If a repeated syntactic shape appears, switch to `ast-grep` for that shape.
3. Pass `--lang` explicitly.
4. Test on the smallest relevant path first.
5. Expand only after the pattern returns expected matches.
6. For rewrites, inspect matches before applying changes.

## Pattern basics

- `$A` matches one AST node.
- `$$$` or `$$$ARGS` matches zero or more nodes, such as arguments or statements.
- Patterns must be parseable code for the selected language.
- Use non-capturing variables like `$_` when you do not need the match value.

## Command

Use the `ast-grep` binary name.
