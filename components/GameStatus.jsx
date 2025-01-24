export default function GameStatus({ emojisData, matchedCards }) {
    return (
        <section className="game-status">
            <h2>Game Status</h2>
            <p>Matched pairs: {matchedCards.length / 2}</p>
            <p>Cards left: {emojisData.length - matchedCards.length}</p>
        </section>
    )
}