'use client'
import { useEffect, useState } from 'react'
import { getLeaderboard } from '@/lib/firestore'
import { useAuth } from '@/components/ui/AuthProvider'
import type { UserProfile } from '@/types'
import { Trophy, Medal, Star, Flame, Shield, Zap } from 'lucide-react'
import clsx from 'clsx'

const MOCK_LEADERS: UserProfile[] = [
  { uid:'1', displayName:'Priya Sharma', email:'', neighbourhood:'Indiranagar', points:4820, badges:[], reportsCount:47, resolvedCount:38, verifiedCount:112, joinedAt:new Date('2024-01-10'), streak:14 },
  { uid:'2', displayName:'Arjun Mehta', email:'', neighbourhood:'Koramangala', points:3960, badges:[], reportsCount:39, resolvedCount:31, verifiedCount:87, joinedAt:new Date('2024-02-05'), streak:9 },
  { uid:'3', displayName:'Divya Nair', email:'', neighbourhood:'HSR Layout', points:3210, badges:[], reportsCount:33, resolvedCount:28, verifiedCount:74, joinedAt:new Date('2024-01-22'), streak:7 },
  { uid:'4', displayName:'Karthik Rao', email:'', neighbourhood:'Whitefield', points:2750, badges:[], reportsCount:27, resolvedCount:21, verifiedCount:61, joinedAt:new Date('2024-03-01'), streak:5 },
  { uid:'5', displayName:'Sneha Patel', email:'', neighbourhood:'Jayanagar', points:2190, badges:[], reportsCount:22, resolvedCount:18, verifiedCount:43, joinedAt:new Date('2024-02-18'), streak:4 },
  { uid:'6', displayName:'Rahul Kumar', email:'', neighbourhood:'Malleshwaram', points:1840, badges:[], reportsCount:18, resolvedCount:14, verifiedCount:37, joinedAt:new Date('2024-03-15'), streak:3 },
  { uid:'7', displayName:'Ananya Singh', email:'', neighbourhood:'Banashankari', points:1520, badges:[], reportsCount:15, resolvedCount:12, verifiedCount:28, joinedAt:new Date('2024-04-01'), streak:2 },
  { uid:'8', displayName:'Vikram Bose', email:'', neighbourhood:'Electronic City', points:1180, badges:[], reportsCount:12, resolvedCount:9, verifiedCount:19, joinedAt:new Date('2024-04-10'), streak:1 },
]

const BADGES = [
  { id:'first_report', name:'First Report', icon:'🚨', desc:'Filed your first civic issue' },
  { id:'truth_seeker', name:'Truth Seeker', icon:'🔍', desc:'Verified 10 community reports' },
  { id:'street_hero', name:'Street Hero', icon:'🦸', desc:'Reported 25 issues' },
  { id:'resolver', name:'Resolver', icon:'✅', desc:'10 of your issues got fixed' },
  { id:'streak_7', name:'Weekly Warrior', icon:'🔥', desc:'7-day reporting streak' },
  { id:'brief_gen', name:'Brief Author', icon:'📋', desc:'Triggered a Civic Brief' },
]

const RANK_STYLES = [
  'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-amber-200',
  'bg-gradient-to-br from-slate-400 to-slate-600 text-white shadow-slate-200',
  'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-orange-200',
]

export default function LeaderboardPage() {
  const { user, profile } = useAuth()
  const [leaders, setLeaders] = useState<UserProfile[]>(MOCK_LEADERS)
  const [activeZone, setActiveZone] = useState('all')
  const [tab, setTab] = useState<'leaders' | 'badges'>('leaders')

  const zones = ['all', 'Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield', 'Jayanagar']
  const filtered = activeZone === 'all' ? leaders : leaders.filter(l => l.neighbourhood === activeZone)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <Trophy className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Civic Heroes</h1>
          <p className="text-slate-500 text-sm">Top contributors making their neighbourhoods better</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('leaders')}
          className={clsx('px-4 py-2 rounded-xl text-sm font-medium transition-all', tab === 'leaders' ? 'bg-civic-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50')}>
          Leaderboard
        </button>
        <button onClick={() => setTab('badges')}
          className={clsx('px-4 py-2 rounded-xl text-sm font-medium transition-all', tab === 'badges' ? 'bg-civic-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50')}>
          Badges
        </button>
      </div>

      {tab === 'leaders' && (
        <>
          <div className="flex gap-2 flex-wrap mb-6">
            {zones.map(z => (
              <button key={z} onClick={() => setActiveZone(z)}
                className={clsx('px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize',
                  activeZone === z ? 'bg-civic-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50')}>
                {z}
              </button>
            ))}
          </div>

          {/* Top 3 podium */}
          {filtered.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[filtered[1], filtered[0], filtered[2]].map((leader, podiumIdx) => {
                const rank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3
                return (
                  <div key={leader.uid} className={clsx('card p-4 text-center', podiumIdx === 1 && 'ring-2 ring-amber-400 ring-offset-2')}>
                    <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-2 shadow-lg', RANK_STYLES[rank - 1])}>
                      {rank === 1 ? '👑' : `#${rank}`}
                    </div>
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-xl mx-auto mb-2">
                      {leader.displayName[0]}
                    </div>
                    <p className="font-semibold text-slate-900 text-sm leading-snug">{leader.displayName}</p>
                    <p className="text-xs text-slate-400 mb-2">{leader.neighbourhood}</p>
                    <p className="text-lg font-bold text-civic-600">{leader.points.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">points</p>
                    {leader.streak > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full mt-2">
                        <Flame className="w-3 h-3" /> {leader.streak}d streak
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Full list */}
          <div className="card divide-y divide-slate-50">
            {filtered.map((leader, i) => (
              <div key={leader.uid} className={clsx('flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors', user?.uid === leader.uid && 'bg-civic-50')}>
                <span className={clsx('w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                  i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500')}>
                  {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                </span>
                <div className="w-9 h-9 bg-civic-100 rounded-full flex items-center justify-center text-civic-700 font-semibold text-sm flex-shrink-0">
                  {leader.displayName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{leader.displayName} {user?.uid === leader.uid && <span className="text-xs text-civic-500 font-normal">(you)</span>}</p>
                  <p className="text-xs text-slate-400">{leader.neighbourhood} · {leader.reportsCount} reports · {leader.resolvedCount} resolved</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-slate-900">{leader.points.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">pts</p>
                </div>
                {leader.streak >= 7 && (
                  <span className="flex items-center gap-1 text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                    <Flame className="w-3 h-3" />{leader.streak}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 card p-4 bg-civic-50 border-civic-100">
            <p className="text-sm font-semibold text-civic-800 mb-1">How to earn points</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-civic-700 mt-2">
              <span>📸 Report issue → 10 pts</span>
              <span>👍 Upvote → 2 pts</span>
              <span>✅ Issue resolved → 25 pts</span>
              <span>🔍 Verify report → 5 pts</span>
              <span>📋 Trigger brief → 50 pts</span>
              <span>🔥 Daily streak → 5 pts/day</span>
            </div>
          </div>
        </>
      )}

      {tab === 'badges' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {BADGES.map(badge => (
            <div key={badge.id} className="card p-5 text-center hover:shadow-md transition-shadow">
              <div className="text-4xl mb-3">{badge.icon}</div>
              <p className="font-semibold text-slate-900 mb-1">{badge.name}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{badge.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
