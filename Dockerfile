FROM node:20-alpine

RUN apk add --no-cache curl tar

# Descarga el binario de github-mcp-server
RUN curl -L https://github.com/github/github-mcp-server/releases/latest/download/github-mcp-server_Linux_x86_64.tar.gz \
    | tar xz -C /usr/local/bin github-mcp-server \
    && chmod +x /usr/local/bin/github-mcp-server

WORKDIR /app
COPY server.js .

ENV GITHUB_PERSONAL_ACCESS_TOKEN=""
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server.js"]
