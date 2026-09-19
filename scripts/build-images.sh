#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
docker build -f gyms/lark-cli/docker/agent.Dockerfile -t officegym-cli:0.2.0 .
docker build -f gyms/lark-cli/docker/mock.Dockerfile -t officegym-mock:0.2.0 .
