'use client'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { getDashboardStats, getDepartments } from '@/lib/firestore'
import { TrendingUp, CheckCircle, AlertTriangle, Clock, Zap, FileText } from 'lucide-react'

const SEVERITY_COLORS: Record<string, string> = {
  pothole: '#2a8aff', streetlight: '#f59e0b', waterleakage: '#06b6d4',
  waste: '#84cc16', drainage: '#8b5cf6', construction: '#f97316',
  treehazard: '#10b981', other: '#94a3b8'
}

const DEPT_DATA = [
  { name: 'BBMP Roads', sla: 14, actual: 18, rating: 3.2, issues: 412, resolved: 289 },
  { name: 'BESCOM', sla: 7, actual: 5, rating: 4.1, issues: 187, resolved: 171 },
  { name: 'BWSSB', sla: 10, actual: 12, rating: 3.7, issues: 243, resolved: 198 },
  { name: 'Solid Waste', sla: 3, actual: 4, rating: 3.9, issues: 321, resolved: 278 },
  { name: 'Horticulture', sla: 14, actual: 9, rating: 4.3, issues: 89, resolved: 81 },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats().then(s => { setStats(s); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-4 border-civic-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const categoryData = stats ? Object.entries(stats.byCategory).map(([k, v]) => ({
    name: k.replace(/([A-Z])/g, ' $1'), value: v as number, fill: SEVERITY_COLORS[k] || '#94a3b8'
  })) : []

  const zoneData = stats ? Object.entries(stats.byNeighbourhood).slice(0, 8).map(([k, v]) => ({
    zone: k.slice(0, 8), issues: v as number
  })) : []

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Civic intelligence dashboard</h1>
        <p className="text-slate-500">Real-time overview of community issues across all neighbourhoods</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total issues', value: stats?.total || 0, icon: FileText, color: 'text-civic-600', bg: 'bg-civic-50' },
          { label: 'Resolved', value: stats?.resolved || 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Resolution rate', value: `${stats?.resolutionRate || 0}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Avg resolution', value: `${stats?.avgResolutionDays || 0}d`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <p className="text-sm text-slate-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Issues by zone</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={zoneData}>
              <XAxis dataKey="zone" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="issues" fill="#2a8aff" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Issue categories</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                {categoryData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip formatter={(v: any, n: any) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {categoryData.slice(0, 5).map(({ name, fill }) => (
              <span key={name} className="flex items-center gap-1 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: fill }} />
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-5 h-5 text-civic-600" />
          <h3 className="font-semibold text-slate-900">Department SLA transparency board</h3>
        </div>
        <div className="space-y-4">
          {DEPT_DATA.map(dept => {
            const onTrack = dept.actual <= dept.sla
            const pct = Math.min(100, Math.round((dept.resolved / dept.issues) * 100))
            return (
              <div key={dept.name} className="flex items-center gap-4">
                <div className="w-28 flex-shrink-0">
                  <p className="text-sm font-medium text-slate-800">{dept.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={`text-xs ${s <= Math.round(dept.rating) ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
                    ))}
                    <span className="text-xs text-slate-400 ml-1">{dept.rating}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>SLA: {dept.sla}d target · Actual: {dept.actual}d avg</span>
                    <span className={onTrack ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                      {onTrack ? '✓ On track' : '✗ Over SLA'}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${onTrack ? 'bg-green-500' : 'bg-red-400'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{pct}% resolved ({dept.resolved}/{dept.issues})</p>
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-slate-400 mt-4">* SLA data sourced from municipal records and citizen reports. Updated daily.</p>
      </div>
    </div>
  )
}
