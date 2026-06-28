'use client'
import { useEffect, useState } from 'react'
import { subscribeToIssues, updateIssue } from '@/lib/firestore'
import type { Issue } from '@/types'
import RTIModal from '@/components/ui/RTIModal'
import Countdown, { getDeadline } from '@/components/ui/Countdown'
import { Scale, MapPin, FileText, ArrowRight, CheckCircle2, ShieldAlert, Gavel } from 'lucide-react'

export default function RTIPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Issue | null>(null)
  const [filter, setFilter] = useState<'all' | 'ticking' | 'breached' | 'resolved'>('all')

  useEffect(() => {
    const unsub = subscribeToIssues(data => { setIssues(data); setLoading(false) })
    return unsub
  }, [])

  // Record a breach permanently on the issue (flows into the Proof Engine ledger)
  useEffect(() => {
    const now = Date.now()
    issues.forEach(i => {
      if (i.status === 'resolved' || i.status === 'rejected') return
      const deadline = getDeadline(i.createdAt, i.severity)
      if (now > deadline && !(i as any).deadlineBreached) {
        updateIssue(i.id, { deadlineBreached: true, breachedAt: new Date() } as any).catch(() => {})
      }
    })
  }, [issues])

  const enriched = issues.map(i => {
    const deadline = getDeadline(i.createdAt, i.severity)
    const isResolved = i.status === 'resolved'
    const isBreached = !isResolved && Date.now() > deadline
    return { issue: i, deadline, isResolved, isBreached }
  })

  const filtered = enriched.filter(({ issue, isResolved, isBreached }) => {
    if (filter === 'resolved') return isResolved
    if (filter === 'breached') return isBreached
    if (filter === 'ticking') return !isResolved && !isBreached && issue.status !== 'rejected'
    return issue.status !== 'rejected'
  }).sort((a, b) => {
    // breached first, then soonest deadline
    if (a.isBreached && !b.isBreached) return -1
    if (!a.isBreached && b.isBreached) return 1
    return a.deadline - b.deadline
  })

  const breachedCount = enriched.filter(e => e.isBreached).length
  const tickingCount = enriched.filter(e => !e.isResolved && !e.isBreached && e.issue.status !== 'rejected').length
  const resolvedCount = enriched.filter(e => e.isResolved).length

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Gavel className="w-6 h-6 text-amber-600" />
          <h1 className="text-3xl font-bold text-stone-900">Accountability Center</h1>
        </div>
        <p className="text-stone-500 max-w-2xl">
          Every escalated issue starts a clock. The authority has a fixed window to respond.
          When that deadline is breached, the failure is permanently recorded in the tamper-proof
          ledger — and you can file a legally-binding RTI the government must answer within 30 days.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-sand-200 rounded-2xl p-5 text-center">
          <div className="text-3xl font-bold text-green-600">{tickingCount}</div>
          <div className="text-xs text-stone-500 mt-1">within deadline</div>
        </div>
        <div className="bg-white border border-red-200 rounded-2xl p-5 text-center">
          <div className="text-3xl font-bold text-red-500">{breachedCount}</div>
          <div className="text-xs text-stone-500 mt-1">deadline breached</div>
        </div>
        <div className="bg-white border border-sand-200 rounded-2xl p-5 text-center">
          <div className="text-3xl font-bold text-stone-900">30</div>
          <div className="text-xs text-stone-500 mt-1">days to legal response</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {([['all','All'],['ticking','Ticking'],['breached','Breached'],['resolved','Resolved']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === key ? 'bg-stone-900 text-white' : 'bg-white border border-sand-200 text-stone-600 hover:border-amber-300'}`}>
            {label}{key === 'breached' && breachedCount > 0 ? ` (${breachedCount})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-stone-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-sand-200 rounded-2xl p-10 text-center">
          <FileText className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500">No issues in this view.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ issue, deadline, isResolved, isBreached }) => (
            <div key={issue.id} className={`bg-white border rounded-2xl p-5 flex items-center gap-4 transition-all ${isBreached ? 'border-red-200 hover:border-red-300' : 'border-sand-200 hover:border-amber-300'} hover:shadow-md`}>
              <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${isResolved ? 'bg-green-50' : isBreached ? 'bg-red-50' : 'bg-amber-50'}`}>
                {isResolved ? <CheckCircle2 className="w-6 h-6 text-green-500" />
                  : isBreached ? <ShieldAlert className="w-6 h-6 text-red-500" />
                  : <Scale className="w-6 h-6 text-amber-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-stone-900 truncate">{issue.title}</h3>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-stone-500"><MapPin className="w-3.5 h-3.5" />{issue.neighbourhood}</span>
                  <span className="text-xs text-stone-400 capitalize">· {issue.severity}</span>
                  {isResolved
                    ? <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">resolved</span>
                    : <Countdown deadline={deadline} breached={isBreached} />}
                </div>
              </div>
              {!isResolved && (
                <button
                  onClick={() => setSelected(issue)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isBreached ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-stone-900 text-white hover:bg-stone-800'}`}>
                  {isBreached ? 'File RTI now' : 'File RTI'} <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {selected && <RTIModal issue={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}