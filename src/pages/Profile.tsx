import { useNavigate } from 'react-router-dom'
export function Profile() {
  const navigate = useNavigate()
  return (
    <div className="p-6">
      <button onClick={() => navigate('/')} className="text-brand-green font-semibold">← Back</button>
      <h1 className="text-3xl font-bold mt-4">Profile</h1>
      <p className="mt-2 text-gray-500">Coming soon</p>
    </div>
  )
}
