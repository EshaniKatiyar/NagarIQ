'use client'
import { useState, useEffect } from 'react'
import type { Issue } from '@/types'
import { X, Loader2, FileText, Scale, Download, Copy, Check, AlertCircle, ChevronRight } from 'lucide-react'
import jsPDF from 'jspdf'

export default function RTIModal({ issue, onClose }: { issue: Issue; onClose: () => void }) {
  const [rti, setRti] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const daysOverdue = (() => {
    let created = Date.now()
    const c: any = issue.createdAt
    if (c?.seconds) created = c.seconds * 1000
    else if (c) created = new Date(c).getTime()
    const days = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24))
    return Math.max(0, days - 14) // 14 day SLA
  })()

  useEffect(() => {
    fetch('/api/generate-rti', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issue: {
          title: issue.title,
          description: issue.description,
          category: issue.category,
          neighbourhood: issue.neighbourhood,
          department: issue.department || 'Municipal Corporation',
          createdAt: new Date().toLocaleDateString('en-IN'),
          daysOverdue,
        }
      })
    })
      .then(r => r.json())
      .then(d => { setRti(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const downloadPDF = () => {
    if (!rti) return
    const doc = new jsPDF()
    const margin = 15
    let y = 20
    const pageWidth = doc.internal.pageSize.getWidth()
    const maxWidth = pageWidth - margin * 2

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('APPLICATION UNDER RIGHT TO INFORMATION ACT, 2005', margin, y, { maxWidth })
    y += 12

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('To: ' + (rti.publicAuthority || ''), margin, y, { maxWidth })
    y += 10

    doc.setFont('helvetica', 'bold')
    doc.text('Subject: ', margin, y)
    doc.setFont('helvetica', 'normal')
    const subjectLines = doc.splitTextToSize(rti.subject || '', maxWidth - 20)
    doc.text(subjectLines, margin + 18, y)
    y += subjectLines.length * 6 + 6

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const bodyLines = doc.splitTextToSize(rti.applicationBody || '', maxWidth)
    doc.text(bodyLines, margin, y)
    y += bodyLines.length * 5 + 6

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Information Requested:', margin, y)
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    ;(rti.questions || []).forEach((q: string, i: number) => {
      const qLines = doc.splitTextToSize(`${i + 1}. ${q}`, maxWidth)
      if (y > 270) { doc.addPage(); y = 20 }
      doc.text(qLines, margin, y)
      y += qLines.length * 5 + 2
    })

    y += 8
    if (y > 260) { doc.addPage(); y = 20 }
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(rti.feeInfo || '', margin, y, { maxWidth })

    doc.save(`RTI-${issue.title.slice(0, 20).replace(/\s/g, '-')}.pdf`)
  }

  const copyText = () => {
    if (!rti) return
    const full = `To: ${rti.publicAuthority}\n\nSubject: ${rti.subject}\n\n${rti.applicationBody}\n\nInformation Requested:\n${(rti.questions || []).map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}`
    navigator.clipboard.writeText(full)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">RTI Receipt</h3>
              <p className="text-xs text-slate-500">Legal weapon · auto-generated under RTI Act 2005</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-civic-600 animate-spin mx-auto mb-3" />
            <p className="font-medium text-slate-700">AI drafting your RTI application...</p>
            <p className="text-xs text-slate-400 mt-1">Formatting under RTI Act 2005, identifying the public authority</p>
          </div>
        ) : !rti ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-slate-600">Could not generate RTI. Please try again.</p>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  This issue is <strong>{daysOverdue} days overdue</strong> past its expected resolution. 
                  Under RTI Act 2005, the government is <strong>legally obligated</strong> to respond to this application within 30 days.
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">To</p>
                <p className="text-sm font-medium text-slate-800 mb-3">{rti.publicAuthority}</p>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Subject</p>
                <p className="text-sm text-slate-700 mb-3">{rti.subject}</p>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Application</p>
                <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{rti.applicationBody}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900 mb-2">Information demanded:</p>
                <div className="space-y-2">
                  {(rti.questions || []).map((q: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="w-5 h-5 bg-civic-100 text-civic-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                      {q}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-green-700 mb-1">💰 Fee</p>
                  <p className="text-xs text-green-600">{rti.feeInfo}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1">⚖ If ignored</p>
                  <p className="text-xs text-blue-600">{rti.appellateInfo}</p>
                </div>
              </div>

              <div className="bg-slate-900 text-white rounded-xl p-4">
                <p className="text-xs font-semibold text-civic-300 uppercase mb-2">How to file</p>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{rti.filingInstructions}</p>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex gap-3">
              <button onClick={copyText} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium btn-secondary">
                {copied ? <><Check className="w-4 h-4 text-green-500" />Copied!</> : <><Copy className="w-4 h-4" />Copy text</>}
              </button>
              <button onClick={downloadPDF} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium btn-primary">
                <Download className="w-4 h-4" />Download RTI PDF
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}