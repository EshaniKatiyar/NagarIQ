import { NextRequest, NextResponse } from 'next/server'
import { generateWithFallback, extractJSON } from '@/lib/geminiHelper'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json()

    const prompt = `Look at this image. Return ONLY valid JSON, no markdown:
{"isValidIssue":true,"isFakeOrIrrelevant":false,"category":"pothole","severity":"high","title":"Large pothole on road","description":"A dangerous pothole on the road surface.","estimatedCost":15000,"tags":["road","pothole"],"confidence":90}

Rules:
- category must be exactly one of: pothole, streetlight, waterleakage, waste, drainage, construction, treehazard, other
- severity must be exactly one of: low, medium, high, critical
- Replace example values with what you actually see
- Return ONLY the JSON object`

    const text = await generateWithFallback([
      { inlineData: { data: imageBase64, mimeType } },
      { text: prompt }
    ])
    const parsed = extractJSON(text)
    if (!parsed.category) parsed.category = 'other'
    if (!parsed.severity) parsed.severity = 'medium'
    if (!parsed.title) parsed.title = 'Civic issue'
    if (!parsed.description) parsed.description = 'Issue reported by citizen.'
    if (!parsed.estimatedCost) parsed.estimatedCost = 10000
    if (!parsed.tags) parsed.tags = []
    if (!parsed.confidence) parsed.confidence = 85
    return NextResponse.json(parsed)
  } catch (e: any) {
    console.error('Analyze error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}