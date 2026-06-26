'use client'
import { useAuth } from '@/components/ui/AuthProvider'
import { useEffect, useState } from 'react'
import { getAllIssues } from '@/lib/firestore'
import type { Issue } from '@/types'
import { MapPin, Award, BarChart3, Flame, LogIn, FileText, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'
import QRCode from 'qrcode'

const NEIGHBOURHOODS = [
  'Indiranagar','Koramangala','HSR Layout','Whitefield','Jayanagar',
  'Malleshwaram','Rajajinagar','Banashankari','Electronic City','Hebbal'
]

export default function ProfilePage() {
  const { user, profile, signIn } = useAuth()
  const [myIssues, setMyIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [qrURL, setQrURL] = useState('')

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const generateQR = async () => {
      const url = await QRCode.toDataURL(`${window.location.origin}/profile/${user.uid}`)
      setQrURL(url)
    }
    generateQR()
    getAllIssues(500)
  .then(issues => {
    setMyIssues(issues.filter(i => i.reportedBy === user.uid))
    setLoading(false)
  })
  .catch(() => setLoading(false))
  }, [user, profile])

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card p-10 text-center max-w-sm w-full">
        <div className="w-16 h-16 bg-civic-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <LogIn className="w-8 h-8 text-civic-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Sign in to view profile</h2>
        <p className="text-slate-500 text-sm mb-6">Track your civic contributions and earned badges.</p>
        <button onClick={signIn} className="btn-primary w-full">Sign in with Google</button>
      </div>
    </div>
  )

  const statusCounts = myIssues.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-5">
          {user.photoURL
            ? <img src={user.photoURL} alt="" className="w-20 h-20 rounded-2xl border-4 border-civic-100" />
            : <div className="w-20 h-20 bg-civic-100 text-civic-700 rounded-2xl flex items-center justify-center text-3xl font-bold">{user.displayName?.[0]}</div>
          }
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900">{user.displayName}</h1>
            <p className="text-slate-500 text-sm">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">{profile?.neighbourhood || 'Neighbourhood not set'}</span>
            </div>
            {profile?.streak && profile.streak > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full mt-2 font-medium">
                <Flame className="w-3 h-3" /> {profile.streak}-day streak
              </span>
            )}
          </div>
          {qrURL && (
            <div className="flex-shrink-0 text-center">
              <img src={qrURL} alt="Profile QR" className="w-20 h-20 rounded-lg border border-slate-200" />
              <p className="text-xs text-slate-400 mt-1">Your QR</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total points', value: profile?.points?.toLocaleString() || '0', icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Reports filed', value: myIssues.length, icon: FileText, color: 'text-civic-600', bg: 'bg-civic-50' },
          { label: 'Issues resolved', value: statusCounts['resolved'] || 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Pending', value: (myIssues.length - (statusCounts['resolved'] || 0)), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4 text-center">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="card p-6 mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">My reported issues</h3>
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-civic-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : myIssues.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-400 text-sm mb-4">No issues reported yet. Be a civic hero!</p>
            <Link href="/report" className="btn-primary text-sm py-2 px-4">Report your first issue</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myIssues.slice(0, 10).map(issue => (
              <div key={issue.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                {issue.photoURL && (
                  <img src={issue.photoURL} alt="" className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{issue.title}</p>
                  <p className="text-xs text-slate-400">{issue.neighbourhood} · {new Date(issue.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0', `status-${issue.status}`)}>
                  {issue.status}
                </span>
                <span className="text-xs text-slate-400 flex-shrink-0">👍 {issue.upvotes}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Settings</h3>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Your neighbourhood</label>
          <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-civic-300">
            <option value="">Select neighbourhood</option>
            {NEIGHBOURHOODS.map(n => <option key={n} value={n} selected={profile?.neighbourhood === n}>{n}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}
