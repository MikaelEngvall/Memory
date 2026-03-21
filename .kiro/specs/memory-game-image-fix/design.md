# Memory Game Image Fix - Bugfix Design

## Overview

Image-based memory card categories (Pokemon, Dogs, Rick & Morty) never display images on flipped cards. The root cause is a duplicate game-start code path: `handleStartGame` in `App.jsx` emits `startGame` to the server without the fetched `cards` payload. When this path is triggered, the server receives no card data, throws an error, and the game either fails to start or starts with cards missing `type` and `image` fields — so `EmojiButton` never renders the `<img>` element.

The fix is minimal: remove the dead `handleStartGame` function and ensure the `Form` component's submit handler always routes through `startGame` (which fetches card data first and emits the full payload). A secondary fix ensures `processedCards` in the `gameStarted` socket handler preserves `type` and `image` fields.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — a game is started via the path that emits `startGame` without a `cards` payload, OR `processedCards` strips `type`/`image` fields from image-type cards
- **Property (P)**: The desired behavior — flipped cards with `type: 'image'` render an `<img>` element with the correct `src`
- **Preservation**: Existing emoji-category behavior, match/mismatch logic, score tracking, and multiplayer room management that must remain unchanged
- **handleStartGame**: The dead/duplicate function in `App.jsx` that emits `startGame` without fetched card data — the primary defect site
- **startGame**: The correct async function in `App.jsx` that fetches card data first, then emits `startGame` with the full `cards` payload
- **processedCards**: The mapped card array built inside the `gameStarted` socket handler in `App.jsx` — must preserve `type` and `image` fields
- **EmojiButton**: The component in `components/EmojiButton.jsx` that conditionally renders `<img>` when `emoji.type === 'image'`

## Bug Details

### Bug Condition

The bug manifests when a player selects an image-based category (Pokemon, Dogs, or Rick & Morty) and the game start event reaches the server without a valid `cards` array. The server's `startGame` handler validates `cards` with `if (!cards || !Array.isArray(cards))` and throws, emitting `gameError` back to the client. Even if cards do arrive, if `processedCards` mapping omits `type` and `image`, `EmojiButton` falls through to the emoji rendering branch and shows nothing meaningful.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { category: string, cards: any, processedCards: object[] }
  OUTPUT: boolean

  RETURN (input.category IN ['pokemon', 'dogs', 'rickandmorty'])
         AND (
           input.cards IS undefined OR NOT Array.isArray(input.cards)
           OR input.processedCards.some(c => c.type IS undefined OR c.image IS undefined)
         )
END FUNCTION
```

### Examples

- Player selects "Pokemon", host clicks start → `handleStartGame` fires → server receives `{ roomCode, gameConfig }` with no `cards` → server throws → `gameError` emitted → `isError` set to true. Expected: game starts with Pokemon images on cards.
- Player selects "Dogs", game starts via correct path but `processedCards` mapping drops `image` field → `EmojiButton` receives `emoji.type = undefined` → renders `"?"` on flip. Expected: dog photo renders on flip.
- Player selects "animals-and-nature" (emoji category) → no bug condition, emoji symbol renders correctly. This case must be preserved.
- Player selects "Rick & Morty", 5 pairs → 10 cards emitted with `type: 'image'` and `image` URLs → all 10 cards should show character images when flipped.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Emoji-category cards (animals-and-nature, food-and-drink, etc.) must continue to display decoded emoji symbols on flip
- Matching two cards with the same name must continue to increment the current player's score
- Mismatching two cards must continue to flip them back and advance to the next player
- All pairs matched must continue to trigger the game-over state with final scores
- Non-host players must continue to be blocked from starting the game
- Player disconnect must continue to reassign host and update room state

**Scope:**
All inputs that do NOT involve image-based categories starting via the broken path are unaffected. This includes:
- Any emoji-category game start (correct path already works)
- Card flip interactions (mouse clicks on cards)
- Score tracking and turn management
- Room creation, joining, and disconnect handling

## Hypothesized Root Cause

Based on code analysis of `App.jsx`:

1. **Dead duplicate emitter (`handleStartGame`)**: Lines define `handleStartGame` which calls `socket.emit('startGame', { roomCode, gameConfig })` — no `cards` field. If the `Form` component's `onSubmit` is wired to this instead of `startGame`, the server never receives card data. The function is flagged as unused by the linter, suggesting it was accidentally left in and may have been wired at some point.

2. **`processedCards` field omission**: Inside the `gameStarted` socket handler, `processedCards` is built with `{ ...card, id: index, type: card.type }`. While `type` is explicitly copied, `image` is only preserved via the spread `...card`. If the spread order or a future refactor drops `image`, the field is lost. The explicit copy of `type` but not `image` is inconsistent and fragile.

3. **Form submit handler wiring**: The `Form` component receives `handleSubmit={startGame}` in the waiting room — this is correct. However, `handleStartGame` exists as a potential alternative wiring point that bypasses card fetching entirely.

4. **No server-side image field validation**: The server stores and re-emits cards as-is without validating that image-type cards have an `image` field, so a malformed payload propagates silently.

## Correctness Properties

Property 1: Bug Condition - Image Cards Render Correctly on Flip

_For any_ game started with an image-based category (Pokemon, Dogs, Rick & Morty) where the bug condition holds (cards emitted to server have valid `type: 'image'` and `image` URL fields), the fixed `EmojiButton` component SHALL render an `<img>` element with `src` equal to the card's `image` URL when the card is flipped or matched.

**Validates: Requirements 2.1, 2.3**

Property 2: Preservation - Emoji Category Cards Unaffected

_For any_ game started with an emoji-based category where the bug condition does NOT hold (cards have `type: 'emoji'` and `symbol` fields), the fixed code SHALL produce exactly the same rendered output as the original code — displaying the decoded emoji symbol or emoji name, not an `<img>` element.

**Validates: Requirements 3.1**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `App.jsx`

**Specific Changes**:

1. **Remove `handleStartGame`**: Delete the dead `handleStartGame` function entirely. It emits `startGame` without `cards` and is already flagged as unused. This eliminates the broken code path.

2. **Verify `Form` submit wiring**: Confirm `Form` receives `handleSubmit={startGame}` (already correct in the waiting room block). No change needed here, but verify no other render path wires `handleStartGame`.

3. **Explicit `image` field in `processedCards`**: In the `gameStarted` socket handler, update the mapping to explicitly include `image`:
   ```js
   const processedCards = gameCards.map((card, index) => ({
     ...card,
     id: index,
     type: card.type,
     image: card.image  // explicit preservation
   }));
   ```

**File**: `components/EmojiButton.jsx`

4. **No changes required**: `EmojiButton` already correctly checks `emoji.type === 'image'` and renders `<img src={emoji.image} />`. The component logic is correct — it just never receives valid data due to the upstream bug.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write unit tests that render `EmojiButton` with image-type card data (simulating what `processedCards` produces today) and assert that an `<img>` element is rendered. Run these on the UNFIXED code to observe failures and confirm the root cause.

**Test Cases**:
1. **Image card renders `<img>` on flip**: Render `EmojiButton` with `{ type: 'image', image: 'https://example.com/pikachu.png', name: 'pikachu' }`, `selectedCardEntry=true` — assert `<img src="https://example.com/pikachu.png">` is present (will fail if `type`/`image` fields are missing from processedCards)
2. **processedCards preserves image field**: Simulate the `gameStarted` handler mapping with a card that has `type: 'image'` and `image: 'url'` — assert the mapped card retains both fields (will fail if mapping strips them)
3. **handleStartGame emits without cards**: Call `handleStartGame` and capture the socket emission — assert the emitted payload has no `cards` field (confirms the broken path)
4. **Server rejects no-cards payload**: Send a `startGame` event to the server without `cards` — assert server emits `gameError` (confirms server-side validation catches it)

**Expected Counterexamples**:
- `EmojiButton` renders `"?"` instead of `<img>` when `type` is undefined
- `processedCards` mapping produces cards without `image` field
- Possible causes: `handleStartGame` wired as submit handler, `processedCards` spread not preserving `image`

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL card WHERE isBugCondition({ category: 'pokemon'|'dogs'|'rickandmorty', card }) DO
  processedCard := processedCards_fixed(card)
  ASSERT processedCard.type === 'image'
  ASSERT processedCard.image === card.image
  
  rendered := render(EmojiButton, { emoji: processedCard, selectedCardEntry: true })
  ASSERT rendered contains <img src={card.image}>
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL card WHERE NOT isBugCondition({ category: 'emoji', card }) DO
  rendered_original := render(EmojiButton_original, { emoji: card, selectedCardEntry: true })
  rendered_fixed    := render(EmojiButton_fixed,    { emoji: card, selectedCardEntry: true })
  ASSERT rendered_original = rendered_fixed
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many emoji card configurations automatically
- It catches edge cases like empty symbols, unusual HTML entities, or long emoji names
- It provides strong guarantees that emoji rendering is unchanged across all non-buggy inputs

**Test Plan**: Observe emoji rendering behavior on UNFIXED code first, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Emoji symbol preservation**: For any card with `type: 'emoji'` and a valid `symbol`, verify the decoded symbol renders the same before and after the fix
2. **Emoji name fallback preservation**: For any card with `type: 'emoji'` and an empty/whitespace symbol, verify the `emoji-name` span renders the same before and after the fix
3. **Unflipped card preservation**: For any card where `selectedCardEntry` and `matchedCardEntry` are both falsy, verify `"?"` renders the same before and after the fix
4. **Score/match logic preservation**: Verify that matching two cards with the same name still increments score and adds to `matchedCards`

### Unit Tests

- Test `EmojiButton` renders `<img>` with correct `src` when `type === 'image'` and card is flipped
- Test `EmojiButton` renders emoji symbol when `type === 'emoji'` and card is flipped
- Test `EmojiButton` renders `"?"` when card is not flipped (neither selected nor matched)
- Test `processedCards` mapping preserves `type` and `image` fields for image-type cards
- Test that `startGame` (the correct path) emits a `cards` array to the server

### Property-Based Tests

- Generate random image-type cards (random name, random image URL) and verify `EmojiButton` always renders `<img src={url}>` when flipped — Property 1
- Generate random emoji-type cards (random symbol, random name) and verify `EmojiButton` renders the same output before and after the fix — Property 2
- Generate random mixed card arrays and verify `processedCards` mapping never drops `type` or `image` fields that were present in the input

### Integration Tests

- Full game flow: select Pokemon category → start game → flip two cards → verify images appear
- Full game flow: select animals-and-nature → start game → flip two cards → verify emoji symbols appear (regression)
- Match flow: flip two matching image cards → verify they stay flipped with images visible and score increments
- Mismatch flow: flip two non-matching image cards → verify they flip back after timeout
