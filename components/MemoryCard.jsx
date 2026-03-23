import EmojiButton from './EmojiButton'

const SPARKLES = [
    { top: '5%',  left: '50%',  tx: '0px',   ty: '-24px', delay: '0s',    color: '#fde68a' },
    { top: '50%', left: '95%',  tx: '24px',  ty: '0px',   delay: '0.05s', color: '#fbbf24' },
    { top: '95%', left: '50%',  tx: '0px',   ty: '24px',  delay: '0.1s',  color: '#fde68a' },
    { top: '50%', left: '5%',   tx: '-24px', ty: '0px',   delay: '0.08s', color: '#fbbf24' },
    { top: '15%', left: '80%',  tx: '16px',  ty: '-16px', delay: '0.03s', color: '#fde68a' },
    { top: '80%', left: '80%',  tx: '16px',  ty: '16px',  delay: '0.12s', color: '#fbbf24' },
    { top: '80%', left: '20%',  tx: '-16px', ty: '16px',  delay: '0.07s', color: '#fde68a' },
    { top: '15%', left: '20%',  tx: '-16px', ty: '-16px', delay: '0.15s', color: '#fbbf24' },
]

function SparkleOverlay() {
    return (
        <>
            {SPARKLES.map((s, i) => (
                <span
                    key={i}
                    className="sparkle-dot"
                    style={{
                        top: s.top,
                        left: s.left,
                        '--tx': s.tx,
                        '--ty': s.ty,
                        animationDelay: s.delay,
                        color: s.color,
                    }}
                >✦</span>
            ))}
        </>
    )
}

export default function MemoryCard({ handleClick, data, selectedCards, matchedCards }) {
    const isSelected = (index) => selectedCards.find(card => card.index === index);
    const isMatched = (index) => matchedCards.find(card => card.index === index);

    // Välj antal kolumner baserat på kortantal för jämna rader utan overflow
    const count = data.length;
    const cols = count <= 10 ? 5
               : count <= 20 ? 5
               : count <= 30 ? 6
               : count <= 40 ? 8
               : 10;

    return (
        <ul className="card-container" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {data.map((emoji, index) => (
                <li 
                    key={index} 
                    className={`card-item ${isSelected(index) ? 'card-item--selected' : ''} ${isMatched(index) ? 'card-item--matched' : ''}`}
                >
                    {isMatched(index) && <SparkleOverlay />}
                        <EmojiButton
                            emoji={emoji}
                            handleClick={(name) => handleClick(name, index)}
                            selectedCardEntry={isSelected(index)}
                            matchedCardEntry={isMatched(index)}
                            index={index}
                        />
                </li>
            ))}
        </ul>
    );
}