import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: NextRequest) {
  try {
    const { message, history, neighbourhood } = await req.json()

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `You are NagarIQ AI, a helpful civic assistant for Indian cities.
Help citizens with: which department handles which issue, how to escalate, their RTI rights, typical resolution timelines.
Be concise, warm, and action-oriented. Answer in the same language the user writes in.

Previous messages:
${(history || []).map((m: any) => `${m.role}: ${m.content}`).join('\n')}

User: ${message}
Assistant:`

    const result = await model.generateContent(prompt)
    const response = result.response.text()
    return NextResponse.json({ response })
  } catch (e: any) {
    console.error('Chat error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}