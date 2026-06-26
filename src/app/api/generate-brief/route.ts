import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    // Lazy imports - only load Firebase/Gemini at runtime, never at build
    const { generateCivicBrief, performRootCauseAnalysis } = await import('@/lib/gemini')
    const { createBrief, updateIssue } = await import('@/lib/firestore')

    const { issues, neighbourhood } = await req.json()
    const briefData = await generateCivicBrief(issues, neighbourhood)
    const rootCause = issues.length >= 3 ? await performRootCauseAnalysis(issues, neighbourhood) : null

    const briefId = await createBrief({
      title: briefData.title,
      issues: issues.map((i: any) => i.id),
      neighbourhood,
      department: briefData.department,
      severity: issues[0]?.severity || 'medium',
      affectedRadius: briefData.affectedRadius,
      totalReports: issues.length,
      estimatedCost: briefData.estimatedCost,
      content: JSON.stringify({ ...briefData, rootCause }),
      status: 'draft',
      shareURL: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/brief/${Date.now()}`,
    })

    for (const issue of issues) {
      await updateIssue(issue.id, {
        status: 'escalated',
        briefURL: `/brief/${briefId}`,
        rootCauseNote: rootCause?.rootCause
      })
    }

    return NextResponse.json({ briefId, brief: briefData, rootCause })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}