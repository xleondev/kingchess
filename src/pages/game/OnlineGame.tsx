import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineGame } from '../../lib/supabase/useOnlineGame'
import { Board } from '../../components/Board/Board'
import { GameHeader } from '../../components/Game/GameHeader'

export function OnlineGame() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const {
    roomCode, playerColor, fen, status, error,
    turn, isCheck, isCheckmate, isStalemate, gameOver,
    getLegalMoves, createRoom, joinRoom, sendMove,
  } = useOnlineGame()

  const legalMoves = useMemo(() => {
    if (!playerColor || turn !== playerColor || gameOver) return {}
    const map: Record<string, string[]> = {}
    'abcdefgh'.split('').forEach((file) => {
      for (let rank = 1; rank <= 8; rank++) {
        const sq = `${file}${rank}`
        const moves = getLegalMoves(sq)
        if (moves.length) map[sq] = moves
      }
    })
    return map
  }, [fen, turn, playerColor, gameOver, getLegalMoves])

  if (status === 'idle') {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center gap-6 p-6">
        <button onClick={() => navigate('/play')} className="self-start text-brand-green font-semibold">← Back</button>
        <h1 className="text-3xl font-bold text-brand-green">Online Play</h1>
        {error && <p className="text-red-500 font-medium">{error}</p>}
        <button
          onClick={createRoom}
          className="bg-brand-green text-white py-4 px-8 rounded-2xl font-bold text-xl shadow-lg w-full max-w-xs"
        >
          Create Room
        </button>
        <div className="flex gap-2 w-full max-w-xs">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="Room code"
            className="flex-1 border-2 border-brand-green rounded-xl px-4 py-3 text-lg font-mono uppercase tracking-widest"
            maxLength={6}
          />
          <button
            onClick={() => joinRoom(input)}
            disabled={input.length < 6}
            className="bg-brand-gold text-white py-3 px-4 rounded-xl font-bold disabled:opacity-50"
          >
            Join
          </button>
        </div>
      </div>
    )
  }

  if (status === 'waiting') {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-2xl font-bold text-brand-green">Room Created!</h1>
        <p className="text-gray-600">Share this code with your opponent:</p>
        <div className="text-5xl font-mono font-bold text-brand-green tracking-widest bg-white px-8 py-4 rounded-2xl shadow-lg">
          {roomCode}
        </div>
        <p className="text-gray-400 animate-pulse mt-2">Waiting for opponent to join...</p>
        <button onClick={() => navigate('/play')} className="text-sm text-gray-400 underline mt-4">
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center p-4 gap-4">
      <button onClick={() => navigate('/play')} className="self-start text-brand-green font-semibold">← Back</button>
      <p className="text-sm text-gray-500">
        Room: <span className="font-mono font-bold">{roomCode}</span> · You are{' '}
        <span className="font-bold">{playerColor === 'w' ? 'White' : 'Black'}</span>
      </p>

      <GameHeader
        turn={turn}
        playerWhite="White"
        playerBlack="Black"
        isCheck={isCheck}
        isCheckmate={isCheckmate}
        isStalemate={isStalemate}
      />

      <Board
        fen={fen}
        turn={turn}
        onMove={(from, to) => sendMove(from, to)}
        legalMoves={legalMoves}
        inCheck={isCheck}
        flipped={playerColor === 'b'}
      />
    </div>
  )
}
