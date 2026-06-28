export type IssueCategory = 
  | 'pothole' | 'streetlight' | 'waterleakage' | 'waste' 
  | 'drainage' | 'construction' | 'treehazard' | 'other'

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical'
export type IssueStatus = 'reported' | 'verified' | 'escalated' | 'in_progress' | 'resolved' | 'rejected'

export interface GeoPoint { lat: number; lng: number }

export interface Issue {
  id: string
  title: string
  description: string
  category: IssueCategory
  severity: IssueSeverity
  status: IssueStatus
  location: GeoPoint
  address: string
  neighbourhood: string
  photoURL: string
  resolutionPhotoURL?: string
  reportedBy: string
  reporterName: string
  reporterAvatar?: string
  upvotes: number
  upvotedBy: string[]
  spottedBy: string[]
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
  department?: string
  briefURL?: string
  clusterId?: string
  estimatedCost?: number
  aiDescription?: string
  rootCauseNote?: string
  resolutionVerified?: boolean
  resolutionConfidence?: number
  language?: string
  slaDeadline?: Date
  deadlineBreached?: boolean
  breachedAt?: Date
  escalationLevel?: number
  departmentRating?: number
  tags?: string[]
}

export interface CivicBrief {
  id: string
  title: string
  issues: string[]
  neighbourhood: string
  department: string
  severity: IssueSeverity
  affectedRadius: number
  totalReports: number
  estimatedCost: number
  content: string
  createdAt: Date
  status: 'draft' | 'sent' | 'acknowledged' | 'resolved'
  shareURL: string
}

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  photoURL?: string
  neighbourhood: string
  points: number
  badges: Badge[]
  reportsCount: number
  resolvedCount: number
  verifiedCount: number
  joinedAt: Date
  streak: number
  rank?: number
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  earnedAt: Date
}

export interface Department {
  id: string
  name: string
  categories: IssueCategory[]
  sladays: number
  avgResolutionDays: number
  rating: number
  totalIssues: number
  resolvedIssues: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}