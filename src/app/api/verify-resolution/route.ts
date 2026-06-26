import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { updateIssue } from '@/lib/firestore'

export async function POST(req: NextRequest) {
  try {
    const { issueId, issueTitle, resolutionBase64, mimeType, resolutionPhotoURL } = await req.json()

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `A civic issue titled "${issueTitle}" was reported. This is the claimed "after/resolution" photo.
Analyze whether this photo shows a properly fixed/resolved civic issue (clean road, working light, no garbage, repaired surface, etc).
Return ONLY this JSON:
{
  "isResolved": true or false,
  "confidence": 0-100,
  "analysis": "2 sentence assessment of whether the issue appears fixed",
  "concerns": "any remaining concerns, or null"
}
Be generous in verification — if the photo plausibly shows a clean road, repaired surface, working streetlight, cleared garbage, or any improved/fixed civic state, mark isResolved as true with confidence 75-95. Only mark false if the photo clearly shows the problem still exists or is unrelated. Return ONLY JSON.`

    const result = await model.generateContent([
      { inlineData: { data: resolutionBase64, mimeType } },
      { text: prompt }
    ])
    const text = result.response.text().replace(/```json|```/g, '').trim()
    const match = text.match(/\{[\s\S]*\}/)
    const parsed = match ? JSON.parse(match[0]) : { isResolved: false, confidence: 0, analysis: 'Could not analyze.', concerns: null }

    return NextResponse.json(parsed)
  } catch (e: any) {
    console.error('Verify resolution error:', e.message)
    return NextResponse.json({ error: e.message, isResolved: false, confidence: 0, analysis: 'Verification error.' }, { status: 200 })
  }
}