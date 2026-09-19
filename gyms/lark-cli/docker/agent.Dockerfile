FROM golang:1.23-bookworm AS builder
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
WORKDIR /build
COPY gyms/lark-cli/cli/ gyms/lark-cli/cli/
COPY scripts/build-cli.sh scripts/build-cli.sh
RUN bash scripts/build-cli.sh
FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends bash ca-certificates git python3 && rm -rf /var/lib/apt/lists/*
COPY --from=builder /build/gyms/lark-cli/bin/lark-cli /usr/local/bin/lark-cli
WORKDIR /workspace
CMD ["sleep", "infinity"]
