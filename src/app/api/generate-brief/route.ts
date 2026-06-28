import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { generateCivicBrief, performRootCauseAnalysis } = await import('@/lib/gemini')
    const { createBrief, updateIssue } = await import('@/lib/firestore')

    const { issues, neighbourhood } = await req.json()

    if (!issues || issues.length === 0) {
      return NextResponse.json({ error: 'No issues provided' }, { status: 400 })
    }

    const briefData = await generateCivicBrief(issues, neighbourhood)
    const rootCause = issues.length >= 3 ? await performRootCauseAnalysis(issues, neighbourhood) : null

    // Build brief with safe fallbacks for every field (Firestore rejects undefined)
    const briefId = await createBrief({
      title: briefData?.title || `Civic Brief — ${neighbourhood}`,
      issues: issues.map((i: any) => i.id).filter(Boolean),
      neighbourhood: neighbourhood || 'Unknown',
      department: briefData?.department || 'Municipal Corporation',
      severity: issues[0]?.severity || 'medium',
      affectedRadius: briefData?.affectedRadius ?? 500,
      totalReports: issues.length,
      estimatedCost: briefData?.estimatedCost ?? 0,
      content: JSON.stringify({ ...briefData, rootCause: rootCause || null }),
      status: 'draft',
      shareURL: `/brief/${Date.now()}`,
    })

    // Update each issue, stripping undefined
    for (const issue of issues) {
      if (!issue.id) continue
      const update: any = {
        status: 'escalated',
        briefURL: `/brief/${briefId}`,
      }
      if (rootCause?.rootCause) update.rootCauseNote = rootCause.rootCause
      await updateIssue(issue.id, update)
    }

    return NextResponse.json({ briefId, brief: briefData, rootCause })
  } catch (e: any) {
    console.error('generate-brief error:', e?.message, e)
    return NextResponse.json({ error: e?.message || 'Brief generation failed' }, { status: 500 })
  }
}