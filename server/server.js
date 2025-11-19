// server.js (ESM Version)
import express from "express";
import http from "http";
import WebSocket, { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
app.use(express.static(__dirname)); // serve admin.html

// Store keys for rooms (memory only)
let roomKeys = {}; // { "201": "XYZ123" }

// WebSocket handling
wss.on("connection", ws => {
    console.log("Client connected");

    ws.on("message", (raw) => {
        const data = JSON.parse(raw);

        // Admin generates key
        if (data.type === "generate-key") {
            const room = data.room;
            const newKey = generateKey();
            roomKeys[room] = newKey;

            // Notify dashboards subscribed to this room
            broadcastToRoom(room, {
                type: "room-key-update",
                room,
                key: newKey
            });

            // Send confirmation back to admin
            ws.send(JSON.stringify({
                type: "admin-confirm",
                room,
                key: newKey
            }));
        }

        // Dashboard subscribes to a room
        if (data.type === "subscribe-room") {
            ws.room = data.room;

            // If room already has a key
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

// Send message only to clients listening to that room
function broadcastToRoom(room, message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.room === room) {
            client.send(JSON.stringify(message));
        }
    });
}

// Random key generator
function generateKey() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Start server
server.listen(8080, () => {
    console.log("Server running on http://localhost:8080");
});
