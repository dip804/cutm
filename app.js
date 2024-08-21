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

// Create a WebSocket server on the same HTTP server
const wss = new WebSocket.Server({ server });

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
