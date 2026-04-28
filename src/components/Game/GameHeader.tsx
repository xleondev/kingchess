interface GameHeaderProps {
  turn: 'w' | 'b'
  playerWhite: string
  playerBlack: string
  isCheck: boolean
  isCheckmate: boolean
  isStalemate: boolean
  thinking?: boolean
}

export function GameHeader({ turn, playerWhite, playerBlack, isCheck, isCheckmate, isStalemate, thinking }: GameHeaderProps) {
  const currentPlayer = turn === 'w' ? playerWhite : playerBlack

  let status = `Your turn, ${currentPlayer}!`
  if (isCheckmate) status = `Checkmate! ${turn === 'w' ? playerBlack : playerWhite} wins!`
  else if (isStalemate) status = "Stalemate — it's a draw!"
  else if (isCheck) status = `Check! ${currentPlayer}, be careful!`
  else if (thinking) status = `${currentPlayer} is thinking…`

  return (
    <div className={`text-center py-3 px-4 bg-brand-green text-white rounded-xl font-bold text-lg shadow w-full max-w-[600px]${thinking ? ' animate-pulse' : ''}`}>
      {status}
    </div>
  )
}
