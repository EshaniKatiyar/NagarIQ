import { NextRequest, NextResponse } from 'next/server'
import { generateWithFallback, extractJSON } from '@/lib/geminiHelper'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { issueTitle, resolutionBase64, mimeType } = await req.json()
    const prompt = `A civic issue titled "${issueTitle}" was reported. This is the claimed "after/resolution" photo.
Analyze whether this photo shows a properly fixed/resolved civic issue.
Return ONLY this JSON:
{"isResolved": true, "confidence": 85, "analysis": "2 sentence assessment", "concerns": null}
Be generous — if the photo plausibly shows a clean road, repaired surface, working light, cleared garbage, or improved civic state, mark isResolved true with confidence 75-95. Only false if the problem clearly still exists. Return ONLY JSON.`

    const text = await generateWithFallback([
      { inlineData: { data: resolutionBase64, mimeType } },
      { text: prompt }
    ])
    const parsed = extractJSON(text)
    return NextResponse.json(parsed)
  } catch (e: any) {
    console.error('Verify error:', e.message)
    return NextResponse.json({ isResolved: false, confidence: 0, analysis: 'Verification temporarily unavailable. Please try again.', concerns: null }, { status: 200 })
  }
}