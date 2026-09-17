#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
expected=0493db0cd1a10d6dd8a2295128bec3e319c7fbb0
source_dir=.deps/lark-cli
mkdir -p .deps
if [[ ! -d "$source_dir/.git" ]]; then
  git clone https://github.com/larksuite/cli.git "$source_dir"
  git -C "$source_dir" checkout "$expected"
fi
[[ "$(git -C "$source_dir" rev-parse HEAD)" == "$expected" ]] || { echo 'Wrong upstream CLI revision' >&2; exit 1; }
mkdir -p gyms/lark-cli/bin
cd gyms/lark-cli/cli
go build -mod=readonly -o ../bin/lark-cli .
