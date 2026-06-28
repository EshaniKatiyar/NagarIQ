'use client'
import { useEffect, useState } from 'react'
import { Clock, AlertOctagon } from 'lucide-react'

// SLA windows by severity (hours) — how long the authority has to respond
export const SLA_HOURS: Record<string, number> = {
  critical: 48,   // 2 days
  high: 96,       // 4 days
  medium: 168,    // 7 days
  low: 336,       // 14 days
}

export function getDeadline(createdAt: any, severity: string): number {
  let created: number
  try {
    if (createdAt?.toDate) created = createdAt.toDate().getTime()
    else if (createdAt?.seconds) created = createdAt.seconds * 1000
    else created = new Date(createdAt).getTime()
    if (isNaN(created)) created = Date.now()
  } catch { created = Date.now() }
  const hours = SLA_HOURS[severity] ?? 168
  return created + hours * 60 * 60 * 1000
}

export default function Countdown({ deadline, breached }: { deadline: number; breached?: boolean }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const remaining = deadline - now
  const isBreached = breached || remaining <= 0

  if (isBreached) {
    const overdueMs = Math.abs(remaining)
    const days = Math.floor(overdueMs / (1000 * 60 * 60 * 24))
    return (
      <div className="inline-flex items-center gap-1.5 text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg text-xs font-bold animate-pulse">
        <AlertOctagon className="w-3.5 h-3.5" />
        DEADLINE BREACHED {days > 0 ? `· ${days}d ago` : ''}
      </div>
    )
  }

  const d = Math.floor(remaining / (1000 * 60 * 60 * 24))
  const h = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  const s = Math.floor((remaining % (1000 * 60)) / 1000)

  const urgent = remaining < 24 * 60 * 60 * 1000 // < 24h
  const color = urgent ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-green-700 bg-green-50 border-green-200'

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border tabular-nums ${color} ${urgent ? 'animate-pulse' : ''}`}>
      <Clock className="w-3.5 h-3.5" />
      {d > 0 && `${d}d `}{String(h).padStart(2, '0')}h {String(m).padStart(2, '0')}m {String(s).padStart(2, '0')}s
    </div>
  )
}