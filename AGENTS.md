# AGENTS.md

This repository contains cross-platform dotfiles for Arch Linux and macOS.

## Project overview

- Dotfiles are managed by `dots` from `dots.lua`.
- Main bootstrap entrypoint is `./setup.sh`.
- `setup.sh` installs `dots` if needed, then runs `dots apply`.
- `dots.lua` loads normal Lua modules under `dots/`.
- Cross-platform configs include Neovim, Ghostty, tmux, zsh, starship, git, yazi, bat, btop, mise, and zoxide.
- Arch-specific configs include niri and noctalia.
- macOS-specific configs include AeroSpace, SketchyBar, and Borders.
- Pi config is tracked under `.pi/agent/` and linked to `~/.pi/agent/` by `dots`.

## Common commands

```sh
./setup.sh
dots check
dots apply
dots state list
```

Secrets command:

```sh
make secrets.backup
```

## Setup behavior

- `dots.common` declares shared symlinks, fonts, and shell.
- `dots.arch` declares Arch packages, user groups, Linux-only links, and common systemd services.
- `dots.macos` declares Homebrew packages, casks, taps, macOS-only links, commands, and services.
- `dots.profiles.personal` declares no VPN service.
- `dots.profiles.work` starts Twingate.
- `dots.profiles.company` starts Tailscale.
- `dots.tools` declares shared command resources, including local tools and the SOPS AGE key restore.
- Local machine state is stored in `.dots/state.json` and is not committed.

## Editing guidelines

- Keep README concise. Do not add long explanatory sections unless asked.
- Prefer small, practical changes.
- Preserve cross-platform behavior between macOS and Arch Linux.
- Do not commit secrets or generated local files.
- Avoid tracking `~/.pi/agent/auth.json`, sessions, package caches, or generated plugin dependencies.
- Add managed files through `dots.symlink(...)` in the appropriate Lua module.

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

- Managed config path: `.pi/agent/`
- Runtime user path: `~/.pi/agent/`
- Do not track auth/session files.
- Local extensions live in `.pi/agent/extensions/`.
