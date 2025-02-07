import { decodeEntity } from 'html-entities'

export default function EmojiButton({
    emoji,
    handleClick,
    selectedCardEntry,
    matchedCardEntry,
    index
}) {
    if (!emoji) {
        return null;
    }

    const getContent = () => {
        if (selectedCardEntry || matchedCardEntry) {
            if (emoji.type === 'image') {
                return <img src={emoji.image} alt="Memory card" />;
            } else {
                const decodedSymbol = decodeEntity(atob(emoji.symbol));
                const isVisibleSymbol = decodedSymbol && decodedSymbol.trim() !== '';
                
                return (
                    <div className="emoji-content">
                        {isVisibleSymbol ? (
                            <span className="emoji-symbol">{decodedSymbol}</span>
                        ) : (
                            <span className="emoji-name">{atob(emoji.name)}</span>
                        )}
                    </div>
                );
            }
        }
        return "?";
    };

    const btnStyle =
        matchedCardEntry ? "btn--emoji__back--matched" :
        selectedCardEntry ? "btn--emoji__back--selected" :
        "btn--emoji__front";
        
    const btnAria =
        matchedCardEntry ? `${emoji.name}. Matchad.` :
        selectedCardEntry ? `${emoji.name}. Inte matchad än.` :
        "Kort upp och ner.";
 
    return (
        <button
            className={`btn btn--emoji ${btnStyle}`}
            onClick={selectedCardEntry ? null : () => handleClick(emoji.name, index)}
            disabled={matchedCardEntry}
            aria-label={`Position ${index + 1}: ${btnAria}`}
            aria-live="polite"
        >
            {getContent()}
        </button>
    );
}