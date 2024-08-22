const net = require('net');

// Ports for client and admin servers
const clientPort = 8443;
const adminPort = 8080;

const clients = {};
let adminSocket = null;

// Function to list connected clients
function listClients() {
    return Object.keys(clients).join('\n');
}

// Create a TCP server for client connections
const clientServer = net.createServer((clientSocket) => {
    const clientId = `${clientSocket.remoteAddress}:${clientSocket.remotePort}`;
    console.log(`Client connected: ${clientId}`);
    clients[clientId] = clientSocket;

    // Notify admin about new client connection
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
        if (adminSocket) {
            adminSocket.write(`Client disconnected: ${clientId}\n`);
        }
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
            const clientList = listClients();
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
