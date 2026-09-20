FROM node:24-bookworm-slim
WORKDIR /opt/mock
COPY gyms/lark-cli/src/server.ts gyms/lark-cli/src/serve.ts gyms/lark-cli/src/chat-members.ts gyms/lark-cli/src/base-records.ts gyms/lark-cli/src/types.ts ./
RUN mkdir -p /var/lib/feishu-mock
ENTRYPOINT ["node", "/opt/mock/serve.ts", "--host", "0.0.0.0", "--port", "8080", "--seed", "/opt/mock/seed.json", "--state", "/var/lib/feishu-mock/state.json", "--ready", "/var/lib/feishu-mock/endpoint"]
