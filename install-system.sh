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

if systemctl is-enabled NetworkManager &>/dev/null; then
  echo "Disabling NetworkManager (conflicts with iwd)..."
  sudo systemctl disable --now NetworkManager
fi

if ! systemctl is-enabled systemd-resolved &>/dev/null; then
  echo "Enabling systemd-resolved (required for DNS)..."
  sudo systemctl enable --now systemd-resolved
fi

if ! systemctl is-enabled iwd &>/dev/null; then
  echo "Enabling iwd..."
  sudo systemctl enable --now iwd
fi

echo "Done."
