#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
docker build -f gyms/lark-cli/docker/agent.Dockerfile -t lark-gym-cli:0.2.1 .
docker build -f gyms/lark-cli/docker/mock.Dockerfile -t lark-gym-mock:0.2.6 .
docker build -f gyms/lark-cli/docker/verifier.Dockerfile -t lark-gym-verifier:0.3.0 .
