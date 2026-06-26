'use client'
import Link from 'next/link'
import { MapPin, Shield, Zap, BarChart3, ArrowRight, Camera, Brain, Bell, Activity, Lock, Scale } from 'lucide-react'

const stats = [
  { label: 'Issues tracked', value: '2,847', delta: '+12% this week' },
  { label: 'Resolved', value: '1,923', delta: '67% resolution rate' },
  { label: 'Active citizens', value: '4,201', delta: 'across 18 zones' },
  { label: 'Briefs generated', value: '143', delta: 'sent to departments' },
]

const features = [
  { icon: Activity, title: 'Civic Twin', desc: 'Every neighbourhood has a live health score and a heartbeat that races when issues pile up. Watch your zone\'s vital signs in real-time.', accent: 'rose' },
  { icon: Scale, title: 'RTI Receipt', desc: 'When the government ignores a deadline, AI auto-generates a filing-ready Right to Information application. We don\'t ask — we legally compel.', accent: 'violet' },
  { icon: Lock, title: 'Proof Engine', desc: 'Every civic action is cryptographically chained. Records can\'t be deleted or backdated — and tampering is mathematically exposed.', accent: 'emerald' },
  { icon: Camera, title: 'AI photo analysis', desc: 'Gemini Vision auto-categorizes your issue, estimates severity, and detects duplicates instantly. Just snap and go.', accent: 'teal' },
  { icon: Brain, title: 'Pattern intelligence', desc: 'When issues cluster, an autonomous agent drafts a formal Civic Brief and routes it to the right department — no human needed.', accent: 'amber' },
  { icon: Shield, title: 'Safety layer', desc: 'Interim safety actions and proximity alerts protect people in the dangerous gap between reported and resolved.', accent: 'sky' },
]

const accentMap: Record<string, string> = {
  rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-100',
  violet: 'bg-violet-50 text-violet-600 group-hover:bg-violet-100',
  emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
  teal: 'bg-teal-50 text-teal-600 group-hover:bg-teal-100',
  amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100',
  sky: 'bg-sky-50 text-sky-600 group-hover:bg-sky-100',
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0d2847] to-[#0a3d3d] text-white">
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'radial-gradient(circle at 15% 50%, #14b8a6 0%, transparent 45%), radial-gradient(circle at 85% 30%, #6366f1 0%, transparent 45%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 py-24 md:py-32 pb-32">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-8 backdrop-blur-sm">
            <Zap className="w-3.5 h-3.5 text-teal-300" />
            Powered by Gemini AI + Google Cloud
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] mb-6 max-w-4xl">
            Your city.<br />
            <span className="bg-gradient-to-r from-teal-300 to-indigo-300 bg-clip-text text-transparent">Your voice.</span><br />
            Real action.
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mb-10 leading-relaxed">
            NagarIQ turns citizen observations into structured accountability. 
            Report issues, watch AI generate formal briefs, and legally compel a response.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/report" className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white px-6 py-3.5 rounded-xl font-semibold text-lg transition-all active:scale-95 shadow-lg shadow-teal-900/30">
              Report an issue
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/pulse" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3.5 rounded-xl font-semibold text-lg transition-all backdrop-blur-sm">
              <Activity className="w-5 h-5" />
              See the heartbeat
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 -mt-16 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(({ label, value, delta }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-5">
              <p className="text-sm text-slate-500 mb-1">{label}</p>
              <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
              <p className="text-xs text-teal-600 font-medium">{delta}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Not just another complaint portal</h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            NagarIQ is an intelligence layer — it synthesizes citizen reports into pressure that actually creates change.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc, accent }) => (
            <div key={title} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-200 group">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors ${accentMap[accent]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-[#0d2847] to-[#0a3d3d] text-white py-16">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #14b8a6 0%, transparent 50%)' }} />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">See a problem? Fix it — together.</h2>
          <p className="text-slate-300 mb-8 text-lg">Join thousands of citizens already making their neighbourhoods better.</p>
          <Link href="/report" className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-teal-50 transition-all active:scale-95">
            Start reporting
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}