export default function AssistiveTechInfo({ emojisData, matchedCards }) {
    if (!emojisData || !matchedCards) {
        return null;
    }

    return (
        <div className="sr-only">
            {emojisData.map((emoji, index) => {
                const isMatched = matchedCards.find(card => card.index === index);
                return (
                    <p key={index}>
                        Kort {index + 1}: {isMatched ? `${atob(emoji.name)} (matchat)` : 'Dolt'}
                    </p>
                );
            })}
        </div>
    )
}