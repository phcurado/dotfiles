# ~/dotfiles

Dotfile configuration for `archlinux`.

## Screenshots

<img src="images/dashboard.png" alt="main screen with snacks dashboard">

<img src="images/cmdline.png" alt="cmd line with noice plugin">

<img src="images/finder.png" alt="Finder plugin">

<img src="images/gitdiff.png" alt="git diff with Neogit plugin">

## Quick Start

After a fresh Arch install, you'll be in a TTY. Run these steps to get a working desktop:

```bash
# 1. Install prerequisites
sudo pacman -S --needed base-devel git stow

# 2. Install paru (AUR helper)
git clone https://aur.archlinux.org/paru.git /tmp/paru
cd /tmp/paru && makepkg -si

# 3. Clone dotfiles
cd ~/
git clone --recurse-submodules -j8 git@github.com:phcurado/dotfiles.git
cd dotfiles

# 4. Install all packages
make install

# 5. Create symlinks
stow .

# 6. Install system configs (iwd for WiFi)
./install-system.sh

# 7. Enable services
sudo systemctl enable --now systemd-resolved
sudo systemctl enable --now iwd
sudo systemctl enable --now bluetooth.service
sudo systemctl enable sddm

# 8. Disable NetworkManager if installed (conflicts with iwd)
sudo systemctl disable --now NetworkManager

# 9. Set zsh as default shell
chsh -s /usr/bin/zsh

# 10. Reboot
reboot
```

SDDM will start on boot. Select Hyprland and login. Open a terminal with `Super + Q` and connect to WiFi using `impala`.

## Secrets Management

This dotfiles setup uses [SOPS](https://github.com/getsops/sops) with [AGE](https://github.com/FiloSottile/age) for encrypting secrets in projects. The AGE private key is stored in 1Password and restored locally.

**On a new machine:**

```bash
make secrets.setup    # Restores key from 1Password to .config/sops/age/keys.txt
```

**Backup your key** (if generating a new one):

```bash
mkdir -p .config/sops/age
age-keygen -o .config/sops/age/keys.txt
make secrets.backup   # Shows key to copy to 1Password
```

The `keys.txt` file is gitignored and never committed.

## Main Packages

### Paru

[Paru](https://github.com/Morganamilo/paru) is an AUR helper for installing packages from the Arch User Repository.

```bash
sudo pacman -S --needed base-devel
git clone https://aur.archlinux.org/paru.git
cd paru
makepkg -si
```

### Neovim

[Neovim](https://neovim.io) is my preferred text editor.

```bash
paru neovim
```

### Ghostty

[Ghostty](https://ghostty.org/) is a modern terminal emulator.

> [!IMPORTANT]
> Ghostty is configured to use the font [0xProto Nerd Font](https://github.com/0xType/0xProto). Install it or change the font in [.config/ghostty/config](.config/ghostty/config). List available fonts with `ghostty +list-fonts`.

```bash
paru ghostty
```

### Tmux

[tmux](https://github.com/tmux/tmux) is a terminal multiplexer.

```bash
paru tmux
```

To install plugins, open a tmux session and press `prefix + I` (prefix is `Ctrl + a`).

### Mise

[Mise](https://github.com/jdx/mise) manages versions of programming languages and tools.

```bash
paru mise
mise install   # Install versions from mise.toml
```

### Zsh

[Zsh](https://wiki.archlinux.org/title/Zsh) is my preferred shell.

```bash
paru zsh
chsh -s /usr/bin/zsh
```

Reboot or log out/in to apply.

### Starship

[Starship](https://starship.rs) is a cross-shell prompt.

```bash
paru starship
```

### GNU Stow

[GNU Stow](https://www.gnu.org/software/stow/manual/stow.html) manages symlinks for dotfiles.

```bash
paru stow
stow .
```

If files conflict, use `--adopt` to override:

```bash
stow --adopt .
```

## Additional Packages

Install packages from the saved list:

```bash
make install
# or: paru -S - < arch-pkgs/pkgs.txt
```

Save current packages to file:

```bash
make tofile
# or: paru -Qqen > arch-pkgs/pkgs.txt
```

Review `arch-pkgs/pkgs.txt` before installing - some packages may be system-specific.

## Makefile Commands

| Command               | Description                              |
| --------------------- | ---------------------------------------- |
| `make install`        | Install packages from arch-pkgs/pkgs.txt |
| `make show`           | List installed packages                  |
| `make tofile`         | Save installed packages to pkgs.txt      |
| `make cleanCache`     | Clean paru cache                         |
| `make secrets.setup`  | Restore AGE key from 1Password           |
| `make secrets.backup` | Show AGE key for backup to 1Password     |

## Additional Configuration

### Bluetooth

Enable bluetooth service:

```bash
sudo systemctl enable --now bluetooth.service
```

### Macropad

Macropad configuration is in `macropad/macropad.ron`. Upload using:

```bash
ansible-playbook --ask-become-pass ansible-scripts/macropad.yml
```

### Hyprland

[Hyprland](https://hyprland.org/) is my window manager (Wayland). Start it from TTY with `Hyprland`.

WiFi uses iwd + [Impala](https://github.com/pythops/impala) instead of NetworkManager. The system config (`/etc/iwd/main.conf`) is installed via `./install-system.sh`.

> [!IMPORTANT]
> iwd requires `systemd-resolved` for DNS resolution. The install script enables it automatically and disables NetworkManager if present (they conflict).

#### Keybindings

| Key                  | Action               |
| -------------------- | -------------------- |
| `Super + Q`          | Terminal             |
| `Super + Space`      | App launcher         |
| `Super + C`          | Close window         |
| `Super + M`          | Power menu (wlogout) |
| `Super + L`          | Lock screen          |
| `Super + Ctrl + W/S` | Next/prev wallpaper  |
| `Print`              | Screenshot (full)    |
| `Super + Print`      | Screenshot (region)  |
