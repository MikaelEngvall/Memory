const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "https://3zt1l3c8-4000.euw.devtunnels.ms/",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST"],
  },
});

// Game rooms storage
const gameRooms = new Map();

function checkGameOver(room) {
  const totalPairs = Math.floor(room.gameCards.length / 2);
  const matchedPairsCount = Math.floor(room.matchedPairs.length / 2);
  return matchedPairsCount === totalPairs;
}

io.on("connection", (socket) => {
  // Create new game room
  socket.on("createRoom", ({ playerName }) => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    gameRooms.set(roomCode, {
      players: [{ id: socket.id, name: playerName, score: 0, isHost: true }],
      currentPlayer: 0,
      selectedCards: [],
      matchedPairs: [],
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
      room.players.push({
        id: socket.id,
        name: playerName,
        score: 0,
        isHost: false,
      });

      socket.join(roomCode);
      io.to(roomCode).emit("roomUpdate", {
        code: roomCode,
        players: room.players,
      });
    } else {
      socket.emit(
        "roomError",
        "Rum hittades inte eller spelet har redan startat"
      );
    }
  });

  // Handle card selection
  socket.on("cardSelected", ({ roomCode, cardIndex }) => {
    const room = gameRooms.get(roomCode);
    if (!isValidMove(room, cardIndex, socket.id)) {
      socket.emit("invalidMove");
      return;
    }
    const currentPlayer = room.players[room.currentPlayer];

    if (
      currentPlayer.id === socket.id &&
      !room.selectedCards.includes(cardIndex)
    ) {
      room.selectedCards.push(cardIndex);

      io.to(roomCode).emit("updateGameState", {
        selectedCard: cardIndex,
        currentPlayer: room.currentPlayer,
        playerName: currentPlayer.name,
        allSelectedCards: room.selectedCards,
      });

      if (room.selectedCards.length === 2) {
        const [firstCard, secondCard] = room.selectedCards;
        const cards = room.gameCards;

        setTimeout(() => {
          if (cards[firstCard].name === cards[secondCard].name) {
            room.matchedPairs.push(firstCard, secondCard);
            room.players[room.currentPlayer].score++;

            io.to(roomCode).emit("pairMatched", {
              cards: room.selectedCards,
              player: {
                id: currentPlayer.id,
                score: currentPlayer.score,
              },
            });

            // Kontrollera om spelet är slut
            if (checkGameOver(room)) {
              io.to(roomCode).emit("gameOver", {
                players: room.players,
                matchedPairs: room.matchedPairs,
              });
            }
          } else {
            room.currentPlayer = (room.currentPlayer + 1) % room.players.length;

            io.to(roomCode).emit("pairMissed", {
              cards: room.selectedCards,
              nextPlayer: room.currentPlayer,
            });
          }
          room.selectedCards = [];
        }, 1000);
      }
    }
  });

  // Start game
  socket.on("startGame", ({ roomCode, gameConfig, cards }) => {
    const room = gameRooms.get(roomCode);
    if (room && room.players.find((p) => p.id === socket.id)?.isHost) {
      try {
        if (!cards || !Array.isArray(cards)) {
          throw new Error("Ett fel uppstod");
        }

        room.gameStarted = true;
        room.gameConfig = gameConfig;
        room.gameCards = cards;
        room.selectedCards = [];
        room.matchedPairs = [];
        room.currentPlayer = 0;
        room.players.forEach((player) => (player.score = 0));

        io.to(roomCode).emit("gameStarted", {
          gameConfig,
          gameCards: cards,
        });
      } catch (error) {
        socket.emit("gameError", "Kunde inte starta spelet");
      }
    } else {
      socket.emit("gameError", "Endast värden kan starta spelet");
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    for (const [roomCode, room] of gameRooms.entries()) {
      const playerIndex = room.players.findIndex((p) => p.id === socket.id);
      if (playerIndex !== -1) {
        const wasHost = room.players[playerIndex].isHost;
        room.players.splice(playerIndex, 1);

        if (room.players.length === 0) {
          gameRooms.delete(roomCode);
        } else {
          // Om värden lämnade, gör första kvarvarande spelare till ny värd
          if (wasHost && room.players.length > 0) {
            room.players[0].isHost = true;
          }

          // Uppdatera currentPlayer om nödvändigt
          if (playerIndex <= room.currentPlayer && room.currentPlayer > 0) {
            room.currentPlayer--;
          }

          io.to(roomCode).emit("roomUpdate", {
            code: roomCode,
            players: room.players,
          });
        }
        break;
      }
    }
  });
});

function isValidMove(room, cardIndex, playerId) {
  return (
    room &&
    room.gameStarted &&
    room.players[room.currentPlayer].id === playerId &&
    !room.selectedCards.includes(cardIndex) &&
    !room.matchedPairs.includes(cardIndex) &&
    cardIndex >= 0 &&
    cardIndex < room.gameCards.length
  );
}

server.listen(3001, () => {
  console.log("Server körs på port 3001");
});
