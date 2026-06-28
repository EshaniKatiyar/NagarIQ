'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { 
  MapPin, BarChart3, Trophy, Plus, MessageCircle, 
  LogIn, LogOut, Menu, X, Zap, Activity, Lock, Scale
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { href: '/pulse', label: 'Civic Twin', icon: Activity },
  { href: '/map', label: 'Map', icon: MapPin },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/ledger', label: 'Proof', icon: Lock },
  { href: '/rti', label: 'RTI', icon: Scale },
  { href: '/leaderboard', label: 'Ranks', icon: Trophy },
  { href: '/chat', label: 'Assistant', icon: MessageCircle },
]

export default function Navbar() {
  const { user, profile, signIn, signOut, loading } = useAuth()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1200] glass border-b border-white/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-stone-900">Nagar<span className="text-amber-600">IQ</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-0.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={clsx(
                'flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                pathname === href
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-stone-600 hover:bg-sand-100 hover:text-stone-900'
              )}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/report"
            className="hidden md:flex items-center gap-1.5 bg-stone-900 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition-all active:scale-95">
            <Plus className="w-4 h-4" />
            Report issue
          </Link>

          {loading ? (
            <div className="w-8 h-8 bg-sand-200 rounded-full animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <Link href="/profile" className="flex items-center gap-2">
                {user.photoURL
                  ? <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border-2 border-amber-200" />
                  : <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-sm font-semibold">{user.displayName?.[0]}</div>
                }
                {profile && (
                  <span className="hidden md:block text-sm font-medium text-stone-700">
                    {profile.points.toLocaleString()} pts
                  </span>
                )}
              </Link>
              <button onClick={signOut} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-sand-100 rounded-lg transition-all">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={signIn} className="flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 px-3 py-2 rounded-lg hover:bg-sand-100 transition-all">
              <LogIn className="w-4 h-4" />
              Sign in
            </button>
          )}

          <button className="md:hidden p-2 text-stone-500 hover:bg-sand-100 rounded-lg" onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-slate-100 px-4 py-3 flex flex-col gap-1 shadow-xl z-50 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className={clsx(
                'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium',
                pathname === href ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'
              )}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <Link href="/report" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-stone-900 text-white mt-1">
            <Plus className="w-4 h-4" />
            Report issue
          </Link>
        </div>
      )}
    </nav>
  )
}