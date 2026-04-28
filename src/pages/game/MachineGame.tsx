import { useNavigate } from 'react-router-dom'
export function MachineGame() {
  const navigate = useNavigate()
  return (
    <div className="p-6">
      <button onClick={() => navigate('/play')} className="text-brand-green font-semibold">← Back</button>
      <p className="mt-4 text-gray-500">Machine game coming soon</p>
    </div>
  )
}
