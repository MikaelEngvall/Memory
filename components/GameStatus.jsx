export default function GameStatus({ emojisData, matchedCards, attempts, timeElapsed }) {
    const matchRate = attempts ? ((matchedCards.length / 2) / attempts * 100).toFixed(1) : 0
    
    return (
        <section className="game-status">
            <div className="status-grid">
                <div className="status-item">
                    <h3>Pairs Found</h3>
                    <span className="animate-number">{matchedCards.length / 2}</span>
                </div>
                <div className="status-item">
                    <h3>Attempts</h3>
                    <span className="animate-number">{attempts}</span>
                </div>
                <div className="status-item">
                    <h3>Match Rate</h3>
                    <span className="animate-number">{matchRate}%</span>
                </div>
                <div className="status-item">
                    <h3>Time</h3>
                    <span className="animate-number">
                        {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
                    </span>
                </div>
            </div>
        </section>
    )
}