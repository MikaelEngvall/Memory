import { useRef, useEffect } from 'react'
import RegularButton from './RegularButton'

export default function GameOver({ handleClick, attempts, playerScores, connectedPlayers }) {
    const divRef = useRef(null)
    
    useEffect(() => {
        if (divRef.current) divRef.current.focus()
    }, [])
    
    const winner = playerScores.length > 0 ? playerScores.indexOf(Math.max(...playerScores)) : 0
    
    return (
        <div
            className="wrapper wrapper--accent"
            tabIndex={0}
            ref={divRef}
        >
            <p className="p--large">Game Over!</p>
            
            {playerScores.length > 1 ? (
                <>
                    <p className="p--regular">
                        Winner: {connectedPlayers[winner]?.name ?? `Player ${winner + 1}`} with {playerScores[winner]} pairs!
                    </p>
                    <div className="scores-container">
                        {playerScores.map((score, index) => (
                            <p key={index} className="p--regular">
                                {connectedPlayers[index]?.name ?? `Player ${index + 1}`}: {score} pairs
                            </p>
                        ))}
                    </div>
                </>
            ) : (
                <p className="p--regular">
                    You matched all pairs in {attempts} attempts!
                </p>
            )}
            
            <RegularButton handleClick={handleClick}>
                Play again
            </RegularButton>
        </div>
    )
}