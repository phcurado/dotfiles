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
    chsh -s /usr/bin/zsh
    ok "Default shell set to zsh"
  else
    ok "zsh is already the default shell"
  fi
}

setupTools() {
  read -p "Install mise languages? [y/N] " answer

  if [[ "$answer" = [yY] ]]; then
    mise install
    ok "Languages installed"
    setupRequiredToolsFromLanguages
  else
    return
  fi
}

setupRequiredToolsFromLanguages() {
  read -p "Install tree-sitter-cli? [y/N] " answer

  if [[ "$answer" = [yY] ]]; then
    cargo install tree-sitter-cli
    ok "tree-sitter-cli installed"
  else
    return
  fi
}

setup() {
  checkOS
  initSubmodules
  stowFiles
  setShell
  setupTools

  printf "\n\033[1;32mSetup complete!\033[0m Reboot to start using your new configuration.\n"
}

setup
