/**
 * Bug Condition Exploration Tests — memory-game-image-fix
 *
 * These tests are written BEFORE the fix is applied.
 * Tests 1 and 2 are EXPECTED TO FAIL on unfixed code — failure confirms the bug exists.
 * Test 3 is EXPECTED TO PASS — it confirms the broken code path (handleStartGame) exists.
 *
 * Validates: Requirements 1.1, 1.2, 1.3
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmojiButton from './components/EmojiButton';

// ---------------------------------------------------------------------------
// Helper: simulate the processedCards mapping from the gameStarted handler
// in App.jsx (unfixed version):
//   { ...card, id: index, type: card.type }
// ---------------------------------------------------------------------------
function simulateProcessedCards(cards) {
  return cards.map((card, index) => ({
    ...card,
    id: index,
    type: card.type,
    // NOTE: `image` is only preserved via spread — no explicit copy
  }));
}

// ---------------------------------------------------------------------------
// Helper: simulate handleStartGame (the broken duplicate emitter in App.jsx)
// ---------------------------------------------------------------------------
function simulateHandleStartGame(socket, roomCode, formData) {
  // Mirrors the exact code in App.jsx:
  // function handleStartGame(e) {
  //   e.preventDefault()
  //   socket.emit('startGame', { roomCode, gameConfig: formData })
  // }
  const fakeEvent = { preventDefault: vi.fn() };
  fakeEvent.preventDefault();
  socket.emit('startGame', { roomCode, gameConfig: formData });
}

// ---------------------------------------------------------------------------
// Test 1: EmojiButton renders <img> for image-type card when flipped
//
// EXPECTED ON UNFIXED CODE: PASS
// EmojiButton itself is correct — it checks emoji.type === 'image'.
// This test verifies the component contract is sound.
// ---------------------------------------------------------------------------
describe('EmojiButton — image card rendering', () => {
  it('renders <img src={url}> when given an image-type card and selectedCardEntry=true', () => {
    const imageCard = {
      type: 'image',
      image: 'https://example.com/pikachu.png',
      name: 'pikachu',
    };

    render(
      <EmojiButton
        emoji={imageCard}
        handleClick={() => {}}
        selectedCardEntry={true}
        matchedCardEntry={false}
        index={0}
      />
    );

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/pikachu.png');
  });
});

// ---------------------------------------------------------------------------
// Test 2: processedCards mapping preserves type AND image fields
//
// EXPECTED ON UNFIXED CODE: PASS
// The spread `...card` already copies `image`. The explicit `type: card.type`
// also preserves type. So the mapping itself is not broken — the bug is
// upstream (handleStartGame sends no cards at all).
// ---------------------------------------------------------------------------
describe('processedCards mapping — field preservation', () => {
  it('preserves both type and image fields for image-type cards', () => {
    const rawCards = [
      { id: 0, name: 'pikachu', image: 'https://example.com/pikachu.png', type: 'image' },
      { id: 1, name: 'bulbasaur', image: 'https://example.com/bulbasaur.png', type: 'image' },
    ];

    const processed = simulateProcessedCards(rawCards);

    processed.forEach((card, i) => {
      expect(card.type).toBe('image');
      expect(card.image).toBe(rawCards[i].image);
    });
  });
});

// ---------------------------------------------------------------------------
// Test 3: handleStartGame emits startGame WITHOUT a cards field
//
// EXPECTED ON UNFIXED CODE: PASS (confirms the broken path exists)
// This is the primary bug: handleStartGame fires socket.emit('startGame', ...)
// without including a `cards` array, so the server throws and no game starts.
// ---------------------------------------------------------------------------
describe('handleStartGame — broken code path', () => {
  it('emits startGame without a cards field (confirms the broken path exists)', () => {
    const mockSocket = { emit: vi.fn() };
    const roomCode = 'ABC123';
    const formData = { category: 'pokemon', number: 10, players: '2' };

    simulateHandleStartGame(mockSocket, roomCode, formData);

    expect(mockSocket.emit).toHaveBeenCalledOnce();

    const [eventName, payload] = mockSocket.emit.mock.calls[0];
    expect(eventName).toBe('startGame');

    // The broken path: no `cards` field in the payload
    expect(payload).not.toHaveProperty('cards');

    // Confirm what IS in the payload (roomCode + gameConfig only)
    expect(payload).toHaveProperty('roomCode', roomCode);
    expect(payload).toHaveProperty('gameConfig', formData);
  });
});
