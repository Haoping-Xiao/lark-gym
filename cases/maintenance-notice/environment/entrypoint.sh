#!/bin/sh
set -eu
mkdir -p /var/lib/feishu-mock
node /opt/feishu/lark-cli-mock/src/harbor/serve.mjs --seed /opt/feishu/seed.json --state /var/lib/feishu-mock/state.json --ready /var/lib/feishu-mock/endpoint &
i=0
until [ -s /var/lib/feishu-mock/endpoint ]; do
 i=$((i+1)); [ "$i" -lt 100 ] || exit 1; sleep 0.1
done
exec "$@"
