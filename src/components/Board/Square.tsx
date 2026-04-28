import { Piece } from './Piece'

interface SquareProps {
  square: string
  isLight: boolean
  piece?: string
  isSelected: boolean
  isLegalTarget: boolean
  isCheck: boolean
  onClick: () => void
}

export function Square({ square, isLight, piece, isSelected, isLegalTarget, isCheck, onClick }: SquareProps) {
  let bg = isLight ? 'bg-board-light' : 'bg-board-dark'
  if (isSelected) bg = 'bg-board-highlight'
  if (isCheck) bg = 'bg-board-check'

  return (
    <div
      data-square={square}
      className={`${bg} relative flex items-center justify-center cursor-pointer w-full h-full transition-colors`}
      onClick={onClick}
    >
      {piece && <Piece type={piece} />}
      {isLegalTarget && (
        <div
          data-legal-dot
          className={`absolute rounded-full pointer-events-none ${
            piece
              ? 'inset-0 border-4 border-black/30'
              : 'w-1/3 h-1/3 bg-black/20'
          }`}
        />
      )}
    </div>
  )
}
