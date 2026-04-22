# 💬 ChatRoom

A full-stack real-time chat application built with React, Node.js, Express, and Socket.io. Users can register a username, browse and create rooms, and send messages instantly across multiple simultaneous clients.

**Live Demo:** https://nandani2203.github.io/ChatRoom/

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│                                                                 │
│   JoinScreen ──► RoomList ──► ChatBox                          │
│       │              │            │                             │
│   POST /users    GET /rooms   socket.emit                       │
│   /join          POST /rooms  (sendMessage, joinRoom)           │
│                  GET /rooms/:id                                 │
└──────────────────────┬──────────────────┬───────────────────────┘
                       │                  │
                  REST API           WebSocket
                  (HTTP)            (Socket.io)
                       │                  │
┌──────────────────────▼──────────────────▼───────────────────────┐
│                     BACKEND (Node.js)                           │
│                                                                 │
│   Express.js REST Layer         Socket.io Layer                 │
│   ┌─────────────────────┐      ┌──────────────────────┐        │
│   │ POST /users/join     │      │ joinRoom             │        │
│   │ GET  /users          │      │ sendMessage          │        │
│   │ GET  /rooms          │      │ userJoined / Left    │        │
│   │ POST /rooms          │      │ roomCreated          │        │
│   │ GET  /rooms/:id      │      │ roomJoined           │        │
│   └─────────────────────┘      └──────────────────────┘        │
│                                                                 │
│             In-Memory Store                                     │
│   ┌──────────────────────────────────────┐                     │
│   │ users: { userId: { username, ... } } │                     │
│   │ rooms: { roomId: { name, members } } │                     │
│   └──────────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

### User Flow

```
1. Enter username  →  POST /users/join  →  receive userId
2. Fetch rooms     →  GET /rooms        →  see room list
3. Create room     →  POST /rooms       →  broadcasts via socket to all clients
4. Join room       →  socket.emit("joinRoom")    →  server scopes socket to room
5. Chat            →  socket.emit("sendMessage") →  server broadcasts to room only
```

---

## REST API Reference

| Method | Endpoint | Body | Response | Description |
|--------|----------|------|----------|-------------|
| POST | `/users/join` | `{ username }` | `{ userId, username }` | Register username |
| GET | `/users` | — | `[{ userId, username }]` | List online users |
| GET | `/rooms` | — | `[{ id, name, memberCount }]` | List all rooms |
| POST | `/rooms` | `{ name, userId }` | `{ id, name, createdBy }` | Create a room |
| GET | `/rooms/:id` | — | `{ id, name, members }` | Get room details |

---

## Socket.io Events

| Direction | Event | Payload | Description |
|-----------|-------|---------|-------------|
| Client → Server | `joinRoom` | `{ roomId, userId }` | Join a specific room |
| Client → Server | `sendMessage` | `{ roomId, userId, text }` | Send message to room |
| Server → Client | `receiveMessage` | `{ username, text, timestamp }` | New message in room |
| Server → Client | `userJoined` | `{ username }` | Someone joined |
| Server → Client | `userLeft` | `{ username }` | Someone left |
| Server → Client | `roomCreated` | `{ id, name }` | New room created |
| Server → Client | `roomJoined` | `{ roomId, members }` | Join confirmed + member list |

---

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | REST API framework |
| Socket.io | WebSocket server |
| CORS | Cross-origin request handling |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Vite | Build tool and dev server |
| Chakra UI | Component library |
| Socket.io-client | WebSocket client |

### Infrastructure
| Service | Purpose |
|---------|---------|
| GitHub Pages | Frontend hosting |
| Render.com | Backend hosting (Node.js) |
| GitHub Actions | CI/CD pipeline |

---

## Project Structure

```
ChatRoom/
├── .github/
│   └── workflows/
│       └── deploy.yml              # Auto deploys frontend to GitHub Pages on push
│
├── chat-backend/
│   ├── server.js                   # Express REST API + Socket.io server
│   └── package.json                # Backend dependencies
│
├── chat-frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── JoinScreen.jsx      # Screen 1 — username entry
│   │   │   ├── RoomList.jsx        # Screen 2 — browse and create rooms
│   │   │   └── ChatBox.jsx         # Screen 3 — real-time chat UI
│   │   ├── config.js               # Backend URL (reads VITE_BACKEND_URL env var)
│   │   ├── App.jsx                 # Root — manages screen state
│   │   ├── main.jsx                # React entry point
│   │   └── index.css               # Global styles
│   ├── index.html                  # HTML shell
│   ├── vite.config.js              # Vite config with GitHub Pages base path
│   └── package.json                # Frontend dependencies
│
└── README.md
```

---

## Running Locally

### Prerequisites
- Node.js v18+
- npm

### 1. Clone the repo

```bash
git clone https://github.com/nandani2203/ChatRoom.git
cd ChatRoom
```

### 2. Start the backend

```bash
cd chat-backend
npm install
node server.js
# Running at http://localhost:4000
```

### 3. Start the frontend

```bash
# New terminal tab
cd chat-frontend
npm install
npm run dev
# Running at http://localhost:5173
```

Open `http://localhost:5173` — open multiple tabs to test real-time messaging.

---
## Notes

- Messages are in-memory only — not persisted to a database. Restarting the server clears everything.
- Render free tier sleeps after 15 min of inactivity — first request after sleep takes ~30s to wake.
- To keep Render awake, set up a free ping at [cron-job.org](https://cron-job.org) pointing to your Render URL every 10 minutes.
