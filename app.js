const net = require('net');
const express = require('express');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const adminPort = 5555;  // Port for admin web interface
const clientPort = 4444;  // Port for client connections

let clients = [];

// WebSocket server for admin control
const wss = new WebSocket.Server({ noServer: true });

// Handle WebSocket connections (from admin)
wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        console.log('Received from admin:', message);
        // Broadcast the command to all connected clients
        clients.forEach(client => client.socket.write(message + '\n'));
    });
});

// TCP server to handle client connections
const cmdServer = net.createServer((socket) => {
    const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`New client connected: ${clientAddress}`);

    clients.push({ socket, address: clientAddress });

    socket.on('data', (data) => {
        console.log(`Received from ${clientAddress}: ${data.toString()}`);
        // Send output back to the admin via WebSocket
        wss.clients.forEach(ws => ws.send(`${clientAddress}: ${data.toString()}`));
    });

    socket.on('end', () => {
        console.log(`Client disconnected: ${clientAddress}`);
        clients = clients.filter(client => client.socket !== socket);
    });
});

cmdServer.listen(clientPort, () => {
    console.log(`Command server listening on port ${clientPort}`);
});

// HTTP server to serve the admin interface
app.use(express.static(path.join(__dirname, 'public')));

const server = app.listen(adminPort, () => {
    console.log(`Admin interface available at http://localhost:${adminPort}`);
});

// Handle WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});
