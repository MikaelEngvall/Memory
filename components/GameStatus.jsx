export default function GameStatus({ emojisData, matchedCards, attempts }) {
    return (
        <section className="game-status">
            <div className="status-grid">
                <div className="status-item">
                    <h3>Pairs Found</h3>
                    <span>{matchedCards.length / 2}</span>
                </div>
                <div className="status-item">
                    <h3>Remaining</h3>
                    <span>{(emojisData.length - matchedCards.length) / 2}</span>
                </div>
                <div className="status-item">
                    <h3>Attempts</h3>
                    <span>{attempts}</span>
                </div>
            </div>
        </section>
    )
}