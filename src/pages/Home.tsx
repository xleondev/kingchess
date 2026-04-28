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
