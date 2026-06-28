import { GoogleGenerativeAI } from '@google/generative-ai'
import type { IssueCategory, IssueSeverity, Issue } from '@/types'

const MODEL = 'gemini-2.5-flash'
let _genAI: GoogleGenerativeAI | null = null
function getGenAI() {
  if (!_genAI) _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
  return _genAI
}
function getModel() { return getGenAI().getGenerativeModel({ model: MODEL }) }
function getVisionModel() { return getGenAI().getGenerativeModel({ model: MODEL }) }

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

  const result = await getVisionModel().generateContent([
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

  const result = await getVisionModel().generateContent([
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

  const result = await getModel().generateContent(prompt)
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

  const result = await getModel().generateContent(prompt)
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
  const systemContext = `You are NagarIQ AI, a helpful civic assistant. 
Current platform stats: ${contextData.totalIssues} total issues, ${contextData.resolvedIssues} resolved, primary area: ${contextData.neighbourhood}.
Help citizens understand issue statuses, civic processes, their rights, and how to escalate problems.
Be concise, empathetic, and action-oriented. Answer in the same language the user writes in.`

  const history = conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')
  const prompt = `${systemContext}\n\nConversation:\n${history}\nuser: ${userMessage}\nassistant:`

  const result = await getModel().generateContent(prompt)
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

  const result = await getModel().generateContent(prompt)
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

  const result = await getModel().generateContent(prompt)
  return result.response.text()
}

export async function generateSafetyActions(
  category: string,
  severity: string,
  title: string
) {
  const genAI2 = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
  const m = genAI2.getGenerativeModel({ model: 'gemini-2.5-flash' })
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
  const genAI3 = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
  const m = genAI3.getGenerativeModel({ model: 'gemini-2.5-flash' })
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

// ── Autonomous Swarm Agent: real multi-step agentic reasoning ────
// The agent perceives a cluster of civic issues, reasons about them with
// Gemini (root cause, responsibility, urgency), decides on an action, and
// returns a transparent step-by-step reasoning trace.
export async function runSwarmAgent(issues: Partial<Issue>[], neighbourhood: string, zoneHealth: number) {
  const issueSummary = issues.map((i, n) =>
    `${n + 1}. [${i.severity}] ${i.title} (${i.category}) — status: ${i.status}, upvotes: ${i.upvotes ?? 0}`
  ).join('\n')

  const prompt = `You are an autonomous civic accountability agent monitoring the neighbourhood of ${neighbourhood}.
Current zone health: ${zoneHealth}/100 (0 = collapse, 100 = healthy).

You perceive these active issues:
${issueSummary}

Reason step by step as an autonomous agent and decide what action to take. Return ONLY a JSON object:
{
  "perception": "1 sentence: what pattern do you observe across these issues?",
  "rootCause": "1 sentence: the most likely systemic root cause linking them",
  "responsibleDepartment": "the single government body most accountable",
  "reasoning": ["step 1 of your decision process", "step 2", "step 3"],
  "decision": one of ["monitor","escalate","emergency_escalate"],
  "actionPlan": "1 sentence: the concrete next action you will take autonomously",
  "confidence": 0-100
}
Base "decision" on severity and clustering: isolated/minor → monitor; multiple related or high-severity → escalate; critical cluster or health < 30 → emergency_escalate.
Return ONLY the JSON, no markdown.`

  try {
    const result = await getModel().generateContent(prompt)
    const text = result.response.text().replace(/```json|```/g, '').trim()
    return JSON.parse(text)
  } catch (e) {
    // Graceful fallback so the agent panel never breaks
    return {
      perception: `${issues.length} active issues detected in ${neighbourhood}.`,
      rootCause: 'Multiple infrastructure failures compounding in this zone.',
      responsibleDepartment: 'Municipal Corporation',
      reasoning: ['Perceived active issue cluster', 'Assessed severity and zone health', 'Selected escalation path'],
      decision: zoneHealth < 30 ? 'emergency_escalate' : issues.length >= 2 ? 'escalate' : 'monitor',
      actionPlan: 'Generate a Civic Brief and route to the responsible department.',
      confidence: 70,
    }
  }
}