import wK from '../../assets/pieces/wK.svg'
import wQ from '../../assets/pieces/wQ.svg'
import wR from '../../assets/pieces/wR.svg'
import wB from '../../assets/pieces/wB.svg'
import wN from '../../assets/pieces/wN.svg'
import wP from '../../assets/pieces/wP.svg'
import bK from '../../assets/pieces/bK.svg'
import bQ from '../../assets/pieces/bQ.svg'
import bR from '../../assets/pieces/bR.svg'
import bB from '../../assets/pieces/bB.svg'
import bN from '../../assets/pieces/bN.svg'
import bP from '../../assets/pieces/bP.svg'

const PIECES: Record<string, string> = {
  wK, wQ, wR, wB, wN, wP,
  bK, bQ, bR, bB, bN, bP,
}

interface PieceProps {
  type: string
}

export function Piece({ type }: PieceProps) {
  const src = PIECES[type]
  if (!src) return null
  return (
    <img
      src={src}
      alt={type}
      className="select-none drop-shadow-md w-4/5 h-4/5 pointer-events-none"
    />
  )
}
