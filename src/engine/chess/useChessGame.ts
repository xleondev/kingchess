import { useState, useCallback } from 'react'
import { Chess, type Square } from 'chess.js'

interface UseChessGameOptions {
  fen?: string
}

interface GameState {
  fen: string
  history: string[]
  turn: 'w' | 'b'
  isCheck: boolean
  isCheckmate: boolean
  isStalemate: boolean
  isDraw: boolean
  gameOver: boolean
  pgn: string
}

function snapshot(chess: Chess): GameState {
  return {
    fen: chess.fen(),
    history: chess.history(),
    turn: chess.turn() as 'w' | 'b',
    isCheck: chess.inCheck(),
    isCheckmate: chess.isCheckmate(),
    isStalemate: chess.isStalemate(),
    isDraw: chess.isDraw(),
    gameOver: chess.isGameOver(),
    pgn: chess.pgn(),
  }
}

export function useChessGame(options: UseChessGameOptions = {}) {
  const [chess] = useState(() => new Chess(options.fen))
  const [state, setState] = useState<GameState>(() => snapshot(chess))

  const sync = useCallback(() => {
    setState(snapshot(chess))
  }, [chess])

  const getLegalMoves = useCallback((square: string): string[] => {
    return chess.moves({ square: square as Square, verbose: true }).map((m) => m.to)
  }, [chess])

  const makeMove = useCallback((from: string, to: string, promotion = 'q'): boolean => {
    try {
      const move = chess.move({ from: from as Square, to: to as Square, promotion })
      if (move) { sync(); return true }
      return false
    } catch {
      return false
    }
  }, [chess, sync])

  const reset = useCallback((newFen?: string) => {
    try {
      if (newFen) chess.load(newFen)
      else chess.reset()
      sync()
    } catch {
      // Invalid FEN — leave state unchanged
    }
  }, [chess, sync])

  return {
    ...state,
    getLegalMoves,
    makeMove,
    reset,
  }
}
