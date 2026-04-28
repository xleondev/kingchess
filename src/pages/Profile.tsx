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
    if (!name.trim()) return
    setProfile({ name: name.trim(), avatar })
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
              className="border-2 border-brand-green rounded-xl px-4 py-2 text-lg text-center w-full max-w-xs"
              maxLength={20}
            />
            <div className="flex gap-2 flex-wrap justify-center">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`text-3xl p-2 rounded-xl transition-colors ${
                    avatar === a ? 'bg-brand-green/20 ring-2 ring-brand-green' : 'hover:bg-gray-100'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            <button
              onClick={save}
              className="bg-brand-green text-white py-2 px-8 rounded-xl font-bold disabled:opacity-50"
              disabled={!name.trim()}
            >
              Save
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-brand-green">{profile.name}</h1>
            <button onClick={() => setEditing(true)} className="text-sm text-gray-500 underline">
              Edit profile
            </button>
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
              <span
                key={b}
                className="bg-brand-gold/20 text-brand-gold border border-brand-gold rounded-full px-3 py-1 text-sm font-semibold"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
