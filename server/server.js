// server.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(express.static(__dirname)); 

// Store room → key
let roomKeys = {};  // { "201": "ABCD1234" }

wss.on("connection", ws => {
    console.log("Client connected");

    ws.on("message", msg => {
        const data = JSON.parse(msg);

        // ADMIN GENERATES KEY
        if (data.type === "generate-key") {
            const room = data.room;
            const newKey = generateKey();
            roomKeys[room] = newKey;

            // Broadcast ONLY to dashboards of that room
            broadcastToRoom(room, {
                type: "room-key-update",
                room,
                key: newKey
            });

            // Send back response to admin
            ws.send(JSON.stringify({
                type: "admin-confirm",
                room,
                key: newKey
            }));
        }

        // DASHBOARD SUBSCRIBES TO ROOM
        if (data.type === "subscribe-room") {
            ws.room = data.room;
            if (roomKeys[data.room]) {
                ws.send(JSON.stringify({
                    type: "room-key-update",
                    room: data.room,
                    key: roomKeys[data.room]
                }));
            }
        }
    });
});

function broadcastToRoom(room, message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.room === room) {
            client.send(JSON.stringify(message));
        }
    });
}

function generateKey() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();  
}


server.listen(8080, () => console.log("Server running on 8080"));
