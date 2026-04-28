import { renderHook, act } from '@testing-library/react'
import { useChessGame } from './useChessGame'

describe('useChessGame', () => {
  it('starts with initial board position', () => {
    const { result } = renderHook(() => useChessGame())
    expect(result.current.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  })

  it('returns legal moves for a square', () => {
    const { result } = renderHook(() => useChessGame())
    const moves = result.current.getLegalMoves('e2')
    expect(moves).toContain('e3')
    expect(moves).toContain('e4')
  })

  it('makes a move and updates fen', () => {
    const { result } = renderHook(() => useChessGame())
    act(() => { result.current.makeMove('e2', 'e4') })
    expect(result.current.fen).not.toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    expect(result.current.turn).toBe('b')
  })

  it('rejects illegal moves', () => {
    const { result } = renderHook(() => useChessGame())
    act(() => { result.current.makeMove('e2', 'e5') })
    expect(result.current.turn).toBe('w') // unchanged
  })

  it('detects checkmate', () => {
    const { result } = renderHook(() => useChessGame({ fen: '4k3/4Q3/4K3/8/8/8/8/8 b - - 0 1' }))
    expect(result.current.isCheckmate).toBe(true)
    expect(result.current.gameOver).toBe(true)
  })

  it('detects check', () => {
    const { result } = renderHook(() => useChessGame({ fen: 'rnbqkbnr/ppp1pppp/8/1B1p4/4P3/8/PPPP1PPP/RNBQK1NR b KQkq - 1 2' }))
    expect(result.current.isCheck).toBe(true)
  })

  it('resets game', () => {
    const { result } = renderHook(() => useChessGame())
    act(() => { result.current.makeMove('e2', 'e4') })
    act(() => { result.current.reset() })
    expect(result.current.turn).toBe('w')
    expect(result.current.history).toHaveLength(0)
  })
})
