FROM node:24-bookworm-slim
WORKDIR /opt/mock
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY gyms/lark-cli/src/ ./
RUN mkdir -p /var/lib/feishu-mock
ENTRYPOINT ["node", "/opt/mock/serve.ts", "--host", "0.0.0.0", "--port", "8080", "--seed", "/opt/mock/seed.json", "--state", "/var/lib/feishu-mock/state.json", "--ready", "/var/lib/feishu-mock/endpoint"]
