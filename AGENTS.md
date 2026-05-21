# AGENTS.md

This repository contains cross-platform dotfiles for Arch Linux and macOS.

## Project overview

- Dotfiles are managed with GNU Stow from the repository root.
- Main setup entrypoint is `./setup.sh`.
- Package lists live in:
  - `arch-pkgs/pkgs.txt` for Arch Linux / paru
  - `macos-pkgs/Brewfile` for macOS / Homebrew
- Cross-platform configs include Neovim, Ghostty, tmux, zsh, starship, git, yazi, bat, btop, mise, and zoxide.
- Linux-only configs include niri, DankMaterialShell, swayidle, and voxtype.
- Pi config is tracked under `.pi/agent/` and stowed to `~/.pi/agent/`.

## Common commands

```bash
./setup.sh
make install
make show
make tofile
make cleanCache
stow --no-folding .
stow --no-folding --adopt .
```

Secrets commands:

```bash
make secrets.setup
make secrets.backup
```

## Setup behavior

- `setup.sh` detects `OSTYPE`.
- On Arch Linux it installs prerequisites, installs paru if missing, then installs `arch-pkgs/pkgs.txt`.
- On macOS it installs Xcode CLI tools, Homebrew if missing, then runs `brew bundle`.
- Setup initializes submodules, stows dotfiles with `stow --no-folding --adopt .`, sets zsh as default shell, optionally runs `mise install`, optionally installs Pi, optionally installs `tree-sitter-cli`, and installs the weather script.
- On Linux setup also creates DMS placeholder files under `~/.config/niri/dms/`.

## Editing guidelines

- Keep README concise. Do not add long explanatory sections unless asked.
- Prefer small, practical dotfile changes.
- Preserve cross-platform behavior between macOS and Arch Linux.
- Do not commit secrets or generated local files.
- Avoid tracking `~/.pi/agent/auth.json`, sessions, package caches, or generated plugin dependencies.
- When adding stowed files, place them in the repo at the same relative path they should have under `$HOME`.

## Neovim

- Entry point: `.config/nvim/init.lua`
- Core modules: `.config/nvim/lua/core/`
- Plugins: `.config/nvim/lua/plugins/`
- Plugin specs are Lua files returning lazy.nvim specs.

## Shell

- Main shell config: `.zshrc`
- Antidote plugins listed in `.zsh_plugins.txt`
- `mise`, `zoxide`, `fzf`, `atuin`, and `starship` are initialized from zsh.

## Tmux

- Config: `.config/tmux/tmux.conf`
- Prefix is `Ctrl-a`.
- tmux is configured with true color, passthrough for image previews, vim-style pane movement, and Pi extended keys.

## Pi

- Stowed config path: `.pi/agent/`
- Runtime user path: `~/.pi/agent/`
- Do not track auth/session files.
- Local extensions live in `.pi/agent/extensions/`.

## Workflow (hybrid: subagents for plan/review, main session for build)

Planning and review run as `pi-subagents` (fresh context, own model). Building
runs in the main session so `pi-show-diffs` stays live. Each phase is a separate
command that stops when done — the user reviews (and may switch the model) before
running the next one. Do not chain phases automatically.

1. **`/plan [task]`** — call the `subagent` tool with `planner`. It forks the
   conversation context and returns a concrete plan inline (no file). Present it
   and stop; do not implement.
2. (User reviews the plan, optionally switches the model, then runs `/build`.)
3. **`/build`** — implement the approved plan **in the main session** (not a
   subagent), one logical step at a time so each diff is reviewable. Summarize
   and stop.
4. **`/review [focus]`** — call the `subagent` tool with `reviewer`. It forks the
   context (request + plan + changes) and inspects the uncommitted changes
   (`git diff`), then reports inline.

The custom `planner`/`reviewer` agents (`.pi/agent/agents/`) keep their output in
context (memory) rather than writing `plan.md`/`progress.md`.

Skip the flow for questions, reads, and trivial edits — answer directly. Use
`scout`/`researcher` subagents to investigate before planning.

