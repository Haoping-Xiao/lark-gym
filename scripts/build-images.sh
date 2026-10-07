#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
docker build -f gyms/lark-cli/docker/agent.Dockerfile -t lark-gym-cli:0.2.1 "$@" .
docker build -f gyms/lark-cli/docker/mock.Dockerfile -t lark-gym-mock:0.2.17 "$@" .
# Task image tags denote supported feature levels, not archived source builds.
# Publish every checked-in task's local alias so clean runners never try Docker Hub.
while IFS= read -r image; do
  docker tag lark-gym-mock:0.2.17 "$image"
done < <(sed -n 's/^FROM \(lark-gym-mock:[0-9.]*\)$/\1/p' tasks/*/environment/mock.Dockerfile | sort -u)
docker build -f gyms/lark-cli/docker/verifier.Dockerfile -t lark-gym-verifier:0.3.0 "$@" .
