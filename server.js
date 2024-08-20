const WebSocket = require('ws');
const express = require('express');
const http = require('http');

// Setup Express app
const app = express();
const server = http.createServer(app);

// WebSocket Server for user commands
const wss = new WebSocket.Server({ server, port: 5555 });

// Command Relay Server
const commandRelay = new WebSocket.Server({ port: 8888 });

wss.on('connection', ws => {
    console.log('User connected');

    ws.on('message', message => {
        console.log(`Received message: ${message}`);
        // Broadcast message to command relay server
        commandRelay.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log('User disconnected');
    });
});

commandRelay.on('connection', ws => {
    console.log('Command relay client connected');
});

server.listen(5555, () => {
    console.log('WebSocket server running on port 5555');
});

server.listen(8888, () => {
    console.log('Command relay server running on port 8888');
});
