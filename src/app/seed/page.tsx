'use client'
import { useState } from 'react'
import { useAuth } from '@/components/ui/AuthProvider'
import { seedDemoData, clearAllIssues } from '@/lib/seedData'

export default function SeedPage() {
  const { user, signIn } = useAuth()
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  const handleReseed = async () => {
    if (!user) { signIn(); return }
    setBusy(true)
    try {
      setStatus('Clearing existing issues...')
      const cleared = await clearAllIssues()
      setStatus(`Cleared ${cleared} old issues. Seeding 20 fresh issues...`)
      await seedDemoData(user.uid, user.displayName || 'Demo Citizen')
      setStatus('✅ Done! Clean dataset: 20 issues across Bengaluru. Health scores will now be accurate.')
    } catch (e: any) {
      setStatus('❌ Error: ' + e.message)
    }
    setBusy(false)
  }

  const handleSeedOnly = async () => {
    if (!user) { signIn(); return }
    setBusy(true)
    try {
      setStatus('Seeding 20 demo issues...')
      await seedDemoData(user.uid, user.displayName || 'Demo Citizen')
      setStatus('✅ Done! 20 issues seeded.')
    } catch (e: any) {
      setStatus('❌ Error: ' + e.message)
    }
    setBusy(false)
  }

  const handleClearOnly = async () => {
    if (!user) { signIn(); return }
    setBusy(true)
    try {
      setStatus('Clearing all issues...')
      const cleared = await clearAllIssues()
      setStatus(`✅ Cleared ${cleared} issues. Database is now empty.`)
    } catch (e: any) {
      setStatus('❌ Error: ' + e.message)
    }
    setBusy(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-sand-200 p-10 text-center max-w-md w-full">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Demo data manager</h1>
        <p className="text-stone-500 text-sm mb-6">Populate or reset the 20 realistic civic issues across Bengaluru neighbourhoods.</p>

        {!user ? (
          <button onClick={signIn} className="btn-primary w-full">Sign in first</button>
        ) : (
          <div className="space-y-3">
            <button onClick={handleReseed} disabled={busy}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50">
              {busy ? 'Working...' : '🔄 Clear all + reseed fresh (recommended)'}
            </button>
            <button onClick={handleSeedOnly} disabled={busy}
              className="w-full bg-white border border-sand-200 text-stone-700 py-2.5 rounded-xl text-sm font-medium hover:bg-sand-50 transition-colors disabled:opacity-50">
              Seed only (may create duplicates)
            </button>
            <button onClick={handleClearOnly} disabled={busy}
              className="w-full bg-white border border-red-200 text-red-600 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50">
              Clear all issues
            </button>
          </div>
        )}

        {status && <p className="text-stone-600 text-sm mt-5">{status}</p>}
      </div>
    </div>
  )
}