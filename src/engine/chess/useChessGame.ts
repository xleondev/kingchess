import { useState, useCallback } from 'react'
import { Chess } from 'chess.js'

interface UseChessGameOptions {
  fen?: string
}

export function useChessGame(options: UseChessGameOptions = {}) {
  const [chess] = useState(() => new Chess(options.fen))
  const [fen, setFen] = useState(chess.fen())
  const [history, setHistory] = useState<string[]>([])

  const sync = useCallback(() => {
    setFen(chess.fen())
    setHistory(chess.history())
  }, [chess])

  const getLegalMoves = useCallback((square: string): string[] => {
    return chess.moves({ square: square as any, verbose: true }).map((m) => m.to)
  }, [chess])

  const makeMove = useCallback((from: string, to: string, promotion = 'q'): boolean => {
    try {
      const move = chess.move({ from: from as any, to: to as any, promotion })
      if (move) { sync(); return true }
      return false
    } catch {
      return false
    }
  }, [chess, sync])

  const reset = useCallback((newFen?: string) => {
    if (newFen) chess.load(newFen)
    else chess.reset()
    sync()
  }, [chess, sync])

  return {
    fen,
    history,
    turn: chess.turn() as 'w' | 'b',
    isCheck: chess.inCheck(),
    isCheckmate: chess.isCheckmate(),
    isStalemate: chess.isStalemate(),
    isDraw: chess.isDraw(),
    gameOver: chess.isGameOver(),
    getLegalMoves,
    makeMove,
    reset,
    pgn: chess.pgn(),
  }
}
