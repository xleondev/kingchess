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
        <button disabled className="bg-purple-600 text-white py-4 rounded-2xl font-bold text-xl shadow-lg opacity-60 cursor-not-allowed">
          🌐 Online (coming soon)
        </button>
      </div>
    </div>
  )
}
