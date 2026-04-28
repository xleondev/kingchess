import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './client'
import { Chess } from 'chess.js'

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export type OnlineGameStatus = 'idle' | 'waiting' | 'active' | 'done'

export function useOnlineGame() {
  const [roomCode, setRoomCode] = useState('')
  const [gameId, setGameId] = useState<string | null>(null)
  const [playerColor, setPlayerColor] = useState<'w' | 'b' | null>(null)
  const chessRef = useRef(new Chess())
  const [fen, setFen] = useState(chessRef.current.fen())
  const [status, setStatus] = useState<OnlineGameStatus>('idle')
  const [error, setError] = useState('')

  const createRoom = useCallback(async () => {
    setError('')
    const code = generateRoomCode()
    const { data, error: err } = await supabase
      .from('games')
      .insert({ room_code: code })
      .select()
      .single()

    if (err || !data) {
      setError(err?.message ?? 'Failed to create room')
      return
    }
    setRoomCode(code)
    setGameId(data.id as string)
    setPlayerColor('w')
    setStatus('waiting')
  }, [])

  const joinRoom = useCallback(async (code: string) => {
    setError('')
    const upper = code.toUpperCase()
    const { data, error: err } = await supabase
      .from('games')
      .select()
      .eq('room_code', upper)
      .single()

    if (err || !data) {
      setError('Room not found')
      return
    }

    const { error: updateErr } = await supabase
      .from('games')
      .update({ status: 'active' })
      .eq('id', data.id)

    if (updateErr) {
      setError(updateErr.message)
      return
    }

    setRoomCode(upper)
    setGameId(data.id as string)
    setPlayerColor('b')
    setStatus('active')
  }, [])

  // Subscribe to real-time move updates and game status changes
  useEffect(() => {
    if (!gameId) return

    const chess = chessRef.current

    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_moves',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const newFen = (payload.new as { fen: string }).fen
          try {
            chess.load(newFen)
            setFen(chess.fen())
          } catch {
            // Invalid FEN from server — ignore
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status: string }).status
          if (newStatus === 'active') setStatus('active')
          if (newStatus === 'done') setStatus('done')
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId])

  const sendMove = useCallback(async (from: string, to: string): Promise<boolean> => {
    if (!gameId) return false
    const chess = chessRef.current
    try {
      const result = chess.move({ from: from as any, to: to as any, promotion: 'q' })
      if (!result) return false
    } catch {
      return false
    }

    const newFen = chess.fen()
    setFen(newFen)

    const { error: err } = await supabase.from('game_moves').insert({
      game_id: gameId,
      move: `${from}${to}`,
      fen: newFen,
    })

    if (err) {
      // Rollback local move on network failure
      chess.undo()
      setFen(chess.fen())
      return false
    }

    return true
  }, [gameId])

  const chess = chessRef.current
  return {
    roomCode,
    gameId,
    playerColor,
    fen,
    status,
    error,
    turn: chess.turn() as 'w' | 'b',
    isCheck: chess.inCheck(),
    isCheckmate: chess.isCheckmate(),
    isStalemate: chess.isStalemate(),
    gameOver: chess.isGameOver(),
    getLegalMoves: useCallback(
      (sq: string) => chess.moves({ square: sq as any, verbose: true }).map((m) => m.to),
      [fen]
    ),
    createRoom,
    joinRoom,
    sendMove,
  }
}
