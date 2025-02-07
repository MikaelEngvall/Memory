import EmojiButton from './EmojiButton'

export default function MemoryCard({ handleClick, data, selectedCards, matchedCards }) {
    const isSelected = (index) => selectedCards.find(card => card.index === index);
    const isMatched = (index) => matchedCards.find(card => card.index === index);

    return (
        <ul className="card-container">
            {data.map((emoji, index) => (
                <li 
                    key={index} 
                    className={`card-item ${isSelected(index) ? 'card-item--selected' : ''} ${isMatched(index) ? 'card-item--matched' : ''}`}
                >
                    <EmojiButton
                        emoji={emoji}
                        handleClick={(name) => handleClick(atob(name), index)}
                        selectedCardEntry={isSelected(index)}
                        matchedCardEntry={isMatched(index)}
                        index={index}
                    />
                </li>
            ))}
        </ul>
    );
}