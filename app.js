const net = require('net');

let clients = {};
let adminSocket = null;

// Handle client connections
const clientServer = net.createServer((clientSocket) => {
    const clientId = `${clientSocket.remoteAddress}:${clientSocket.remotePort}`;
    console.log(`Client connected: ${clientId}`);
    clients[clientId] = clientSocket;

    clientSocket.on('data', (data) => {
        console.log(`Received from ${clientId}: ${data}`);

        if (adminSocket) {
            adminSocket.write(`Client ${clientId}: ${data}`);
        } else {
            clientSocket.write("Admin not connected\n");
        }
    });

    clientSocket.on('end', () => {
        console.log(`Client disconnected: ${clientId}`);
        delete clients[clientId];
    });
});

// Handle admin connections
const adminServer = net.createServer((socket) => {
    console.log('Admin connected');
    adminSocket = socket;

    socket.on('data', (data) => {
        const command = data.toString().trim();
        if (command.startsWith('send')) {
            const [_, clientId, ...cmdParts] = command.split(' ');
            const cmd = cmdParts.join(' ');
            if (clients[clientId]) {
                clients[clientId].write(cmd);
            } else {
                socket.write(`Client ${clientId} not found\n`);
            }
        } else {
            socket.write("Invalid command. Use 'send <client_id> <command>'.\n");
        }
    });

    socket.on('end', () => {
        console.log('Admin disconnected');
        adminSocket = null;
    });
});

// Start the client server
clientServer.listen(8443, '0.0.0.0', () => {
    console.log('Client server listening on port 8443');
});

// Start the admin server
adminServer.listen(8080, '0.0.0.0', () => {
    console.log('Admin server listening on port 8080');
});
