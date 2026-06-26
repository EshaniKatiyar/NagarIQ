import { NextRequest, NextResponse } from 'next/server'
import { generateRTIApplication } from '@/lib/gemini'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { issue } = await req.json()
    const result = await generateRTIApplication(issue)
    return NextResponse.json(result || { error: 'Could not generate RTI' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}