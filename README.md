# 🧠 Memory Game

A real-time multiplayer memory card game built with React and Socket.IO. Players take turns flipping cards to find matching pairs — supports emojis, Pokémon, dogs, Rick & Morty characters, and Pexels photo categories.

![Neon gaming UI with dark background and cyan/purple glow effects]

---

## Features

- Real-time multiplayer via WebSockets (2+ players)
- Room-based matchmaking with shareable invite links
- Joining via invite link pre-fills the room code automatically
- Players joining via link can only join — not create a new room
- Multiple card categories: emojis, Pokémon, dogs, Rick & Morty, Pexels photos (nature, cities, animals, food, space, architecture)
- Configurable number of cards (host chooses before game starts)
- Random first-player selection on game start
- Active player panel glows to indicate whose turn it is
- Sparkle animation on matched pairs
- Card flip zoom animation
- All cards fit on screen without scrolling (responsive layout)
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
VITE_PEXELS_API_KEY=your_pexels_api_key_here
```

Get a free Pexels API key at [pexels.com/api](https://www.pexels.com/api/).

---

## Running Locally

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
VITE_PEXELS_API_KEY=your_pexels_api_key_here
```

**3. Rebuild:**
```bash
npm run build
```

**4. Start the server:**
```bash
node server/index.js
```

**5. Start ngrok:**
```bash
ngrok http 3001
```

**6. Share the invite link.** Once you've created a room, copy the invite link from the waiting room — it includes the room code automatically. Your friend just opens the link, enters their name, and clicks **Gå med i spel**.

---

## How to Play

1. Enter your name and click **Skapa spel** (Create game)
2. In the waiting room, copy the invite link and send it to your friend
3. Your friend opens the link — the room code is pre-filled, they just enter their name and join
4. The host configures category and number of cards, then starts the game
5. A random player goes first — the active player's panel glows cyan
6. Take turns flipping two cards — if they match, you keep the turn and score a point
7. The player with the most pairs when all cards are matched wins
8. Click **Spela igen** to rematch without re-entering codes

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
│   ├── GameStatus.jsx       # Active player glow + scores during game
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

Tests cover socket event handling, turn enforcement, card flip guards, and image card rendering correctness.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build frontend to `dist/` |
| `npm run preview` | Preview production build |
| `node server/index.js` | Start backend server (port 3001) |
| `npx vitest run` | Run tests once |
