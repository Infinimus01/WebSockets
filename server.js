const express = require("express");
const http = require("http");
const WebSocket = require("ws"); // use standard naming

const app = express();
const PORT = 8080;

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html"); // fixed req -> res
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("Client connected");

  // // Receive messages from client
  // ws.on("message", (message) => {
  //   console.log("Received:", message);

  //   // Broadcast message to all clients
  //   wss.clients.forEach((client) => {
  //     if (client.readyState === WebSocket.OPEN) {
  //       client.send(message);
  //     }
  //   });
  // });
  ws.on("message", (message) => {
    // If message is Buffer, convert to string
    if (message instanceof Buffer) {
      message = message.toString();
    }
  
    console.log("Received:", message);
  
    // Broadcast
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
  

  // Detect client disconnect
  ws.on("close", () => console.log("Client disconnected"));

  // Heartbeat
  ws.isAlive = true;
  ws.on("pong", () => (ws.isAlive = true));
});

// Heartbeat check every 30 seconds
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
