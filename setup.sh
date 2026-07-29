#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")"

git submodule update --init --recursive

curl -fsSL https://raw.githubusercontent.com/phcurado/dots/main/install.sh | sh
dots apply
