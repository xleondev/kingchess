import { useState, useCallback, useMemo, useEffect } from 'react'
import { Chess } from 'chess.js'
import { Square } from './Square'

interface BoardProps {
  fen: string
  turn: 'w' | 'b'
  onMove: (from: string, to: string) => void
  legalMoves?: Record<string, string[]>
  inCheck?: boolean
  flipped?: boolean
}

function fenToPieceMap(fen: string): Record<string, string> {
  const chess = new Chess(fen)
  const board = chess.board()
  const map: Record<string, string> = {}
  board.forEach((row, rankIdx) => {
    row.forEach((sq, fileIdx) => {
      if (sq) {
        const file = 'abcdefgh'[fileIdx]
        const rank = 8 - rankIdx
        map[`${file}${rank}`] = `${sq.color}${sq.type.toUpperCase()}`
      }
    })
  })
  return map
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1]

export function Board({ fen, turn, onMove, legalMoves = {}, inCheck = false, flipped = false }: BoardProps) {
  const [selected, setSelected] = useState<string | null>(null)

  // Memoize the piece map — only recompute when fen changes
  const pieceMap = useMemo(() => fenToPieceMap(fen), [fen])

  // Clear selection when the board position changes externally (e.g. AI move)
  useEffect(() => {
    setSelected(null)
  }, [fen])

  const files = flipped ? [...FILES].reverse() : FILES
  const ranks = flipped ? [...RANKS].reverse() : RANKS

  const handleSquareClick = useCallback((square: string) => {
    if (selected) {
      const targets = legalMoves[selected] ?? []
      if (targets.includes(square)) {
        onMove(selected, square)
        setSelected(null)
        return
      }
    }
    const piece = pieceMap[square]
    if (piece && piece[0] === turn) {
      setSelected(square)
    } else {
      setSelected(null)
    }
  }, [selected, legalMoves, onMove, pieceMap, turn])

  return (
    <div className="aspect-square w-full max-w-[600px] grid grid-cols-8 grid-rows-8 rounded-lg overflow-hidden shadow-2xl border-4 border-brand-gold">
      {ranks.map((rank, ri) =>
        files.map((file, fi) => {
          const square = `${file}${rank}`
          // Use actual rank/file index (not flipped index) for consistent light/dark pattern
          const fileIdx = flipped ? FILES.length - 1 - fi : fi
          const rankIdx = flipped ? RANKS.length - 1 - ri : ri
          const isLight = (fileIdx + rankIdx) % 2 === 0
          const piece = pieceMap[square]
          const isSelected = selected === square
          const isLegalTarget = selected ? (legalMoves[selected] ?? []).includes(square) : false
          const isCheck = inCheck && piece === `${turn}K`

          return (
            <Square
              key={square}
              square={square}
              isLight={isLight}
              piece={piece}
              isSelected={isSelected}
              isLegalTarget={isLegalTarget}
              isCheck={isCheck}
              onClick={() => handleSquareClick(square)}
            />
          )
        })
      )}
    </div>
  )
}
