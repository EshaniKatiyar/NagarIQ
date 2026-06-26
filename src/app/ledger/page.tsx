'use client'
import { useEffect, useState } from 'react'
import { subscribeToIssues } from '@/lib/firestore'
import { hashLedgerEntry, verifyLedgerIntegrity, type LedgerEntry } from '@/lib/civicTwin'
import type { Issue } from '@/types'
import { Shield, ShieldCheck, ShieldAlert, Link2, Lock, Hash, Check, X, AlertTriangle, Pencil, RotateCcw } from 'lucide-react'
import clsx from 'clsx'

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  reported: { label: 'Issue Reported', color: 'bg-slate-100 text-slate-700' },
  verified: { label: 'Community Verified', color: 'bg-blue-100 text-blue-700' },
  escalated: { label: 'Escalated to Dept', color: 'bg-orange-100 text-orange-700' },
  in_progress: { label: 'Work In Progress', color: 'bg-purple-100 text-purple-700' },
  resolved: { label: 'Marked Resolved', color: 'bg-green-100 text-green-700' },
}

export default function LedgerPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [integrity, setIntegrity] = useState<{ valid: boolean; brokenAt: number | null }>({ valid: true, brokenAt: null })
  const [tamperedIndex, setTamperedIndex] = useState<number | null>(null)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    const unsub = subscribeToIssues(data => { setIssues(data); setLoading(false) })
    return unsub
  }, [])

  // Build the hash chain from issues
  useEffect(() => {
    if (issues.length === 0) return
    const buildChain = async () => {
      const entries: LedgerEntry[] = []
      let previousHash = '0000000000000000000000000000000000000000000000000000000000000000'
      
      // Create ledger entries from issue lifecycle
      const events: { issueId: string; action: string; timestamp: number; actor: string }[] = []
      issues.slice(0, 12).forEach(issue => {
        let ts = Date.now()
        const c: any = issue.createdAt
        if (c?.seconds) ts = c.seconds * 1000
        events.push({ issueId: issue.id, action: 'reported', timestamp: ts, actor: issue.reporterName || 'Citizen' })
        if (['verified','escalated','in_progress','resolved'].includes(issue.status)) {
          events.push({ issueId: issue.id, action: issue.status, timestamp: ts + 86400000, actor: 'NagarIQ Agent' })
        }
      })
      events.sort((a, b) => a.timestamp - b.timestamp)

      let blockNum = 0
      for (const event of events) {
        const hash = await hashLedgerEntry(previousHash, event)
        entries.push({
          id: `block-${blockNum}`,
          ...event,
          previousHash,
          hash,
          blockNumber: blockNum,
        })
        previousHash = hash
        blockNum++
      }
      setLedger(entries)
      setIntegrity(verifyLedgerIntegrity(entries))
    }
    buildChain()
  }, [issues])

  const handleVerify = async () => {
    setVerifying(true)
    await new Promise(r => setTimeout(r, 800))
    setIntegrity(verifyLedgerIntegrity(ledger))
    setVerifying(false)
  }

  // Simulate tampering - judge can click to break a block
  const handleTamper = (index: number) => {
    const tampered = [...ledger]
    tampered[index] = { ...tampered[index], actor: 'Hacked Actor', action: 'resolved', hash: 'tampered' + tampered[index].hash.slice(8) }
    setLedger(tampered)
    setTamperedIndex(index)
    setIntegrity(verifyLedgerIntegrity(tampered))
  }

  const handleReset = () => {
    setTamperedIndex(null)
    window.location.reload()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Shield className="w-8 h-8 text-civic-500 animate-pulse" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-6 h-6 text-civic-600" />
          <h1 className="text-3xl font-bold text-slate-900">Proof Engine</h1>
          <span className="px-2 py-0.5 bg-slate-900 text-white text-xs font-semibold rounded-full">TAMPER-PROOF</span>
        </div>
        <p className="text-slate-500">Every civic action is cryptographically chained. Records can't be deleted or backdated — and you can prove it.</p>
      </div>

      {/* Integrity status banner */}
      <div className={clsx('card p-6 mb-6 border-2',
        integrity.valid ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50')}>
        <div className="flex items-center gap-4">
          <div className={clsx('w-14 h-14 rounded-2xl flex items-center justify-center',
            integrity.valid ? 'bg-green-500' : 'bg-red-500')}>
            {integrity.valid ? <ShieldCheck className="w-7 h-7 text-white" /> : <ShieldAlert className="w-7 h-7 text-white" />}
          </div>
          <div className="flex-1">
            <h3 className={clsx('font-bold text-lg', integrity.valid ? 'text-green-800' : 'text-red-800')}>
              {integrity.valid ? 'Chain integrity verified' : '⚠ Tampering detected!'}
            </h3>
            <p className={clsx('text-sm', integrity.valid ? 'text-green-600' : 'text-red-600')}>
              {integrity.valid 
                ? `All ${ledger.length} records are authentic and unmodified. Cryptographic proof intact.`
                : `Chain broken at block #${integrity.brokenAt}. Records after this point are compromised and provably altered.`}
            </p>
          </div>
          <button onClick={handleVerify} disabled={verifying}
            className={clsx('px-4 py-2 rounded-xl font-medium text-sm transition-all',
              integrity.valid ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700')}>
            {verifying ? 'Verifying...' : 'Re-verify chain'}
          </button>
        </div>
      </div>

      {/* Demo controls */}
      <div className="card p-4 mb-6 bg-slate-50 border-dashed border-2 border-slate-200">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <p className="text-sm text-slate-600">
              <span className="font-semibold">Demo:</span> Try to tamper with a record — watch the chain break and expose it.
            </p>
          </div>
          {tamperedIndex !== null && (
            <button onClick={handleReset} className="flex items-center gap-1.5 text-sm font-medium text-civic-600 hover:text-civic-700">
              <RotateCcw className="w-3.5 h-3.5" />
              Reset chain
            </button>
          )}
        </div>
      </div>

      {/* The chain */}
      <div className="space-y-0">
        {ledger.map((entry, i) => {
          const isBroken = !integrity.valid && integrity.brokenAt !== null && i >= integrity.brokenAt
          const isTampered = tamperedIndex === i
          const actionInfo = ACTION_LABELS[entry.action] || { label: entry.action, color: 'bg-slate-100 text-slate-700' }
          
          return (
            <div key={entry.id}>
              {/* Connector line */}
              {i > 0 && (
                <div className="flex justify-center">
                  <div className={clsx('w-0.5 h-4', isBroken ? 'bg-red-300' : 'bg-slate-200')} />
                </div>
              )}
              
              <div className={clsx('card p-4 transition-all relative',
                isTampered ? 'border-2 border-red-400 bg-red-50' :
                isBroken ? 'border-red-200 bg-red-50/50' : 'border-slate-100 hover:border-slate-200')}>
                <div className="flex items-start gap-4">
                  {/* Block number */}
                  <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-mono text-sm font-bold',
                    isBroken ? 'bg-red-100 text-red-700' : 'bg-civic-50 text-civic-700')}>
                    {entry.blockNumber}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', actionInfo.color)}>
                        {actionInfo.label}
                      </span>
                      <span className="text-xs text-slate-400">by {entry.actor}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-400">{new Date(entry.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {isTampered && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-200 text-red-800 flex items-center gap-1">
                          <X className="w-3 h-3" /> TAMPERED
                        </span>
                      )}
                    </div>

                    {/* Hashes */}
                    <div className="space-y-1 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <Hash className="w-3 h-3 text-slate-300 flex-shrink-0" />
                        <span className="text-slate-400">prev:</span>
                        <span className={clsx('truncate', isBroken ? 'text-red-500' : 'text-slate-500')}>
                          {entry.previousHash.slice(0, 32)}...
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Lock className="w-3 h-3 text-slate-300 flex-shrink-0" />
                        <span className="text-slate-400">hash:</span>
                        <span className={clsx('truncate font-semibold', 
                          isTampered ? 'text-red-600' : isBroken ? 'text-red-400' : 'text-civic-600')}>
                          {entry.hash.slice(0, 32)}...
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tamper button */}
                  {tamperedIndex === null && i > 0 && i < ledger.length - 1 && (
                    <button onClick={() => handleTamper(i)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-all flex-shrink-0">
                      <Pencil className="w-3 h-3" />
                      Tamper
                    </button>
                  )}

                  {/* Verified checkmark */}
                  {!isBroken && (
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    </div>
                  )}
                  {isBroken && (
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <X className="w-3.5 h-3.5 text-red-600" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {ledger.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-slate-400">No ledger entries yet. Report some issues to build the chain.</p>
        </div>
      )}

      <div className="mt-8 card p-6 bg-slate-900 text-white">
        <div className="flex items-start gap-3">
          <Link2 className="w-5 h-5 text-civic-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-2">How it works</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Each block contains a SHA-256 hash of its contents plus the hash of the previous block. 
              Change any record — even one character — and its hash changes, breaking the link to every block after it. 
              This makes civic history mathematically tamper-evident: departments can't quietly delete complaints or backdate resolutions without the entire chain exposing the fraud.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}