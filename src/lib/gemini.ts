import { GoogleGenerativeAI } from '@google/generative-ai'
import type { IssueCategory, IssueSeverity, Issue } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
const visionModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

export async function analyzeIssueImage(imageBase64: string, mimeType: string) {
  const prompt = `You are a civic issue analyzer. Analyze this image and return a JSON object with:
{
  "isValidIssue": boolean (true if this is a genuine civic/infrastructure problem),
  "isFakeOrIrrelevant": boolean,
  "category": one of ["pothole","streetlight","waterleakage","waste","drainage","construction","treehazard","other"],
  "severity": one of ["low","medium","high","critical"],
  "title": short descriptive title (max 8 words),
  "description": 2-3 sentence description of the problem,
  "estimatedCost": approximate cost in INR to fix (number only),
  "tags": array of 2-4 relevant tags,
  "confidence": 0-100
}
Return ONLY the JSON, no markdown.`

  const result = await visionModel.generateContent([
    { inlineData: { data: imageBase64, mimeType } },
    prompt
  ])
  const text = result.response.text().replace(/```json|```/g, '').trim()
  return JSON.parse(text)
}

export async function verifyResolution(
  originalBase64: string, 
  resolutionBase64: string, 
  mimeType: string,
  issueTitle: string
) {
  const prompt = `Compare these two images. The first is a reported civic issue: "${issueTitle}". The second is the claimed resolution photo.
Return JSON:
{
  "isResolved": boolean,
  "confidence": 0-100,
  "analysis": "2 sentence assessment",
  "concerns": "any remaining issues or null"
}
Return ONLY JSON, no markdown.`

  const result = await visionModel.generateContent([
    { inlineData: { data: originalBase64, mimeType } },
    { inlineData: { data: resolutionBase64, mimeType } },
    prompt
  ])
  const text = result.response.text().replace(/```json|```/g, '').trim()
  return JSON.parse(text)
}

export async function generateCivicBrief(issues: Partial<Issue>[], neighbourhood: string) {
  const issuesSummary = issues.map(i => 
    `- ${i.title} (${i.category}, ${i.severity} severity, ${i.upvotes} upvotes, reported ${i.createdAt})`
  ).join('\n')

  const prompt = `You are a civic intelligence system generating a formal Community Issue Brief.
Neighbourhood: ${neighbourhood}
Issues cluster (${issues.length} reports):
${issuesSummary}

Generate a formal brief as JSON:
{
  "title": "Civic Issue Brief title",
  "department": "most relevant municipal department name",
  "executiveSummary": "2-3 sentence summary for officials",
  "issueDetails": "detailed description of the pattern",
  "affectedRadius": radius in meters (number),
  "estimatedCost": total estimated cost INR to fix (number),
  "recommendedActions": ["action1", "action2", "action3"],
  "urgencyJustification": "why this needs immediate attention",
  "rootCause": "likely root cause if pattern suggests one",
  "slaRecommendation": days to resolve (number)
}
Return ONLY JSON.`

  const result = await model.generateContent(prompt)
  const text = result.response.text().replace(/```json|```/g, '').trim()
  return JSON.parse(text)
}

export async function performRootCauseAnalysis(issues: Partial<Issue>[], neighbourhood: string) {
  const prompt = `You are a civic data analyst. These repeated issues in ${neighbourhood} suggest a systemic problem:
${issues.map(i => `- ${i.title} (${i.category}) on ${i.createdAt}`).join('\n')}

Analyze the pattern and return JSON:
{
  "rootCause": "the systemic root cause in 1-2 sentences",
  "pattern": "description of the pattern detected",
  "recommendation": "specific structural recommendation to prevent recurrence",
  "severity": "systemic impact assessment",
  "departmentsToInvolve": ["dept1", "dept2"]
}
Return ONLY JSON.`

  const result = await model.generateContent(prompt)
  const text = result.response.text().replace(/```json|```/g, '').trim()
  return JSON.parse(text)
}

export async function identifyDepartment(category: IssueCategory, address: string) {
  const deptMap: Record<IssueCategory, string> = {
    pothole: 'Roads & Infrastructure Division (BBMP)',
    streetlight: 'Street Lighting Department (BESCOM)',
    waterleakage: 'BWSSB - Water Supply & Sewerage Board',
    waste: 'Solid Waste Management (BBMP)',
    drainage: 'Storm Water Drain Division (BBMP)',
    construction: 'Building Regulation Department',
    treehazard: 'Horticulture Department (BBMP)',
    other: 'General Civic Services (Municipal Corporation)',
  }
  return deptMap[category] || 'Municipal Corporation General Services'
}

export async function civicChatResponse(
  userMessage: string, 
  conversationHistory: { role: string; content: string }[],
  contextData: { totalIssues: number; resolvedIssues: number; neighbourhood: string }
) {
  const systemContext = `You are CivicPulse AI, a helpful civic assistant. 
Current platform stats: ${contextData.totalIssues} total issues, ${contextData.resolvedIssues} resolved, primary area: ${contextData.neighbourhood}.
Help citizens understand issue statuses, civic processes, their rights, and how to escalate problems.
Be concise, empathetic, and action-oriented. Answer in the same language the user writes in.`

  const history = conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')
  const prompt = `${systemContext}\n\nConversation:\n${history}\nuser: ${userMessage}\nassistant:`

  const result = await model.generateContent(prompt)
  return result.response.text()
}

export async function translateAndExtractFromVoice(transcript: string) {
  const prompt = `Extract civic issue details from this voice report: "${transcript}"
Return JSON:
{
  "category": one of ["pothole","streetlight","waterleakage","waste","drainage","construction","treehazard","other"],
  "severity": one of ["low","medium","high","critical"],  
  "title": short title,
  "description": full description,
  "locationHint": any location mentioned or null,
  "language": detected language code (e.g. "en", "hi", "kn", "ta"),
  "translatedToEnglish": English version of the report
}
Return ONLY JSON.`

  const result = await model.generateContent(prompt)
  const text = result.response.text().replace(/```json|```/g, '').trim()
  return JSON.parse(text)
}

export async function generateCivicHealthReport(
  issues: Partial<Issue>[],
  neighbourhood: string,
  month: string
) {
  const stats = {
    total: issues.length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    critical: issues.filter(i => i.severity === 'critical').length,
    byCategory: issues.reduce((acc, i) => {
      acc[i.category!] = (acc[i.category!] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  const prompt = `Generate a monthly civic health report narrative for ${neighbourhood}, ${month}.
Stats: ${JSON.stringify(stats)}
Write a 3-paragraph executive summary covering: overall health, key wins, areas needing attention.
Be specific and data-driven. Return plain text, no JSON.`

  const result = await model.generateContent(prompt)
  return result.response.text()
}

export async function generateSafetyActions(
  category: string,
  severity: string,
  title: string
) {
  const genAI2 = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const m = genAI2.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const prompt = `A civic issue was reported: "${title}" (category: ${category}, severity: ${severity}).
The permanent fix will take time. Suggest IMMEDIATE interim safety actions to reduce harm RIGHT NOW.
Return ONLY this JSON:
{
  "immediateActions": [
    {"action": "specific action", "icon": "one emoji", "timeToComplete": "e.g. 2 hours", "cost": "e.g. 800", "priority": "high/medium/low"}
  ],
  "publicWarning": "one-sentence warning message to alert nearby citizens",
  "dangerRadius": number in meters that should be cautioned,
  "requiresEmergency": boolean
}
Give 2-4 actions. Be specific to the issue type. Return ONLY JSON.`
  const result = await m.generateContent(prompt)
  const text = result.response.text().replace(/```json|```/g, '').trim()
  const match = text.match(/\{[\s\S]*\}/)
  return match ? JSON.parse(match[0]) : null
}

export async function generateRTIApplication(issue: {
  title: string
  description: string
  category: string
  neighbourhood: string
  department: string
  createdAt: string
  daysOverdue: number
}) {
  const genAI3 = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const m = genAI3.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const prompt = `Generate a complete, filing-ready Right to Information (RTI) Act 2005 application for an unresolved civic issue in India.

Issue: "${issue.title}"
Description: ${issue.description}
Category: ${issue.category}
Location: ${issue.neighbourhood}, Bengaluru
Responsible department: ${issue.department}
Reported on: ${issue.createdAt}
Days overdue past expected resolution: ${issue.daysOverdue}

Generate a formal RTI application. Return ONLY this JSON:
{
  "publicAuthority": "exact name of the Public Information Officer / department to address it to",
  "subject": "one-line subject of the RTI",
  "applicationBody": "the full formal RTI application text, properly worded under RTI Act 2005, addressing the PIO, stating the issue, and politely demanding information. Use \\n for line breaks. Include placeholders [YOUR NAME] and [YOUR ADDRESS].",
  "questions": ["5 specific pointed questions the citizen should ask - about complaint receipt date, action taken, responsible officer name, sanctioned timeline, reason for delay"],
  "feeInfo": "how to pay the Rs 10 application fee",
  "appellateInfo": "what to do if no response in 30 days - first appellate authority info",
  "filingInstructions": "step by step where and how to file this RTI"
}
Return ONLY valid JSON, no markdown.`

  const result = await m.generateContent(prompt)
  const text = result.response.text().replace(/```json|```/g, '').trim()
  const match = text.match(/\{[\s\S]*\}/)
  return match ? JSON.parse(match[0]) : null
}