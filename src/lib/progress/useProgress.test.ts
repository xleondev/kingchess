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

  it('marks lesson as complete', () => {
    const { result } = renderHook(() => useProgress())
    act(() => result.current.completeLesson('lesson-1'))
    expect(result.current.completedLessons).toContain('lesson-1')
  })

  it('does not duplicate completed lessons', () => {
    const { result } = renderHook(() => useProgress())
    act(() => result.current.completeLesson('lesson-1'))
    act(() => result.current.completeLesson('lesson-1'))
    expect(result.current.completedLessons.filter(l => l === 'lesson-1')).toHaveLength(1)
  })

  it('tracks puzzle solves', () => {
    const { result } = renderHook(() => useProgress())
    act(() => result.current.completePuzzle('puzzle-1'))
    expect(result.current.completedPuzzles).toContain('puzzle-1')
  })

  it('increments wins', () => {
    const { result } = renderHook(() => useProgress())
    act(() => result.current.recordWin())
    act(() => result.current.recordWin())
    expect(result.current.wins).toBe(2)
  })

  it('awards badges without duplicates', () => {
    const { result } = renderHook(() => useProgress())
    act(() => result.current.awardBadge('First Checkmate!'))
    act(() => result.current.awardBadge('First Checkmate!'))
    expect(result.current.badges.filter(b => b === 'First Checkmate!')).toHaveLength(1)
  })

  it('persists data across hook re-mounts', () => {
    const { result: r1 } = renderHook(() => useProgress())
    act(() => r1.current.setProfile({ name: 'Sam', avatar: '♟' }))
    act(() => r1.current.completeLesson('lesson-1'))

    // New hook instance reads from localStorage
    const { result: r2 } = renderHook(() => useProgress())
    expect(r2.current.profile.name).toBe('Sam')
    expect(r2.current.completedLessons).toContain('lesson-1')
  })
})
