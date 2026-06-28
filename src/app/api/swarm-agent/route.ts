import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { runSwarmAgent } = await import('@/lib/gemini')
    const { issues, neighbourhood, zoneHealth } = await req.json()
    if (!issues || issues.length === 0) {
      return NextResponse.json({ error: 'No issues to analyze' }, { status: 400 })
    }
    const result = await runSwarmAgent(issues, neighbourhood, zoneHealth ?? 50)
    return NextResponse.json(result)
  } catch (e: any) {
    console.error('swarm-agent error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Agent failed' }, { status: 500 })
  }
}