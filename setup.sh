#!/usr/bin/env sh
set -eu

DOTFILES_DIR=$(CDPATH= cd "$(dirname "$0")" && pwd)
BIN_DIR="${BIN_DIR:-$HOME/.local/bin}"
export PATH="$BIN_DIR:$PATH"

if ! command -v dots >/dev/null 2>&1; then
  curl -fsSL https://raw.githubusercontent.com/phcurado/dots/main/install.sh | BIN_DIR="$BIN_DIR" sh
fi

cd "$DOTFILES_DIR"
exec dots apply
