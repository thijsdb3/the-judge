// src/server/index.js
const http = require('http');
const { WebSocketServer } = require('ws');

const server = http.createServer();
const wsServer = new WebSocketServer({ server });
const port = 8000;
let clients = [];

wsServer.on('connection', (ws) => {
    const client = { ws, username: null }; 
    clients.push(client);
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'join' && data.username) {
            console.log(data.username)
            client.username = data.username; 
            broadcastUserList();
        }
    });

    ws.on('close', () => {
        // Remove when connection is closed
        clients = clients.filter(c => c.ws !== ws);
        broadcastUserList(); 
    });
});

function broadcastUserList() {
    const userList = clients
        .filter(client => client.username) 
        .map(client => client.username); 

    clients.forEach(client => {
        client.ws.send(JSON.stringify({ type: 'userList', users: userList }));
    });
}

server.listen(port, () => {
    console.log(`WebSocket server is running on port ${port}`);
});
