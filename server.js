const http = require('http');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 8080;
const TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

const server = http.createServer((req, res) => {
  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200);
    return res.end('ok');
  }

  // SSE endpoint — cada conexion lanza su propio proceso
  if (req.method === 'GET' && req.url === '/sse') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    const child = spawn('github-mcp-server', ['stdio'], {
      env: { ...process.env, GITHUB_PERSONAL_ACCESS_TOKEN: TOKEN },
    });

    // stdin del child recibe los mensajes POST del cliente
    req.socket._mcpChild = child;

    // stdout del child → SSE al cliente
    child.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        res.write(`data: ${line}\n\n`);
      }
    });

    child.stderr.on('data', (d) => process.stderr.write(d));

    child.on('exit', () => {
      console.log('Child process exited');
      res.end();
    });

    req.on('close', () => {
      console.log('Client disconnected, killing child');
      child.kill();
    });

    return;
  }

  // Message endpoint — recibe JSON del cliente y lo manda al child via stdin
  if (req.method === 'POST' && req.url === '/message') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      const child = req.socket._mcpChild;
      if (child && !child.killed) {
        child.stdin.write(body + '\n');
        res.writeHead(200);
        res.end('ok');
      } else {
        res.writeHead(400);
        res.end('No active SSE session on this socket');
      }
    });
    return;
  }

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`MCP SSE server listening on port ${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`POST endpoint: http://localhost:${PORT}/message`);
});
