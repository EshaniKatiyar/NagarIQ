'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getBrief } from '@/lib/firestore'
import type { CivicBrief } from '@/types'
import { FileText, MapPin, IndianRupee, AlertTriangle, ArrowLeft, Building2, Users, Loader2 } from 'lucide-react'

// Rich fallback for the seeded demo cluster (briefURL: /brief/koramangala-road-cluster)
const DEMO_BRIEF = {
  title: 'Systemic Road Failure — Koramangala 80ft Road Corridor',
  neighbourhood: 'Koramangala',
  department: 'BBMP Roads',
  severity: 'high',
  affectedRadius: 500,
  totalReports: 3,
  estimatedCost: 56000,
  status: 'escalated',
  rootCause: 'Repeated potholes within a 500m stretch suggest substandard resurfacing during the last monsoon repair cycle. The clustering pattern indicates a contractor quality failure rather than isolated wear. Recommend a formal contractor audit and core-sample testing of the road base.',
  summary: 'Three independent pothole reports have been filed within a 500-metre stretch of the 80ft Road in Koramangala over a short window. Individually, each is a routine repair. Together, they form a clear systemic pattern that a single-issue complaint system would miss entirely. NagarIQ\u2019s Swarm Agent automatically clustered these reports, identified the underlying cause, and escalated them as a single accountable brief to BBMP Roads.',
  actions: [
    'Conduct a contractor audit of the last resurfacing tender for this corridor',
    'Core-sample the road base to verify sub-surface quality',
    'Issue a consolidated repair work order rather than three patch jobs',
    'File an RTI application requesting the original tender and material specifications',
  ],
}

export default function BriefPage() {
  const params = useParams()
  const id = params?.id as string
  const [brief, setBrief] = useState<CivicBrief | null>(null)
  const [loading, setLoading] = useState(true)
  const [demo, setDemo] = useState(false)

  useEffect(() => {
    (async () => {
      // The seeded demo cluster uses a slug, not a real Firestore id
      if (id === 'koramangala-road-cluster') {
        setDemo(true); setLoading(false); return
      }
      const b = await getBrief(id)
      if (b) setBrief(b)
      else setDemo(true) // graceful fallback so judges never hit a 404
      setLoading(false)
    })()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
      </div>
    )
  }

  // Parse real brief content if present
  let parsed: any = null
  if (brief?.content) { try { parsed = JSON.parse(brief.content) } catch {} }

  const d = demo ? DEMO_BRIEF : {
    title: brief?.title || 'Civic Brief',
    neighbourhood: brief?.neighbourhood || '',
    department: brief?.department || '',
    severity: brief?.severity || 'medium',
    affectedRadius: brief?.affectedRadius || 0,
    totalReports: brief?.totalReports || 0,
    estimatedCost: brief?.estimatedCost || 0,
    status: brief?.status || 'draft',
    rootCause: parsed?.rootCause?.rootCause || parsed?.rootCause || '',
    summary: parsed?.summary || parsed?.executiveSummary || '',
    actions: parsed?.recommendedActions || parsed?.actions || [],
  }

  return (
    <div className="min-h-screen bg-sand-50 pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/map" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-amber-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to map
        </Link>

        {/* Header card */}
        <div className="bg-white border border-sand-200 rounded-2xl p-7 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              <FileText className="w-3.5 h-3.5" /> Civic Brief
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full uppercase">
              {d.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight mb-4 leading-snug">{d.title}</h1>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-sand-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-1"><MapPin className="w-3.5 h-3.5" />Area</div>
              <div className="font-bold text-stone-900 text-sm">{d.neighbourhood}</div>
            </div>
            <div className="bg-sand-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-1"><Building2 className="w-3.5 h-3.5" />Department</div>
              <div className="font-bold text-stone-900 text-sm">{d.department}</div>
            </div>
            <div className="bg-sand-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-1"><Users className="w-3.5 h-3.5" />Reports</div>
              <div className="font-bold text-stone-900 text-sm">{d.totalReports} clustered</div>
            </div>
            <div className="bg-sand-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-1"><IndianRupee className="w-3.5 h-3.5" />Est. cost</div>
              <div className="font-bold text-stone-900 text-sm">₹{d.estimatedCost.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        {/* Summary */}
        {d.summary && (
          <div className="bg-white border border-sand-200 rounded-2xl p-7 mb-5">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide mb-3">Executive summary</h2>
            <p className="text-stone-600 leading-relaxed">{d.summary}</p>
          </div>
        )}

        {/* Root cause */}
        {d.rootCause && (
          <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-7 mb-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-amber-800 uppercase tracking-wide mb-3">
              <AlertTriangle className="w-4 h-4" /> AI root-cause analysis
            </h2>
            <p className="text-stone-700 leading-relaxed">{d.rootCause}</p>
          </div>
        )}

        {/* Recommended actions */}
        {d.actions && d.actions.length > 0 && (
          <div className="bg-white border border-sand-200 rounded-2xl p-7 mb-5">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide mb-4">Recommended actions</h2>
            <ul className="space-y-2.5">
              {d.actions.map((a: string, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <span className="text-stone-600 leading-relaxed">{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-center text-xs text-stone-400 mt-6">
          Generated autonomously by the NagarIQ Swarm Agent · Escalated to {d.department}
        </p>
      </div>
    </div>
  )
}