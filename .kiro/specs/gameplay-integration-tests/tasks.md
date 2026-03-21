# Implementation Plan: gameplay-integration-tests

## Overview

Implement `gameplay-integration-tests.test.jsx` at the workspace root. The file tests `App.jsx`'s socket event handling, turn enforcement, and ref consistency using Vitest, @testing-library/react, and a `vi.mock` of `socket.io-client`.

## Tasks

- [x] 1. Set up socket mock infrastructure
  - Create `gameplay-integration-tests.test.jsx` at the workspace root
  - Implement `vi.mock('socket.io-client', ...)` factory that returns a fake socket with `on`, `off`, `emit` (vi.spy), and `simulateEvent(event, payload)` helpers
  - Store registered handlers in a `listeners` map; `simulateEvent` invokes all handlers for the given event synchronously
  - Add `beforeEach` that clears `emit` spy calls and resets the `listeners` map between tests
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implement `gameStarted` handler tests
  - [x] 2.1 Write helper `setupGame({ playerName, players, gameCards })` that renders `<App />`, simulates `roomUpdate` then `gameStarted`, and returns `{ socketMock }`
    - Use `act` + `waitFor` to flush React state updates after each simulated event
    - _Requirements: 2.1, 6.1, 6.2, 6.3, 6.4_

  - [x] 2.2 Write test: `gameStarted` renders correct number of card buttons
    - Simulate `gameStarted` with 4 `gameCards`; assert `screen.getAllByRole('button')` contains exactly 4 card buttons
    - _Requirements: 6.1_

  - [x] 2.3 Write test: `gameStarted` transitions from waiting room to game board
    - Assert waiting-room element is gone and game board is visible after `gameStarted`
    - _Requirements: 6.4_

  - [ ]* 2.4 Write property test for `gameStarted` card count
    - **Property 1: Card count matches gameCards length**
    - **Validates: Requirements 6.1**
    - Iterate over representative card counts (2, 4, 6, 8) and assert rendered card buttons equal the count each time

- [x] 3. Implement `myPlayerIndexRef` correctness tests
  - [x] 3.1 Write test: local player is first in `connectedPlayers` → `myPlayerIndexRef` is `0` (verified via turn enforcement)
    - Set `playerName` to `'Alice'` (index 0); simulate `gameStarted`; click card 0; assert `socket.emit` was called with `'cardSelected'`
    - _Requirements: 2.1, 2.2, 3.1_

  - [x] 3.2 Write test: local player is second in `connectedPlayers` → `myPlayerIndexRef` is `1` (verified via turn enforcement)
    - Set `playerName` to `'Bob'` (index 1); simulate `gameStarted` (currentPlayer starts at 0); click card 0; assert `socket.emit` was NOT called with `'cardSelected'`
    - _Requirements: 2.1, 2.3, 3.2_

  - [ ]* 3.3 Write property test for `myPlayerIndexRef` assignment
    - **Property 2: myPlayerIndexRef equals findIndex of local player in connectedPlayers**
    - **Validates: Requirements 2.1, 2.2, 2.3**
    - For each player position (index 0 and index 1), verify turn enforcement matches the expected index

- [x] 4. Checkpoint — Ensure all tests pass so far
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement `turnCard` turn enforcement tests
  - [x] 5.1 Write test: correct player (currentPlayer === myPlayerIndexRef) emits `cardSelected`
    - `playerName = 'Alice'` (index 0), `currentPlayer = 0`; click card; assert `socket.emit` called with `'cardSelected'`
    - _Requirements: 3.1_

  - [x] 5.2 Write test: wrong player (currentPlayer !== myPlayerIndexRef) does NOT emit `cardSelected`
    - `playerName = 'Alice'` (index 0), simulate `updateGameState` to set `currentPlayer = 1`; click card; assert `socket.emit` NOT called with `'cardSelected'`
    - _Requirements: 3.2, 3.3_

  - [x] 5.3 Write test: player 1 can act when it is their turn
    - `playerName = 'Bob'` (index 1), simulate `updateGameState` to set `currentPlayer = 1`; click card; assert `socket.emit` called with `'cardSelected'`
    - _Requirements: 3.4_

  - [ ]* 5.4 Write property test for turn enforcement
    - **Property 3: cardSelected is emitted iff currentPlayer === myPlayerIndexRef.current**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
    - Iterate over all (currentPlayer, myPlayerIndex) combinations for a 2-player game and assert emit/no-emit accordingly

- [x] 6. Implement `cardSelected` payload tests
  - [x] 6.1 Write test: emitted payload contains correct `cardIndex`
    - Click card at grid index 2; assert `socket.emit` was called with `'cardSelected'` and `{ cardIndex: 2, ... }`
    - _Requirements: 4.1, 4.2_

  - [x] 6.2 Write test: emitted payload contains correct `playerName`
    - Assert `playerName` in payload matches the name used during `roomUpdate`
    - _Requirements: 4.1, 4.3_

  - [x] 6.3 Write test: emitted payload contains correct `roomCode`
    - Assert `roomCode` in payload matches the code from `roomUpdate`
    - _Requirements: 4.1, 4.4_

  - [ ]* 6.4 Write property test for `cardSelected` payload shape
    - **Property 4: cardSelected payload always contains { roomCode, cardIndex, playerName }**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
    - Iterate over several card indices and assert all three fields are present and correct

- [x] 7. Implement already-selected and matched card guard tests
  - [x] 7.1 Write test: clicking an already-selected card does not emit `cardSelected`
    - Simulate `updateGameState` with `allSelectedCards: [0]`; click card 0; assert `socket.emit` NOT called with `'cardSelected'`
    - _Requirements: 5.1_

  - [x] 7.2 Write test: clicking a matched card does not emit `cardSelected`
    - Simulate `pairMatched` with `cards: [1]`; click card 1; assert `socket.emit` NOT called with `'cardSelected'`
    - _Requirements: 5.2_

  - [x] 7.3 Write test: clicking any card when 2 cards are already selected does not emit `cardSelected`
    - Simulate `updateGameState` with `allSelectedCards: [0, 2]`; click card 3; assert `socket.emit` NOT called with `'cardSelected'`
    - _Requirements: 5.3_

  - [ ]* 7.4 Write property test for card guard
    - **Property 5: turnCard never emits cardSelected for already-selected or matched cards**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 8. Implement `emojisDataRef` round-trip consistency test
  - [x] 8.1 Write test: after `gameStarted`, simulating `updateGameState` resolves card names from the ref consistently with rendered cards
    - Simulate `updateGameState` with `allSelectedCards: [0, 1]`; assert the selected card names visible in the DOM match `gameCards[0].name` and `gameCards[1].name`
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 8.2 Write property test for `emojisDataRef` round-trip
    - **Property 6: emojisDataRef.current[i].name equals rendered card name at index i for all i**
    - **Validates: Requirements 7.1, 7.2, 7.3**
    - Iterate over all card indices and verify ref-resolved name matches DOM-rendered name after `updateGameState`

- [x] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The `setupGame` helper (task 2.1) is shared across all test groups — implement it first
- `simulateEvent` must be called inside `act(...)` to flush React state updates
- The `MIN_MOVE_DELAY` guard in `turnCard` uses `Date.now()`; tests may need `vi.useFakeTimers()` or a small `await` between clicks to avoid the 500ms debounce
- Property tests use `it.each` over representative input sets rather than a PBT library
