FROM node:24-bookworm-slim
WORKDIR /opt/mock
COPY gyms/lark-cli/src/server.mjs gyms/lark-cli/src/serve.mjs gyms/lark-cli/src/chat-members.ts ./
RUN mkdir -p /var/lib/feishu-mock
ENTRYPOINT ["node", "/opt/mock/serve.mjs", "--host", "0.0.0.0", "--port", "8080", "--seed", "/opt/mock/seed.json", "--state", "/var/lib/feishu-mock/state.json", "--ready", "/var/lib/feishu-mock/endpoint"]
