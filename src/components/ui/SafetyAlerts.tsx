'use client'
import { useEffect, useState } from 'react'
import { subscribeToIssues, getDistanceKm } from '@/lib/firestore'
import type { Issue } from '@/types'
import { AlertTriangle, X, MapPin, Bell, ShieldAlert } from 'lucide-react'
import clsx from 'clsx'

export default function SafetyAlerts() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null)
  const [activeBanner, setActiveBanner] = useState<Issue | null>(null)
  const [dismissed, setDismissed] = useState<string[]>([])
  const [showFeed, setShowFeed] = useState(false)
  const [seenCount, setSeenCount] = useState(0)

  useEffect(() => {
    const unsub = subscribeToIssues(setIssues)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(p => setUserLoc({ lat: p.coords.latitude, lng: p.coords.longitude }))
    }
    return unsub
  }, [])

  // Only CRITICAL unresolved issues count as active safety alerts
  const alerts = issues.filter(i => 
    i.severity === 'critical' && 
    i.status !== 'resolved' && i.status !== 'rejected'
  )

  // Proximity banner - show nearest critical issue within 2km
  useEffect(() => {
    if (!userLoc || alerts.length === 0) return
    const nearby = alerts
      .filter(i => i.location && !dismissed.includes(i.id))
      .map(i => ({ issue: i, dist: getDistanceKm(userLoc.lat, userLoc.lng, i.location.lat, i.location.lng) }))
      .filter(x => x.dist <= 2)
      .sort((a, b) => a.dist - b.dist)
    if (nearby.length > 0) setActiveBanner(nearby[0].issue)
  }, [userLoc, issues, dismissed])

  useEffect(() => {
    setSeenCount(alerts.length)
  }, [alerts.length])

  return (
    <>
      {/* Proximity warning banner */}
      {activeBanner && (
        <div className="fixed top-16 left-0 right-0 z-[1100] bg-red-500 text-white px-4 py-3 shadow-lg animate-slide-up">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 animate-pulse" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">⚠ Safety alert near you</p>
              <p className="text-xs text-red-50 truncate">{activeBanner.title} reported in {activeBanner.neighbourhood} — stay cautious in this area</p>
            </div>
            <button onClick={() => { setDismissed(d => [...d, activeBanner.id]); setActiveBanner(null) }}
              className="p-1 hover:bg-red-600 rounded-lg flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating alert bell */}
      <button onClick={() => setShowFeed(v => !v)}
        className="fixed bottom-6 right-6 z-[1100] w-14 h-14 bg-civic-600 hover:bg-civic-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all active:scale-90">
        <Bell className="w-6 h-6" />
        {alerts.length > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
            {alerts.length}
          </span>
        )}
      </button>

      {/* Alert feed panel */}
      {showFeed && (
        <div className="fixed bottom-24 right-6 z-[1100] w-80 max-h-[60vh] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-slide-up">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-red-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h3 className="font-semibold text-slate-900">Live safety alerts</h3>
            </div>
            <button onClick={() => setShowFeed(false)} className="p-1 hover:bg-red-100 rounded-lg">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1">
            {alerts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No active safety alerts 🎉</p>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className="p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-2">
                    <span className={clsx('w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                      alert.severity === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-orange-500')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{alert.title}</p>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {alert.neighbourhood}
                        <span className={clsx('ml-1 px-1.5 py-0.5 rounded-full text-xs font-medium',
                          alert.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700')}>
                          {alert.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-3 bg-slate-50 text-center">
            <p className="text-xs text-slate-400">Alerts within 2km are pushed to your device</p>
          </div>
        </div>
      )}
    </>
  )
}