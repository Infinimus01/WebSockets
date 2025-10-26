const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const PORT = 8080;

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    if (message instanceof Buffer) {
      message = message.toString();
    }

    let parsed;
    try {
      parsed = JSON.parse(message);
    } catch (err) {
      console.log("Invalid JSON:", message);
      return;
    }

    // 🕒 Generate timestamp
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    parsed.timestamp = timestamp; // attach timestamp to message

    // ✅ Correct console log
    console.log(`[${parsed.timestamp}] [${parsed.username}]: ${parsed.message}`);

    // Broadcast to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(parsed));
      }
    });
  });

  ws.on("close", () => console.log("Client disconnected"));

  // Heartbeat
  ws.isAlive = true;
  ws.on("pong", () => (ws.isAlive = true));
});

// Heartbeat check every 30s
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

server.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
