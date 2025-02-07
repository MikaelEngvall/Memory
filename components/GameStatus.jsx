export default function GameStatus({ 
    currentPlayer,
    playerScores,
    connectedPlayers 
}) {
    return (
        <div className="game-status">
            {connectedPlayers.map((player, index) => (
                <div key={btoa(player.id)} className="player-status">
                    <span>{maskPlayerName(player.name)}</span>
                    <span>Poäng: {obfuscateScore(playerScores[index])}</span>
                </div>
            ))}
        </div>
    );
}