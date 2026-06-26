'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { 
  MapPin, BarChart3, Trophy, Plus, MessageCircle, 
  LogIn, LogOut, Menu, X, Zap, Activity, Lock
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { href: '/pulse', label: 'Civic Twin', icon: Activity },
  { href: '/map', label: 'Live map', icon: MapPin },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/ledger', label: 'Proof Engine', icon: Lock },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/chat', label: 'AI assistant', icon: MessageCircle },
]

export default function Navbar() {
  const { user, profile, signIn, signOut, loading } = useAuth()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <div className="w-8 h-8 bg-civic-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-slate-900">Nagar<span className="text-civic-600">IQ</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                pathname === href
                  ? 'bg-civic-50 text-civic-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/report"
            className="hidden md:flex items-center gap-1.5 bg-civic-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-civic-700 transition-all active:scale-95">
            <Plus className="w-4 h-4" />
            Report issue
          </Link>

          {loading ? (
            <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <Link href="/profile" className="flex items-center gap-2">
                {user.photoURL
                  ? <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border-2 border-civic-200" />
                  : <div className="w-8 h-8 bg-civic-100 text-civic-700 rounded-full flex items-center justify-center text-sm font-semibold">{user.displayName?.[0]}</div>
                }
                {profile && (
                  <span className="hidden md:block text-sm font-medium text-slate-700">
                    {profile.points.toLocaleString()} pts
                  </span>
                )}
              </Link>
              <button onClick={signOut} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={signIn} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-all">
              <LogIn className="w-4 h-4" />
              Sign in
            </button>
          )}

          <button className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg" onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-3 flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className={clsx(
                'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium',
                pathname === href ? 'bg-civic-50 text-civic-700' : 'text-slate-600 hover:bg-slate-50'
              )}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <Link href="/report" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-civic-600 text-white mt-1">
            <Plus className="w-4 h-4" />
            Report issue
          </Link>
        </div>
      )}
    </nav>
  )
}