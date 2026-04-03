FROM ghcr.io/github/github-mcp-server AS mcp
FROM node:20-alpine

COPY --from=mcp /github-mcp-server /usr/local/bin/github-mcp-server
RUN chmod +x /usr/local/bin/github-mcp-server
RUN npm install -g supergateway

ENV GITHUB_PERSONAL_ACCESS_TOKEN=""
ENV PORT=8000

EXPOSE 8000

CMD supergateway --port $PORT --stdio "github-mcp-server"
