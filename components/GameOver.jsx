import { useRef, useEffect } from 'react'
import RegularButton from './RegularButton'

export default function GameOver({ handleClick, attempts }) {
    const divRef = useRef(null)
    
    useEffect(() => {
        divRef.current.focus()
    }, [])
    
    return (
        <div
            className="wrapper wrapper--accent"
            tabIndex={0}
            ref={divRef}
        >
            <p className="p--large">You've matched all the memory cards!</p>
            <p className="p--regular">Total attempts: {attempts}</p>
            <RegularButton handleClick={handleClick}>
                Play again
            </RegularButton>
        </div>
    )
}