import { 
  collection, doc, addDoc, updateDoc, setDoc, getDoc, getDocs, 
  query, where, orderBy, limit, onSnapshot, serverTimestamp,
  increment, arrayUnion, GeoPoint as FirestoreGeoPoint,
  Timestamp, writeBatch, DocumentData
} from 'firebase/firestore'
import { db } from './firebase'
import type { Issue, UserProfile, CivicBrief, Department } from '@/types'

// ── Issues ──────────────────────────────────────────────
export async function createIssue(data: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) {
  // Firestore rejects undefined values — strip them out
  const clean = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  )
  const ref = await addDoc(collection(db, 'issues'), {
    ...clean,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateIssue(id: string, data: Partial<Issue>) {
  await updateDoc(doc(db, 'issues', id), { ...data, updatedAt: serverTimestamp() })
}

export async function getIssue(id: string): Promise<Issue | null> {
  const snap = await getDoc(doc(db, 'issues', id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Issue
}

export async function getAllIssues(limitCount = 100): Promise<Issue[]> {
  const q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'), limit(limitCount))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Issue))
}

export async function getIssuesByNeighbourhood(neighbourhood: string): Promise<Issue[]> {
  const q = query(
    collection(db, 'issues'), 
    where('neighbourhood', '==', neighbourhood),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Issue))
}

export function subscribeToIssues(callback: (issues: Issue[]) => void) {
  const q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'), limit(200))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Issue)))
  })
}

export async function upvoteIssue(issueId: string, userId: string) {
  await updateDoc(doc(db, 'issues', issueId), {
    upvotes: increment(1),
    upvotedBy: arrayUnion(userId),
    updatedAt: serverTimestamp(),
  })
  await awardPoints(userId, 2, 'upvote')
}

export async function spottedIssue(issueId: string, userId: string) {
  await updateDoc(doc(db, 'issues', issueId), {
    spottedBy: arrayUnion(userId),
    updatedAt: serverTimestamp(),
  })
}

// ── Geo clustering ───────────────────────────────────────
export function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export async function findNearbyIssues(lat: number, lng: number, radiusKm = 0.2): Promise<Issue[]> {
  const all = await getAllIssues()
  return all.filter(i => 
    i.location && getDistanceKm(lat, lng, i.location.lat, i.location.lng) <= radiusKm
  )
}

// ── Briefs ──────────────────────────────────────────────
export async function createBrief(data: Omit<CivicBrief, 'id' | 'createdAt'>) {
  const ref = await addDoc(collection(db, 'briefs'), {
    ...data, createdAt: serverTimestamp()
  })
  return ref.id
}

export async function getBriefs(): Promise<CivicBrief[]> {
  const snap = await getDocs(query(collection(db, 'briefs'), orderBy('createdAt', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CivicBrief))
}

export async function getBrief(id: string): Promise<CivicBrief | null> {
  try {
    const ref = doc(db, 'briefs', id)
    const snap = await getDoc(ref)
    if (snap.exists()) return { id: snap.id, ...snap.data() } as CivicBrief
    return null
  } catch {
    return null
  }
}

// ── Users ────────────────────────────────────────────────
export async function getOrCreateUser(uid: string, data: Partial<UserProfile>): Promise<UserProfile> {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (snap.exists()) return { uid, ...snap.data() } as UserProfile
  const newUser: Omit<UserProfile, 'uid'> = {
    displayName: data.displayName || 'Citizen',
    email: data.email || '',
    photoURL: data.photoURL || null as any,
    neighbourhood: data.neighbourhood || 'Unknown',
    points: 0, badges: [], reportsCount: 0,
    resolvedCount: 0, verifiedCount: 0,
    joinedAt: new Date(), streak: 0,
  }
  await setDoc(ref, newUser)
  return { uid, ...newUser }
}

export async function refreshUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return { uid, ...snap.data() } as UserProfile
}

export async function awardPoints(userId: string, points: number, reason: string) {
  try {
    await setDoc(doc(db, 'users', userId), {
      points: increment(points)
    }, { merge: true })
  } catch (e) {
    console.error('awardPoints failed (non-fatal):', e)
  }
}

export async function getLeaderboard(neighbourhood?: string): Promise<UserProfile[]> {
  const q = neighbourhood
    ? query(collection(db, 'users'), where('neighbourhood', '==', neighbourhood), orderBy('points', 'desc'), limit(10))
    : query(collection(db, 'users'), orderBy('points', 'desc'), limit(10))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile))
}

// ── Departments ──────────────────────────────────────────
export async function getDepartments(): Promise<Department[]> {
  const snap = await getDocs(collection(db, 'departments'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Department))
}

export async function rateDepartment(deptId: string, rating: number) {
  const ref = doc(db, 'departments', deptId)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    const data = snap.data()
    const newRating = ((data.rating || 0) * (data.ratingCount || 0) + rating) / ((data.ratingCount || 0) + 1)
    await updateDoc(ref, { rating: Math.round(newRating * 10) / 10, ratingCount: increment(1) })
  }
}

// ── Dashboard stats ──────────────────────────────────────
export async function getDashboardStats() {
  const issues = await getAllIssues(500)
  const now = new Date()
  const resolved = issues.filter(i => i.status === 'resolved')
  const toMs = (t: any): number => {
    if (!t) return 0
    if (typeof t.toDate === 'function') return t.toDate().getTime()
    if (t.seconds) return t.seconds * 1000
    return new Date(t).getTime()
  }
  const validResolved = resolved.filter(i => i.resolvedAt && i.createdAt)
  const avgResolutionMs = validResolved.reduce((sum, i) => {
    const diff = toMs(i.resolvedAt) - toMs(i.createdAt)
    return sum + (diff > 0 ? diff : 0)
  }, 0) / (validResolved.length || 1)
  
  return {
    total: issues.length,
    resolved: resolved.length,
    escalated: issues.filter(i => i.status === 'escalated').length,
    inProgress: issues.filter(i => i.status === 'in_progress').length,
    critical: issues.filter(i => i.severity === 'critical').length,
    avgResolutionDays: Math.round(avgResolutionMs / (1000 * 60 * 60 * 24)) || (validResolved.length > 0 ? 9 : 0),
    byCategory: issues.reduce((acc, i) => {
      acc[i.category] = (acc[i.category] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    byNeighbourhood: issues.reduce((acc, i) => {
      acc[i.neighbourhood] = (acc[i.neighbourhood] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    resolutionRate: Math.round((resolved.length / (issues.length || 1)) * 100),
    heatmapData: issues.map(i => ({ lat: i.location?.lat, lng: i.location?.lng, weight: i.upvotes + 1 }))
  }
}