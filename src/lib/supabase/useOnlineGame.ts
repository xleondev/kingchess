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
  const playerColorRef = useRef<'w' | 'b' | null>(null)
  const chessRef = useRef(new Chess())
  const [fen, setFen] = useState(chessRef.current.fen())
  const [status, setStatus] = useState<OnlineGameStatus>('idle')
  const [error, setError] = useState('')
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

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
    playerColorRef.current = 'w'
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

    playerColorRef.current = 'b'
    setRoomCode(upper)
    setGameId(data.id as string)
    setPlayerColor('b')
    setStatus('active')
  }, [])

  // Subscribe to channel — send join signal only after subscription is confirmed
  useEffect(() => {
    if (!gameId) return

    const chess = chessRef.current

    const channel = supabase
      .channel(`game:${gameId}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'player_joined' }, () => {
        setStatus('active')
      })
      .on('broadcast', { event: 'move' }, ({ payload }) => {
        try {
          chess.load(payload.fen as string)
          setFen(chess.fen())
        } catch {
          // Invalid FEN — ignore
        }
      })
      .subscribe((subStatus) => {
        // Only Player 2 sends the join signal, and only once fully subscribed
        if (subStatus === 'SUBSCRIBED' && playerColorRef.current === 'b') {
          channel.send({
            type: 'broadcast',
            event: 'player_joined',
            payload: {},
          })
        }
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [gameId])

  const sendMove = useCallback(async (from: string, to: string): Promise<boolean> => {
    if (!gameId || !channelRef.current) return false
    const chess = chessRef.current
    try {
      const result = chess.move({ from: from as any, to: to as any, promotion: 'q' })
      if (!result) return false
    } catch {
      return false
    }

    const newFen = chess.fen()
    setFen(newFen)

    // Broadcast move to opponent
    channelRef.current.send({
      type: 'broadcast',
      event: 'move',
      payload: { fen: newFen },
    })

    // Persist to DB
    supabase.from('game_moves').insert({
      game_id: gameId,
      move: `${from}${to}`,
      fen: newFen,
    })

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
