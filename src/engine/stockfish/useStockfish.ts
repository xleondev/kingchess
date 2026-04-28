import { useRef, useCallback, useEffect } from 'react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import StockfishWorker from './stockfish.worker.ts?worker'

// Difficulty → Skill Level mapping (Stockfish UCI Skill Level 0-20)
const SKILL_MAP: Record<string, number> = {
  easy: 3,    // ~600 Elo
  medium: 10, // ~1200 Elo
  hard: 18,   // ~1800 Elo
}

export function useStockfish() {
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    workerRef.current = new StockfishWorker()
    workerRef.current.postMessage('uci')
    return () => { workerRef.current?.terminate() }
  }, [])

  const getBestMove = useCallback((
    fen: string,
    depth = 10,
    difficulty: 'easy' | 'medium' | 'hard' | 'adaptive' = 'medium'
  ): Promise<string> => {
    return new Promise((resolve) => {
      const worker = workerRef.current
      if (!worker) return resolve('')

      const skill = SKILL_MAP[difficulty] ?? 10

      const prevOnMessage = worker.onmessage

      worker.onmessage = (e: MessageEvent<string>) => {
        if (e.data.startsWith('bestmove')) {
          worker.onmessage = prevOnMessage
          const move = e.data.split(' ')[1]
          resolve(move === '(none)' ? '' : move)
        }
      }

      worker.postMessage(`setoption name Skill Level value ${skill}`)
      worker.postMessage(`position fen ${fen}`)
      worker.postMessage(`go depth ${depth}`)
    })
  }, [])

  return { getBestMove }
}
