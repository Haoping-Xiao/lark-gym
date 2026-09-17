FROM golang:1.23-bookworm AS go-toolchain
FROM node:24-bookworm
COPY --from=go-toolchain /usr/local/go /usr/local/go
ENV PATH="/usr/local/go/bin:${PATH}"
RUN apt-get update && apt-get install -y --no-install-recommends git python3 && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/feishu
# Generated from tracked source by npm run prepare:harbor; no grader/solution/login data.
COPY mock-source/ ./
RUN npm ci && npm run build:cli
COPY seed.json /opt/feishu/seed.json
COPY entrypoint.sh /opt/feishu/entrypoint.sh
COPY lark-cli.sh /usr/local/bin/lark-cli
RUN chmod +x /opt/feishu/entrypoint.sh /usr/local/bin/lark-cli
WORKDIR /workspace
ENTRYPOINT ["/opt/feishu/entrypoint.sh"]
CMD ["sleep", "infinity"]
