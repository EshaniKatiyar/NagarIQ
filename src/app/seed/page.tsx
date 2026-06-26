'use client'
import { useState } from 'react'
import { useAuth } from '@/components/ui/AuthProvider'
import { seedDemoData } from '@/lib/seedData'

export default function SeedPage() {
  const { user, signIn } = useAuth()
  const [status, setStatus] = useState('')
  const [done, setDone] = useState(false)

  const handleSeed = async () => {
    if (!user) { signIn(); return }
    setStatus('Seeding 20 demo issues...')
    try {
      await seedDemoData(user.uid, user.displayName || 'Demo Citizen')
      setStatus('✅ Done! 20 issues seeded across Bengaluru.')
      setDone(true)
    } catch (e: any) {
      setStatus('❌ Error: ' + e.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card p-10 text-center max-w-md w-full">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Seed demo data</h1>
        <p className="text-slate-500 text-sm mb-6">Populates 20 realistic civic issues across Bengaluru neighbourhoods for demo purposes.</p>
        {!user ? (
          <button onClick={signIn} className="btn-primary w-full">Sign in first</button>
        ) : done ? (
          <div>
            <p className="text-green-600 font-medium mb-4">{status}</p>
            <a href="/dashboard" className="btn-primary">View dashboard →</a>
          </div>
        ) : (
          <div>
            {status && <p className="text-slate-600 text-sm mb-4 animate-pulse">{status}</p>}
            <button onClick={handleSeed} className="btn-primary w-full">
              Seed 20 demo issues
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
