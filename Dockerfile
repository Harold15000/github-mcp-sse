FROM node:20-alpine

RUN apk add --no-cache curl tar

# Descarga el binario directamente desde GitHub Releases
RUN curl -L https://github.com/github/github-mcp-server/releases/latest/download/github-mcp-server_Linux_x86_64.tar.gz \
    | tar xz -C /usr/local/bin github-mcp-server \
    && chmod +x /usr/local/bin/github-mcp-server

RUN npm install -g supergateway@latest

ENV GITHUB_PERSONAL_ACCESS_TOKEN=""
ENV PORT=8080

EXPOSE 8080

# Loop de restart automático — si supergateway crashea, arranca solo
CMD while true; do \
      supergateway --port $PORT --stdio "github-mcp-server stdio" --cors; \
      echo "Supergateway crashed, restarting in 2s..."; \
      sleep 2; \
    done
