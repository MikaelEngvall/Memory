const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Game rooms storage
const gameRooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Create new game room
  socket.on("createRoom", ({ playerName }) => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    gameRooms.set(roomCode, {
      players: [{ id: socket.id, name: playerName, score: 0 }],
      currentPlayer: 0,
      gameState: null,
      isPlaying: false,
      gameStarted: false,
    });
    socket.join(roomCode);
    io.to(roomCode).emit("roomUpdate", {
      code: roomCode,
      players: gameRooms.get(roomCode).players,
    });
  });

  // Join existing room
  socket.on("joinRoom", ({ roomCode, playerName }) => {
    const room = gameRooms.get(roomCode);
    if (room && !room.gameStarted) {
      room.players.push({ id: socket.id, name: playerName, score: 0 });
      socket.join(roomCode);
      io.to(roomCode).emit("roomUpdate", {
        code: roomCode,
        players: room.players,
      });
    }
  });

  // Handle card selection
  socket.on("cardSelected", ({ roomCode, cardIndex }) => {
    const room = gameRooms.get(roomCode);
    if (room) {
      io.to(roomCode).emit("updateGameState", {
        selectedCard: cardIndex,
        currentPlayer: room.currentPlayer,
      });
    }
  });

  // Start game
  socket.on("startGame", ({ roomCode, gameConfig }) => {
    const room = gameRooms.get(roomCode);
    if (room) {
      room.gameStarted = true;
      io.to(roomCode).emit("gameStarted", gameConfig);
    }
  });
});

server.listen(3001, () => {
  console.log("Server running on port 3001");
});
