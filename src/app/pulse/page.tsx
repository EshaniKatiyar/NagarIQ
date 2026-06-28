'use client'
import { useEffect, useState, useMemo } from 'react'
import { subscribeToIssues } from '@/lib/firestore'
import { 
  calculateCityHealth, calculateZoneHealth, predictHealthTimeline, 
  checkSwarmTrigger, type ZoneHealth, type HealthPrediction 
} from '@/lib/civicTwin'
import type { Issue } from '@/types'
import { 
  Activity, TrendingDown, TrendingUp, AlertTriangle, Zap, 
  Heart, Shield, Clock, ArrowRight, Skull, Sparkles
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts'
import clsx from 'clsx'

const BASE_NEIGHBOURHOODS = [
  'Koramangala','Indiranagar','HSR Layout','Whitefield','Jayanagar',
  'Malleshwaram','Banashankari','Electronic City','Rajajinagar','Hebbal'
]

function healthColor(health: number) {
  if (health >= 75) return { text: 'text-green-600', bg: 'bg-green-500', ring: 'ring-green-200', hex: '#22c55e' }
  if (health >= 50) return { text: 'text-amber-600', bg: 'bg-amber-500', ring: 'ring-amber-200', hex: '#f59e0b' }
  if (health >= 30) return { text: 'text-orange-600', bg: 'bg-orange-500', ring: 'ring-orange-200', hex: '#f97316' }
  return { text: 'text-red-600', bg: 'bg-red-500', ring: 'ring-red-200', hex: '#ef4444' }
}

export default function PulsePage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [selectedZone, setSelectedZone] = useState('Koramangala')
  const [predictionDays, setPredictionDays] = useState(90)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeToIssues(data => { setIssues(data); setLoading(false) })
    return unsub
  }, [])

  const NEIGHBOURHOODS = useMemo(() => {
    const fromIssues = Array.from(new Set(issues.map(i => i.neighbourhood).filter(n => n && n !== 'Unknown')))
    return Array.from(new Set([...BASE_NEIGHBOURHOODS, ...fromIssues]))
  }, [issues])

  const city = useMemo(() => calculateCityHealth(issues, NEIGHBOURHOODS), [issues, NEIGHBOURHOODS])
  const zoneHealth = useMemo(() => calculateZoneHealth(issues, selectedZone), [issues, selectedZone])
  const predictions = useMemo(() => predictHealthTimeline(zoneHealth, predictionDays), [zoneHealth, predictionDays])
  const swarm = useMemo(() => checkSwarmTrigger(zoneHealth), [zoneHealth])

  // Autonomous Swarm Agent — runs Gemini reasoning whenever the monitored
  // zone's issues change. No button: the agent perceives and reasons on its own.
  const [agent, setAgent] = useState<any>(null)
  const [agentThinking, setAgentThinking] = useState(false)
  const zoneIssues = useMemo(
    () => issues.filter(i => i.neighbourhood === selectedZone && i.status !== 'resolved'),
    [issues, selectedZone]
  )
  useEffect(() => {
    if (zoneIssues.length === 0) { setAgent(null); return }
    let cancelled = false
    setAgentThinking(true)
    const payload = zoneIssues.slice(0, 8).map(i => ({
      title: i.title, category: i.category, severity: i.severity, status: i.status, upvotes: i.upvotes,
    }))
    fetch('/api/swarm-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issues: payload, neighbourhood: selectedZone, zoneHealth: zoneHealth.currentHealth }),
    })
      .then(r => r.json())
      .then(data => { if (!cancelled && !data.error) setAgent(data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setAgentThinking(false) })
    return () => { cancelled = true }
  }, [selectedZone, zoneIssues.length, zoneHealth.currentHealth])

  const futureHealth = predictions[predictions.length - 1]
  const colors = healthColor(zoneHealth.currentHealth)
  const cityColors = healthColor(city.cityHealth)

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Heart className="w-8 h-8 text-red-500 animate-pulse" />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-6 h-6 text-civic-600" />
            <h1 className="text-3xl font-bold text-slate-900">Civic Twin</h1>
            <span className="px-2 py-0.5 bg-civic-100 text-civic-700 text-xs font-semibold rounded-full">LIVE</span>
          </div>
          <p className="text-slate-500">Your neighbourhood is alive. Watch its health in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">City health</span>
          <div className={clsx('flex items-center gap-2 px-4 py-2 rounded-xl', cityColors.text, 'bg-white border border-slate-100 shadow-sm')}>
            <Heart className={clsx('w-5 h-5', cityColors.text)} fill="currentColor" />
            <span className="text-2xl font-bold">{city.cityHealth}</span>
            <span className="text-sm text-slate-400">/100</span>
          </div>
        </div>
      </div>

      {/* Zone selector */}
      <div className="flex gap-2 flex-wrap mb-8">
        {city.zones.map(zone => {
          const c = healthColor(zone.currentHealth)
          return (
            <button key={zone.neighbourhood} onClick={() => setSelectedZone(zone.neighbourhood)}
              className={clsx('flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border',
                selectedZone === zone.neighbourhood ? 'border-civic-400 bg-civic-50 ring-2 ring-civic-100' : 'border-slate-200 bg-white hover:border-slate-300')}>
              <span className={clsx('w-2 h-2 rounded-full', c.bg)} />
              {zone.neighbourhood}
              <span className={clsx('font-bold', c.text)}>{zone.currentHealth}</span>
            </button>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* THE HEARTBEAT - centerpiece */}
        <div className="lg:col-span-1 card p-8 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-4 left-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">{selectedZone}</div>
          
          {/* Animated pulsing heart */}
          <div className="relative my-4">
            <div className={clsx('absolute inset-0 rounded-full animate-ping', colors.bg, 'opacity-20')}
              style={{ animationDuration: `${(60 / zoneHealth.pulseRate).toFixed(2)}s` }} />
            <div className={clsx('relative w-40 h-40 rounded-full flex items-center justify-center ring-8', colors.ring)}
              style={{ 
                background: `conic-gradient(${colors.hex} ${zoneHealth.currentHealth}%, #f1f5f9 ${zoneHealth.currentHealth}%)`,
              }}>
              <div className="w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center">
                <Heart 
                  className={clsx('w-7 h-7 mb-1', colors.text)} 
                  fill="currentColor"
                  style={{ 
                    animation: `heartbeat ${60 / zoneHealth.pulseRate}s ease-in-out infinite` 
                  }}
                />
                <span className={clsx('text-4xl font-bold', colors.text)}>{zoneHealth.currentHealth}</span>
                <span className="text-xs text-slate-400">health</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Activity className={clsx('w-4 h-4', colors.text)} />
            <span className="text-sm font-medium text-slate-600">{zoneHealth.pulseRate} BPM</span>
            <span className="text-xs text-slate-400">
              {zoneHealth.pulseRate < 80 ? '(calm)' : zoneHealth.pulseRate < 110 ? '(stressed)' : '(critical)'}
            </span>
          </div>

          <div className={clsx('mt-4 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1',
            zoneHealth.trend === 'critical' ? 'bg-red-100 text-red-700' :
            zoneHealth.trend === 'declining' ? 'bg-orange-100 text-orange-700' :
            zoneHealth.trend === 'improving' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600')}>
            {zoneHealth.trend === 'improving' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {zoneHealth.trendValue}/day · {zoneHealth.trend}
          </div>
        </div>

        {/* Vital stats */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Active threats</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{zoneHealth.activeIssues}</p>
            <p className="text-xs text-red-500 mt-1">{zoneHealth.criticalIssues} critical</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm">Daily drain</span>
            </div>
            <p className="text-3xl font-bold text-orange-600">-{zoneHealth.drainPerDay}</p>
            <p className="text-xs text-slate-400 mt-1">health points/day</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">Heal potential</span>
            </div>
            <p className="text-3xl font-bold text-green-600">+{zoneHealth.healPotential}</p>
            <p className="text-xs text-slate-400 mt-1">if all issues resolved</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Heart className="w-4 h-4" />
              <span className="text-sm">Pulse rate</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{zoneHealth.pulseRate}</p>
            <p className="text-xs text-slate-400 mt-1">BPM (60 = healthy)</p>
          </div>
        </div>
      </div>

      {/* SWARM ALERT */}
      {/* AUTONOMOUS SWARM AGENT — live Gemini reasoning trace */}
      {(agentThinking || agent) && (
        <div className={clsx('card p-5 mb-6 border-2',
          agent?.decision === 'emergency_escalate' ? 'border-red-300 bg-red-50' :
          agent?.decision === 'escalate' ? 'border-orange-300 bg-orange-50' : 'border-amber-200 bg-amber-50')}>
          <div className="flex items-start gap-4">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
              agent?.decision === 'emergency_escalate' ? 'bg-red-500' :
              agent?.decision === 'escalate' ? 'bg-orange-500' : 'bg-amber-500')}>
              <Zap className={clsx('w-5 h-5 text-white', agentThinking && 'animate-pulse')} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="font-bold text-slate-900">Swarm Agent</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900 text-white">AUTONOMOUS</span>
                {agentThinking
                  ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 animate-pulse">⟳ Reasoning…</span>
                  : agent && <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full uppercase',
                      agent.decision === 'emergency_escalate' ? 'bg-red-200 text-red-800' :
                      agent.decision === 'escalate' ? 'bg-orange-200 text-orange-800' : 'bg-amber-200 text-amber-800')}>
                      {agent.decision === 'emergency_escalate' ? '🚨 Emergency escalate' : agent.decision === 'escalate' ? 'Auto-escalating' : 'Monitoring'}
                    </span>}
              </div>

              {agentThinking && !agent && (
                <p className="text-sm text-slate-500">Perceiving {zoneIssues.length} active issues in {selectedZone} and reasoning through root cause, responsibility, and action…</p>
              )}

              {agent && (
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-0.5">Perception</p>
                      <p className="text-slate-700">{agent.perception}</p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-0.5">Root cause</p>
                      <p className="text-slate-700">{agent.rootCause}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400 mb-1">Reasoning trace</p>
                    <ol className="space-y-1">
                      {(agent.reasoning || []).map((step: string, n: number) => (
                        <li key={n} className="text-sm text-slate-600 flex gap-2">
                          <span className="text-slate-400 font-mono text-xs mt-0.5">{n + 1}.</span>{step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="flex items-start gap-2 pt-1 border-t border-slate-200/60">
                    <span className="text-xs text-slate-400 mt-0.5">Action</span>
                    <p className="text-sm font-medium text-slate-800">{agent.actionPlan}
                      <span className="text-slate-400 font-normal"> → {agent.responsibleDepartment} · {agent.confidence}% confidence</span>
                    </p>
                  </div>
                  <p className="text-xs text-slate-400">This decision was reached autonomously by the agent — no human action required.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TIME MACHINE */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-civic-600" />
            <h3 className="font-bold text-slate-900">Time Machine</h3>
            <span className="text-xs text-slate-400">— predicted future if issues stay unresolved</span>
          </div>
          <div className="flex gap-2">
            {[30, 60, 90].map(d => (
              <button key={d} onClick={() => setPredictionDays(d)}
                className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  predictionDays === d ? 'bg-civic-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                {d} days
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className={clsx('rounded-xl p-4', futureHealth?.health < 40 ? 'bg-red-50' : 'bg-slate-50')}>
            <p className="text-sm text-slate-400 mb-1">Health in {predictionDays} days</p>
            <p className={clsx('text-3xl font-bold', healthColor(futureHealth?.health || 0).text)}>
              {futureHealth?.health}
              <span className="text-base text-slate-400 font-normal"> from {zoneHealth.currentHealth}</span>
            </p>
          </div>
          <div className="rounded-xl p-4 bg-orange-50">
            <p className="text-sm text-slate-400 mb-1">Projected accidents</p>
            <p className="text-3xl font-bold text-orange-600">{futureHealth?.projectedAccidents}</p>
          </div>
          <div className="rounded-xl p-4 bg-red-50">
            <p className="text-sm text-slate-400 mb-1">Cost of inaction</p>
            <p className="text-3xl font-bold text-red-600">₹{(futureHealth?.projectedCost || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={predictions}>
            <defs>
              <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.hex} stopOpacity={0.3} />
                <stop offset="100%" stopColor={colors.hex} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={2} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip 
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null
                const d = payload[0].payload as HealthPrediction
                return (
                  <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg text-xs">
                    <p className="font-semibold text-slate-900">{d.date}</p>
                    <p className="text-slate-600">Health: <span className="font-bold">{d.health}</span></p>
                    <p className="text-orange-600">{d.projectedAccidents} accidents projected</p>
                    <p className="text-red-600">₹{d.projectedCost.toLocaleString('en-IN')} cost</p>
                    <p className="text-slate-400 mt-1">{d.status}</p>
                  </div>
                )
              }}
            />
            <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'danger', fontSize: 10, fill: '#ef4444' }} />
            <Area type="monotone" dataKey="health" stroke={colors.hex} strokeWidth={2} fill="url(#healthGrad)" />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-400 mt-3 text-center">
          ⚠ This is the predicted decay curve. Each resolved issue bends this line back upward.
        </p>
      </div>

      {/* Top threats draining health */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Skull className="w-5 h-5 text-red-500" />
          <h3 className="font-bold text-slate-900">What's killing {selectedZone}</h3>
        </div>
        {zoneHealth.topThreats.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No active threats — this zone is healthy! 🎉</p>
        ) : (
          <div className="space-y-3">
            {zoneHealth.topThreats.map((threat, i) => (
              <div key={threat.issueId} className="flex items-center gap-4">
                <span className="w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{threat.title}</p>
                  <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(100, threat.drain * 8)}%` }} />
                  </div>
                </div>
                <span className="text-sm font-bold text-red-600 flex-shrink-0">-{threat.drain}/day</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}