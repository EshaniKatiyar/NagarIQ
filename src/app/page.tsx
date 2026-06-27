'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Activity, Scale, Lock, Camera, Brain, Shield, ArrowRight, ArrowUpRight, Heart } from 'lucide-react'

const stats = [
  { value: '2,847', label: 'issues tracked' },
  { value: '67%', label: 'resolution rate' },
  { value: '143', label: 'briefs auto-filed' },
  { value: '18', label: 'zones monitored' },
]
const pillars = [
  { icon: Activity, name: 'Civic Twin', line: 'Every neighbourhood gets a live health score and a heartbeat that races as conditions worsen.', tag: 'the city, alive' },
  { icon: Scale, name: 'RTI Receipt', line: 'When a deadline is breached, AI drafts a filing-ready legal application the government must answer in 30 days.', tag: 'leverage, not requests' },
  { icon: Lock, name: 'Proof Engine', line: 'Every action is cryptographically chained. Records cannot be deleted or backdated, and tampering is exposed.', tag: 'accountability, enforced' },
]
const flow = [
  { icon: Camera, title: 'Report', body: 'Snap a photo or speak. Gemini Vision categorizes, scores severity, and routes it to the right department.' },
  { icon: Brain, title: 'Synthesize', body: 'Clustered issues become a formal Civic Brief, generated and escalated autonomously.' },
  { icon: Shield, title: 'Protect', body: 'Interim safety actions and proximity alerts shield people between reported and resolved.' },
  { icon: Scale, title: 'Compel', body: 'Past the deadline, a ready-to-file RTI application turns a citizen into someone the system must answer.' },
]

export default function Home() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const fade = (d: string) => `transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${d}`

  return (
    <div className="bg-sand-50 text-stone-900 overflow-x-hidden">
      {/* HERO */}
      <section className="relative px-6 pt-36 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(60% 50% at 50% 0%, rgba(217,127,36,0.14) 0%, transparent 70%), radial-gradient(40% 40% at 85% 20%, rgba(192,97,26,0.09) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 pointer-events-none opacity-50" style={{ backgroundImage: 'linear-gradient(#e9ddc9 1px, transparent 1px), linear-gradient(90deg, #e9ddc9 1px, transparent 1px)', backgroundSize: '64px 64px', maskImage: 'radial-gradient(70% 60% at 50% 30%, #000 0%, transparent 75%)', WebkitMaskImage: 'radial-gradient(70% 60% at 50% 30%, #000 0%, transparent 75%)' }} />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className={`inline-flex items-center gap-2 text-sm font-medium text-amber-600 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full mb-7 ${fade('delay-0')}`}>
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full w-2 h-2 bg-amber-500" />
            </span>
            Civic intelligence, powered by Google Gemini
          </div>
          <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.02] tracking-tight mb-6 ${fade('delay-100')}`}>
            Your neighbourhood<br />
            <span className="italic bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">is alive.</span>
          </h1>
          <p className={`text-lg lg:text-xl leading-relaxed text-stone-600 max-w-xl mx-auto mb-9 ${fade('delay-200')}`}>
            NagarIQ isn&apos;t a complaint box. It gives every locality a living health score, predicts its decline, and hands citizens the legal tools to force a response.
          </p>
          <div className={`flex gap-3 justify-center flex-wrap ${fade('delay-300')}`}>
            <Link href="/pulse" className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-3.5 rounded-xl font-semibold shadow-lg shadow-stone-900/20 hover:-translate-y-0.5 transition-transform whitespace-nowrap">
              See the heartbeat <ArrowRight className="w-4 h-4 shrink-0" />
            </Link>
            <Link href="/report" className="inline-flex items-center gap-2 bg-white text-stone-900 px-6 py-3.5 rounded-xl font-semibold border border-sand-200 hover:border-amber-500 hover:text-amber-600 hover:-translate-y-0.5 transition-all whitespace-nowrap">
              Report an issue
            </Link>
          </div>
          {/* EKG PULSE SIGNATURE */}
          <div className={`relative mt-16 ${fade('delay-500')}`}>
            <svg className="w-full h-32 block" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden>
              <defs>
                <linearGradient id="pg" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#d97f24" stopOpacity="0" />
                  <stop offset="20%" stopColor="#d97f24" stopOpacity="1" />
                  <stop offset="80%" stopColor="#c0611a" stopOpacity="1" />
                  <stop offset="100%" stopColor="#c0611a" stopOpacity="0" />
                </linearGradient>
                <filter id="pb" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
              </defs>
              <line x1="0" y1="100" x2="1200" y2="100" stroke="#e9ddc9" strokeWidth="1.5" strokeDasharray="4 6" />
              <path d="M0,100 L260,100 L290,100 L310,40 L330,160 L350,100 L380,100 L520,100 L545,100 L560,70 L575,130 L590,100 L760,100 L860,100 L885,100 L905,30 L925,170 L945,100 L975,100 L1200,100" fill="none" stroke="url(#pg)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" filter="url(#pb)" style={{ strokeDasharray: 2400, strokeDashoffset: 2400 }} className="animate-trace" />
              <path d="M0,100 L260,100 L290,100 L310,40 L330,160 L350,100 L380,100 L520,100 L545,100 L560,70 L575,130 L590,100 L760,100 L860,100 L885,100 L905,30 L925,170 L945,100 L975,100 L1200,100" fill="none" stroke="url(#pg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 2400, strokeDashoffset: 2400 }} className="animate-trace" />
            </svg>
            <div className="inline-flex items-center gap-2 mt-2 text-sm font-medium text-stone-600">
              <Heart className="w-4 h-4 text-red-500 animate-heartbeat" fill="currentColor" />
              <span>Koramangala</span>
              <span className="text-stone-900 font-bold">126 BPM</span>
              <span className="text-red-500 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full">critical</span>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 px-6 pb-20">
        {stats.map((s, i) => (
          <div key={s.label} className={`text-center py-6 px-4 ${i % 4 !== 0 ? 'md:border-l border-sand-200' : ''}`}>
            <div className="text-3xl lg:text-4xl font-bold tracking-tight">{s.value}</div>
            <div className="text-sm text-stone-500 mt-1">{s.label}</div>
          </div>
        ))}
      </section>

      {/* THESIS */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="uppercase tracking-[0.18em] text-xs font-semibold text-amber-600 mb-4">The shift</p>
        <h2 className="text-3xl lg:text-5xl leading-tight tracking-tight font-bold">
          Most civic apps help you <span className="relative text-stone-400 line-through decoration-2">ask</span>.<br />
          NagarIQ helps you <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">measure, predict, and compel</span>.
        </h2>
      </section>

      {/* PILLARS */}
      <section className="max-w-5xl mx-auto grid md:grid-cols-3 gap-5 px-6 pb-20">
        {pillars.map((p) => (
          <article key={p.name} className="bg-white border border-sand-200 rounded-2xl p-7 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-stone-900/10 hover:border-amber-500/40 transition-all duration-300">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500/15 to-amber-600/15 text-amber-600 mb-5">
              <p.icon className="w-5 h-5" />
            </div>
            <div className="text-xs uppercase tracking-wider text-amber-600 font-semibold mb-2">{p.tag}</div>
            <h3 className="text-xl font-bold mb-2.5 tracking-tight">{p.name}</h3>
            <p className="text-[0.95rem] leading-relaxed text-stone-600">{p.line}</p>
          </article>
        ))}
      </section>

      {/* FLOW */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="max-w-xl mb-10">
          <p className="uppercase tracking-[0.18em] text-xs font-semibold text-amber-600 mb-3">How it works</p>
          <h2 className="text-3xl lg:text-4xl leading-tight tracking-tight font-bold">From a single photo to a force the city must answer.</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {flow.map((f, i) => (
            <div key={f.title} className="p-6 bg-sand-100 rounded-2xl hover:bg-white hover:shadow-lg hover:shadow-stone-900/5 transition-all">
              <div className="text-sm font-bold text-amber-600 tabular-nums mb-3">{String(i + 1).padStart(2, '0')}</div>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white text-stone-900 mb-3.5 border border-sand-200"><f.icon className="w-5 h-5" /></div>
              <h4 className="text-base font-bold mb-1.5">{f.title}</h4>
              <p className="text-sm leading-relaxed text-stone-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CLOSING */}
      <section className="relative text-center py-24 px-6 mx-6 mb-12 bg-stone-900 rounded-[28px] overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(50% 80% at 50% 100%, rgba(217,127,36,0.35) 0%, transparent 70%)' }} />
        <h2 className="relative text-3xl lg:text-5xl font-bold text-white tracking-tight mb-3">See a problem? Make the city answer for it.</h2>
        <p className="relative text-amber-100/70 text-lg mb-8">Join the citizens turning observations into accountability.</p>
        <Link href="/report" className="relative inline-flex items-center gap-2 bg-white text-stone-900 px-7 py-4 rounded-xl font-semibold text-lg hover:-translate-y-0.5 transition-transform">
          Start reporting <ArrowUpRight className="w-4 h-4 shrink-0" />
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="max-w-5xl mx-auto px-6 py-10 flex flex-wrap justify-between items-center gap-6 border-t border-sand-200">
        <div className="flex flex-col gap-1">
          <span className="text-xl font-bold tracking-tight">Nagar<span className="text-amber-600">IQ</span></span>
          <span className="text-sm text-stone-500">Civic intelligence for living cities.</span>
        </div>
        <div className="flex gap-6">
          <Link href="/pulse" className="text-stone-500 hover:text-amber-600 text-sm font-medium transition-colors">Civic Twin</Link>
          <Link href="/map" className="text-stone-500 hover:text-amber-600 text-sm font-medium transition-colors">Map</Link>
          <Link href="/ledger" className="text-stone-500 hover:text-amber-600 text-sm font-medium transition-colors">Proof Engine</Link>
          <Link href="/dashboard" className="text-stone-500 hover:text-amber-600 text-sm font-medium transition-colors">Dashboard</Link>
        </div>
        <div className="text-xs text-stone-500">Built with Google Gemini · Cloud Run · Firebase</div>
      </footer>
    </div>
  )
}