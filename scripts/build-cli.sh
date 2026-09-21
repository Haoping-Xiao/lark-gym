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
# The upstream root package embeds and registers agent-readable documentation.
# Importing cmd alone does not run that package's init; stage its exact pinned
# implementation and content alongside our evaluation entrypoint.
for content in skills affordance; do
  rm -rf "gyms/lark-cli/cli/$content"
  cp -R "$source_dir/$content" "gyms/lark-cli/cli/$content"
done
cp "$source_dir/content_embed.go" gyms/lark-cli/cli/content_embed.go
cd gyms/lark-cli/cli
go build -mod=readonly -o ../bin/lark-cli .
# Exercise the final artifact during local and Docker builds without a backend.
FEISHU_MOCK_URL=http://127.0.0.1:1 ../bin/lark-cli skills list >/dev/null
FEISHU_MOCK_URL=http://127.0.0.1:1 ../bin/lark-cli skills read lark-base --json >/dev/null
