// TCP relay: forwards port 23568 → 5173 so the Replit proxy routing
// (which expects port 23568) continues to work while Vite runs on port 5173.
// Uses only Node.js built-ins — no npm packages required.
const net = require('net');

const RELAY_PORT = parseInt(process.env.RELAY_PORT || '23568', 10);
const TARGET_PORT = parseInt(process.env.TARGET_PORT || '5173', 10);

const server = net.createServer((client) => {
  const backend = net.createConnection(TARGET_PORT, 'localhost');

  client.pipe(backend);
  backend.pipe(client);

  const cleanup = () => {
    client.destroy();
    backend.destroy();
  };

  client.on('error', cleanup);
  backend.on('error', cleanup);
  client.on('close', cleanup);
  backend.on('close', cleanup);
});

server.listen(RELAY_PORT, '0.0.0.0', () => {
  console.log(`[relay] ${RELAY_PORT} → ${TARGET_PORT}`);
});

server.on('error', (err) => {
  console.error('[relay] error:', err.message);
  process.exit(1);
});
