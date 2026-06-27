import { GoogleGenerativeAI } from '@google/generative-ai'

// Lazy init - never runs at build time
let _genAI: GoogleGenerativeAI | null = null
function getGenAI() {
  if (!_genAI) _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
  return _genAI
}

// Try flash-lite first, fall back to 2.0-flash on overload/rate-limit
const MODEL_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
]

export async function generateWithFallback(parts: any): Promise<string> {
  let lastError: any = null
  for (const modelName of MODEL_CHAIN) {
    try {
      const model = getGenAI().getGenerativeModel({ model: modelName })
      const result = await model.generateContent(parts)
      return result.response.text()
    } catch (e: any) {
      lastError = e
      const msg = e.message || ''
      if (msg.includes('503') || msg.includes('429') || msg.includes('overloaded') || msg.includes('high demand')) {
        console.log(`Model ${modelName} unavailable, trying next...`)
        continue
      }
      throw e
    }
  }
  throw lastError || new Error('All models failed')
}

// Safely extract a JSON object from an LLM text response
export function extractJSON(text: string): any {
  const cleaned = text.replace(/```json|```/g, '').trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}