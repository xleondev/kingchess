# KingChess Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a kid-friendly chess web app with lessons, puzzles, local P2P, online P2P (Supabase real-time), and vs Machine (Stockfish.js WASM), deployable to Cloudflare Pages.

**Architecture:** Vite + React + TypeScript SPA. All game logic runs client-side (chess.js for rules, Stockfish.js WASM Web Worker for AI). Supabase anonymous real-time channels handle online P2P. Progress and profile stored in localStorage.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS v3, chess.js, stockfish (npm WASM package), @supabase/supabase-js, Vitest, React Testing Library

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`, `src/index.css`

**Step 1: Scaffold Vite project**

```bash
cd /Users/louis_ng/projects/kingchess
npm create vite@latest . -- --template react-ts
npm install
```

**Step 2: Install dependencies**

```bash
npm install chess.js @supabase/supabase-js
npm install stockfish
npm install -D tailwindcss@3 postcss autoprefixer
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npx tailwindcss init -p
```

**Step 3: Configure Tailwind — edit `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        board: {
          light: '#f0d9b5',
          dark: '#b58863',
          highlight: '#f6f669',
          legal: 'rgba(0,0,0,0.15)',
          check: 'rgba(220,38,38,0.6)',
        },
        brand: {
          green: '#1a6b3c',
          gold: '#d4a017',
          cream: '#fdf6e3',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
```

**Step 4: Configure Vitest — edit `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

**Step 5: Create test setup — `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom'
```

**Step 6: Update `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-brand-cream font-sans;
}
```

**Step 7: Replace `src/App.tsx` with placeholder**

```tsx
export default function App() {
  return <div className="min-h-screen bg-brand-cream flex items-center justify-center">
    <h1 className="text-4xl font-bold text-brand-green">KingChess</h1>
  </div>
}
```

**Step 8: Run dev server to verify**

```bash
npm run dev
```
Expected: Browser shows "KingChess" on cream background.

**Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TypeScript + Tailwind project"
```

---

## Task 2: Chess Engine Wrapper

**Files:**
- Create: `src/engine/chess/useChessGame.ts`
- Create: `src/engine/chess/useChessGame.test.ts`

**Step 1: Write failing tests — `src/engine/chess/useChessGame.test.ts`**

```ts
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
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/engine/chess/useChessGame.test.ts
```
Expected: FAIL — module not found.

**Step 3: Implement — `src/engine/chess/useChessGame.ts`**

```ts
import { useState, useCallback } from 'react'
import { Chess } from 'chess.js'

interface UseChessGameOptions {
  fen?: string
}

export function useChessGame(options: UseChessGameOptions = {}) {
  const [chess] = useState(() => new Chess(options.fen))
  const [fen, setFen] = useState(chess.fen())
  const [history, setHistory] = useState<string[]>([])

  const sync = useCallback(() => {
    setFen(chess.fen())
    setHistory(chess.history())
  }, [chess])

  const getLegalMoves = useCallback((square: string): string[] => {
    return chess.moves({ square: square as any, verbose: true }).map((m) => m.to)
  }, [chess])

  const makeMove = useCallback((from: string, to: string, promotion = 'q'): boolean => {
    try {
      const move = chess.move({ from: from as any, to: to as any, promotion })
      if (move) { sync(); return true }
      return false
    } catch {
      return false
    }
  }, [chess, sync])

  const reset = useCallback((newFen?: string) => {
    if (newFen) chess.load(newFen)
    else chess.reset()
    sync()
  }, [chess, sync])

  return {
    fen,
    history,
    turn: chess.turn() as 'w' | 'b',
    isCheck: chess.inCheck(),
    isCheckmate: chess.isCheckmate(),
    isStalemate: chess.isStalemate(),
    isDraw: chess.isDraw(),
    gameOver: chess.isGameOver(),
    getLegalMoves,
    makeMove,
    reset,
    pgn: chess.pgn(),
  }
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/engine/chess/useChessGame.test.ts
```
Expected: All 7 tests PASS.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add chess engine hook with move validation"
```

---

## Task 3: Stockfish Web Worker

**Files:**
- Create: `src/engine/stockfish/stockfish.worker.ts`
- Create: `src/engine/stockfish/useStockfish.ts`
- Create: `src/engine/stockfish/useStockfish.test.ts`

**Step 1: Write failing test — `src/engine/stockfish/useStockfish.test.ts`**

```ts
import { renderHook, act, waitFor } from '@testing-library/react'
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
```

**Step 2: Run to verify it fails**

```bash
npx vitest run src/engine/stockfish/useStockfish.test.ts
```
Expected: FAIL — module not found.

**Step 3: Create worker — `src/engine/stockfish/stockfish.worker.ts`**

```ts
import Stockfish from 'stockfish'

const engine = Stockfish()

engine.onmessage = (line: string) => {
  postMessage(line)
}

onmessage = (e: MessageEvent<string>) => {
  engine.postMessage(e.data)
}
```

**Step 4: Implement hook — `src/engine/stockfish/useStockfish.ts`**

```ts
import { useRef, useCallback, useEffect } from 'react'
import StockfishWorker from './stockfish.worker.ts?worker'

// Difficulty → Elo mapping
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

      const handler = (e: MessageEvent<string>) => {
        if (e.data.startsWith('bestmove')) {
          const move = e.data.split(' ')[1]
          worker.removeEventListener('message', handler)
          resolve(move === '(none)' ? '' : move)
        }
      }

      worker.addEventListener('message', handler)
      worker.postMessage(`setoption name Skill Level value ${skill}`)
      worker.postMessage(`position fen ${fen}`)
      worker.postMessage(`go depth ${depth}`)
    })
  }, [])

  return { getBestMove }
}
```

**Step 5: Run test to verify it passes**

```bash
npx vitest run src/engine/stockfish/useStockfish.test.ts
```
Expected: PASS.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Stockfish.js WASM web worker with difficulty levels"
```

---

## Task 4: Chessboard Component

**Files:**
- Create: `src/components/Board/Board.tsx`
- Create: `src/components/Board/Square.tsx`
- Create: `src/components/Board/Piece.tsx`
- Create: `src/components/Board/Board.test.tsx`

**Step 1: Write failing tests — `src/components/Board/Board.test.tsx`**

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Board } from './Board'

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

describe('Board', () => {
  it('renders 64 squares', () => {
    render(<Board fen={INITIAL_FEN} onMove={() => {}} turn="w" />)
    expect(document.querySelectorAll('[data-square]')).toHaveLength(64)
  })

  it('shows legal move dots when a piece is clicked', () => {
    render(<Board fen={INITIAL_FEN} onMove={() => {}} turn="w" legalMoves={{ e2: ['e3', 'e4'] }} />)
    fireEvent.click(document.querySelector('[data-square="e2"]')!)
    expect(document.querySelectorAll('[data-legal-dot]').length).toBeGreaterThan(0)
  })

  it('calls onMove when a legal destination is clicked', () => {
    const onMove = vi.fn()
    render(<Board fen={INITIAL_FEN} onMove={onMove} turn="w" legalMoves={{ e2: ['e3', 'e4'] }} />)
    fireEvent.click(document.querySelector('[data-square="e2"]')!)
    fireEvent.click(document.querySelector('[data-square="e4"]')!)
    expect(onMove).toHaveBeenCalledWith('e2', 'e4')
  })
})
```

**Step 2: Run to verify they fail**

```bash
npx vitest run src/components/Board/Board.test.tsx
```
Expected: FAIL — module not found.

**Step 3: Create Piece component — `src/components/Board/Piece.tsx`**

```tsx
// Unicode chess pieces — clean and universally available
const PIECES: Record<string, string> = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
}

interface PieceProps {
  type: string // e.g. 'wP', 'bK'
}

export function Piece({ type }: PieceProps) {
  return (
    <span
      className="select-none text-4xl leading-none drop-shadow-md"
      style={{ fontSize: '2.2rem' }}
      aria-label={type}
    >
      {PIECES[type] ?? ''}
    </span>
  )
}
```

**Step 4: Create Square component — `src/components/Board/Square.tsx`**

```tsx
import { Piece } from './Piece'

interface SquareProps {
  square: string          // e.g. 'e4'
  isLight: boolean
  piece?: string          // e.g. 'wP'
  isSelected: boolean
  isLegalTarget: boolean
  isCheck: boolean
  onClick: () => void
}

export function Square({ square, isLight, piece, isSelected, isLegalTarget, isCheck, onClick }: SquareProps) {
  let bg = isLight ? 'bg-board-light' : 'bg-board-dark'
  if (isSelected) bg = 'bg-board-highlight'
  if (isCheck && piece?.endsWith('K')) bg = 'bg-board-check'

  return (
    <div
      data-square={square}
      className={`${bg} relative flex items-center justify-center cursor-pointer w-full h-full transition-colors`}
      onClick={onClick}
    >
      {piece && <Piece type={piece} />}
      {isLegalTarget && (
        <div
          data-legal-dot
          className={`absolute rounded-full pointer-events-none ${
            piece
              ? 'inset-0 border-4 border-black/30'
              : 'w-1/3 h-1/3 bg-black/20'
          }`}
        />
      )}
    </div>
  )
}
```

**Step 5: Create Board component — `src/components/Board/Board.tsx`**

```tsx
import { useState, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Square } from './Square'

interface BoardProps {
  fen: string
  turn: 'w' | 'b'
  onMove: (from: string, to: string) => void
  legalMoves?: Record<string, string[]>
  inCheck?: boolean
  flipped?: boolean
}

function fenToPieceMap(fen: string): Record<string, string> {
  const chess = new Chess(fen)
  const board = chess.board()
  const map: Record<string, string> = {}
  board.forEach((row, rankIdx) => {
    row.forEach((sq, fileIdx) => {
      if (sq) {
        const file = 'abcdefgh'[fileIdx]
        const rank = 8 - rankIdx
        map[`${file}${rank}`] = `${sq.color}${sq.type.toUpperCase()}`
      }
    })
  })
  return map
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1]

export function Board({ fen, turn, onMove, legalMoves = {}, inCheck = false, flipped = false }: BoardProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const pieceMap = fenToPieceMap(fen)

  const files = flipped ? [...FILES].reverse() : FILES
  const ranks = flipped ? [...RANKS].reverse() : RANKS

  const handleSquareClick = useCallback((square: string) => {
    if (selected) {
      const targets = legalMoves[selected] ?? []
      if (targets.includes(square)) {
        onMove(selected, square)
        setSelected(null)
        return
      }
    }
    // Select piece of current player
    const piece = pieceMap[square]
    if (piece && piece[0] === turn) {
      setSelected(square)
    } else {
      setSelected(null)
    }
  }, [selected, legalMoves, onMove, pieceMap, turn])

  return (
    <div className="aspect-square w-full max-w-[600px] grid grid-cols-8 grid-rows-8 rounded-lg overflow-hidden shadow-2xl border-4 border-brand-gold">
      {ranks.map((rank) =>
        files.map((file) => {
          const square = `${file}${rank}`
          const fileIdx = FILES.indexOf(file)
          const rankIdx = RANKS.indexOf(rank)
          const isLight = (fileIdx + rankIdx) % 2 === 0
          const piece = pieceMap[square]
          const isSelected = selected === square
          const isLegalTarget = selected ? (legalMoves[selected] ?? []).includes(square) : false
          const isCheck = inCheck && piece === `${turn}K`

          return (
            <Square
              key={square}
              square={square}
              isLight={isLight}
              piece={piece}
              isSelected={isSelected}
              isLegalTarget={isLegalTarget}
              isCheck={isCheck}
              onClick={() => handleSquareClick(square)}
            />
          )
        })
      )}
    </div>
  )
}
```

**Step 6: Run tests**

```bash
npx vitest run src/components/Board/Board.test.tsx
```
Expected: All 3 tests PASS.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add interactive chessboard component with legal move highlights"
```

---

## Task 5: Router & Page Shell

**Files:**
- Create: `src/pages/Home.tsx`
- Create: `src/pages/Play.tsx`
- Create: `src/pages/Learn.tsx`
- Create: `src/pages/Puzzles.tsx`
- Create: `src/pages/Profile.tsx`
- Modify: `src/App.tsx`

**Step 1: Install router**

```bash
npm install react-router-dom
```

**Step 2: Create Home page — `src/pages/Home.tsx`**

```tsx
import { useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { label: 'Learn', emoji: '📖', path: '/learn', color: 'bg-brand-green' },
  { label: 'Play', emoji: '♟', path: '/play', color: 'bg-brand-gold' },
  { label: 'Puzzles', emoji: '🧩', path: '/puzzles', color: 'bg-purple-600' },
  { label: 'Profile', emoji: '👑', path: '/profile', color: 'bg-rose-600' },
]

export function Home() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center gap-8 p-6">
      <h1 className="text-5xl font-bold text-brand-green drop-shadow-sm">KingChess</h1>
      <p className="text-lg text-gray-600">Learn. Play. Master.</p>
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {NAV_ITEMS.map(({ label, emoji, path, color }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`${color} text-white rounded-2xl p-6 text-center text-xl font-bold shadow-lg active:scale-95 transition-transform`}
          >
            <div className="text-4xl mb-2">{emoji}</div>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

**Step 3: Create stub pages**

`src/pages/Play.tsx`:
```tsx
import { useNavigate } from 'react-router-dom'
export function Play() {
  const navigate = useNavigate()
  return <div className="p-6"><button onClick={() => navigate('/')}>← Back</button><h1 className="text-3xl font-bold mt-4">Play</h1><p className="mt-2 text-gray-500">Coming soon</p></div>
}
```

`src/pages/Learn.tsx`:
```tsx
import { useNavigate } from 'react-router-dom'
export function Learn() {
  const navigate = useNavigate()
  return <div className="p-6"><button onClick={() => navigate('/')}>← Back</button><h1 className="text-3xl font-bold mt-4">Learn</h1><p className="mt-2 text-gray-500">Coming soon</p></div>
}
```

`src/pages/Puzzles.tsx`:
```tsx
import { useNavigate } from 'react-router-dom'
export function Puzzles() {
  const navigate = useNavigate()
  return <div className="p-6"><button onClick={() => navigate('/')}>← Back</button><h1 className="text-3xl font-bold mt-4">Puzzles</h1><p className="mt-2 text-gray-500">Coming soon</p></div>
}
```

`src/pages/Profile.tsx`:
```tsx
import { useNavigate } from 'react-router-dom'
export function Profile() {
  const navigate = useNavigate()
  return <div className="p-6"><button onClick={() => navigate('/')}>← Back</button><h1 className="text-3xl font-bold mt-4">Profile</h1><p className="mt-2 text-gray-500">Coming soon</p></div>
}
```

**Step 4: Wire router — `src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { Play } from './pages/Play'
import { Learn } from './pages/Learn'
import { Puzzles } from './pages/Puzzles'
import { Profile } from './pages/Profile'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play" element={<Play />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/puzzles" element={<Puzzles />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  )
}
```

**Step 5: Verify in browser**

```bash
npm run dev
```
Expected: Home page shows 4 nav buttons, each navigates to stub page.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add router and page shell with home nav"
```

---

## Task 6: Local P2P Game Mode

**Files:**
- Create: `src/pages/game/LocalGame.tsx`
- Create: `src/components/Game/GameHeader.tsx`
- Create: `src/components/Game/CapturedPieces.tsx`
- Modify: `src/pages/Play.tsx`

**Step 1: Create GameHeader — `src/components/Game/GameHeader.tsx`**

```tsx
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
  else if (isStalemate) status = 'Stalemate — it\'s a draw!'
  else if (isCheck) status = `Check! ${currentPlayer}, be careful!`

  return (
    <div className="text-center py-3 px-4 bg-brand-green text-white rounded-xl font-bold text-lg shadow">
      {status}
    </div>
  )
}
```

**Step 2: Create CapturedPieces — `src/components/Game/CapturedPieces.tsx`**

```tsx
const PIECE_UNICODE: Record<string, string> = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
}

interface CapturedPiecesProps {
  pgn: string
  color: 'w' | 'b'
}

export function CapturedPieces({ pgn, color }: CapturedPiecesProps) {
  // Count captures from PGN — pieces with 'x' in moves
  // Simple display — just show count for now
  return (
    <div className="flex gap-1 flex-wrap min-h-[2rem] items-center">
      {/* Placeholder — enhanced in polish task */}
      <span className="text-gray-400 text-sm">{color === 'w' ? 'White' : 'Black'} captures</span>
    </div>
  )
}
```

**Step 3: Create LocalGame — `src/pages/game/LocalGame.tsx`**

```tsx
import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChessGame } from '../../engine/chess/useChessGame'
import { Board } from '../../components/Board/Board'
import { GameHeader } from '../../components/Game/GameHeader'

interface LocalGameProps {
  playerWhite?: string
  playerBlack?: string
}

export function LocalGame({ playerWhite = 'Player 1', playerBlack = 'Player 2' }: LocalGameProps) {
  const navigate = useNavigate()
  const { fen, turn, isCheck, isCheckmate, isStalemate, gameOver, getLegalMoves, makeMove, reset, pgn } = useChessGame()

  const legalMoves = useMemo(() => {
    const map: Record<string, string[]> = {}
    const files = 'abcdefgh'.split('')
    for (let rank = 1; rank <= 8; rank++) {
      for (const file of files) {
        const sq = `${file}${rank}`
        const moves = getLegalMoves(sq)
        if (moves.length) map[sq] = moves
      }
    }
    return map
  }, [fen, getLegalMoves])

  const handleMove = useCallback((from: string, to: string) => {
    makeMove(from, to)
  }, [makeMove])

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center p-4 gap-4">
      <button onClick={() => navigate('/play')} className="self-start text-brand-green font-semibold">← Back</button>

      <GameHeader
        turn={turn}
        playerWhite={playerWhite}
        playerBlack={playerBlack}
        isCheck={isCheck}
        isCheckmate={isCheckmate}
        isStalemate={isStalemate}
      />

      <Board
        fen={fen}
        turn={turn}
        onMove={handleMove}
        legalMoves={legalMoves}
        inCheck={isCheck}
      />

      {gameOver && (
        <button
          onClick={() => reset()}
          className="bg-brand-gold text-white font-bold py-3 px-8 rounded-xl text-lg shadow-lg"
        >
          Play Again
        </button>
      )}
    </div>
  )
}
```

**Step 4: Update Play page — `src/pages/Play.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LocalGame } from './game/LocalGame'
import { MachineGame } from './game/MachineGame'

type Mode = null | 'local' | 'machine'

export function Play() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>(null)

  if (mode === 'local') return <LocalGame />
  if (mode === 'machine') return <MachineGame />

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center gap-6 p-6">
      <button onClick={() => navigate('/')} className="self-start text-brand-green font-semibold">← Back</button>
      <h1 className="text-3xl font-bold text-brand-green">Choose Mode</h1>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button onClick={() => setMode('local')} className="bg-brand-green text-white py-4 rounded-2xl font-bold text-xl shadow-lg">
          👥 Local 2-Player
        </button>
        <button onClick={() => setMode('machine')} className="bg-brand-gold text-white py-4 rounded-2xl font-bold text-xl shadow-lg">
          🤖 vs Computer
        </button>
        <button className="bg-purple-600 text-white py-4 rounded-2xl font-bold text-xl shadow-lg opacity-80">
          🌐 Online (coming soon)
        </button>
      </div>
    </div>
  )
}
```

Note: `MachineGame` is a stub — implement in next task.

**Step 5: Create stub MachineGame — `src/pages/game/MachineGame.tsx`**

```tsx
import { useNavigate } from 'react-router-dom'
export function MachineGame() {
  const navigate = useNavigate()
  return <div className="p-6"><button onClick={() => navigate('/play')}>← Back</button><p>Machine game coming soon</p></div>
}
```

**Step 6: Verify in browser**

```bash
npm run dev
```
Expected: Play → Local 2-Player shows working chessboard, moves work, turn alternates.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: implement local P2P game mode"
```

---

## Task 7: vs Machine Game Mode

**Files:**
- Modify: `src/pages/game/MachineGame.tsx`

**Step 1: Implement MachineGame — `src/pages/game/MachineGame.tsx`**

```tsx
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChessGame } from '../../engine/chess/useChessGame'
import { useStockfish } from '../../engine/stockfish/useStockfish'
import { Board } from '../../components/Board/Board'
import { GameHeader } from '../../components/Game/GameHeader'

type Difficulty = 'easy' | 'medium' | 'hard' | 'adaptive'

const DIFFICULTY_OPTIONS: { label: string; value: Difficulty }[] = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
  { label: 'Adaptive', value: 'adaptive' },
]

export function MachineGame() {
  const navigate = useNavigate()
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [playerColor] = useState<'w' | 'b'>('w') // player is always white for now
  const [thinking, setThinking] = useState(false)

  const { fen, turn, isCheck, isCheckmate, isStalemate, gameOver, getLegalMoves, makeMove, reset } = useChessGame()
  const { getBestMove } = useStockfish()

  const legalMoves = useMemo(() => {
    if (turn !== playerColor) return {}
    const map: Record<string, string[]> = {}
    'abcdefgh'.split('').forEach((file) => {
      for (let rank = 1; rank <= 8; rank++) {
        const sq = `${file}${rank}`
        const moves = getLegalMoves(sq)
        if (moves.length) map[sq] = moves
      }
    })
    return map
  }, [fen, turn, playerColor, getLegalMoves])

  // Machine's turn
  useEffect(() => {
    if (turn === playerColor || gameOver || !difficulty) return
    setThinking(true)
    getBestMove(fen, 10, difficulty === 'adaptive' ? 'medium' : difficulty).then((move) => {
      if (move && move.length >= 4) {
        makeMove(move.slice(0, 2), move.slice(2, 4))
      }
      setThinking(false)
    })
  }, [turn, fen, gameOver, difficulty])

  if (!difficulty) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center gap-6 p-6">
        <button onClick={() => navigate('/play')} className="self-start text-brand-green font-semibold">← Back</button>
        <h1 className="text-3xl font-bold text-brand-green">Choose Difficulty</h1>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          {DIFFICULTY_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setDifficulty(value)}
              className="bg-brand-green text-white py-4 rounded-2xl font-bold text-xl shadow-lg"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center p-4 gap-4">
      <button onClick={() => navigate('/play')} className="self-start text-brand-green font-semibold">← Back</button>

      <GameHeader
        turn={turn}
        playerWhite="You"
        playerBlack={`Computer (${difficulty})`}
        isCheck={isCheck}
        isCheckmate={isCheckmate}
        isStalemate={isStalemate}
      />

      {thinking && <p className="text-brand-green font-semibold animate-pulse">Computer is thinking...</p>}

      <Board
        fen={fen}
        turn={turn}
        onMove={(from, to) => makeMove(from, to)}
        legalMoves={legalMoves}
        inCheck={isCheck}
      />

      {gameOver && (
        <button onClick={() => reset()} className="bg-brand-gold text-white font-bold py-3 px-8 rounded-xl text-lg shadow-lg">
          Play Again
        </button>
      )}
    </div>
  )
}
```

**Step 2: Verify in browser**

```bash
npm run dev
```
Expected: Play → vs Computer → pick difficulty → play a game, computer responds automatically.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: implement vs machine game mode with Stockfish difficulty levels"
```

---

## Task 8: localStorage Progress Store

**Files:**
- Create: `src/lib/progress/useProgress.ts`
- Create: `src/lib/progress/useProgress.test.ts`

**Step 1: Write failing tests — `src/lib/progress/useProgress.test.ts`**

```ts
import { renderHook, act } from '@testing-library/react'
import { useProgress } from './useProgress'

beforeEach(() => localStorage.clear())

describe('useProgress', () => {
  it('returns default profile when no data exists', () => {
    const { result } = renderHook(() => useProgress())
    expect(result.current.profile.name).toBe('')
    expect(result.current.badges).toHaveLength(0)
  })

  it('saves and loads profile', () => {
    const { result } = renderHook(() => useProgress())
    act(() => result.current.setProfile({ name: 'Alex', avatar: '👑' }))
    expect(result.current.profile.name).toBe('Alex')
  })

  it('marks lesson as complete and awards badge', () => {
    const { result } = renderHook(() => useProgress())
    act(() => result.current.completeLesson('lesson-1'))
    expect(result.current.completedLessons).toContain('lesson-1')
  })

  it('tracks puzzle solves', () => {
    const { result } = renderHook(() => useProgress())
    act(() => result.current.completePuzzle('puzzle-1'))
    expect(result.current.completedPuzzles).toContain('puzzle-1')
  })

  it('increments wins', () => {
    const { result } = renderHook(() => useProgress())
    act(() => result.current.recordWin())
    expect(result.current.wins).toBe(1)
  })
})
```

**Step 2: Run to verify fail**

```bash
npx vitest run src/lib/progress/useProgress.test.ts
```

**Step 3: Implement — `src/lib/progress/useProgress.ts`**

```ts
import { useState, useCallback } from 'react'

interface Profile {
  name: string
  avatar: string
}

interface ProgressState {
  profile: Profile
  completedLessons: string[]
  completedPuzzles: string[]
  badges: string[]
  wins: number
}

const KEY = 'kc_progress'

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { profile: { name: '', avatar: '👑' }, completedLessons: [], completedPuzzles: [], badges: [], wins: 0 }
}

function save(state: ProgressState) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function useProgress() {
  const [state, setState] = useState<ProgressState>(load)

  const update = useCallback((updater: (s: ProgressState) => ProgressState) => {
    setState((prev) => {
      const next = updater(prev)
      save(next)
      return next
    })
  }, [])

  return {
    ...state,
    setProfile: (profile: Profile) => update((s) => ({ ...s, profile })),
    completeLesson: (id: string) => update((s) => ({
      ...s,
      completedLessons: s.completedLessons.includes(id) ? s.completedLessons : [...s.completedLessons, id],
    })),
    completePuzzle: (id: string) => update((s) => ({
      ...s,
      completedPuzzles: s.completedPuzzles.includes(id) ? s.completedPuzzles : [...s.completedPuzzles, id],
    })),
    recordWin: () => update((s) => ({ ...s, wins: s.wins + 1 })),
    awardBadge: (badge: string) => update((s) => ({
      ...s,
      badges: s.badges.includes(badge) ? s.badges : [...s.badges, badge],
    })),
  }
}
```

**Step 4: Run tests**

```bash
npx vitest run src/lib/progress/useProgress.test.ts
```
Expected: All 5 tests PASS.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add localStorage progress store"
```

---

## Task 9: Lesson Content & Learn Page

**Files:**
- Create: `src/lessons/lessons.ts`
- Create: `src/pages/Learn.tsx` (full implementation)
- Create: `src/pages/lesson/LessonView.tsx`

**Step 1: Create lesson data — `src/lessons/lessons.ts`**

```ts
export interface LessonQuiz {
  question: string
  options: string[]
  correct: number
}

export interface Lesson {
  id: string
  title: string
  description: string
  demoFen: string       // board position to demonstrate concept
  content: string       // markdown-like text
  quiz: LessonQuiz[]
}

export const LESSONS: Lesson[] = [
  {
    id: 'lesson-1',
    title: 'The Board & Setup',
    description: 'Learn how the chessboard is arranged and where the pieces go.',
    demoFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    content: `The chessboard has 64 squares arranged in 8 rows (ranks) and 8 columns (files). White pieces start on ranks 1 and 2, black pieces on ranks 7 and 8. The queen goes on her own color!`,
    quiz: [
      { question: 'How many squares does a chessboard have?', options: ['32', '48', '64', '72'], correct: 2 },
      { question: 'Where does the white queen start?', options: ['d1', 'e1', 'd8', 'a1'], correct: 0 },
      { question: 'Which color moves first?', options: ['Black', 'White', 'Either', 'Neither'], correct: 1 },
    ],
  },
  {
    id: 'lesson-2',
    title: 'How Pawns Move',
    description: 'Pawns are the foot soldiers. Learn their special rules.',
    demoFen: '8/8/8/8/8/8/PPPPPPPP/8 w - - 0 1',
    content: `Pawns move forward one square at a time, but on their first move they can move two squares. Pawns capture diagonally — one square forward and to the side.`,
    quiz: [
      { question: 'How does a pawn capture?', options: ['Straight ahead', 'Diagonally forward', 'Backwards', 'Any direction'], correct: 1 },
      { question: 'How far can a pawn move on its first move?', options: ['1 square only', 'Up to 2 squares', '3 squares', 'As far as it wants'], correct: 1 },
      { question: 'What direction do white pawns move?', options: ['Down (towards rank 1)', 'Up (towards rank 8)', 'Sideways', 'Any direction'], correct: 1 },
    ],
  },
  {
    id: 'lesson-3',
    title: 'The Rook',
    description: 'The rook is a powerful piece that controls rows and columns.',
    demoFen: '8/8/8/8/3R4/8/8/8 w - - 0 1',
    content: `The rook moves any number of squares horizontally or vertically. It cannot jump over other pieces. Two rooks working together are extremely powerful!`,
    quiz: [
      { question: 'How does a rook move?', options: ['Diagonally', 'In an L-shape', 'Horizontally or vertically', 'One square any direction'], correct: 2 },
      { question: 'Can a rook jump over pieces?', options: ['Yes', 'No', 'Only over pawns', 'Only when capturing'], correct: 1 },
      { question: 'How many squares can a rook move in one turn?', options: ['1', '2', '3', 'Any number'], correct: 3 },
    ],
  },
  {
    id: 'lesson-4',
    title: 'The Bishop',
    description: 'Bishops slide diagonally and stick to one color.',
    demoFen: '8/8/8/8/3B4/8/8/8 w - - 0 1',
    content: `The bishop moves any number of squares diagonally. Each bishop stays on its starting color for the entire game. A bishop on white squares always stays on white squares!`,
    quiz: [
      { question: 'How does a bishop move?', options: ['Horizontally or vertically', 'Diagonally', 'In an L-shape', 'One square any direction'], correct: 1 },
      { question: 'How many color squares does a bishop visit?', options: ['All squares', 'Only one color', 'Two colors alternating', 'It depends'], correct: 1 },
      { question: 'Can a bishop jump over pieces?', options: ['Yes', 'No'], correct: 1 },
    ],
  },
  {
    id: 'lesson-5',
    title: 'The Knight',
    description: 'Knights are the only pieces that can jump over others!',
    demoFen: '8/8/8/8/3N4/8/8/8 w - - 0 1',
    content: `The knight moves in an L-shape: two squares in one direction, then one square perpendicular. It is the only piece that can jump over other pieces. Knights are tricky!`,
    quiz: [
      { question: 'What shape does a knight move in?', options: ['Straight line', 'Diagonal', 'L-shape', 'Circle'], correct: 2 },
      { question: 'Can a knight jump over other pieces?', options: ['Yes', 'No'], correct: 0 },
      { question: 'From the center of the board, how many squares can a knight reach?', options: ['2', '4', '8', '16'], correct: 2 },
    ],
  },
  {
    id: 'lesson-6',
    title: 'Check & Checkmate',
    description: 'Learn the goal of chess — trapping the enemy king!',
    demoFen: '4k3/4Q3/4K3/8/8/8/8/8 b - - 0 1',
    content: `Check means your king is under attack. You must escape check immediately by moving the king, blocking the attack, or capturing the attacker. Checkmate means there is no escape — game over!`,
    quiz: [
      { question: 'What is check?', options: ['Winning the game', 'King under attack', 'A draw', 'Losing a piece'], correct: 1 },
      { question: 'How can you escape check?', options: ['Move king, block, or capture attacker', 'Only move the king', 'Only capture the attacker', 'Pass your turn'], correct: 0 },
      { question: 'What is checkmate?', options: ['A check you can escape', 'A check with no escape', 'A draw', 'Capturing the queen'], correct: 1 },
    ],
  },
  {
    id: 'lesson-7',
    title: 'Basic Strategy',
    description: 'Control the center and develop your pieces early.',
    demoFen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    content: `The four key principles: 1) Control the center with pawns and pieces. 2) Develop knights and bishops early. 3) Castle to keep your king safe. 4) Connect your rooks. Follow these and you will start strong every game!`,
    quiz: [
      { question: 'Which squares are the center of the board?', options: ['a1, h1, a8, h8', 'd4, d5, e4, e5', 'a4, a5, h4, h5', 'All 64 squares'], correct: 1 },
      { question: 'What should you do in the opening?', options: ['Move the same piece twice', 'Develop knights and bishops', 'Move only pawns', 'Attack immediately'], correct: 1 },
      { question: 'Why should you castle early?', options: ['It wins more points', 'It keeps your king safe', 'It is required by rules', 'It develops the rook faster'], correct: 1 },
    ],
  },
]
```

**Step 2: Create LessonView — `src/pages/lesson/LessonView.tsx`**

```tsx
import { useState } from 'react'
import { Board } from '../../components/Board/Board'
import type { Lesson } from '../../lessons/lessons'

interface LessonViewProps {
  lesson: Lesson
  onComplete: (id: string) => void
  onBack: () => void
  isCompleted: boolean
}

export function LessonView({ lesson, onComplete, onBack, isCompleted }: LessonViewProps) {
  const [phase, setPhase] = useState<'read' | 'quiz'>('read')
  const [quizIndex, setQuizIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)

  const quiz = lesson.quiz[quizIndex]

  const handleAnswer = (idx: number) => {
    setSelected(idx)
    if (idx === quiz.correct) setCorrect((c) => c + 1)
    setTimeout(() => {
      if (quizIndex + 1 < lesson.quiz.length) {
        setQuizIndex((i) => i + 1)
        setSelected(null)
      } else {
        setDone(true)
        if (!isCompleted) onComplete(lesson.id)
      }
    }, 800)
  }

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col p-4 gap-4 max-w-lg mx-auto">
      <button onClick={onBack} className="self-start text-brand-green font-semibold">← Lessons</button>
      <h1 className="text-2xl font-bold text-brand-green">{lesson.title}</h1>

      {phase === 'read' && (
        <>
          <div className="w-full max-w-sm mx-auto">
            <Board fen={lesson.demoFen} turn="w" onMove={() => {}} />
          </div>
          <p className="text-gray-700 text-lg leading-relaxed">{lesson.content}</p>
          <button
            onClick={() => setPhase('quiz')}
            className="bg-brand-green text-white py-3 rounded-xl font-bold text-lg"
          >
            Take the Quiz →
          </button>
        </>
      )}

      {phase === 'quiz' && !done && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-500">Question {quizIndex + 1} of {lesson.quiz.length}</p>
          <p className="text-xl font-bold text-gray-800">{quiz.question}</p>
          <div className="flex flex-col gap-2">
            {quiz.options.map((opt, i) => {
              let bg = 'bg-white border-2 border-gray-200'
              if (selected !== null) {
                if (i === quiz.correct) bg = 'bg-green-100 border-green-500'
                else if (i === selected) bg = 'bg-red-100 border-red-400'
              }
              return (
                <button
                  key={i}
                  onClick={() => selected === null && handleAnswer(i)}
                  className={`${bg} py-3 px-4 rounded-xl text-left font-medium transition-colors`}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {done && (
        <div className="text-center flex flex-col gap-4">
          <div className="text-5xl">{correct === lesson.quiz.length ? '🎉' : '👍'}</div>
          <p className="text-2xl font-bold text-brand-green">
            {correct}/{lesson.quiz.length} correct!
          </p>
          {isCompleted && <p className="text-green-600 font-semibold">Lesson already completed!</p>}
          <button onClick={onBack} className="bg-brand-green text-white py-3 rounded-xl font-bold text-lg">
            Back to Lessons
          </button>
        </div>
      )}
    </div>
  )
}
```

**Step 3: Implement Learn page — `src/pages/Learn.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LESSONS } from '../lessons/lessons'
import { useProgress } from '../lib/progress/useProgress'
import { LessonView } from './lesson/LessonView'

export function Learn() {
  const navigate = useNavigate()
  const { completedLessons, completeLesson } = useProgress()
  const [activeLesson, setActiveLesson] = useState<string | null>(null)

  const lesson = LESSONS.find((l) => l.id === activeLesson)

  if (lesson) {
    return (
      <LessonView
        lesson={lesson}
        onComplete={completeLesson}
        onBack={() => setActiveLesson(null)}
        isCompleted={completedLessons.includes(lesson.id)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-brand-cream p-4 max-w-lg mx-auto">
      <button onClick={() => navigate('/')} className="text-brand-green font-semibold">← Home</button>
      <h1 className="text-3xl font-bold text-brand-green mt-4 mb-6">Lessons</h1>

      <div className="flex flex-col gap-3">
        {LESSONS.map((lesson, i) => {
          const done = completedLessons.includes(lesson.id)
          const locked = i > 0 && !completedLessons.includes(LESSONS[i - 1].id)
          return (
            <button
              key={lesson.id}
              onClick={() => !locked && setActiveLesson(lesson.id)}
              disabled={locked}
              className={`flex items-center gap-4 p-4 rounded-2xl shadow text-left transition-opacity ${
                locked ? 'bg-gray-200 opacity-60 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                done ? 'bg-green-500 text-white' : locked ? 'bg-gray-400 text-white' : 'bg-brand-green text-white'
              }`}>
                {done ? '✓' : locked ? '🔒' : i + 1}
              </div>
              <div>
                <p className="font-bold text-gray-800">{lesson.title}</p>
                <p className="text-sm text-gray-500">{lesson.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

**Step 4: Verify in browser**

```bash
npm run dev
```
Expected: Learn page shows 7 lessons, locked after first. Click lesson 1 → board + text + quiz → complete → next unlocks.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: implement lesson system with 7 modules, quizzes, and unlock flow"
```

---

## Task 10: Puzzle Mode

**Files:**
- Create: `src/puzzles/puzzles.ts`
- Create: `src/pages/Puzzles.tsx` (full implementation)

**Step 1: Create puzzle data — `src/puzzles/puzzles.ts`**

```ts
export interface Puzzle {
  id: string
  title: string
  fen: string
  solution: string[]  // sequence of UCI moves e.g. ['d1h5', 'e8d8', 'h5e8']
  hint: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export const PUZZLES: Puzzle[] = [
  {
    id: 'p1',
    title: 'Checkmate in 1',
    fen: 'k7/8/1K6/8/8/8/8/R7 w - - 0 1',
    solution: ['a1a8'],
    hint: 'The rook can deliver checkmate on the back rank.',
    difficulty: 'beginner',
  },
  {
    id: 'p2',
    title: 'Fork the King and Rook',
    fen: '4k3/8/8/8/8/8/8/4K2R w - - 0 1',
    solution: ['h1h8'],
    hint: 'Look for a move that attacks two pieces at once.',
    difficulty: 'beginner',
  },
  {
    id: 'p3',
    title: 'Scholar\'s Mate',
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 3',
    solution: ['d1h5'],
    hint: 'The queen and bishop work together to threaten f7.',
    difficulty: 'beginner',
  },
  {
    id: 'p4',
    title: 'Back Rank Mate',
    fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',
    solution: ['a1a8'],
    hint: 'The king is trapped by its own pawns!',
    difficulty: 'intermediate',
  },
  {
    id: 'p5',
    title: 'Queen Checkmate',
    fen: '7k/6pp/8/8/8/8/6PP/6QK w - - 0 1',
    solution: ['g1g7'],
    hint: 'The queen can deliver checkmate with support.',
    difficulty: 'intermediate',
  },
]
```

**Step 2: Implement Puzzles page — `src/pages/Puzzles.tsx`**

```tsx
import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Chess } from 'chess.js'
import { PUZZLES } from '../puzzles/puzzles'
import { Board } from '../components/Board/Board'
import { useProgress } from '../lib/progress/useProgress'

export function Puzzles() {
  const navigate = useNavigate()
  const { completedPuzzles, completePuzzle } = useProgress()
  const [activePuzzle, setActivePuzzle] = useState<string | null>(null)
  const [chess, setChess] = useState<Chess | null>(null)
  const [fen, setFen] = useState('')
  const [solutionIdx, setSolutionIdx] = useState(0)
  const [status, setStatus] = useState<'playing' | 'correct' | 'wrong'>('playing')
  const [showHint, setShowHint] = useState(false)

  const puzzle = PUZZLES.find((p) => p.id === activePuzzle)

  const startPuzzle = (id: string) => {
    const p = PUZZLES.find((x) => x.id === id)!
    const c = new Chess(p.fen)
    setChess(c)
    setFen(c.fen())
    setSolutionIdx(0)
    setStatus('playing')
    setShowHint(false)
    setActivePuzzle(id)
  }

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
  }, [fen, status])

  const handleMove = useCallback((from: string, to: string) => {
    if (!chess || !puzzle || status !== 'playing') return
    const expectedMove = puzzle.solution[solutionIdx]
    const playedMove = `${from}${to}`

    if (playedMove === expectedMove) {
      chess.move({ from: from as any, to: to as any, promotion: 'q' })
      setFen(chess.fen())
      if (solutionIdx + 1 >= puzzle.solution.length) {
        setStatus('correct')
        completePuzzle(puzzle.id)
      } else {
        setSolutionIdx((i) => i + 1)
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
  }, [chess, puzzle, solutionIdx, status])

  if (puzzle && chess) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col items-center p-4 gap-4 max-w-lg mx-auto">
        <button onClick={() => setActivePuzzle(null)} className="self-start text-brand-green font-semibold">← Puzzles</button>
        <h1 className="text-2xl font-bold text-brand-green">{puzzle.title}</h1>

        {status === 'correct' && <div className="text-green-600 font-bold text-xl">Solved! 🎉</div>}
        {status === 'wrong' && <div className="text-red-500 font-bold text-xl">Not quite — try again!</div>}

        <Board fen={fen} turn={chess.turn()} onMove={handleMove} legalMoves={legalMoves} inCheck={chess.inCheck()} />

        <div className="flex gap-3">
          <button onClick={() => setShowHint(true)} className="bg-brand-gold text-white px-4 py-2 rounded-xl font-semibold">
            Hint
          </button>
          <button onClick={() => startPuzzle(puzzle.id)} className="bg-gray-400 text-white px-4 py-2 rounded-xl font-semibold">
            Reset
          </button>
        </div>

        {showHint && <p className="text-gray-700 bg-yellow-50 p-3 rounded-xl border border-yellow-300">{puzzle.hint}</p>}
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
              className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow text-left hover:bg-gray-50"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${done ? 'bg-green-500 text-white' : 'bg-brand-green text-white'}`}>
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
```

**Step 3: Verify in browser**

```bash
npm run dev
```
Expected: Puzzles page shows list, clicking a puzzle shows board, correct move advances, wrong move resets.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: implement puzzle mode with hints and progress tracking"
```

---

## Task 11: Profile Page

**Files:**
- Modify: `src/pages/Profile.tsx`

**Implement — `src/pages/Profile.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress } from '../lib/progress/useProgress'
import { LESSONS } from '../lessons/lessons'
import { PUZZLES } from '../puzzles/puzzles'

const AVATARS = ['👑', '♟', '🏰', '🐉', '🦁', '🌟', '🎯', '🔥']

export function Profile() {
  const navigate = useNavigate()
  const { profile, setProfile, completedLessons, completedPuzzles, wins, badges } = useProgress()
  const [editing, setEditing] = useState(!profile.name)
  const [name, setName] = useState(profile.name)
  const [avatar, setAvatar] = useState(profile.avatar || '👑')

  const save = () => {
    setProfile({ name, avatar })
    setEditing(false)
  }

  return (
    <div className="min-h-screen bg-brand-cream p-4 max-w-lg mx-auto">
      <button onClick={() => navigate('/')} className="text-brand-green font-semibold">← Home</button>

      <div className="mt-4 bg-white rounded-2xl p-6 shadow flex flex-col items-center gap-3">
        <div className="text-6xl">{avatar}</div>
        {editing ? (
          <>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="border-2 border-brand-green rounded-xl px-4 py-2 text-lg text-center w-full"
            />
            <div className="flex gap-2 flex-wrap justify-center">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`text-3xl p-2 rounded-xl ${avatar === a ? 'bg-brand-green/20 ring-2 ring-brand-green' : ''}`}
                >
                  {a}
                </button>
              ))}
            </div>
            <button onClick={save} className="bg-brand-green text-white py-2 px-8 rounded-xl font-bold">Save</button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-brand-green">{profile.name || 'Anonymous'}</h1>
            <button onClick={() => setEditing(true)} className="text-sm text-gray-500 underline">Edit profile</button>
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Lessons', value: `${completedLessons.length}/${LESSONS.length}`, icon: '📖' },
          { label: 'Puzzles', value: `${completedPuzzles.length}/${PUZZLES.length}`, icon: '🧩' },
          { label: 'Wins', value: wins, icon: '🏆' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow text-center">
            <div className="text-3xl">{icon}</div>
            <div className="text-2xl font-bold text-brand-green">{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {badges.length > 0 && (
        <div className="mt-4 bg-white rounded-2xl p-4 shadow">
          <h2 className="font-bold text-brand-green mb-3">Badges</h2>
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <span key={b} className="bg-brand-gold/20 text-brand-gold border border-brand-gold rounded-full px-3 py-1 text-sm font-semibold">{b}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

**Commit:**

```bash
git add -A
git commit -m "feat: implement profile page with avatar, stats, and badges"
```

---

## Task 12: Online P2P (Supabase Real-time)

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/useOnlineGame.ts`
- Create: `src/pages/game/OnlineGame.tsx`
- Modify: `src/pages/Play.tsx`

**Step 1: Set up Supabase project**

Go to https://supabase.com and create a free project. In the SQL editor, run:

```sql
create table games (
  id uuid default gen_random_uuid() primary key,
  room_code text unique not null,
  status text default 'waiting',
  pgn text default '',
  created_at timestamptz default now()
);

create table game_moves (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references games(id) on delete cascade,
  move text not null,
  fen text not null,
  created_at timestamptz default now()
);

alter table games enable row level security;
alter table game_moves enable row level security;

create policy "Anyone can read games" on games for select using (true);
create policy "Anyone can insert games" on games for insert with check (true);
create policy "Anyone can update games" on games for update using (true);
create policy "Anyone can read moves" on game_moves for select using (true);
create policy "Anyone can insert moves" on game_moves for insert with check (true);
```

Copy the Project URL and anon key.

**Step 2: Add env file — `.env.local`**

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Add `.env.local` to `.gitignore`.

**Step 3: Create Supabase client — `src/lib/supabase/client.ts`**

```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

**Step 4: Create online game hook — `src/lib/supabase/useOnlineGame.ts`**

```ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from './client'
import { Chess } from 'chess.js'

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function useOnlineGame() {
  const [roomCode, setRoomCode] = useState('')
  const [gameId, setGameId] = useState<string | null>(null)
  const [playerColor, setPlayerColor] = useState<'w' | 'b' | null>(null)
  const [chess] = useState(() => new Chess())
  const [fen, setFen] = useState(chess.fen())
  const [status, setStatus] = useState<'idle' | 'waiting' | 'active' | 'done'>('idle')
  const [error, setError] = useState('')

  const createRoom = useCallback(async () => {
    const code = generateRoomCode()
    const { data, error } = await supabase
      .from('games')
      .insert({ room_code: code })
      .select()
      .single()

    if (error) { setError(error.message); return }
    setRoomCode(code)
    setGameId(data.id)
    setPlayerColor('w')
    setStatus('waiting')
  }, [])

  const joinRoom = useCallback(async (code: string) => {
    const { data, error } = await supabase
      .from('games')
      .select()
      .eq('room_code', code.toUpperCase())
      .single()

    if (error || !data) { setError('Room not found'); return }

    await supabase.from('games').update({ status: 'active' }).eq('id', data.id)
    setRoomCode(code.toUpperCase())
    setGameId(data.id)
    setPlayerColor('b')
    setStatus('active')
  }, [])

  // Subscribe to moves
  useEffect(() => {
    if (!gameId) return

    const channel = supabase
      .channel(`game:${gameId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'game_moves',
        filter: `game_id=eq.${gameId}`,
      }, (payload) => {
        chess.load(payload.new.fen)
        setFen(chess.fen())
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`,
      }, (payload) => {
        if (payload.new.status === 'active') setStatus('active')
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [gameId])

  const sendMove = useCallback(async (from: string, to: string) => {
    if (!gameId) return false
    const result = chess.move({ from: from as any, to: to as any, promotion: 'q' })
    if (!result) return false

    const newFen = chess.fen()
    setFen(newFen)

    await supabase.from('game_moves').insert({
      game_id: gameId,
      move: `${from}${to}`,
      fen: newFen,
    })
    return true
  }, [chess, gameId])

  return {
    roomCode, gameId, playerColor, fen, status, error,
    turn: chess.turn() as 'w' | 'b',
    isCheck: chess.inCheck(),
    isCheckmate: chess.isCheckmate(),
    isStalemate: chess.isStalemate(),
    gameOver: chess.isGameOver(),
    getLegalMoves: (sq: string) => chess.moves({ square: sq as any, verbose: true }).map((m) => m.to),
    createRoom, joinRoom, sendMove,
  }
}
```

**Step 5: Create OnlineGame — `src/pages/game/OnlineGame.tsx`**

```tsx
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineGame } from '../../lib/supabase/useOnlineGame'
import { Board } from '../../components/Board/Board'
import { GameHeader } from '../../components/Game/GameHeader'

export function OnlineGame() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const { roomCode, playerColor, fen, status, error, turn, isCheck, isCheckmate, isStalemate, gameOver, getLegalMoves, createRoom, joinRoom, sendMove } = useOnlineGame()

  const legalMoves = useMemo(() => {
    if (!playerColor || turn !== playerColor || gameOver) return {}
    const map: Record<string, string[]> = {}
    'abcdefgh'.split('').forEach((file) => {
      for (let rank = 1; rank <= 8; rank++) {
        const sq = `${file}${rank}`
        const moves = getLegalMoves(sq)
        if (moves.length) map[sq] = moves
      }
    })
    return map
  }, [fen, turn, playerColor, gameOver])

  if (status === 'idle') {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center gap-6 p-6">
        <button onClick={() => navigate('/play')} className="self-start text-brand-green font-semibold">← Back</button>
        <h1 className="text-3xl font-bold text-brand-green">Online Play</h1>
        {error && <p className="text-red-500">{error}</p>}
        <button onClick={createRoom} className="bg-brand-green text-white py-4 px-8 rounded-2xl font-bold text-xl shadow-lg w-full max-w-xs">
          Create Room
        </button>
        <div className="flex gap-2 w-full max-w-xs">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="Enter room code"
            className="flex-1 border-2 border-brand-green rounded-xl px-4 py-3 text-lg font-mono uppercase"
            maxLength={6}
          />
          <button onClick={() => joinRoom(input)} className="bg-brand-gold text-white py-3 px-4 rounded-xl font-bold">
            Join
          </button>
        </div>
      </div>
    )
  }

  if (status === 'waiting') {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-2xl font-bold text-brand-green">Room Created!</h1>
        <p className="text-gray-600">Share this code with your opponent:</p>
        <div className="text-5xl font-mono font-bold text-brand-green tracking-widest bg-white px-8 py-4 rounded-2xl shadow-lg">
          {roomCode}
        </div>
        <p className="text-gray-400 animate-pulse">Waiting for opponent...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center p-4 gap-4">
      <button onClick={() => navigate('/play')} className="self-start text-brand-green font-semibold">← Back</button>
      <p className="text-sm text-gray-500">Room: <span className="font-mono font-bold">{roomCode}</span> · You are {playerColor === 'w' ? 'White' : 'Black'}</p>

      <GameHeader
        turn={turn}
        playerWhite="White"
        playerBlack="Black"
        isCheck={isCheck}
        isCheckmate={isCheckmate}
        isStalemate={isStalemate}
      />

      <Board
        fen={fen}
        turn={turn}
        onMove={(from, to) => sendMove(from, to)}
        legalMoves={legalMoves}
        inCheck={isCheck}
        flipped={playerColor === 'b'}
      />
    </div>
  )
}
```

**Step 6: Update Play page to include Online mode**

In `src/pages/Play.tsx`, replace the "coming soon" online button:

```tsx
import { OnlineGame } from './game/OnlineGame'
// Add 'online' to Mode type and add:
if (mode === 'online') return <OnlineGame />
// Update the button:
<button onClick={() => setMode('online')} className="bg-purple-600 text-white py-4 rounded-2xl font-bold text-xl shadow-lg">
  🌐 Online 2-Player
</button>
```

**Step 7: Verify in browser**

```bash
npm run dev
```
Expected: Play → Online 2-Player → create room shows code, open second tab → join room → moves sync in real time.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: implement online P2P with Supabase real-time anonymous channels"
```

---

## Task 13: Cloudflare Pages Deployment

**Files:**
- Create: `public/_redirects`
- Modify: `vite.config.ts`

**Step 1: Add SPA redirect for Cloudflare Pages — `public/_redirects`**

```
/* /index.html 200
```

**Step 2: Verify build works**

```bash
npm run build
```
Expected: `dist/` folder created with no errors.

**Step 3: Deploy to Cloudflare Pages**

1. Push repo to GitHub:
```bash
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. Go to Cloudflare Pages dashboard → Create a project → Connect GitHub → select `kingchess` repo
3. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Add environment variables (from `.env.local`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy

**Step 4: Commit**

```bash
git add public/_redirects
git commit -m "chore: add Cloudflare Pages SPA redirect"
```

---

## Task 14: Final Polish

**Files:**
- Modify: `src/pages/game/LocalGame.tsx`
- Modify: `src/pages/game/MachineGame.tsx`

**Step 1: Award win badge after game over**

In `LocalGame.tsx` and `MachineGame.tsx`, import `useProgress` and call `recordWin()` when the current player wins.

In `LocalGame.tsx`:
```tsx
const { recordWin } = useProgress()

// In handleMove, after makeMove:
// Check if game is now over and determine winner, call recordWin() for the winner
```

In `MachineGame.tsx`:
```tsx
// After machine's move, if isCheckmate and turn was machine's (meaning player won), call recordWin()
useEffect(() => {
  if (isCheckmate && turn !== playerColor) {
    recordWin()
  }
}, [isCheckmate])
```

**Step 2: Run full test suite**

```bash
npx vitest run
```
Expected: All tests pass.

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: award win badges and complete KingChess v1"
```

---

## Summary

| Task | Description |
|---|---|
| 1 | Project scaffold (Vite + React + Tailwind + Vitest) |
| 2 | Chess engine hook (chess.js wrapper, TDD) |
| 3 | Stockfish.js WASM web worker with difficulty |
| 4 | Interactive chessboard component (TDD) |
| 5 | Router and page shell |
| 6 | Local P2P game mode |
| 7 | vs Machine game mode |
| 8 | localStorage progress store (TDD) |
| 9 | 7-module lesson system with quizzes |
| 10 | Puzzle mode with hints |
| 11 | Profile page with stats and badges |
| 12 | Online P2P (Supabase real-time) |
| 13 | Cloudflare Pages deployment |
| 14 | Final polish and win tracking |
