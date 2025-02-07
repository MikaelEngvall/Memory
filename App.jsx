import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import Form from '/components/Form'
import MemoryCard from '/components/MemoryCard'
import AssistiveTechInfo from '/components/AssistiveTechInfo'
import GameOver from '/components/GameOver'
import GameStatus from './components/GameStatus'
import ErrorCard from '/components/ErrorCard'

const socket = io('http://localhost:3001')

export default function App() {
    const initialFormData = {
        category: "animals-and-nature",
        number: 10,
        players: "2"  // Ändra default till 2 spelare
    }
    
    const [formData, setFormData] = useState(initialFormData)
    const [isGameOn, setIsGameOn] = useState(false)
    const [emojisData, setEmojisData] = useState([])
    const [selectedCards, setSelectedCards] = useState([])
    const [matchedCards, setMatchedCards] = useState([])
    const [areAllCardsMatched, setAreAllCardsMatched] = useState(false)
    const [isError, setIsError] = useState(false)
    const [attempts, setAttempts] = useState(0)  // Add attempts state
    const [bestScore, setBestScore] = useState(
        JSON.parse(localStorage.getItem('bestScore')) || {}
    )
    const [currentPlayer, setCurrentPlayer] = useState(0)
    const [playerScores, setPlayerScores] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [isOnline, setIsOnline] = useState(false)
    const [roomCode, setRoomCode] = useState('')
    const [playerName, setPlayerName] = useState('')
    const [connectedPlayers, setConnectedPlayers] = useState([])
    const [isHost, setIsHost] = useState(false)
    const [isWaitingRoom, setIsWaitingRoom] = useState(false)
    const [roomError, setRoomError] = useState("")

    // Add attempt counter when two cards are selected
    useEffect(() => {
        if (selectedCards.length === 2) {
            setAttempts(prev => prev + 1)
            // Check for match
            if (selectedCards[0].name === selectedCards[1].name) {
                setPlayerScores(prev => {
                    const newScores = [...prev]
                    newScores[currentPlayer]++
                    return newScores
                })
            } else {
                // Switch to next player if no match
                setCurrentPlayer(prev => 
                    (prev + 1) % parseInt(formData.players)
                )
            }
        }
    }, [selectedCards])

    useEffect(() => {
        if (selectedCards.length === 2 && selectedCards[0].name === selectedCards[1].name) {
            setMatchedCards(prevMatchedCards => [...prevMatchedCards, ...selectedCards])
        }
    }, [selectedCards])
    
    // Socket event listeners
    useEffect(() => {
        socket.on('roomCreated', (code) => {
            setRoomCode(code)
        })

        socket.on('playerJoined', (players) => {
            setConnectedPlayers(players)
        })

        socket.on('updateGameState', (gameState) => {
            const rotatedCards = rotateCardIds(gameState.cards);
            setEmojisData(rotatedCards);
        })

        socket.on('roomUpdate', ({ code, players }) => {
            setRoomCode(code)
            setConnectedPlayers(players)
            setIsWaitingRoom(true)
        })

        socket.on('roomError', (error) => {
            setRoomError(error)
        })

        socket.on('gameStarted', (data) => {
            try {
                const { gameConfig, gameCards } = data;
                
                // Behåll bara den grundläggande obfuskeringen
                const obfuscatedCards = gameCards.map((card, index) => ({
                    ...card,
                    name: btoa(card.name),
                    symbol: card.symbol ? btoa(card.symbol) : null,
                    id: index,
                    type: card.type
                }));

                setEmojisData(obfuscatedCards);
                setFormData(gameConfig);
                setPlayerScores(new Array(connectedPlayers.length).fill(0));
                setCurrentPlayer(0);
                setSelectedCards([]);
                setMatchedCards([]);
                setIsWaitingRoom(false);
                setIsGameOn(true);
            } catch (error) {
                setIsError(true);
            }
        });

        socket.on('gameError', (error) => {
            setIsError(true);
        });

        socket.on("pairMatched", ({ cards, player }) => {
            setMatchedCards(prev => [...prev, ...cards.map(cardIndex => ({
                name: atob(emojisData[cardIndex].name), // Dekoda namnet
                index: cardIndex
            }))]);
            setPlayerScores(prev => {
                const newScores = [...prev];
                const playerIndex = connectedPlayers.findIndex(p => p.id === player.id);
                if (playerIndex !== -1) {
                    newScores[playerIndex] = player.score;
                }
                return newScores;
            });
            setSelectedCards([]);
        });

        socket.on("pairMissed", ({ cards, nextPlayer }) => {
            // Vänta lite innan korten vänds tillbaka
            setTimeout(() => {
                setSelectedCards([]);
                setCurrentPlayer(nextPlayer);
            }, 1000);
        });

        socket.on("gameOver", ({ players }) => {
            // Hitta vinnaren (spelaren med högst poäng)
            const winner = players.reduce((prev, current) => 
                (current.score > prev.score) ? current : prev
            );

            setAreAllCardsMatched(true);
            setPlayerScores(players.map(p => p.score));
        });

        return () => {
            socket.off('roomCreated')
            socket.off('playerJoined')
            socket.off('updateGameState')
            socket.off('roomUpdate')
            socket.off('roomError')
            socket.off('gameStarted')
            socket.off('gameError')
            socket.off("pairMatched");
            socket.off("pairMissed");
            socket.off("gameOver");
        }
    }, [connectedPlayers, emojisData])
    
    function handleFormChange(e) {
        setFormData(prevFormData => ({...prevFormData, [e.target.name]: e.target.value}))
    }
    
    async function startGame(e) {
        if (e) e.preventDefault();
        if (!isHost) return;
        
        setIsLoading(true);
        try {
            let gameCards;
            const numPairs = parseInt(formData.number) / 2;
            
            switch(formData.category) {
                case 'pokemon':
                    gameCards = await fetchPokemonData(numPairs);
                    break;
                case 'dogs':
                    gameCards = await fetchDogData(numPairs);
                    break;
                case 'rickandmorty':
                    gameCards = await fetchRickAndMortyData(numPairs);
                    break;
                default:
                    gameCards = await fetchEmojiData(formData.category, numPairs);
            }

            if (!gameCards || gameCards.length !== numPairs) {
                throw new Error(`Invalid number of cards received`);
            }

            const cardPairs = [...gameCards, ...gameCards]
                .map((card, index) => ({
                    ...card,
                    cardId: `${card.id}-${index}`
                }))
                .sort(() => Math.random() - 0.5);

            socket.emit('startGame', {
                roomCode,
                gameConfig: formData,
                cards: cardPairs
            });
        } catch(err) {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }   
    }

    async function fetchPokemonData(numPairs) {
        const pokemonIds = new Set();
        while(pokemonIds.size < numPairs) {
            pokemonIds.add(Math.floor(Math.random() * 898) + 1);
        }
        
        const promises = [...pokemonIds].map(id => 
            fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
                .then(res => res.json())
        );
        
        const pokemonData = await Promise.all(promises);
        return pokemonData.map((pokemon, index) => ({
            id: index,
            name: pokemon.name,
            image: pokemon.sprites.front_default,
            type: 'image'
        }));
    }

    async function fetchDogData(numPairs) {
        const response = await fetch(`https://dog.ceo/api/breeds/image/random/${numPairs}`);
        const data = await response.json();
        return data.message.map((url, index) => ({
            id: index,
            name: `dog${index}`,
            image: url,
            type: 'image'
        }));
    }

    async function fetchRickAndMortyData(numPairs) {
        const maxChar = 826;
        const charIds = new Set();
        while(charIds.size < numPairs) {
            charIds.add(Math.floor(Math.random() * maxChar) + 1);
        }
        
        const response = await fetch(`https://rickandmortyapi.com/api/character/${[...charIds]}`);
        const data = await response.json();
        return data.map((char, index) => ({
            id: index,
            name: char.name,
            image: char.image,
            type: 'image'
        }));
    }

    async function fetchEmojiData(category, numPairs) {
        const response = await fetch(`https://emojihub.yurace.pro/api/all/category/${category}`);
        if (!response.ok) {
            throw new Error("Ett fel uppstod");
        }
        const data = await response.json();
        
        const validEmojis = data.filter(emoji => 
            emoji && 
            emoji.htmlCode && 
            emoji.htmlCode[0] && 
            emoji.name &&
            emoji.htmlCode[0].trim() !== ''
        );

        if (validEmojis.length < numPairs) {
            throw new Error("Ett fel uppstod");
        }

        const shuffled = [...validEmojis].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, numPairs);
        
        return selected.map((emoji, index) => ({
            id: index,
            name: emoji.name,
            symbol: emoji.htmlCode[0], // Detta kommer att kodas senare
            type: 'emoji'
        }));
    }

    function getRandomIndices(data) {        
        const randomIndicesArray = []
 
        for (let i = 0; i < (formData.number / 2); i++) {
            const randomNum = Math.floor(Math.random() * data.length)
            if (!randomIndicesArray.includes(randomNum)) {
                randomIndicesArray.push(randomNum)
            } else {
                i--
            }
        }
        
        return randomIndicesArray
    }

    async function getEmojisArray(data) {
        if (!data || !Array.isArray(data)) {
            throw new Error("Ett fel uppstod");
        }

        const pairedEmojisArray = [...data, ...data]
        
        for (let i = pairedEmojisArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            [pairedEmojisArray[i], pairedEmojisArray[j]] = [pairedEmojisArray[j], pairedEmojisArray[i]]
        }
        
        return pairedEmojisArray
    }
    
    let lastMoveTime = 0;
    const MIN_MOVE_DELAY = 500; // millisekunder

    function turnCard(name, index) {
        const now = Date.now();
        if (now - lastMoveTime < MIN_MOVE_DELAY) {
            return; // För snabbt drag, ignorera
        }
        lastMoveTime = now;
        if (currentPlayer !== connectedPlayers.findIndex(p => p.name === playerName)) {
            return;
        }

        if (selectedCards.find(card => card.index === index) || 
            matchedCards.find(card => card.index === index)) {
            return;
        }

        if (selectedCards.length >= 2) {
            return;
        }

        socket.emit('cardSelected', {
            roomCode,
            cardIndex: index,
            playerName: playerName
        });
    }
    
    // Reset game function should clear attempts
    function resetGame() {
        setIsGameOn(false)
        setSelectedCards([])
        setMatchedCards([])
        setAreAllCardsMatched(false)
        setAttempts(0)
        setCurrentPlayer(0)
        setPlayerScores([])
        setIsWaitingRoom(true)
    }
    
    function resetError() {
        setIsError(false)
    }

    // Create new online game
    function createOnlineGame() {
        socket.emit('createRoom', playerName)
        setIsOnline(true)
    }

    // Join existing game
    function joinGame(code) {
        socket.emit('joinRoom', {roomCode: code, playerName})
        setRoomCode(code)
        setIsOnline(true)
    }

    // Handle remote card selection
    function handleRemoteCardSelection(gameState) {
        const { selectedCard: index, currentPlayer: activePlayer, allSelectedCards } = gameState;
        const card = emojisData[index];
        
        if (card && card.name) {
            // Uppdatera valda kort baserat på serverns state
            const newSelectedCards = allSelectedCards.map(cardIndex => ({
                name: emojisData[cardIndex].name,
                index: cardIndex
            }));
            setSelectedCards(newSelectedCards);
            setCurrentPlayer(activePlayer);
        }
    }

    function createRoom() {
        if (!playerName.trim()) {
            setRoomError("Please enter your name")
            return
        }
        socket.emit('createRoom', { playerName })
        setIsHost(true)
    }

    function joinRoom() {
        if (!playerName.trim()) {
            setRoomError("Please enter your name")
            return
        }
        if (!roomCode.trim()) {
            setRoomError("Please enter a room code")
            return
        }
        socket.emit('joinRoom', { roomCode, playerName })
    }

    function handleStartGame(e) {
        e.preventDefault()
        socket.emit('startGame', {
            roomCode,
            gameConfig: formData
        })
    }
    
    // Rotera kortID:n efter varje drag för att förhindra mönsteridentifiering
    function rotateCardIds(cards) {
        return cards.map(card => ({
            ...card,
            id: btoa(Math.random().toString(36) + card.id)
        }));
    }
    
    return (
        <main>
            <h1>Memory</h1>
            {!isGameOn && !isError && (
                <>
                    {!isWaitingRoom ? (
                        <div className="menu">
                            {roomError && <p className="error">{roomError}</p>}
                            <input 
                                type="text" 
                                placeholder="Ange ditt namn"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                            />
                            <button onClick={createRoom}>Skapa spel</button>
                            <div>
                                <input 
                                    type="text" 
                                    placeholder="Ange rumskod"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                />
                                <button onClick={joinRoom}>Gå med i spel</button>
                            </div>
                        </div>
                    ) : (
                        <div className="room">
                            <h2>Rumskod: {roomCode}</h2>
                            <div className="players">
                                <h3>Spelare:</h3>
                                {connectedPlayers.map(player => (
                                    <p key={player.id}>
                                        {player.name} {player.isHost ? "(Värd)" : ""}
                                        {currentPlayer === connectedPlayers.indexOf(player) && " (Nuvarande tur)"}
                                    </p>
                                ))}
                            </div>
                            {isHost && (
                                <div>
                                    <Form 
                                        handleSubmit={startGame} 
                                        handleChange={handleFormChange} 
                                    />
                                </div>
                            )}
                            {!isHost && (
                                <p>Väntar på att värden ska starta spelet...</p>
                            )}
                        </div>
                    )}
                </>
            )}
            {isLoading && <p>Loading game...</p>}
            {isGameOn && !areAllCardsMatched && !isLoading &&
                <div className="game-container">
                    <AssistiveTechInfo 
                        emojisData={emojisData} 
                        matchedCards={matchedCards} 
                    />
                    <GameStatus 
                        currentPlayer={currentPlayer}
                        playerScores={playerScores}
                        connectedPlayers={connectedPlayers}
                    />
                    <MemoryCard
                        handleClick={turnCard}
                        data={emojisData}
                        selectedCards={selectedCards}
                        matchedCards={matchedCards}
                    />
                </div>
            }
            {areAllCardsMatched && 
                <GameOver 
                    handleClick={resetGame} 
                    attempts={attempts}
                    playerScores={playerScores}
                />
            }
            {isError && <ErrorCard handleClick={resetError} />}
        </main>
    )
}