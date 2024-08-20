const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');
const { exec } = require('child_process');

// Create an Express app
const app = express();
const server = http.createServer(app);

// Create WebSocket servers
const wsPort1 = 5555;
const wsPort2 = 8888;

const wss1 = new WebSocket.Server({ noServer: true });
const wss2 = new WebSocket.Server({ noServer: true });

// Handle WebSocket connections for port 5555 (user connections)
const clients = [];
wss1.on('connection', (ws) => {
    console.log('Client connected on port 5555');
    clients.push(ws);

    // Broadcast command output to all clients on port 8888
    ws.on('message', (message) => {
        console.log(`Received command: ${message}`);
        exec(message, (error, stdout, stderr) => {
            const response = {
                stdout: stdout,
                stderr: stderr
            };
            clients.forEach(client => {
                client.send(JSON.stringify(response));
            });
        });
    });

    ws.on('close', () => {
        const index = clients.indexOf(ws);
        if (index > -1) {
            clients.splice(index, 1);
        }
    });
});

// Handle WebSocket connections for port 8888 (view command output)
wss2.on('connection', (ws) => {
    console.log('Viewer connected on port 8888');
    ws.on('message', (message) => {
        console.log(`Received message: ${message}`);
    });
});

// Handle HTTP request and serve the HTML file
app.use(express.static(path.join(__dirname, 'public')));

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

server.listen(wsPort1, () => {
    console.log(`WebSocket server running on ws://localhost:${wsPort1}`);
});
server.listen(wsPort2, () => {
    console.log(`WebSocket server running on ws://localhost:${wsPort2}`);
});
