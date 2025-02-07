export default function GameStatus({ 
    currentPlayer,
    playerScores,
    connectedPlayers 
}) {
    return (
        <section className="game-status">
            <div className="status-grid">
                {playerScores.map((score, index) => (
                    <div key={index} className="status-item">
                        <h3>
                            {connectedPlayers[index]?.name} 
                            {currentPlayer === index ? " (Nuvarande tur)" : ""}
                        </h3>
                        <span className="animate-number">
                            Matchningar: {score}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
}