// app.js
const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const port = process.env.PORT || 3001; // HTTP port
const wsPort = 8888; // WebSocket port
const app = express();
const publicPath = path.join(__dirname, 'public');

// Serve static files
app.use(express.static(publicPath));

// Create an HTTP server
const server = http.createServer(app);

// Create a WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);
    // Broadcast message to all clients
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

// Upgrade HTTP server to handle WebSocket connections
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Start the HTTP server
server.listen(port, () => {
  console.log(`HTTP server listening on port ${port}`);
});

// Start the WebSocket server separately on port 8888
const wsServer = http.createServer();
wsServer.listen(wsPort, () => {
  console.log(`WebSocket server listening on port ${wsPort}`);
});
