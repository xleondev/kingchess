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
})
