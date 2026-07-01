#!/usr/bin/env sh
set -eu

curl -fsSL https://raw.githubusercontent.com/phcurado/dots/main/install.sh | sh
dots apply
