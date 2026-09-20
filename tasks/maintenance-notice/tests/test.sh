#!/bin/sh
set -eu
mkdir -p /logs/verifier
node /tests/entry.ts
