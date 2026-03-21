# 🧠 Memory Game

A real-time multiplayer memory card game built with React and Socket.IO. Players take turns flipping cards to find matching pairs — supports emojis, Pokémon, dogs, and Rick & Morty characters.

![Neon gaming UI with dark background and cyan/purple glow effects]

---

## Features

- Real-time multiplayer via WebSockets (2+ players)
- Room-based matchmaking with shareable room codes
- Multiple card categories: emojis, Pokémon, dogs, Rick & Morty
- Configurable number of cards (host chooses before game starts)
- Random first-player selection on game start
- Sparkle animation on matched pairs
- Neon/gaming UI theme
- Play Again without re-entering room codes
- Remote play via ngrok (single tunnel)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite |
| Styling | Plain CSS (custom neon theme) |
| Real-time | Socket.IO (client + server) |
| Backend | Node.js, Express |
| Testing | Vitest, @testing-library/react |
| Build | Vite |
| Tunneling | ngrok (optional, for remote play) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default `.env` for local play:

```
VITE_SOCKET_URL=http://localhost:3001
```

---

## Running Locally

You need two terminals:

**Terminal 1 — backend server:**
```bash
node server/index.js
```

**Terminal 2 — frontend dev server:**
```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Playing with a Friend (Remote)

The easiest setup uses a single ngrok tunnel — the Express server serves both the frontend and the socket.

**1. Build the frontend:**
```bash
npm run build
```

**2. Update `.env` with your ngrok URL:**
```
VITE_SOCKET_URL=https://your-ngrok-url.ngrok-free.app
```

**3. Rebuild:**
```bash
npm run build
```

**4. Start the server:**
```bash
node server/index.js
```

**5. Start ngrok (in a separate terminal):**
```bash
ngrok http 3001
```

**6. Share the ngrok URL with your friend.** Both of you open it in a browser — no separate frontend tunnel needed.

---

## How to Play

1. Enter your name and click **Skapa spel** (Create game) — you get a room code
2. Share the room code with friends
3. Friends enter the code and click **Gå med i spel** (Join game)
4. The host configures category and number of cards, then starts the game
5. A random player goes first
6. Take turns flipping two cards — if they match, you keep the turn and score a point
7. The player with the most pairs when all cards are matched wins

---

## Project Structure

```
├── App.jsx                  # Main app, socket logic, game state
├── index.jsx                # React entry point
├── index.css                # Global styles (neon theme)
├── index.html
├── components/
│   ├── MemoryCard.jsx       # Card grid + sparkle overlay
│   ├── EmojiButton.jsx      # Individual card button
│   ├── GameOver.jsx         # End screen with scores
│   ├── GameStatus.jsx       # Current player + scores during game
│   ├── Form.jsx             # Game config form (host only)
│   └── ...
├── server/
│   └── index.js             # Express + Socket.IO server
├── data/
│   └── data.js
└── vite.config.js
```

---

## Running Tests

```bash
npx vitest run
```

Tests cover the image card rendering bug fix (bug condition + preservation properties).

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build frontend to `dist/` |
| `npm run preview` | Preview production build |
| `node server/index.js` | Start backend server (port 3001) |
| `npx vitest run` | Run tests once |
