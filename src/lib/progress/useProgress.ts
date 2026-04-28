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
    if (raw) return JSON.parse(raw) as ProgressState
  } catch {
    // corrupted data — reset
  }
  return {
    profile: { name: '', avatar: '👑' },
    completedLessons: [],
    completedPuzzles: [],
    badges: [],
    wins: 0,
  }
}

function save(state: ProgressState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // storage full or unavailable — ignore
  }
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
    setProfile: useCallback(
      (profile: Profile) => update((s) => ({ ...s, profile })),
      [update]
    ),
    completeLesson: useCallback(
      (id: string) => update((s) => ({
        ...s,
        completedLessons: s.completedLessons.includes(id)
          ? s.completedLessons
          : [...s.completedLessons, id],
      })),
      [update]
    ),
    completePuzzle: useCallback(
      (id: string) => update((s) => ({
        ...s,
        completedPuzzles: s.completedPuzzles.includes(id)
          ? s.completedPuzzles
          : [...s.completedPuzzles, id],
      })),
      [update]
    ),
    recordWin: useCallback(
      () => update((s) => ({ ...s, wins: s.wins + 1 })),
      [update]
    ),
    awardBadge: useCallback(
      (badge: string) => update((s) => ({
        ...s,
        badges: s.badges.includes(badge)
          ? s.badges
          : [...s.badges, badge],
      })),
      [update]
    ),
  }
}
