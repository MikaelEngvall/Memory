# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Image Cards Missing on Flip
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases: image-type cards (pokemon/dogs/rickandmorty) with valid `image` URLs
  - Test that `EmojiButton` renders `<img src={url}>` when given `{ type: 'image', image: 'https://example.com/pikachu.png', name: 'pikachu' }` and `selectedCardEntry=true`
  - Test that `processedCards` mapping in the `gameStarted` handler preserves both `type` and `image` fields for image-type cards
  - Test that `handleStartGame` emits `startGame` without a `cards` field (confirms the broken path exists)
  - Run test on UNFIXED code — `EmojiButton` will render `"?"` or emoji fallback instead of `<img>` because `type`/`image` may be missing from `processedCards`
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., `EmojiButton` renders `"?"` instead of `<img>` when `processedCards` strips `image` field)
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Emoji Category Cards Unaffected
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: `EmojiButton` with `{ type: 'emoji', symbol: '&#128049;', name: 'cat' }` and `selectedCardEntry=true` renders the decoded emoji symbol on unfixed code
  - Observe: `EmojiButton` with an empty/whitespace symbol falls back to rendering the `emoji-name` span on unfixed code
  - Observe: `EmojiButton` with `selectedCardEntry=false` and `matchedCardEntry=false` renders `"?"` on unfixed code
  - Write property-based test: for all cards with `type: 'emoji'` and a valid `symbol`, the rendered output is identical before and after the fix
  - Write property-based test: for all cards where `selectedCardEntry` and `matchedCardEntry` are both falsy, `"?"` is rendered regardless of card type
  - Verify tests PASS on UNFIXED code (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Fix image cards not rendering on flip

  - [x] 3.1 Remove `handleStartGame` dead function from `App.jsx`
    - Delete the `handleStartGame` function (lines that define `function handleStartGame(e) { e.preventDefault(); socket.emit('startGame', { roomCode, gameConfig: formData }) }`)
    - This eliminates the broken code path that emits `startGame` without a `cards` payload
    - Confirm no JSX in `App.jsx` references `handleStartGame` (it is already unused per linter warnings)
    - _Bug_Condition: isBugCondition(input) where input.cards IS undefined — triggered when handleStartGame fires instead of startGame_
    - _Expected_Behavior: host form submission always routes through `startGame`, which fetches card data and emits full `cards` payload_
    - _Preservation: emoji-category game start, card flip, score tracking, room management all unaffected_
    - _Requirements: 2.2_

  - [x] 3.2 Explicitly preserve `image` field in `processedCards` mapping in `App.jsx`
    - In the `gameStarted` socket handler, update the `processedCards` mapping to explicitly include `image: card.image`
    - Change: `{ ...card, id: index, type: card.type }` → `{ ...card, id: index, type: card.type, image: card.image }`
    - This makes the field preservation explicit and resilient to future refactors
    - _Bug_Condition: isBugCondition(input) where processedCards strips image field — EmojiButton receives undefined image_
    - _Expected_Behavior: processedCard.type === 'image' AND processedCard.image === card.image for all image-type cards_
    - _Preservation: emoji-type cards unaffected — their `symbol` field is preserved via `...card` spread_
    - _Requirements: 2.3_

  - [x] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Image Cards Render Correctly on Flip
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior: `EmojiButton` renders `<img src={url}>` for image-type cards
    - When this test passes, it confirms `processedCards` preserves `type` and `image`, and `EmojiButton` renders the image
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.3_

  - [x] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Emoji Category Cards Unaffected
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions in emoji rendering, match/mismatch logic, and unflipped card behavior)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
