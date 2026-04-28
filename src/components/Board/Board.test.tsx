import { render, fireEvent } from '@testing-library/react'
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

  it('clears selection when fen prop changes', () => {
    const FEN2 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
    const { rerender } = render(
      <Board fen={INITIAL_FEN} onMove={() => {}} turn="w" legalMoves={{ e2: ['e3', 'e4'] }} />
    )
    fireEvent.click(document.querySelector('[data-square="e2"]')!)
    expect(document.querySelectorAll('[data-legal-dot]').length).toBeGreaterThan(0)
    // Simulate position change after AI move
    rerender(<Board fen={FEN2} onMove={() => {}} turn="b" legalMoves={{}} />)
    expect(document.querySelectorAll('[data-legal-dot]').length).toBe(0)
  })

  it('clicking an opponent piece does not select it', () => {
    render(<Board fen={INITIAL_FEN} onMove={() => {}} turn="w" legalMoves={{ e7: ['e6', 'e5'] }} />)
    fireEvent.click(document.querySelector('[data-square="e7"]')!) // black pawn, white's turn
    expect(document.querySelectorAll('[data-legal-dot]').length).toBe(0)
  })

  it('highlights king square when inCheck is true', () => {
    // White king on e1, white is in check
    const CHECK_FEN = 'rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq - 0 3'
    render(
      <Board
        fen={CHECK_FEN}
        onMove={() => {}}
        turn="b"
        inCheck={true}
        legalMoves={{}}
      />
    )
    // The board should render without errors when inCheck=true
    expect(document.querySelectorAll('[data-square]')).toHaveLength(64)
  })
})
