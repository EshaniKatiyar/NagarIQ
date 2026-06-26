'use client'
import { useEffect, useState } from 'react'
import { Shield, Clock, IndianRupee, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'

interface SafetyAction {
  action: string
  icon: string
  timeToComplete: string
  cost: string
  priority: 'high' | 'medium' | 'low'
}

interface SafetyData {
  immediateActions: SafetyAction[]
  publicWarning: string
  dangerRadius: number
  requiresEmergency: boolean
}

export default function SafetyActionsPanel({ category, severity, title }: { category: string; severity: string; title: string }) {
  const [data, setData] = useState<SafetyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState<number[]>([])

  useEffect(() => {
    fetch('/api/safety-actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, severity, title })
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [category, severity, title])

  if (loading) return (
    <div className="card p-6 text-center">
      <Loader2 className="w-6 h-6 text-civic-600 animate-spin mx-auto mb-2" />
      <p className="text-sm text-slate-500">AI generating interim safety actions...</p>
    </div>
  )

  if (!data) return null

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
          <Shield className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Interim safety actions</h3>
          <p className="text-xs text-slate-400">Reduce harm now — while the permanent fix is pending</p>
        </div>
      </div>

      {data.requiresEmergency && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">Emergency response recommended — cordon area immediately</p>
        </div>
      )}

      <div className="space-y-2">
        {data.immediateActions?.map((action, i) => (
          <button key={i} onClick={() => setCompleted(c => c.includes(i) ? c.filter(x => x !== i) : [...c, i])}
            className={clsx('w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
              completed.includes(i) ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200 hover:border-civic-300')}>
            <span className="text-2xl flex-shrink-0">{action.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={clsx('text-sm font-medium', completed.includes(i) ? 'text-green-700 line-through' : 'text-slate-800')}>
                {action.action}
              </p>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{action.timeToComplete}</span>
                <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />{action.cost}</span>
                <span className={clsx('px-1.5 py-0.5 rounded-full font-medium',
                  action.priority === 'high' ? 'bg-red-100 text-red-600' :
                  action.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500')}>
                  {action.priority}
                </span>
              </div>
            </div>
            {completed.includes(i) && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />}
          </button>
        ))}
      </div>

      {data.publicWarning && (
        <div className="bg-civic-50 border border-civic-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-civic-700 mb-1">📢 Public warning broadcast</p>
          <p className="text-sm text-civic-800">{data.publicWarning}</p>
          <p className="text-xs text-civic-500 mt-1">Citizens within {data.dangerRadius}m alerted</p>
        </div>
      )}
    </div>
  )
}