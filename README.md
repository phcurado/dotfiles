# ~/dotfiles

Dotfiles for Arch Linux and macOS, managed with [`dots`](https://github.com/phcurado/dots).

## Screenshots

<img src="images/main.png" alt="Main Screen">

<img src="images/dashboard.png" alt="Neovim with Snacks Dashboard">

## Fresh machine

Clone the repo and run the bootstrap script:

```sh
git clone git@github.com:phcurado/dotfiles.git ~/dotfiles
cd ~/dotfiles
./setup.sh
```

`setup.sh` will basically install [dots](https://github.com/phurado/dots), a software to manage dotfiles declaratively and works on both of my Linux and MacOS setup.
You can install `dots` first and check the changes that will be made on your machine with `dots check`.

If running on Arch, it's good to reboot after running the scripts because it changes the shell (`bash` to `zsh`), create groups and
start system services.

## Daily use

If you change something, create symlinks, just run:

```sh
dots check
```

Which will show what settings from this dotfiles that will be applied on your machine. To apply:

```sh
dots apply
```

I use different profiles in the same machine, for instance I have different VPN configurations depending on projects I'm working on it so I can quickly switch to a profile with these commands:

```sh
dots --profile personal apply
# no VPN service

dots --profile work apply
# Twingate

dots --profile company apply
# Tailscale
```

## Dotfile Setup

- shell: `zsh`
- config links: Neovim, Ghostty, tmux, zsh, Starship, git, yazi, bat, btop, mise, zoxide
- fonts from `fonts/`
- mise tools
- local commands such as `pi`, `tree-sitter`, `weather`, and `tpane`

Arch resources include:

- pacman bootstrap packages: `base-devel`, `git`
- `paru` installed through pacman
- desktop packages for niri/noctalia
- user groups: `docker`, `wheel`
- system services: Bluetooth, Docker, NetworkManager
- profile services: Twingate for `work`, Tailscale for my `company`

macOS resources include:

- Homebrew and Homebrew taps
- AeroSpace, SketchyBar, Borders, Ghostty, Brave, Discord, Obsidian, Docker Desktop, Tailscale, 1Password
- SketchyBar Lua bindings
- Homebrew services for SketchyBar and Borders

## Makefile

The Makefile is only a shortcut layer:

| Command               | Description              |
| --------------------- | ------------------------ |
| `make secrets.backup` | Print AGE key for backup |

## Notes

### macOS window management

Before using AeroSpace for the first time, turn off **Displays have separate
Spaces** in `System Settings > Desktop & Dock > Mission Control`, then log out
and back in. Grant Accessibility permissions to AeroSpace and SketchyBar when
prompted. If I remember correctly, you will get prompted for all this configuration when setting up this dotfiles.

### Niri keybindings

| Key                | Action             |
| ------------------ | ------------------ |
| `Super + T`        | Terminal           |
| `Super + B`        | Browser            |
| `Super + Space`    | App launcher       |
| `Super + Q`        | Close window       |
| `Super + Tab`      | Previous workspace |
| `Super + M`        | Power menu         |
| `Super + Alt + L`  | Lock screen        |
| `Super + Ctrl + W` | Random wallpaper   |
| `Print`            | Screenshot         |

### Secrets

The SOPS AGE key is restored from 1Password by `dots apply`.

You can backup using the `make` command.

```sh
make secrets.backup
```

## AI - pi.dev

I'm using [pi](https://pi.dev) as my agent harness. It is a very customizable harness which fits nicely with my working. You can check my plugins and configurations on `.pi/` folder.

## Tmux

Tmux is terminal multiplexer and probably one of the most important tools in this setup. Since I work in many projects, I create tabs and specific workflows on how things should be opened to improve my experience while coding. I also created my own tool to manage tmux panes: [tpane](https://github.com/phcurado/tpane), which allows me to do all the tmux configuration using the `Lua` language. This tool also keeps a daemon running which stores panes state in memory and allows me to customize how and when things should be opened using the configured shortcuts in `.config/tmux/tpane/`, here are some of the shortcuts:

| Key         | Action                                       |
| ----------- | -------------------------------------------- |
| `Super + c` | New tab                                      |
| `Super + a` | Open or toggle `pi` pane in the right        |
| `Super + t` | Open or toggle a pane terminal in the bottom |

## Disclaimer

This is my personal configuration, the intent of this project is not to copy but serve as inspiration if anyone wants to use similar tools or just check my config.
