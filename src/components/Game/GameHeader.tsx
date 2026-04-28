interface GameHeaderProps {
  turn: 'w' | 'b'
  playerWhite: string
  playerBlack: string
  isCheck: boolean
  isCheckmate: boolean
  isStalemate: boolean
}

export function GameHeader({ turn, playerWhite, playerBlack, isCheck, isCheckmate, isStalemate }: GameHeaderProps) {
  const currentPlayer = turn === 'w' ? playerWhite : playerBlack

  let status = `Your turn, ${currentPlayer}!`
  if (isCheckmate) status = `Checkmate! ${turn === 'w' ? playerBlack : playerWhite} wins!`
  else if (isStalemate) status = "Stalemate — it's a draw!"
  else if (isCheck) status = `Check! ${currentPlayer}, be careful!`

  return (
    <div className="text-center py-3 px-4 bg-brand-green text-white rounded-xl font-bold text-lg shadow w-full max-w-[600px]">
      {status}
    </div>
  )
}
