import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChessGame } from '../../engine/chess/useChessGame'
import { useStockfish } from '../../engine/stockfish/useStockfish'
import { useProgress } from '../../lib/progress/useProgress'
import { Board } from '../../components/Board/Board'
import { GameHeader } from '../../components/Game/GameHeader'

type Difficulty = 'easy' | 'medium' | 'hard' | 'adaptive'

const DIFFICULTY_OPTIONS: { label: string; value: Difficulty; emoji: string }[] = [
  { label: 'Easy', value: 'easy', emoji: '😊' },
  { label: 'Medium', value: 'medium', emoji: '🤔' },
  { label: 'Hard', value: 'hard', emoji: '😤' },
  { label: 'Adaptive', value: 'adaptive', emoji: '🧠' },
]

export function MachineGame() {
  const navigate = useNavigate()
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [playerColor] = useState<'w' | 'b'>('w')
  const [thinking, setThinking] = useState(false)

  const { fen, turn, isCheck, isCheckmate, isStalemate, gameOver, getLegalMoves, makeMove, reset } = useChessGame()
  const { getBestMove } = useStockfish()
  const { recordWin, awardBadge } = useProgress()

  useEffect(() => {
    if (isCheckmate && turn === 'b') {
      // Black king is mated — white (player) won
      recordWin()
      awardBadge('Beat the Computer!')
    }
  }, [isCheckmate, turn, recordWin, awardBadge])

  const legalMoves = useMemo(() => {
    if (turn !== playerColor || gameOver) return {}
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

  // Machine's turn
  useEffect(() => {
    if (turn === playerColor || gameOver || !difficulty) return
    let cancelled = false
    setThinking(true)
    const engineDifficulty = difficulty === 'adaptive' ? 'medium' : difficulty
    getBestMove(fen, 10, engineDifficulty)
      .then((move) => {
        if (cancelled) return
        if (move && move.length >= 4) {
          makeMove(move.slice(0, 2), move.slice(2, 4))
        }
      })
      .catch(() => { /* worker terminated on unmount — ignore */ })
      .finally(() => {
        if (!cancelled) setThinking(false)
      })
    return () => { cancelled = true }
  }, [turn, fen, gameOver, difficulty, getBestMove, makeMove])

  if (!difficulty) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center gap-6 p-6">
        <button onClick={() => navigate('/play')} className="self-start text-brand-green font-semibold">← Back</button>
        <h1 className="text-3xl font-bold text-brand-green">Choose Difficulty</h1>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          {DIFFICULTY_OPTIONS.map(({ label, value, emoji }) => (
            <button
              key={value}
              onClick={() => setDifficulty(value)}
              className="bg-brand-green text-white py-4 rounded-2xl font-bold text-xl shadow-lg flex items-center justify-center gap-3"
            >
              <span>{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center p-4 gap-4">
      <button onClick={() => navigate('/play')} className="self-start text-brand-green font-semibold">← Back</button>

      <GameHeader
        turn={turn}
        playerWhite="You"
        playerBlack={`Computer (${difficulty})`}
        isCheck={isCheck}
        isCheckmate={isCheckmate}
        isStalemate={isStalemate}
        thinking={thinking}
      />

      <Board
        fen={fen}
        turn={turn}
        onMove={(from, to) => makeMove(from, to)}
        legalMoves={legalMoves}
        inCheck={isCheck}
      />

      {gameOver && (
        <button
          onClick={() => reset()}
          className="bg-brand-gold text-white font-bold py-3 px-8 rounded-xl text-lg shadow-lg"
        >
          Play Again
        </button>
      )}
    </div>
  )
}
