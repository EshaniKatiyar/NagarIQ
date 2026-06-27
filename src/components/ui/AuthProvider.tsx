'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, User, signInWithPopup, signInAnonymously, signOut as firebaseSignOut } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { getOrCreateUser, refreshUserProfile } from '@/lib/firestore'
import type { UserProfile } from '@/types'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: () => Promise<void>
  signInAnon: () => Promise<User | null>
  ensureUser: () => Promise<User | null>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null, profile: null, loading: true,
  signIn: async () => {}, signInAnon: async () => null, ensureUser: async () => null, signOut: async () => {}, refreshProfile: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        const p = await getOrCreateUser(u.uid, {
          displayName: u.displayName || 'Citizen',
          email: u.email || '',
          photoURL: u.photoURL || undefined,
        })
        setProfile(p)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const signIn = async () => {
    try { await signInWithPopup(auth, googleProvider) }
    catch (e) { console.error(e) }
  }

  // Silently create an anonymous session (for guest reporting)
  const signInAnon = async (): Promise<User | null> => {
    try {
      const cred = await signInAnonymously(auth)
      return cred.user
    } catch (e) {
      console.error('Anon sign-in failed:', e)
      return null
    }
  }

  // Guarantee there's a user before an action; sign in anonymously if needed
  const ensureUser = async (): Promise<User | null> => {
    if (auth.currentUser) return auth.currentUser
    return await signInAnon()
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (!user) return
    const p = await refreshUserProfile(user.uid)
    if (p) setProfile(p)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signInAnon, ensureUser, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)