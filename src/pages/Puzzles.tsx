import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Chess } from 'chess.js'
import { PUZZLES } from '../puzzles/puzzles'
import { Board } from '../components/Board/Board'
import { useProgress } from '../lib/progress/useProgress'

export function Puzzles() {
  const navigate = useNavigate()
  const { completedPuzzles, completePuzzle } = useProgress()
  const [activePuzzleId, setActivePuzzleId] = useState<string | null>(null)
  const [chess, setChess] = useState<Chess | null>(null)
  const [fen, setFen] = useState('')
  const [solutionIdx, setSolutionIdx] = useState(0)
  const [status, setStatus] = useState<'playing' | 'correct' | 'wrong'>('playing')
  const [showHint, setShowHint] = useState(false)

  const puzzle = PUZZLES.find((p) => p.id === activePuzzleId)

  const startPuzzle = useCallback((id: string) => {
    const p = PUZZLES.find((x) => x.id === id)!
    const c = new Chess(p.fen)
    setChess(c)
    setFen(c.fen())
    setSolutionIdx(0)
    setStatus('playing')
    setShowHint(false)
    setActivePuzzleId(id)
  }, [])

  const legalMoves = useMemo(() => {
    if (!chess || status !== 'playing') return {}
    const map: Record<string, string[]> = {}
    'abcdefgh'.split('').forEach((file) => {
      for (let rank = 1; rank <= 8; rank++) {
        const sq = `${file}${rank}`
        const moves = chess.moves({ square: sq as any, verbose: true }).map((m) => m.to)
        if (moves.length) map[sq] = moves
      }
    })
    return map
  }, [fen, status, chess])

  const handleMove = useCallback((from: string, to: string) => {
    if (!chess || !puzzle || status !== 'playing') return
    const expectedMove = puzzle.solution[solutionIdx]
    const playedMove = `${from}${to}`

    if (playedMove === expectedMove) {
      try {
        chess.move({ from: from as any, to: to as any, promotion: 'q' })
        setFen(chess.fen())
        if (solutionIdx + 1 >= puzzle.solution.length) {
          setStatus('correct')
          completePuzzle(puzzle.id)
        } else {
          setSolutionIdx((i) => i + 1)
        }
      } catch {
        setStatus('wrong')
        setTimeout(() => {
          chess.load(puzzle.fen)
          setFen(chess.fen())
          setSolutionIdx(0)
          setStatus('playing')
        }, 1200)
      }
    } else {
      setStatus('wrong')
      setTimeout(() => {
        chess.load(puzzle.fen)
        setFen(chess.fen())
        setSolutionIdx(0)
        setStatus('playing')
      }, 1200)
    }
  }, [chess, puzzle, solutionIdx, status, completePuzzle])

  if (puzzle && chess) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col items-center p-4 gap-4 max-w-lg mx-auto">
        <button onClick={() => setActivePuzzleId(null)} className="self-start text-brand-green font-semibold">← Puzzles</button>
        <h1 className="text-2xl font-bold text-brand-green">{puzzle.title}</h1>
        <p className="text-sm text-gray-500 capitalize">{puzzle.difficulty}</p>

        {status === 'correct' && (
          <div className="text-green-600 font-bold text-xl bg-green-50 px-4 py-2 rounded-xl w-full text-center">
            Solved!
          </div>
        )}
        {status === 'wrong' && (
          <div className="text-red-500 font-bold text-xl bg-red-50 px-4 py-2 rounded-xl w-full text-center">
            Not quite — try again!
          </div>
        )}

        <Board
          fen={fen}
          turn={chess.turn()}
          onMove={handleMove}
          legalMoves={legalMoves}
          inCheck={chess.inCheck()}
        />

        <div className="flex gap-3">
          <button
            onClick={() => setShowHint(true)}
            className="bg-brand-gold text-white px-4 py-2 rounded-xl font-semibold"
          >
            Hint
          </button>
          <button
            onClick={() => startPuzzle(puzzle.id)}
            className="bg-gray-400 text-white px-4 py-2 rounded-xl font-semibold"
          >
            Reset
          </button>
        </div>

        {showHint && (
          <p className="text-gray-700 bg-yellow-50 p-3 rounded-xl border border-yellow-300 w-full">
            {puzzle.hint}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-cream p-4 max-w-lg mx-auto">
      <button onClick={() => navigate('/')} className="text-brand-green font-semibold">← Home</button>
      <h1 className="text-3xl font-bold text-brand-green mt-4 mb-6">Puzzles</h1>
      <div className="flex flex-col gap-3">
        {PUZZLES.map((p) => {
          const done = completedPuzzles.includes(p.id)
          return (
            <button
              key={p.id}
              onClick={() => startPuzzle(p.id)}
              className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow text-left hover:bg-gray-50 transition-colors"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                done ? 'bg-green-500 text-white' : 'bg-brand-green text-white'
              }`}>
                {done ? '✓' : '♟'}
              </div>
              <div>
                <p className="font-bold text-gray-800">{p.title}</p>
                <p className="text-sm text-gray-500 capitalize">{p.difficulty}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
