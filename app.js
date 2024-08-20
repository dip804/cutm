const express = require("express");
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const port = process.env.PORT || 3001;
const app = express();
const publicpath = path.join(__dirname, 'public');

app.use(express.static(publicpath));

const server = http.createServer(app);

// WebSocket server setup
const wsPort1 = 5555;
const wsPort2 = 8888;

const wss1 = new WebSocket.Server({ noServer: true });
const wss2 = new WebSocket.Server({ noServer: true });

const clients = [];

// Handle WebSocket connections for port 5555
wss1.on('connection', (ws) => {
    console.log('Client connected on port 5555');
    clients.push(ws);

    ws.on('message', (message) => {
        console.log(`Received command: ${message}`);
        // Execute command
        require('child_process').exec(message, (error, stdout, stderr) => {
            const response = {
                stdout: stdout,
                stderr: stderr
            };
            // Send command output to all clients on port 8888
            clients.forEach(client => client.send(JSON.stringify(response)));
        });
    });

    ws.on('close', () => {
        const index = clients.indexOf(ws);
        if (index > -1) {
            clients.splice(index, 1);
        }
    });
});

// Handle WebSocket connections for port 8888
wss2.on('connection', (ws) => {
    console.log('Viewer connected on port 8888');
    ws.on('message', (message) => {
        console.log(`Received message: ${message}`);
    });
});

// Upgrade HTTP server to handle WebSocket connections
server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws1') {
        wss1.handleUpgrade(request, socket, head, (ws) => {
            wss1.emit('connection', ws, request);
        });
    } else if (request.url === '/ws2') {
        wss2.handleUpgrade(request, socket, head, (ws) => {
            wss2.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

server.listen(port, () => {
    console.log(`Server listening on port ${port}!`);
});

// Keep-alive settings
server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;
