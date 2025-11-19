import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

let messages = [];

// Receive message from Home Assistant card
app.post("/messages", (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "No message provided" });

  messages.push({
    text: message,
    time: new Date().toISOString()
  });

  console.log("New message:", message);
  res.json({ status: "ok" });
});

// Admin panel fetches messages
app.get("/api/messages", (req, res) => {
  res.json(messages);
});

// Default response (optional)
app.get("/", (req, res) => {
  res.send("Message API is running.");
});

// Render port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server running on port", port);
});
