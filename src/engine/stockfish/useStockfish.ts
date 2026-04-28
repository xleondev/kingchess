import { useRef, useCallback, useEffect } from 'react'

const SKILL_MAP: Record<string, number> = {
  easy: 3,
  medium: 10,
  hard: 18,
}

type PendingCall = {
  fen: string
  depth: number
  skill: number
  resolve: (move: string) => void
  reject: (err: Error) => void
}

export function useStockfish() {
  const workerRef = useRef<Worker | null>(null)
  const readyRef = useRef(false)
  const pendingRef = useRef<PendingCall | null>(null)
  const queueRef = useRef<PendingCall[]>([])

  const processNext = useCallback(() => {
    if (pendingRef.current || queueRef.current.length === 0 || !readyRef.current) return
    const call = queueRef.current.shift()!
    pendingRef.current = call
    const worker = workerRef.current!
    worker.postMessage(`setoption name Skill Level value ${call.skill}`)
    worker.postMessage(`position fen ${call.fen}`)
    worker.postMessage(`go depth ${call.depth}`)
  }, [])

  useEffect(() => {
    const worker = new Worker('/stockfish.worker.js')
    workerRef.current = worker

    const handleMessage = (e: MessageEvent<string>) => {
      const line = e.data
      if (line === 'uciok' || line.startsWith('readyok')) {
        readyRef.current = true
        processNext()
        return
      }
      if (line.startsWith('bestmove')) {
        const pending = pendingRef.current
        pendingRef.current = null
        if (pending) {
          const move = line.split(' ')[1]
          pending.resolve(move === '(none)' ? '' : move)
        }
        processNext()
      }
    }

    const handleError = (e: ErrorEvent) => {
      const pending = pendingRef.current
      pendingRef.current = null
      if (pending) pending.reject(new Error(e.message ?? 'Worker error'))
      // Drain queue with rejections
      while (queueRef.current.length > 0) {
        queueRef.current.shift()!.reject(new Error('Worker error'))
      }
    }

    worker.addEventListener('message', handleMessage)
    worker.addEventListener('error', handleError as EventListener)
    worker.postMessage('uci')

    return () => {
      // Reject any pending/queued calls on unmount
      const pending = pendingRef.current
      if (pending) pending.reject(new Error('Worker terminated'))
      pendingRef.current = null
      while (queueRef.current.length > 0) {
        queueRef.current.shift()!.reject(new Error('Worker terminated'))
      }
      worker.removeEventListener('message', handleMessage)
      worker.removeEventListener('error', handleError as EventListener)
      worker.terminate()
      workerRef.current = null
      readyRef.current = false
    }
  }, [processNext])

  const getBestMove = useCallback((
    fen: string,
    depth = 10,
    difficulty: 'easy' | 'medium' | 'hard' | 'adaptive' = 'medium'
  ): Promise<string> => {
    const skill = SKILL_MAP[difficulty] ?? 10
    return new Promise((resolve, reject) => {
      if (!workerRef.current) { resolve(''); return }
      queueRef.current.push({ fen, depth, skill, resolve, reject })
      processNext()
    })
  }, [processNext])

  return { getBestMove }
}
