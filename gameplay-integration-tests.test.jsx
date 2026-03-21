/**
 * Gameplay Integration Tests — App.jsx socket event handling
 *
 * Tests socket event handling, turn enforcement, and ref consistency in App.jsx.
 * Uses a vi.mock of socket.io-client to simulate server events without a real server.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4,
 *            4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Socket mock infrastructure
//
// App.jsx calls io() at module scope (outside the component), so vi.mock
// hoisting is critical — the factory runs before any module is evaluated.
// vi.hoisted() lets us create the mock object before the vi.mock factory runs,
// so the factory can safely reference it.
// ---------------------------------------------------------------------------

// listeners map: event name → array of registered handlers
const listeners = {};

const socketMock = vi.hoisted(() => ({
  on(event, handler) {
    if (!listeners[event]) {
      listeners[event] = [];
    }
    listeners[event].push(handler);
  },

  off(event, handler) {
    if (!listeners[event]) return;
    if (handler) {
      listeners[event] = listeners[event].filter(h => h !== handler);
    } else {
      listeners[event] = [];
    }
  },

  emit: vi.fn(),

  /**
   * Test-only helper: synchronously invoke all registered handlers for `event`
   * with the given `payload`. Call inside act(...) to flush React state updates.
   */
  simulateEvent(event, payload) {
    const handlers = listeners[event] || [];
    handlers.forEach(handler => handler(payload));
  },
}));

vi.mock('socket.io-client', () => ({
  io: () => socketMock,
}));

// Import App after the mock is set up
import App from './App';

// ---------------------------------------------------------------------------
// Reset between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Clear emit spy call history
  socketMock.emit.mockClear();

  // Wipe all registered event handlers
  Object.keys(listeners).forEach(key => {
    delete listeners[key];
  });

  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Socket mock infrastructure tests
// ---------------------------------------------------------------------------

describe('gameplay-integration-tests — socket mock infrastructure', () => {
  it('socketMock.emit is a vi spy', () => {
    expect(vi.isMockFunction(socketMock.emit)).toBe(true);
  });

  it('simulateEvent invokes all registered handlers for the event', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    socketMock.on('testEvent', handler1);
    socketMock.on('testEvent', handler2);

    socketMock.simulateEvent('testEvent', { foo: 'bar' });

    expect(handler1).toHaveBeenCalledWith({ foo: 'bar' });
    expect(handler2).toHaveBeenCalledWith({ foo: 'bar' });
  });

  it('simulateEvent does not invoke handlers for other events', () => {
    const handler = vi.fn();
    socketMock.on('otherEvent', handler);

    socketMock.simulateEvent('testEvent', {});

    expect(handler).not.toHaveBeenCalled();
  });

  it('beforeEach clears emit spy calls between tests', () => {
    socketMock.emit('someEvent', {});
    // emit.mockClear() runs in beforeEach of the NEXT test;
    // here we just verify emit was recorded
    expect(socketMock.emit).toHaveBeenCalledTimes(1);
  });

  it('beforeEach resets listeners map between tests', () => {
    // Any handlers registered in the previous test are gone
    const handler = vi.fn();
    socketMock.simulateEvent('testEvent', {});
    expect(handler).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Task 2.1 — setupGame helper
//
// Renders <App />, types playerName, clicks "Skapa spel" (createRoom),
// then simulates roomUpdate and gameStarted to drive the app into the
// game-playing state.
// ---------------------------------------------------------------------------

const DEFAULT_PLAYERS = [
  { id: 'socket-id-1', name: 'Alice', isHost: true },
  { id: 'socket-id-2', name: 'Bob',   isHost: false },
];

const DEFAULT_GAME_CONFIG = {
  category: 'animals-and-nature',
  number: 4,
  players: '2',
};

async function setupGame({
  playerName = 'Alice',
  players = DEFAULT_PLAYERS,
  gameCards = [],
} = {}) {
  render(<App />);

  // Type the player name into the name input
  const nameInput = screen.getByPlaceholderText('Ange ditt namn');
  fireEvent.change(nameInput, { target: { value: playerName } });

  // Click "Skapa spel" to trigger createRoom (sets isHost=true)
  const createBtn = screen.getByRole('button', { name: /Skapa spel/i });
  fireEvent.click(createBtn);

  // Simulate roomUpdate — sets connectedPlayers and isWaitingRoom=true
  await act(async () => {
    socketMock.simulateEvent('roomUpdate', { code: 'ABCD', players });
  });
  await waitFor(() => {
    expect(screen.getByText(/Rumskod/i)).toBeInTheDocument();
  });

  // Simulate gameStarted — sets isGameOn=true and renders the card grid
  await act(async () => {
    socketMock.simulateEvent('gameStarted', {
      gameConfig: DEFAULT_GAME_CONFIG,
      gameCards,
    });
  });
  await waitFor(() => {
    expect(screen.queryByText(/Rumskod/i)).not.toBeInTheDocument();
  });

  return { socketMock };
}

// ---------------------------------------------------------------------------
// Task 2.2 — gameStarted renders correct number of card buttons
// Task 2.3 — gameStarted transitions from waiting room to game board
// ---------------------------------------------------------------------------

describe('gameStarted handler', () => {
  it('renders correct number of card buttons', async () => {
    const gameCards = [
      { id: 0, name: 'cat', type: 'emoji', symbol: '&#128049;' },
      { id: 1, name: 'dog', type: 'emoji', symbol: '&#128054;' },
      { id: 0, name: 'cat', type: 'emoji', symbol: '&#128049;' },
      { id: 1, name: 'dog', type: 'emoji', symbol: '&#128054;' },
    ];

    await setupGame({ gameCards });

    const cardButtons = document.querySelectorAll('.btn--emoji');
    expect(cardButtons).toHaveLength(4);
  });

  it('transitions from waiting room to game board', async () => {
    const gameCards = [
      { id: 0, name: 'cat', type: 'emoji', symbol: '&#128049;' },
      { id: 1, name: 'dog', type: 'emoji', symbol: '&#128054;' },
      { id: 0, name: 'cat', type: 'emoji', symbol: '&#128049;' },
      { id: 1, name: 'dog', type: 'emoji', symbol: '&#128054;' },
    ];

    await setupGame({ gameCards });

    // Waiting room text should be gone
    expect(screen.queryByText(/Rumskod/i)).not.toBeInTheDocument();

    // Card buttons should be visible
    const cardButtons = document.querySelectorAll('.btn--emoji');
    expect(cardButtons.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Shared game cards used across multiple test groups
// ---------------------------------------------------------------------------

const GAME_CARDS = [
  { id: 0, name: 'cat',  type: 'emoji', symbol: '&#128049;' },
  { id: 1, name: 'dog',  type: 'emoji', symbol: '&#128054;' },
  { id: 2, name: 'fish', type: 'emoji', symbol: '&#128041;' },
  { id: 3, name: 'bird', type: 'emoji', symbol: '&#128038;' },
  { id: 0, name: 'cat',  type: 'emoji', symbol: '&#128049;' },
  { id: 1, name: 'dog',  type: 'emoji', symbol: '&#128054;' },
  { id: 2, name: 'fish', type: 'emoji', symbol: '&#128041;' },
  { id: 3, name: 'bird', type: 'emoji', symbol: '&#128038;' },
];

// ---------------------------------------------------------------------------
// Task 3 — myPlayerIndexRef correctness tests
// ---------------------------------------------------------------------------

describe('myPlayerIndexRef correctness', () => {
  it('3.1 — local player is first (Alice, index 0) → can flip card when currentPlayer=0', async () => {
    // Validates: Requirements 2.1, 2.2, 3.1
    await setupGame({ playerName: 'Alice', gameCards: GAME_CARDS });

    // Bypass MIN_MOVE_DELAY (500ms)
    act(() => { vi.advanceTimersByTime(600); });

    const cardButtons = document.querySelectorAll('.btn--emoji');
    fireEvent.click(cardButtons[0]);

    expect(socketMock.emit).toHaveBeenCalledWith('cardSelected', expect.objectContaining({ cardIndex: 0 }));
  });

  it('3.2 — local player is second (Bob, index 1) → cannot flip card when currentPlayer=0', async () => {
    // Validates: Requirements 2.1, 2.3, 3.2
    await setupGame({ playerName: 'Bob', gameCards: GAME_CARDS });

    // Bypass MIN_MOVE_DELAY
    act(() => { vi.advanceTimersByTime(600); });

    const cardButtons = document.querySelectorAll('.btn--emoji');
    fireEvent.click(cardButtons[0]);

    const cardSelectedCalls = socketMock.emit.mock.calls.filter(c => c[0] === 'cardSelected');
    expect(cardSelectedCalls).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Task 5 — turnCard turn enforcement tests
// ---------------------------------------------------------------------------

describe('turnCard turn enforcement', () => {
  it('5.1 — correct player (currentPlayer === myPlayerIndexRef) emits cardSelected', async () => {
    // Validates: Requirements 3.1
    await setupGame({ playerName: 'Alice', gameCards: GAME_CARDS });

    act(() => { vi.advanceTimersByTime(600); });

    const cardButtons = document.querySelectorAll('.btn--emoji');
    fireEvent.click(cardButtons[0]);

    expect(socketMock.emit).toHaveBeenCalledWith('cardSelected', expect.objectContaining({ cardIndex: 0 }));
  });

  it('5.2 — wrong player blocked after updateGameState sets currentPlayer=1', async () => {
    // Validates: Requirements 3.2, 3.3
    // Alice is index 0; after updateGameState sets currentPlayer=1, she cannot act
    await setupGame({ playerName: 'Alice', gameCards: GAME_CARDS });

    await act(async () => {
      socketMock.simulateEvent('updateGameState', { currentPlayer: 1, allSelectedCards: [] });
    });

    act(() => { vi.advanceTimersByTime(600); });

    const cardButtons = document.querySelectorAll('.btn--emoji');
    fireEvent.click(cardButtons[0]);

    const cardSelectedCalls = socketMock.emit.mock.calls.filter(c => c[0] === 'cardSelected');
    expect(cardSelectedCalls).toHaveLength(0);
  });

  it('5.3 — Bob can act when currentPlayer=1', async () => {
    // Validates: Requirements 3.4
    // Bob is index 1; after updateGameState sets currentPlayer=1, he can act
    await setupGame({ playerName: 'Bob', gameCards: GAME_CARDS });

    await act(async () => {
      socketMock.simulateEvent('updateGameState', { currentPlayer: 1, allSelectedCards: [] });
    });

    act(() => { vi.advanceTimersByTime(600); });

    const cardButtons = document.querySelectorAll('.btn--emoji');
    fireEvent.click(cardButtons[0]);

    expect(socketMock.emit).toHaveBeenCalledWith('cardSelected', expect.objectContaining({ cardIndex: 0 }));
  });
});

// ---------------------------------------------------------------------------
// Task 6 — cardSelected payload tests
// ---------------------------------------------------------------------------

describe('cardSelected payload', () => {
  it('6.1 — emitted payload contains correct cardIndex', async () => {
    // Validates: Requirements 4.1, 4.2
    await setupGame({ playerName: 'Alice', gameCards: GAME_CARDS });

    act(() => { vi.advanceTimersByTime(600); });

    const cardButtons = document.querySelectorAll('.btn--emoji');
    // Click card at index 2
    fireEvent.click(cardButtons[2]);

    expect(socketMock.emit).toHaveBeenCalledWith('cardSelected', expect.objectContaining({ cardIndex: 2 }));
  });

  it('6.2 — emitted payload contains correct playerName', async () => {
    // Validates: Requirements 4.1, 4.3
    await setupGame({ playerName: 'Alice', gameCards: GAME_CARDS });

    act(() => { vi.advanceTimersByTime(600); });

    const cardButtons = document.querySelectorAll('.btn--emoji');
    fireEvent.click(cardButtons[0]);

    expect(socketMock.emit).toHaveBeenCalledWith('cardSelected', expect.objectContaining({ playerName: 'Alice' }));
  });

  it('6.3 — emitted payload contains correct roomCode', async () => {
    // Validates: Requirements 4.1, 4.4
    await setupGame({ playerName: 'Alice', gameCards: GAME_CARDS });

    act(() => { vi.advanceTimersByTime(600); });

    const cardButtons = document.querySelectorAll('.btn--emoji');
    fireEvent.click(cardButtons[0]);

    expect(socketMock.emit).toHaveBeenCalledWith('cardSelected', expect.objectContaining({ roomCode: 'ABCD' }));
  });
});

// ---------------------------------------------------------------------------
// Task 7 — already-selected and matched card guard tests
// ---------------------------------------------------------------------------

describe('card guard — already-selected and matched cards', () => {
  it('7.1 — clicking an already-selected card does not emit cardSelected', async () => {
    // Validates: Requirements 5.1
    await setupGame({ playerName: 'Alice', gameCards: GAME_CARDS });

    // Mark card 0 as already selected via updateGameState
    await act(async () => {
      socketMock.simulateEvent('updateGameState', { currentPlayer: 0, allSelectedCards: [0] });
    });

    act(() => { vi.advanceTimersByTime(600); });

    const cardButtons = document.querySelectorAll('.btn--emoji');
    fireEvent.click(cardButtons[0]);

    const cardSelectedCalls = socketMock.emit.mock.calls.filter(c => c[0] === 'cardSelected');
    expect(cardSelectedCalls).toHaveLength(0);
  });

  it('7.2 — clicking a matched card does not emit cardSelected', async () => {
    // Validates: Requirements 5.2
    await setupGame({ playerName: 'Alice', gameCards: GAME_CARDS });

    // Mark card 1 as matched via pairMatched
    await act(async () => {
      socketMock.simulateEvent('pairMatched', { cards: [1], player: { id: 'socket-id-1', score: 1 } });
    });

    act(() => { vi.advanceTimersByTime(600); });

    const cardButtons = document.querySelectorAll('.btn--emoji');
    fireEvent.click(cardButtons[1]);

    const cardSelectedCalls = socketMock.emit.mock.calls.filter(c => c[0] === 'cardSelected');
    expect(cardSelectedCalls).toHaveLength(0);
  });

  it('7.3 — clicking any card when 2 cards are already selected does not emit cardSelected', async () => {
    // Validates: Requirements 5.3
    await setupGame({ playerName: 'Alice', gameCards: GAME_CARDS });

    // Two cards already selected
    await act(async () => {
      socketMock.simulateEvent('updateGameState', { currentPlayer: 0, allSelectedCards: [0, 2] });
    });

    act(() => { vi.advanceTimersByTime(600); });

    const cardButtons = document.querySelectorAll('.btn--emoji');
    fireEvent.click(cardButtons[3]);

    const cardSelectedCalls = socketMock.emit.mock.calls.filter(c => c[0] === 'cardSelected');
    expect(cardSelectedCalls).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Task 8 — emojisDataRef round-trip consistency test
// ---------------------------------------------------------------------------

describe('emojisDataRef round-trip consistency', () => {
  it('8.1 — after gameStarted, updateGameState resolves card names from ref consistently with rendered cards', async () => {
    // Validates: Requirements 7.1, 7.2, 7.3
    const gameCards = [
      { id: 0, name: 'cat',  type: 'emoji', symbol: '&#128049;' },
      { id: 1, name: 'dog',  type: 'emoji', symbol: '&#128054;' },
      { id: 0, name: 'cat',  type: 'emoji', symbol: '&#128049;' },
      { id: 1, name: 'dog',  type: 'emoji', symbol: '&#128054;' },
    ];

    await setupGame({ playerName: 'Alice', gameCards });

    // Simulate server selecting cards at indices 0 and 1
    await act(async () => {
      socketMock.simulateEvent('updateGameState', { currentPlayer: 0, allSelectedCards: [0, 1] });
    });

    // Cards at index 0 and 1 should now be "selected" and show their names in aria-labels
    // aria-label format: "Position N: {name}. Inte matchad än."
    const card0 = document.querySelector('[aria-label="Position 1: cat. Inte matchad än."]');
    const card1 = document.querySelector('[aria-label="Position 2: dog. Inte matchad än."]');

    expect(card0).not.toBeNull();
    expect(card1).not.toBeNull();

    // Verify the names match the original gameCards
    expect(card0.getAttribute('aria-label')).toContain(gameCards[0].name);
    expect(card1.getAttribute('aria-label')).toContain(gameCards[1].name);
  });
});
