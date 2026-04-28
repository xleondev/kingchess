const PIECES: Record<string, string> = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
}

interface PieceProps {
  type: string
}

export function Piece({ type }: PieceProps) {
  return (
    <span
      className="select-none leading-none drop-shadow-md"
      style={{ fontSize: '2.2rem' }}
      aria-label={type}
    >
      {PIECES[type] ?? ''}
    </span>
  )
}
