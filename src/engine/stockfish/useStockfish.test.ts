import { renderHook, act } from '@testing-library/react'
import { useStockfish } from './useStockfish'

// Mock the worker in test environment
vi.mock('./stockfish.worker.ts?worker', () => ({
  default: class MockWorker {
    onmessage: ((e: MessageEvent) => void) | null = null
    postMessage(msg: string) {
      if (msg.startsWith('position') || msg.startsWith('go')) {
        setTimeout(() => {
          this.onmessage?.({ data: 'bestmove e2e4 ponder e7e5' } as MessageEvent)
        }, 10)
      } else {
        this.onmessage?.({ data: 'readyok' } as MessageEvent)
      }
    }
    terminate() {}
  },
}))

describe('useStockfish', () => {
  it('returns a best move for a given fen', async () => {
    const { result } = renderHook(() => useStockfish())
    let move = ''
    await act(async () => {
      move = await result.current.getBestMove(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        1
      )
    })
    expect(move).toMatch(/^[a-h][1-8][a-h][1-8]/)
  })
})
