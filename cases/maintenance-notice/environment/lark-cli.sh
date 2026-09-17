#!/bin/sh
set -eu
# Container command interception: preserve argv, inject local backend routing.
export FEISHU_MOCK_URL="$(cat /var/lib/feishu-mock/endpoint)"
exec /opt/feishu/lark-cli-mock/bin/lark-cli "$@"
