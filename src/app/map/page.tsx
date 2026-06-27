'use client'
import { useEffect, useState, useRef } from 'react'
import { subscribeToIssues, upvoteIssue, spottedIssue, findNearbyIssues } from '@/lib/firestore'
import { useAuth } from '@/components/ui/AuthProvider'
import type { Issue, IssueSeverity } from '@/types'
import { ThumbsUp, Eye, Layers, Zap, X, ExternalLink, Share2, CheckCircle2, Scale } from 'lucide-react'
import clsx from 'clsx'
import Link from 'next/link'
import ResolveModal from '@/components/ui/ResolveModal'
import RTIModal from '@/components/ui/RTIModal'

const SEVERITY_COLORS: Record<IssueSeverity, string> = {
  low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444'
}
const CATEGORY_ICONS: Record<string, string> = {
  pothole: '🕳️', streetlight: '💡', waterleakage: '💧', waste: '🗑️',
  drainage: '🌊', construction: '🏗️', treehazard: '🌳', other: '⚠️'
}

export default function MapPage() {
  const { user, refreshProfile } = useAuth()
  const [showResolve, setShowResolve] = useState(false)
  const [showRTI, setShowRTI] = useState(false)
  const [spottedDone, setSpottedDone] = useState<string[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [generating, setGenerating] = useState(false)
  const [briefResult, setBriefResult] = useState<any>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const LRef = useRef<any>(null)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    const unsub = subscribeToIssues(setIssues)
    return unsub
  }, [])

  // Initialize Leaflet map
  useEffect(() => {
    let mounted = true
    const initMap = async () => {
      const L = (await import('leaflet')).default
      LRef.current = L
      // Load CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }
      if (!mounted || !mapRef.current || mapInstanceRef.current) return
      const map = L.map(mapRef.current).setView([12.9716, 77.5946], 12)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)
      mapInstanceRef.current = map
      setMapReady(true)

      // Try to center on user
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          map.setView([pos.coords.latitude, pos.coords.longitude], 13)
        })
      }
    }
    initMap()
    return () => { mounted = false }
  }, [])

  // Render markers
  useEffect(() => {
    const L = LRef.current
    const map = mapInstanceRef.current
    if (!L || !map) return

    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current = []

    const filtered = issues.filter(i => {
      if (filterSeverity !== 'all' && i.severity !== filterSeverity) return false
      if (filterStatus !== 'all' && i.status !== filterStatus) return false
      return i.location && i.location.lat && i.location.lng
    })

    filtered.forEach(issue => {
      const size = issue.upvotes > 10 ? 40 : issue.upvotes > 5 ? 34 : 28
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width:${size}px;height:${size}px;
          background:${SEVERITY_COLORS[issue.severity]};
          border:3px solid white;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-size:${size/2}px;box-shadow:0 2px 8px rgba(0,0,0,0.3);
          cursor:pointer;">${CATEGORY_ICONS[issue.category] || '⚠️'}</div>`,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
      })
      const marker = L.marker([issue.location.lat, issue.location.lng], { icon }).addTo(map)
      marker.on('click', () => setSelectedIssue(issue))
      markersRef.current.push(marker)
    })
  }, [issues, filterSeverity, filterStatus, mapReady])

  const handleUpvote = async (issue: Issue) => {
    if (!user || issue.upvotedBy?.includes(user.uid)) return
    await upvoteIssue(issue.id, user.uid)
    setSelectedIssue(prev => prev ? { ...prev, upvotes: prev.upvotes + 1, upvotedBy: [...(prev.upvotedBy||[]), user.uid] } : prev)
  }
  const handleSpotted = async (issue: Issue) => {
    if (!user) return
    await spottedIssue(issue.id, user.uid)
  }
  const handleGenerateBrief = async (issue: Issue) => {
    if (!issue.location) return
    setGenerating(true)
    try {
      const nearby = await findNearbyIssues(issue.location.lat, issue.location.lng, 0.3)
      if (nearby.length < 2) { alert('Need 2+ nearby reports for a Civic Brief.'); setGenerating(false); return }
      const res = await fetch('/api/generate-brief', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issues: nearby, neighbourhood: issue.neighbourhood })
      })
      setBriefResult(await res.json())
    } catch { alert('Failed to generate brief.') }
    setGenerating(false)
  }
  const handleShare = (issue: Issue) => {
    const text = `NagarIQ: ${issue.title} in ${issue.neighbourhood}`
    const url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + window.location.origin)}`
    window.open(url, '_blank')
  }

  const statusColors: Record<string, string> = {
    reported: 'bg-slate-100 text-slate-600', verified: 'bg-blue-100 text-blue-700',
    escalated: 'bg-orange-100 text-orange-700', in_progress: 'bg-purple-100 text-purple-700',
    resolved: 'bg-green-100 text-green-700',
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex relative">
      <div ref={mapRef} className="flex-1 h-full z-0" />

      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <div className="glass rounded-xl p-3 shadow-lg flex flex-col gap-2 min-w-[180px]">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filters</p>
          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white">
            <option value="all">All severities</option>
            <option value="critical">🔴 Critical</option>
            <option value="high">🟠 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white">
            <option value="all">All statuses</option>
            <option value="reported">Reported</option>
            <option value="verified">Verified</option>
            <option value="escalated">Escalated</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div className="glass rounded-xl px-3 py-2 shadow text-xs text-slate-500">
          <span className="font-semibold text-slate-800">{issues.length}</span> live issues
        </div>
      </div>

      <div className="absolute bottom-8 left-4 z-[1000] glass rounded-xl p-3 shadow text-xs space-y-1.5">
        {Object.entries(SEVERITY_COLORS).map(([k, c]) => (
          <div key={k} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: c }} />
            <span className="text-slate-600 capitalize">{k}</span>
          </div>
        ))}
      </div>

      {selectedIssue && (
        <div className="absolute top-0 right-0 h-full w-80 glass shadow-2xl flex flex-col overflow-y-auto z-[1000] animate-slide-up">
          <div className="flex items-start justify-between p-4 border-b border-slate-100">
            <div>
              <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', statusColors[selectedIssue.status])}>{selectedIssue.status}</span>
              <h3 className="font-semibold text-slate-900 mt-2">{selectedIssue.title}</h3>
            </div>
            <button onClick={() => setSelectedIssue(null)} className="p-1 hover:bg-slate-100 rounded-lg ml-2"><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          {selectedIssue.photoURL && <img src={selectedIssue.photoURL} alt="" className="w-full h-44 object-cover" />}
          <div className="p-4 space-y-3 flex-1">
            <p className="text-sm text-slate-600">{selectedIssue.description}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 rounded-lg p-2">
                <p className="text-slate-400">Category</p>
                <p className="font-medium capitalize">{CATEGORY_ICONS[selectedIssue.category]} {selectedIssue.category}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2">
                <p className="text-slate-400">Severity</p>
                <span className={`font-medium px-1.5 py-0.5 rounded severity-${selectedIssue.severity}`}>{selectedIssue.severity}</span>
              </div>
              {selectedIssue.department && (
                <div className="col-span-2 bg-slate-50 rounded-lg p-2">
                  <p className="text-slate-400">Department</p>
                  <p className="font-medium text-slate-800">{selectedIssue.department}</p>
                </div>
              )}
              <div className="bg-slate-50 rounded-lg p-2">
                <p className="text-slate-400">Location</p>
                <p className="font-medium">{selectedIssue.neighbourhood}</p>
              </div>
              {selectedIssue.estimatedCost && (
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-slate-400">Est. cost</p>
                  <p className="font-medium">₹{selectedIssue.estimatedCost.toLocaleString()}</p>
                </div>
              )}
            </div>
            {selectedIssue.rootCauseNote && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-amber-700 mb-1">🔍 Root cause</p>
                <p className="text-xs text-amber-800">{selectedIssue.rootCauseNote}</p>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={() => handleUpvote(selectedIssue)} disabled={!user || selectedIssue.upvotedBy?.includes(user?.uid||'')}
                className={clsx('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium',
                  selectedIssue.upvotedBy?.includes(user?.uid||'') ? 'bg-civic-100 text-civic-700' : 'btn-secondary')}>
                <ThumbsUp className="w-3.5 h-3.5" />{selectedIssue.upvotes}
              </button>
              <button onClick={() => handleSpotted(selectedIssue)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium btn-secondary">
                <Eye className="w-3.5 h-3.5" />Spotted
              </button>
            </div>
            <button onClick={() => handleShare(selectedIssue)} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium btn-secondary">
              <Share2 className="w-3.5 h-3.5" />Share on WhatsApp
            </button>
            {selectedIssue.briefURL ? (
              <Link href={selectedIssue.briefURL} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <ExternalLink className="w-3.5 h-3.5" />View Civic Brief
              </Link>
            ) : (
              <button onClick={() => handleGenerateBrief(selectedIssue)} disabled={generating}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium bg-civic-50 text-civic-700 border border-civic-200">
                <Zap className="w-3.5 h-3.5" />{generating ? 'Generating...' : 'Generate Civic Brief'}
              </button>
            )}

            {selectedIssue.status !== 'resolved' ? (
              <button onClick={() => setShowResolve(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100">
                <CheckCircle2 className="w-3.5 h-3.5" />Mark as resolved
              </button>
            ) : (
              <div className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium bg-green-100 text-green-700">
                <CheckCircle2 className="w-3.5 h-3.5" />Resolved ✓ {selectedIssue.resolutionConfidence ? `(${selectedIssue.resolutionConfidence}% AI verified)` : ''}
              </div>
            )}

            {selectedIssue.status !== 'resolved' && (
              <button onClick={() => setShowRTI(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium bg-slate-900 text-white hover:bg-slate-800">
                <Scale className="w-3.5 h-3.5" />Generate RTI Receipt
              </button>
            )}
          </div>
          {briefResult && (
            <div className="m-4 bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-green-800 mb-1">✓ Civic Brief generated!</p>
              <p className="text-xs text-green-700">Routed to {briefResult.brief?.department}</p>
            </div>
          )}
        </div>
      )}

      {showResolve && selectedIssue && (
        <ResolveModal 
          issue={selectedIssue} 
          onClose={() => setShowResolve(false)}
          onResolved={() => setSelectedIssue(prev => prev ? { ...prev, status: 'resolved' } : prev)}
        />
      )}
      {showRTI && selectedIssue && (
        <RTIModal issue={selectedIssue} onClose={() => setShowRTI(false)} />
      )}
    </div>
  )
}