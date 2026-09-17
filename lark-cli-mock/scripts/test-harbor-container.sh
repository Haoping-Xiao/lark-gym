#!/usr/bin/env bash
# Exercise the same image, solution entrypoint and verifier entrypoint as Harbor.
set -euo pipefail
cd "$(dirname "$0")/../.."
case_dir="$PWD/cases/maintenance-notice"
image="feishu-maintenance-test:local"
container=""
cleanup() { if [[ -n "$container" ]]; then docker rm -f "$container" >/dev/null; fi; }
trap cleanup EXIT
npm run prepare:harbor
docker build -t "$image" "$case_dir/environment"
container=$(docker run -d -v "$case_dir/solution:/solution:ro" -v "$case_dir/tests:/tests:ro" "$image")
for attempt in $(seq 1 100); do
  if docker exec "$container" test -s /var/lib/feishu-mock/endpoint; then break; fi
  sleep 0.1
done
docker exec "$container" sh /tests/test.sh
docker exec "$container" sh -c 'test "$(cat /logs/verifier/reward.txt)" = 0'
docker exec "$container" sh /solution/solve.sh
docker exec "$container" sh /tests/test.sh
docker exec "$container" sh -c 'test "$(cat /logs/verifier/reward.txt)" = 1'
