#!/bin/bash
# Install system-level configs (requires sudo)

set -e

DOTFILES_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Installing system configs from $DOTFILES_DIR/etc/"

# iwd config
if [ -f "$DOTFILES_DIR/etc/iwd/main.conf" ]; then
  sudo mkdir -p /etc/iwd
  sudo cp "$DOTFILES_DIR/etc/iwd/main.conf" /etc/iwd/main.conf
  echo "Installed /etc/iwd/main.conf"
fi

echo "Done. Restart iwd: sudo systemctl restart iwd"
