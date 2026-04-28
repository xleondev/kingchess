import { renderHook, act } from '@testing-library/react'
import { useStockfish } from './useStockfish'

vi.mock('./stockfish.worker.ts?worker', () => ({
  default: class MockWorker {
    private handlers = new Map<string, Set<EventListener>>()

    addEventListener(type: string, handler: EventListener) {
      if (!this.handlers.has(type)) this.handlers.set(type, new Set())
      this.handlers.get(type)!.add(handler)
    }

    removeEventListener(type: string, handler: EventListener) {
      this.handlers.get(type)?.delete(handler)
    }

    emit(type: string, data: string) {
      const event = { data } as MessageEvent
      this.handlers.get(type)?.forEach(h => h(event as unknown as Event))
    }

    postMessage(msg: string) {
      if (msg === 'uci') {
        setTimeout(() => this.emit('message', 'uciok'), 5)
      } else if (msg.startsWith('go')) {
        setTimeout(() => this.emit('message', 'bestmove e2e4 ponder e7e5'), 10)
      }
    }

    terminate() {
      this.handlers.clear()
    }
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

  it('returns empty string when bestmove is (none)', async () => {
    // Override mock to return (none)
    const MockWorkerClass = (await vi.importMock('./stockfish.worker.ts?worker') as any).default
    const originalPostMessage = MockWorkerClass.prototype.postMessage
    MockWorkerClass.prototype.postMessage = function(msg: string) {
      if (msg === 'uci') setTimeout(() => this.emit('message', 'uciok'), 5)
      else if (msg.startsWith('go')) setTimeout(() => this.emit('message', 'bestmove (none)'), 10)
    }

    const { result } = renderHook(() => useStockfish())
    let move = 'not-empty'
    await act(async () => {
      move = await result.current.getBestMove('4k3/4Q3/4K3/8/8/8/8/8 b - - 0 1', 1)
    })
    expect(move).toBe('')

    MockWorkerClass.prototype.postMessage = originalPostMessage
  })

  it('serialises concurrent calls correctly', async () => {
    const { result } = renderHook(() => useStockfish())
    const moves: string[] = []
    await act(async () => {
      const [m1, m2] = await Promise.all([
        result.current.getBestMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 1),
        result.current.getBestMove('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1', 1),
      ])
      moves.push(m1, m2)
    })
    expect(moves).toHaveLength(2)
    moves.forEach(m => expect(m).toMatch(/^[a-h][1-8][a-h][1-8]/))
  })
})
