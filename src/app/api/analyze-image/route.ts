import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json()

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `Look at this image. Return ONLY valid JSON, no markdown, no backticks:
{"isValidIssue":true,"isFakeOrIrrelevant":false,"category":"pothole","severity":"high","title":"Large pothole on road","description":"A dangerous pothole on the road surface.","estimatedCost":15000,"tags":["road","pothole"],"confidence":90}

Rules:
- category must be exactly one of: pothole, streetlight, waterleakage, waste, drainage, construction, treehazard, other
- severity must be exactly one of: low, medium, high, critical
- Replace the example values with what you actually see in the image
- Return ONLY the JSON object, nothing else`

    const result = await model.generateContent([
      { inlineData: { data: imageBase64, mimeType } },
      { text: prompt }
    ])

    const text = result.response.text().trim()
    console.log('Gemini text:', text)

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response: ' + text)

    const parsed = JSON.parse(jsonMatch[0])
    if (!parsed.category) parsed.category = 'other'
    if (!parsed.severity) parsed.severity = 'medium'
    if (!parsed.title) parsed.title = 'Civic issue'
    if (!parsed.description) parsed.description = 'Issue reported by citizen.'
    if (!parsed.estimatedCost) parsed.estimatedCost = 10000
    if (!parsed.tags) parsed.tags = []
    if (!parsed.confidence) parsed.confidence = 85

    return NextResponse.json(parsed)
  } catch (e: any) {
    console.error('Error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}