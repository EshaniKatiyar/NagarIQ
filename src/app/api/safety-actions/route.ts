import { NextRequest, NextResponse } from 'next/server'
import { generateSafetyActions } from '@/lib/gemini'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { category, severity, title } = await req.json()
    const result = await generateSafetyActions(category, severity, title)
    return NextResponse.json(result || { immediateActions: [], publicWarning: '', dangerRadius: 0, requiresEmergency: false })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}