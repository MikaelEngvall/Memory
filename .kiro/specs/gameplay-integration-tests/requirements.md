# Requirements Document

## Introduction

This feature adds integration tests for the multiplayer Memory game's gameplay logic. The tests target known bug categories: stale closure bugs in socket event handlers (e.g. `myPlayerIndexRef` not being set when `gameStarted` fires), stale ref bugs in `turnCard` (e.g. `connectedPlayersRef` not reflecting current players), turn enforcement (correct player can flip, wrong player is blocked), and correct socket event emission (`cardSelected`). Tests use Vitest, @testing-library/react, and a mocked socket.io-client.

## Glossary

- **App**: The main React component (`App.jsx`) containing all socket logic and game state.
- **Socket**: The mocked `socket.io-client` instance used in tests.
- **turnCard**: The function in `App` that validates turn ownership and emits `cardSelected`.
- **myPlayerIndexRef**: A React ref in `App` that stores the local player's index in the `connectedPlayers` array.
- **connectedPlayersRef**: A React ref in `App` that stores the current list of connected players.
- **gameStarted**: A socket event emitted by the server to start the game, carrying `gameConfig` and `gameCards`.
- **cardSelected**: A socket event emitted by the client when a player flips a card.
- **currentPlayer**: State in `App` tracking whose turn it is (index into `connectedPlayers`).
- **Test_Suite**: The Vitest integration test file `gameplay-integration-tests.test.jsx`.
- **Socket_Mock**: The vi.mock of `socket.io-client` that captures emitted events and exposes a `simulateEvent` helper.

---

## Requirements

### Requirement 1: Socket Mock Infrastructure

**User Story:** As a test author, I want a reliable socket mock, so that I can simulate server events and assert on client emissions without a real server.

#### Acceptance Criteria

1. THE Test_Suite SHALL mock `socket.io-client` using `vi.mock` so that `io()` returns a controllable fake socket object.
2. THE Socket_Mock SHALL expose an `emit` spy that records all events and payloads emitted by the client.
3. THE Socket_Mock SHALL expose a `simulateEvent(event, payload)` helper that triggers registered `socket.on` listeners synchronously.
4. WHEN a test calls `simulateEvent`, THE Socket_Mock SHALL invoke all handlers registered for that event with the given payload.
5. THE Test_Suite SHALL reset all spies and listener registrations between tests using `beforeEach`/`afterEach` hooks.

---

### Requirement 2: gameStarted Handler Sets myPlayerIndexRef Correctly

**User Story:** As a developer, I want a test that catches the stale-closure bug where `myPlayerIndexRef` is not set correctly when `gameStarted` fires, so that I can verify the fix works.

#### Acceptance Criteria

1. WHEN `gameStarted` is simulated after two players have joined, THE App SHALL set `myPlayerIndexRef.current` to the index of the local player within `connectedPlayers`.
2. WHEN the local player is the first player in `connectedPlayers`, THE App SHALL set `myPlayerIndexRef.current` to `0`.
3. WHEN the local player is the second player in `connectedPlayers`, THE App SHALL set `myPlayerIndexRef.current` to `1`.
4. IF `gameStarted` fires before `connectedPlayers` state is populated, THEN THE App SHALL NOT set `myPlayerIndexRef.current` to a value other than `-1`.
5. THE Test_Suite SHALL assert `myPlayerIndexRef.current` by accessing the ref through a test-exposed mechanism (e.g. a `data-testid` attribute or a wrapper component).

---

### Requirement 3: turnCard Enforces Turn Ownership

**User Story:** As a developer, I want tests that verify only the current player can flip cards, so that I can catch bugs where stale refs allow the wrong player to act.

#### Acceptance Criteria

1. WHEN `currentPlayer` is `0` and `myPlayerIndexRef.current` is `0`, THE App SHALL emit `cardSelected` when a card button is clicked.
2. WHEN `currentPlayer` is `1` and `myPlayerIndexRef.current` is `0`, THE App SHALL NOT emit `cardSelected` when a card button is clicked.
3. WHEN `currentPlayer` is `0` and `myPlayerIndexRef.current` is `1`, THE App SHALL NOT emit `cardSelected` when a card button is clicked.
4. WHEN `currentPlayer` is `1` and `myPlayerIndexRef.current` is `1`, THE App SHALL emit `cardSelected` when a card button is clicked.
5. THE Test_Suite SHALL verify turn blocking by asserting that `socket.emit` was NOT called with `'cardSelected'` after a blocked click.

---

### Requirement 4: cardSelected Emission Payload

**User Story:** As a developer, I want tests that verify the `cardSelected` event is emitted with the correct payload, so that the server receives the right data.

#### Acceptance Criteria

1. WHEN a valid card click occurs on the correct player's turn, THE App SHALL emit `cardSelected` with `{ roomCode, cardIndex, playerName }`.
2. THE Test_Suite SHALL assert that `cardIndex` in the emitted payload matches the index of the clicked card in the grid.
3. THE Test_Suite SHALL assert that `playerName` in the emitted payload matches the local player's name.
4. THE Test_Suite SHALL assert that `roomCode` in the emitted payload matches the room code set during room join.

---

### Requirement 5: turnCard Ignores Already-Selected and Matched Cards

**User Story:** As a developer, I want tests that verify clicking an already-selected or matched card does nothing, so that double-flip bugs are caught.

#### Acceptance Criteria

1. WHEN a card at index `i` is already in `selectedCards`, THE App SHALL NOT emit `cardSelected` for index `i` when that card is clicked again.
2. WHEN a card at index `i` is already in `matchedCards`, THE App SHALL NOT emit `cardSelected` for index `i` when that card is clicked again.
3. WHEN `selectedCards` already contains 2 cards, THE App SHALL NOT emit `cardSelected` for any additional card click.

---

### Requirement 6: gameStarted Handler Initialises Game State

**User Story:** As a developer, I want a test that verifies `gameStarted` correctly initialises all game state, so that the board renders with the right cards.

#### Acceptance Criteria

1. WHEN `gameStarted` is simulated with `gameCards` containing N card objects, THE App SHALL render exactly N card buttons in the DOM.
2. WHEN `gameStarted` is simulated, THE App SHALL set `currentPlayer` to `0`.
3. WHEN `gameStarted` is simulated, THE App SHALL clear `selectedCards` and `matchedCards` to empty arrays.
4. WHEN `gameStarted` is simulated, THE App SHALL transition from the waiting room view to the game board view.

---

### Requirement 7: Round-Trip Consistency of emojisDataRef

**User Story:** As a developer, I want a test that verifies `emojisDataRef` and `emojisData` state are consistent after `gameStarted`, so that card lookups by index never return stale data.

#### Acceptance Criteria

1. WHEN `gameStarted` is simulated, THE App SHALL set `emojisDataRef.current` to the same processed card array as `emojisData` state.
2. FOR ALL card indices in the processed array, THE App SHALL resolve the same card object from both `emojisDataRef.current[index]` and the rendered card at that position.
3. THE Test_Suite SHALL verify this by simulating an `updateGameState` event after `gameStarted` and asserting that the card names resolved from the ref match the rendered card names.
