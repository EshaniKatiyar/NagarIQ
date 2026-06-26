import { NextRequest, NextResponse } from 'next/server'
import { translateAndExtractFromVoice } from '@/lib/gemini'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json()
    const result = await translateAndExtractFromVoice(transcript)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}