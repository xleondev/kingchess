import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChessGame } from '../../engine/chess/useChessGame'
import { useProgress } from '../../lib/progress/useProgress'
import { Board } from '../../components/Board/Board'
import { GameHeader } from '../../components/Game/GameHeader'

interface LocalGameProps {
  playerWhite?: string
  playerBlack?: string
}

export function LocalGame({ playerWhite = 'Player 1', playerBlack = 'Player 2' }: LocalGameProps) {
  const navigate = useNavigate()
  const { fen, turn, isCheck, isCheckmate, isStalemate, gameOver, getLegalMoves, makeMove, reset } = useChessGame()
  const { recordWin, awardBadge } = useProgress()

  useEffect(() => {
    if (isCheckmate) {
      recordWin()
      awardBadge('First Checkmate!')
    }
  }, [isCheckmate, recordWin, awardBadge])

  const legalMoves = useMemo(() => {
    const map: Record<string, string[]> = {}
    const files = 'abcdefgh'.split('')
    for (let rank = 1; rank <= 8; rank++) {
      for (const file of files) {
        const sq = `${file}${rank}`
        const moves = getLegalMoves(sq)
        if (moves.length) map[sq] = moves
      }
    }
    return map
  }, [fen, getLegalMoves])

  const handleMove = useCallback((from: string, to: string) => {
    makeMove(from, to)
  }, [makeMove])

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center p-4 gap-4">
      <button onClick={() => navigate('/play')} className="self-start text-brand-green font-semibold">← Back</button>

      <GameHeader
        turn={turn}
        playerWhite={playerWhite}
        playerBlack={playerBlack}
        isCheck={isCheck}
        isCheckmate={isCheckmate}
        isStalemate={isStalemate}
      />

      <Board
        fen={fen}
        turn={turn}
        onMove={handleMove}
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
