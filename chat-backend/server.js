const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// ─── In-memory store (no DB for this project) ───────────────────────────────
const users = {};   // { userId: { username, joinedAt } }
const rooms = {     // pre-seed two default rooms
  general: { id: "general", name: "General", createdBy: "system", createdAt: new Date().toISOString(), members: [] },
  tech:    { id: "tech",    name: "Tech",    createdBy: "system", createdAt: new Date().toISOString(), members: [] },
};

// ─── REST API ────────────────────────────────────────────────────────────────

// POST /users/join — register a username, get back a userId
app.post("/users/join", (req, res) => {
  const { username } = req.body;

  if (!username || !username.trim()) {
    return res.status(400).json({ error: "Username is required" });
  }

  // Check if username already taken
  const taken = Object.values(users).some(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase()
  );
  if (taken) {
    return res.status(409).json({ error: "Username already taken" });
  }

  const userId = Math.random().toString(36).substring(2, 9);
  users[userId] = { username: username.trim(), joinedAt: new Date().toISOString() };

  return res.status(201).json({ userId, username: username.trim() });
});

// GET /users — list all online users
app.get("/users", (req, res) => {
  return res.json(Object.entries(users).map(([id, u]) => ({ userId: id, ...u })));
});

// GET /rooms — list all rooms
app.get("/rooms", (req, res) => {
  const roomList = Object.values(rooms).map((r) => ({
    ...r,
    memberCount: r.members.length,
  }));
  return res.json(roomList);
});

// POST /rooms — create a new room
app.post("/rooms", (req, res) => {
  const { name, userId } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Room name is required" });
  }
  if (!userId || !users[userId]) {
    return res.status(401).json({ error: "Invalid userId — join first" });
  }

  const id = name.trim().toLowerCase().replace(/\s+/g, "-");

  if (rooms[id]) {
    return res.status(409).json({ error: "Room already exists" });
  }

  rooms[id] = {
    id,
    name: name.trim(),
    createdBy: users[userId].username,
    createdAt: new Date().toISOString(),
    members: [],
  };

  // Notify all connected clients about the new room
  io.emit("roomCreated", rooms[id]);

  return res.status(201).json(rooms[id]);
});

// GET /rooms/:id — get a specific room
app.get("/rooms/:id", (req, res) => {
  const room = rooms[req.params.id];
  if (!room) return res.status(404).json({ error: "Room not found" });
  return res.json({ ...room, memberCount: room.members.length });
});

// ─── Socket.io ───────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Join a specific room
  socket.on("joinRoom", ({ roomId, userId }) => {
    if (!rooms[roomId]) {
      socket.emit("error", { message: "Room not found" });
      return;
    }
    if (!users[userId]) {
      socket.emit("error", { message: "User not recognised — please rejoin" });
      return;
    }

    // Leave any previous room
    if (socket.currentRoom) {
      socket.leave(socket.currentRoom);
      const prev = rooms[socket.currentRoom];
      if (prev) prev.members = prev.members.filter((id) => id !== userId);
      socket.to(socket.currentRoom).emit("userLeft", {
        username: users[userId]?.username,
      });
    }

    socket.join(roomId);
    socket.currentRoom = roomId;
    socket.currentUserId = userId;

    if (!rooms[roomId].members.includes(userId)) {
      rooms[roomId].members.push(userId);
    }

    // Tell everyone else in the room
    socket.to(roomId).emit("userJoined", {
      username: users[userId].username,
    });

    // Send current member list back to joining user
    const memberNames = rooms[roomId].members
      .map((id) => users[id]?.username)
      .filter(Boolean);
    socket.emit("roomJoined", { roomId, members: memberNames });
  });

  // Send message to room
  socket.on("sendMessage", ({ roomId, userId, text }) => {
    if (!rooms[roomId] || !users[userId]) return;

    const message = {
      userId,
      username: users[userId].username,
      text,
      roomId,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to everyone in room including sender
    io.to(roomId).emit("receiveMessage", message);
  });

  // Disconnect cleanup
  socket.on("disconnect", () => {
    const { currentRoom, currentUserId } = socket;
    if (currentRoom && currentUserId && rooms[currentRoom]) {
      rooms[currentRoom].members = rooms[currentRoom].members.filter(
        (id) => id !== currentUserId
      );
      socket.to(currentRoom).emit("userLeft", {
        username: users[currentUserId]?.username,
      });
      delete users[currentUserId];
    }
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(4000, () => console.log("Server listening on port 4000"));
