// app.js
const express = require("express");
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const port = process.env.PORT || 3001;
const app = express();
const publicpath = path.join(__dirname, 'public');
console.log(publicpath);

// Serve static files
app.use(express.static(publicpath));

// Create an HTTP server
const server = http.createServer(app);

// Create a WebSocket server
const wss = new WebSocket.Server({ server });

// WebSocket connection handler
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

// Start the server
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;
