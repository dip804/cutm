const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const net = require('net');

// Set up Express and paths
const port = process.env.PORT || 3001; // HTTP port
const wsPort = 8888; // WebSocket port
const clientPort = 8443; // TCP port for client connections
const adminPort = 8080; // TCP port for admin connections

const app = express();
const publicPath = path.join(__dirname, 'public');

// Serve static files
app.use(express.static(publicPath));

// Create an HTTP server
const server = http.createServer(app);

// WebSocket server on the same HTTP server (port 3001)
const wss = new WebSocket.Server({ server });

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);
    // Broadcast message to all WebSocket clients
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

// Create a TCP server for client connections
const clients = {};
let adminSocket = null;

const clientServer = net.createServer((clientSocket) => {
    const clientId = `${clientSocket.remoteAddress}:${clientSocket.remotePort}`;
    console.log(`Client connected: ${clientId}`);
    clients[clientId] = clientSocket;

    console.log(`Client IP Address: ${clientSocket.remoteAddress}`);

    // Notify the admin about the new client connection
    if (adminSocket) {
        adminSocket.write(`Client connected: ${clientId}\n`);
    }

    clientSocket.on('data', (data) => {
        console.log(`Received from ${clientId}: ${data.toString().trim()}`);
        if (adminSocket) {
            adminSocket.write(`Client ${clientId}: ${data}`);
        }
    });

    clientSocket.on('end', () => {
        console.log(`Client disconnected: ${clientId}`);
        delete clients[clientId];
    });

    clientSocket.on('error', (err) => {
        console.error(`Error with client ${clientId}: ${err.message}`);
    });
});

clientServer.listen(clientPort, '0.0.0.0', () => {
    console.log(`Client server listening on port ${clientPort}`);
});

// Create a TCP server for admin connections
const adminServer = net.createServer((socket) => {
    console.log('Admin connected');
    adminSocket = socket;

    socket.on('data', (data) => {
        const command = data.toString().trim();
        if (command === 'list_clients') {
            // List all connected clients with their IP addresses
            const clientList = Object.keys(clients).join('\n');
            socket.write(`Connected clients:\n${clientList}\n`);
        } else if (command.startsWith('send')) {
            const [_, clientId, ...cmdParts] = command.split(' ');
            const cmd = cmdParts.join(' ');
            if (clients[clientId]) {
                clients[clientId].write(cmd);
            } else {
                socket.write(`Client ${clientId} not found\n`);
            }
        } else {
            socket.write("Invalid command. Use 'send <client_id> <command>' or 'list_clients'.\n");
        }
    });

    socket.on('end', () => {
        console.log('Admin disconnected');
        adminSocket = null;
    });

    socket.on('error', (err) => {
        console.error(`Error with admin: ${err.message}`);
    });
});

adminServer.listen(adminPort, '0.0.0.0', () => {
    console.log(`Admin server listening on port ${adminPort}`);
});
