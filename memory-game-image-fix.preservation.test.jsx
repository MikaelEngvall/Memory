/**
 * Preservation Property Tests — memory-game-image-fix
 *
 * These tests are written BEFORE the fix is applied.
 * ALL tests MUST PASS on unfixed code — they establish the baseline behavior
 * that must be preserved after the fix.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { decodeEntity } from 'html-entities';
import EmojiButton from './components/EmojiButton';

// ---------------------------------------------------------------------------
// Observation 1: EmojiButton with a valid emoji symbol renders decoded symbol
// ---------------------------------------------------------------------------
describe('Observation: emoji card with valid symbol renders decoded symbol', () => {
  it('renders the decoded emoji symbol for { type: "emoji", symbol: "&#128049;", name: "cat" } with selectedCardEntry=true', () => {
    const card = { type: 'emoji', symbol: '&#128049;', name: 'cat' };

    render(
      <EmojiButton
        emoji={card}
        handleClick={() => {}}
        selectedCardEntry={true}
        matchedCardEntry={false}
        index={0}
      />
    );

    const expected = decodeEntity('&#128049;');
    const symbolSpan = document.querySelector('.emoji-symbol');
    expect(symbolSpan).toBeInTheDocument();
    expect(symbolSpan.textContent).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Observation 2: EmojiButton with empty/whitespace symbol falls back to emoji-name span
// ---------------------------------------------------------------------------
describe('Observation: emoji card with empty symbol falls back to emoji-name span', () => {
  it('renders the emoji-name span when symbol is empty string', () => {
    const card = { type: 'emoji', symbol: '', name: 'unknown-emoji' };

    render(
      <EmojiButton
        emoji={card}
        handleClick={() => {}}
        selectedCardEntry={true}
        matchedCardEntry={false}
        index={0}
      />
    );

    const nameSpan = document.querySelector('.emoji-name');
    expect(nameSpan).toBeInTheDocument();
    expect(nameSpan.textContent).toBe('unknown-emoji');
  });

  it('renders the emoji-name span when symbol is whitespace only', () => {
    const card = { type: 'emoji', symbol: '   ', name: 'space-emoji' };

    render(
      <EmojiButton
        emoji={card}
        handleClick={() => {}}
        selectedCardEntry={true}
        matchedCardEntry={false}
        index={0}
      />
    );

    const nameSpan = document.querySelector('.emoji-name');
    expect(nameSpan).toBeInTheDocument();
    expect(nameSpan.textContent).toBe('space-emoji');
  });
});

// ---------------------------------------------------------------------------
// Observation 3: EmojiButton with selectedCardEntry=false and matchedCardEntry=false renders "?"
// ---------------------------------------------------------------------------
describe('Observation: unflipped card renders "?"', () => {
  it('renders "?" when selectedCardEntry=false and matchedCardEntry=false', () => {
    const card = { type: 'emoji', symbol: '&#128049;', name: 'cat' };

    render(
      <EmojiButton
        emoji={card}
        handleClick={() => {}}
        selectedCardEntry={false}
        matchedCardEntry={false}
        index={0}
      />
    );

    const btn = screen.getByRole('button');
    expect(btn.textContent).toBe('?');
  });
});

// ---------------------------------------------------------------------------
// Property-based test: for all emoji cards with valid symbols,
// the rendered output is the decoded symbol (not an <img>, not "?")
//
// Simulates property testing by iterating over many hand-crafted inputs.
// Validates: Requirements 3.1
// **Validates: Requirements 3.1**
// ---------------------------------------------------------------------------
describe('Property: emoji cards with valid symbols always render decoded symbol', () => {
  // A representative set of emoji HTML entities covering different code points
  const emojiCases = [
    { symbol: '&#128049;', name: 'cat' },
    { symbol: '&#128054;', name: 'dog' },
    { symbol: '&#127822;', name: 'apple' },
    { symbol: '&#127803;', name: 'sunflower' },
    { symbol: '&#128512;', name: 'grinning-face' },
    { symbol: '&#9749;',   name: 'hot-beverage' },
    { symbol: '&#127881;', name: 'party-popper' },
    { symbol: '&#128640;', name: 'rocket' },
    { symbol: '&#10084;',  name: 'heart' },
    { symbol: '&#127775;', name: 'glowing-star' },
    { symbol: '&#128008;', name: 'cat-face' },
    { symbol: '&#128011;', name: 'whale' },
    { symbol: '&#127794;', name: 'evergreen-tree' },
    { symbol: '&#127826;', name: 'strawberry' },
    { symbol: '&#128007;', name: 'rabbit' },
  ];

  it.each(emojiCases)(
    'renders decoded symbol for $name ($symbol) when selectedCardEntry=true',
    ({ symbol, name }) => {
      const card = { type: 'emoji', symbol, name };
      const { unmount } = render(
        <EmojiButton
          emoji={card}
          handleClick={() => {}}
          selectedCardEntry={true}
          matchedCardEntry={false}
          index={0}
        />
      );

      const expected = decodeEntity(symbol);
      const symbolSpan = document.querySelector('.emoji-symbol');
      expect(symbolSpan).toBeInTheDocument();
      expect(symbolSpan.textContent).toBe(expected);

      // Must NOT render an <img>
      expect(document.querySelector('img')).not.toBeInTheDocument();

      unmount();
    }
  );

  it.each(emojiCases)(
    'renders decoded symbol for $name ($symbol) when matchedCardEntry=true',
    ({ symbol, name }) => {
      const card = { type: 'emoji', symbol, name };
      const { unmount } = render(
        <EmojiButton
          emoji={card}
          handleClick={() => {}}
          selectedCardEntry={false}
          matchedCardEntry={true}
          index={0}
        />
      );

      const expected = decodeEntity(symbol);
      const symbolSpan = document.querySelector('.emoji-symbol');
      expect(symbolSpan).toBeInTheDocument();
      expect(symbolSpan.textContent).toBe(expected);

      unmount();
    }
  );
});

// ---------------------------------------------------------------------------
// Property-based test: for all cards where selectedCardEntry and matchedCardEntry
// are both falsy, "?" is rendered regardless of card type
//
// Validates: Requirements 3.1, 3.2, 3.3, 3.4
// **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
// ---------------------------------------------------------------------------
describe('Property: unflipped cards always render "?" regardless of card type', () => {
  const cardVariants = [
    { type: 'emoji',  symbol: '&#128049;', name: 'cat' },
    { type: 'emoji',  symbol: '&#128054;', name: 'dog' },
    { type: 'emoji',  symbol: '',          name: 'empty-symbol' },
    { type: 'emoji',  symbol: '   ',       name: 'whitespace-symbol' },
    { type: 'image',  image: 'https://example.com/pikachu.png', name: 'pikachu' },
    { type: 'image',  image: 'https://example.com/bulbasaur.png', name: 'bulbasaur' },
    { type: 'image',  image: 'https://example.com/dog1.jpg', name: 'dog1' },
    { type: 'image',  image: 'https://rickandmortyapi.com/api/character/avatar/1.jpeg', name: 'rick' },
    { type: undefined, name: 'unknown-type' },
  ];

  it.each(cardVariants)(
    'renders "?" for $name (type=$type) when both selectedCardEntry and matchedCardEntry are false',
    (card) => {
      const { unmount } = render(
        <EmojiButton
          emoji={card}
          handleClick={() => {}}
          selectedCardEntry={false}
          matchedCardEntry={false}
          index={0}
        />
      );

      const btn = screen.getByRole('button');
      expect(btn.textContent).toBe('?');

      // Must NOT render an <img> when unflipped
      expect(document.querySelector('img')).not.toBeInTheDocument();

      unmount();
    }
  );

  // Also verify with falsy-but-not-false values (null, undefined, 0)
  const falsyValues = [null, undefined, 0, ''];

  it.each(falsyValues)(
    'renders "?" when selectedCardEntry=%s and matchedCardEntry=%s (both falsy)',
    (falsyVal) => {
      const card = { type: 'emoji', symbol: '&#128049;', name: 'cat' };
      const { unmount } = render(
        <EmojiButton
          emoji={card}
          handleClick={() => {}}
          selectedCardEntry={falsyVal}
          matchedCardEntry={falsyVal}
          index={0}
        />
      );

      const btn = screen.getByRole('button');
      expect(btn.textContent).toBe('?');

      unmount();
    }
  );
});

// ---------------------------------------------------------------------------
// Property: emoji-name fallback for all empty/whitespace symbols
// Validates: Requirements 3.1
// **Validates: Requirements 3.1**
// ---------------------------------------------------------------------------
describe('Property: emoji-name fallback for empty/whitespace symbols', () => {
  const emptySymbolCases = [
    { symbol: '',     name: 'empty' },
    { symbol: ' ',    name: 'single-space' },
    { symbol: '   ',  name: 'multi-space' },
    { symbol: '\t',   name: 'tab' },
    { symbol: '\n',   name: 'newline' },
    { symbol: '\t\n', name: 'tab-newline' },
  ];

  it.each(emptySymbolCases)(
    'renders emoji-name span for name=$name when symbol is "$symbol"',
    ({ symbol, name }) => {
      const card = { type: 'emoji', symbol, name };
      const { unmount } = render(
        <EmojiButton
          emoji={card}
          handleClick={() => {}}
          selectedCardEntry={true}
          matchedCardEntry={false}
          index={0}
        />
      );

      const nameSpan = document.querySelector('.emoji-name');
      expect(nameSpan).toBeInTheDocument();
      expect(nameSpan.textContent).toBe(name);

      // Must NOT render emoji-symbol span
      expect(document.querySelector('.emoji-symbol')).not.toBeInTheDocument();

      unmount();
    }
  );
});
