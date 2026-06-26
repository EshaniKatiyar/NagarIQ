import { NextRequest, NextResponse } from 'next/server'
import { generateWithFallback } from '@/lib/geminiHelper'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { message, history, neighbourhood } = await req.json()
    const prompt = `You are NagarIQ AI, a helpful civic assistant for Indian cities.
Help citizens with: which department handles which issue, how to escalate, their RTI rights, typical resolution timelines.
Be concise, warm, and action-oriented. Do not use markdown formatting, asterisks, or bullet symbols. Write in plain conversational sentences. Answer in the same language the user writes in.

Previous messages:
${(history || []).map((m: any) => `${m.role}: ${m.content}`).join('\n')}

User: ${message}
Assistant:`
    const response = await generateWithFallback([{ text: prompt }])
    return NextResponse.json({ response })
  } catch (e: any) {
    console.error('Chat error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}