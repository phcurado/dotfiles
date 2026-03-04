#!/bin/bash
set -e

DOTFILES_DIR="$(cd "$(dirname "$0")" && pwd)"

info() { printf "\n\033[1;34m[INFO]\033[0m %s\n" "$1"; }
ok() { printf "\033[1;32m[OK]\033[0m %s\n" "$1"; }
err() {
  printf "\033[1;31m[ERROR]\033[0m %s\n" "$1"
  exit 1
}

checkOS() {
  info "Detecting OS"
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    ok "Linux detected"
    linuxInstall
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    ok "macOS detected"
    darwinInstall
  else
    err "Your OS $OSTYPE is not supported"
  fi
}

linuxInstall() {
  info "Installing prerequisites (base-devel, git)"
  sudo pacman -S --needed base-devel git

  if ! command -v paru &> /dev/null; then
    info "Installing paru (AUR helper)"
    git clone https://aur.archlinux.org/paru.git /tmp/paru
    cd /tmp/paru && makepkg -si
    ok "paru installed"
  else
    ok "paru is already installed"
  fi

  cd "$DOTFILES_DIR"

  info "Installing packages from arch-pkgs/pkgs.txt"
  paru -S --needed --noconfirm - < arch-pkgs/pkgs.txt
  ok "Packages installed"
}

darwinInstall() {
  if ! xcode-select -p &> /dev/null; then
    info "Installing Xcode Command Line Tools"
    xcode-select --install
    read -p "Press enter after Xcode CLI tools finish installing..."
    ok "Xcode CLI tools installed"
  else
    ok "Xcode CLI tools already installed"
  fi

  if ! command -v brew &> /dev/null; then
    info "Installing Homebrew"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    eval "$(/opt/homebrew/bin/brew shellenv)"
    ok "Homebrew installed"
  else
    ok "Homebrew already installed"
  fi

  info "Installing packages from macos-pkgs/Brewfile"
  brew bundle --file=macos-pkgs/Brewfile
  ok "Packages installed"
}

initSubmodules() {
  info "Initializing git submodules"
  git submodule update --init --recursive
  ok "Submodules initialized"
}

stowFiles() {
  info "Linking dotfiles with stow"
  stow --no-folding --adopt .
  ok "Dotfiles linked"
}

setShell() {
  if [[ "$SHELL" != */zsh ]]; then
    info "Setting zsh as default shell"
    if [[ "$OSTYPE" == "darwin"* ]]; then
      chsh -s /bin/zsh
    else
      chsh -s /usr/bin/zsh
    fi
    ok "Default shell set to zsh"
  else
    ok "zsh is already the default shell"
  fi
}

setupTools() {
  read -p "Install mise languages? [Y/n] " answer

  if [[ "$answer" = [nN] ]]; then
    return
  fi

  mise install
  ok "Languages installed"
  setupRequiredToolsFromLanguages
}

setupRequiredToolsFromLanguages() {
  read -p "Install tree-sitter-cli? [Y/n] " answer

  if [[ "$answer" = [nN] ]]; then
    return
  fi

  cargo install tree-sitter-cli
  ok "tree-sitter-cli installed"
}

initDMS() {
  info "Creating DMS config placeholders"
  touch ~/.config/niri/dms/{outputs,colors,layout,alttab}.kdl
  ok "DMS config initialized"
}

setup() {
  checkOS
  initSubmodules
  stowFiles
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    initDMS
  fi
  setShell
  setupTools

  printf "\n\033[1;32mSetup complete!\033[0m Reboot to start using your new configuration.\n"
}

setup
