export default function RegularButton({ children, handleClick, disabled }) {
    return (
        <button
            className="btn btn--text"
            onClick={handleClick}
            disabled={disabled}
            style={disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
        >
            {children}
        </button>
    )
}