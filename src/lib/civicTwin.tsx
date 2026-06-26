import type { Issue, IssueSeverity, IssueCategory } from '@/types'

// ── Health decay model ──────────────────────────────────
const SEVERITY_DRAIN: Record<IssueSeverity, number> = {
  low: 0.3,
  medium: 0.8,
  high: 2.0,
  critical: 4.5,
}

const CATEGORY_MULTIPLIER: Record<IssueCategory, number> = {
  waterleakage: 1.5,
  drainage: 1.6,
  pothole: 1.3,
  treehazard: 1.4,
  streetlight: 1.1,
  waste: 1.5,
  construction: 1.0,
  other: 1.0,
}

export interface ZoneHealth {
  neighbourhood: string
  currentHealth: number
  trend: 'improving' | 'declining' | 'stable' | 'critical'
  trendValue: number
  activeIssues: number
  criticalIssues: number
  pulseRate: number
  drainPerDay: number
  healPotential: number
  topThreats: { title: string; drain: number; issueId: string }[]
}

export interface HealthPrediction {
  day: number
  date: string
  health: number
  projectedAccidents: number
  projectedCost: number
  status: string
}

// ── Calculate current health of a zone ──────────────────
export function calculateZoneHealth(issues: Issue[], neighbourhood: string): ZoneHealth {
  const zoneIssues = issues.filter(i => 
    i.neighbourhood === neighbourhood && i.status !== 'resolved' && i.status !== 'rejected'
  )

  let totalDrain = 0
  const threats: { title: string; drain: number; issueId: string }[] = []

  for (const issue of zoneIssues) {
    let createdMs = Date.now()
    if (issue.createdAt) {
      const c: any = issue.createdAt
      if (typeof c.toDate === 'function') createdMs = c.toDate().getTime()
      else if (c.seconds) createdMs = c.seconds * 1000
      else createdMs = new Date(c).getTime()
    }
    const ageInDaysRaw = (Date.now() - createdMs) / (1000 * 60 * 60 * 24)
    const ageInDays = isNaN(ageInDaysRaw) ? 0 : Math.max(0, ageInDaysRaw)
    
    const baseDrain = SEVERITY_DRAIN[issue.severity] || 1
    const categoryMult = CATEGORY_MULTIPLIER[issue.category] || 1
    const ageMultiplier = 1 + Math.min(ageInDays / 30, 1.5)
    const impactMult = 1 + Math.min((issue.upvotes || 0) / 50, 1)
    
    const issueDrain = baseDrain * categoryMult * ageMultiplier * impactMult
    totalDrain += issueDrain
    threats.push({ title: issue.title, drain: Math.round(issueDrain * 10) / 10, issueId: issue.id })
  }

  const safeDrain = isNaN(totalDrain) ? 0 : totalDrain
  const currentHealth = Math.max(0, Math.min(100, Math.round(100 - safeDrain * 2)))
  
  const criticalCount = zoneIssues.filter(i => i.severity === 'critical').length
  const pulseRate = Math.round(60 + (100 - currentHealth) * 0.8)

  let trend: ZoneHealth['trend'] = 'stable'
  if (currentHealth < 35) trend = 'critical'
  else if (safeDrain > 5) trend = 'declining'
  else if (zoneIssues.length === 0) trend = 'improving'

  threats.sort((a, b) => b.drain - a.drain)

  return {
    neighbourhood,
    currentHealth,
    trend,
    trendValue: Math.round(-safeDrain * 10) / 10,
    activeIssues: zoneIssues.length,
    criticalIssues: criticalCount,
    pulseRate,
    drainPerDay: Math.round(safeDrain * 10) / 10,
    healPotential: Math.min(100 - currentHealth, Math.round(safeDrain * 2)),
    topThreats: threats.slice(0, 5),
  }
}

// ── Time Machine: predict future health ─────────────────
export function predictHealthTimeline(
  health: ZoneHealth, 
  daysAhead: number = 90
): HealthPrediction[] {
  const predictions: HealthPrediction[] = []
  let projectedHealth = health.currentHealth
  
  for (let day = 0; day <= daysAhead; day += 5) {
    const compoundFactor = 1 + (day / 90) * 0.5
    const dailyDrain = health.drainPerDay * compoundFactor * 0.15
    projectedHealth = Math.max(0, projectedHealth - dailyDrain * 5)
    
    const date = new Date()
    date.setDate(date.getDate() + day)
    
    const healthDeficit = 100 - projectedHealth
    const projectedAccidents = Math.round((healthDeficit / 100) * health.criticalIssues * (day / 30))
    const projectedCost = Math.round(healthDeficit * health.activeIssues * 1200 * (day / 30))
    
    let status = 'Healthy'
    if (projectedHealth < 25) status = 'Critical - urgent intervention needed'
    else if (projectedHealth < 45) status = 'Poor - significant degradation'
    else if (projectedHealth < 65) status = 'Declining - attention needed'
    else if (projectedHealth < 80) status = 'Fair'
    
    predictions.push({
      day,
      date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      health: Math.round(projectedHealth),
      projectedAccidents: Math.max(0, projectedAccidents),
      projectedCost: Math.max(0, projectedCost),
      status,
    })
  }
  
  return predictions
}

// ── Swarm: should this zone auto-escalate? ──────────────
export function checkSwarmTrigger(health: ZoneHealth): {
  shouldEscalate: boolean
  reason: string
  urgency: 'none' | 'watch' | 'act' | 'emergency'
} {
  if (health.currentHealth < 25) {
    return {
      shouldEscalate: true,
      urgency: 'emergency',
      reason: `${health.neighbourhood} health critical at ${health.currentHealth}/100. Autonomous escalation triggered for ${health.criticalIssues} critical issues.`,
    }
  }
  if (health.currentHealth < 45 && health.criticalIssues >= 2) {
    return {
      shouldEscalate: true,
      urgency: 'act',
      reason: `${health.neighbourhood} declining rapidly. ${health.criticalIssues} critical issues compounding. Brief auto-generated.`,
    }
  }
  if (health.drainPerDay > 6) {
    return {
      shouldEscalate: false,
      urgency: 'watch',
      reason: `${health.neighbourhood} draining fast (${health.drainPerDay}/day). Monitoring for escalation threshold.`,
    }
  }
  return { shouldEscalate: false, urgency: 'none', reason: 'Zone stable.' }
}

// ── Proof Engine: hash chain for tamper-proof ledger ────
export async function hashLedgerEntry(
  previousHash: string,
  data: { issueId: string; action: string; timestamp: number; actor: string }
): Promise<string> {
  const content = `${previousHash}|${data.issueId}|${data.action}|${data.timestamp}|${data.actor}`
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export interface LedgerEntry {
  id: string
  issueId: string
  action: string
  timestamp: number
  actor: string
  previousHash: string
  hash: string
  blockNumber: number
}

export function verifyLedgerIntegrity(entries: LedgerEntry[]): {
  valid: boolean
  brokenAt: number | null
} {
  for (let i = 1; i < entries.length; i++) {
    if (entries[i].previousHash !== entries[i - 1].hash) {
      return { valid: false, brokenAt: i }
    }
  }
  return { valid: true, brokenAt: null }
}

// ── Overall city health (all zones combined) ────────────
export function calculateCityHealth(issues: Issue[], neighbourhoods: string[]): {
  cityHealth: number
  zones: ZoneHealth[]
  sickestZone: ZoneHealth | null
  healthiestZone: ZoneHealth | null
} {
  const zones = neighbourhoods.map(n => calculateZoneHealth(issues, n))
  const valid = zones.filter(z => !isNaN(z.currentHealth))
  const cityHealth = valid.length 
    ? Math.round(valid.reduce((sum, z) => sum + z.currentHealth, 0) / valid.length)
    : 100
  const sorted = [...zones].sort((a, b) => a.currentHealth - b.currentHealth)
  
  return {
    cityHealth,
    zones,
    sickestZone: sorted[0] || null,
    healthiestZone: sorted[sorted.length - 1] || null,
  }
}