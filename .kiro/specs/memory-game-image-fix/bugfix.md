# Bugfix Requirements Document

## Introduction

The memory card game supports image-based categories (Pokemon, Dogs, Rick & Morty) where each card should display an image when flipped. Currently, images never appear on flipped cards for these categories. The root cause is a duplicate game-start path: `handleStartGame` emits `startGame` to the server without the fetched `cards` payload, so the server receives no card data and throws an error or sends back cards without the `image` and `type` fields. Additionally, the overall UI lacks visual polish and consistency.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a player selects an image-based category (Pokemon, Dogs, or Rick & Morty) and starts the game THEN the system shows a blank or missing image on flipped cards instead of the fetched image.

1.2 WHEN `handleStartGame` is called (the unused but present duplicate emitter) THEN the system emits `startGame` to the server without a `cards` payload, causing the server to throw and emit `gameError` instead of starting the game.

1.3 WHEN the server receives a `startGame` event with a valid `cards` array THEN the system passes the cards through unchanged, but the `gameStarted` handler in the client spreads `...card` correctly — meaning the bug is isolated to the missing `cards` payload from the duplicate emitter path.

1.4 WHEN the game board is displayed THEN the system renders UI elements (menu, room lobby, game status, cards) without consistent spacing, color contrast, or responsive layout, resulting in a visually inconsistent experience.

### Expected Behavior (Correct)

2.1 WHEN a player selects an image-based category and starts the game THEN the system SHALL display the correct fetched image on each card when it is flipped or matched.

2.2 WHEN the host submits the game configuration form THEN the system SHALL use only the `startGame` path that fetches card data first and emits the full `cards` payload to the server.

2.3 WHEN the server emits `gameStarted` with cards that have `type: 'image'` and an `image` URL THEN the system SHALL preserve both fields in `processedCards` so `EmojiButton` can render the `<img>` element.

2.4 WHEN the game UI is displayed THEN the system SHALL render a visually consistent layout with clear typography, adequate spacing, readable color contrast, and a responsive card grid.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a player selects an emoji-based category (e.g., animals-and-nature, food-and-drink) THEN the system SHALL CONTINUE TO display the decoded emoji symbol on flipped cards.

3.2 WHEN two cards with the same name are flipped THEN the system SHALL CONTINUE TO mark them as matched and increment the current player's score.

3.3 WHEN two cards with different names are flipped THEN the system SHALL CONTINUE TO flip them back and advance to the next player's turn.

3.4 WHEN all card pairs are matched THEN the system SHALL CONTINUE TO trigger the game-over state and display final scores.

3.5 WHEN a non-host player is in the room THEN the system SHALL CONTINUE TO prevent them from starting the game and show a waiting message.

3.6 WHEN a player disconnects mid-game THEN the system SHALL CONTINUE TO reassign the host role and update the room state for remaining players.
