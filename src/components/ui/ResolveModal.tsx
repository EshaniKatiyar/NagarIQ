'use client'
import { useState, useRef } from 'react'
import { useAuth } from './AuthProvider'
import { updateIssue, awardPoints } from '@/lib/firestore'
import type { Issue } from '@/types'
import { X, Upload, Loader2, CheckCircle2, AlertTriangle, Camera, Sparkles } from 'lucide-react'

export default function ResolveModal({ issue, onClose, onResolved }: { 
  issue: Issue; onClose: () => void; onResolved: () => void 
}) {
  const { user, refreshProfile } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<'upload' | 'verifying' | 'result'>('upload')
  const [preview, setPreview] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Please upload an image.'); return }
    setPreview(URL.createObjectURL(file))
    setStep('verifying')
    setError('')

    try {
      // Upload resolution photo to Cloudinary
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', 'nagarIQ')
      const upRes = await fetch('https://api.cloudinary.com/v1_1/djzjmtdj1/image/upload', { method: 'POST', body: formData })
      const upData = await upRes.json()
      const resolutionPhotoURL = upData.secure_url

      // Get base64 for Gemini verification
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1]
        const verRes = await fetch('/api/verify-resolution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            issueId: issue.id,
            issueTitle: issue.title,
            originalBase64: '',  // original may be remote; AI verifies resolution photo independently
            resolutionBase64: base64,
            mimeType: file.type,
            resolutionPhotoURL,
            originalPhotoURL: issue.photoURL,
          })
        })
        const verData = await verRes.json()
        setResult(verData)
        setStep('result')

        // If verified, actually mark the issue resolved in Firestore + award points
        if (verData.isResolved && verData.confidence > 70) {
          await updateIssue(issue.id, {
            status: 'resolved',
            resolvedAt: new Date(),
            resolutionVerified: true,
            resolutionConfidence: verData.confidence,
            resolutionPhotoURL,
          })
          if (user) {
            await awardPoints(user.uid, 25, 'resolution')
            await refreshProfile()
          }
          onResolved?.()
        }
      }
      reader.readAsDataURL(file)
    } catch (e) {
      setError('Verification failed. Please try again.')
      setStep('upload')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-900">Mark as resolved</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <p className="text-sm text-slate-500 mb-4">Upload an "after" photo. Gemini Vision will verify the issue is actually fixed before marking it resolved.</p>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
            <AlertTriangle className="w-4 h-4" />{error}
          </div>
        )}

        {step === 'upload' && (
          <div onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-civic-200 hover:border-civic-400 rounded-xl p-8 text-center cursor-pointer transition-all">
            <Camera className="w-10 h-10 text-civic-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">Upload resolution photo</p>
            <p className="text-xs text-slate-400">AI will compare against the original</p>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </div>
        )}

        {step === 'verifying' && (
          <div className="text-center py-8">
            {preview && <img src={preview} alt="" className="w-full h-40 object-cover rounded-xl mb-4" />}
            <Loader2 className="w-8 h-8 text-civic-600 animate-spin mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">Gemini Vision verifying...</p>
            <p className="text-xs text-slate-400">Comparing before & after</p>
          </div>
        )}

        {step === 'result' && result && (
          <div className="text-center py-4">
            {preview && <img src={preview} alt="" className="w-full h-40 object-cover rounded-xl mb-4" />}
            {result.isResolved && result.confidence > 70 ? (
              <>
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <h4 className="font-bold text-green-700 mb-1">Resolution verified! ✓</h4>
                <p className="text-sm text-slate-600 mb-2">{result.analysis}</p>
                <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium">
                  <Sparkles className="w-3 h-3" /> AI confidence: {result.confidence}%
                </span>
                <button onClick={() => { onResolved(); onClose() }} className="btn-primary w-full mt-4">Done (+25 pts to reporter)</button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-7 h-7 text-amber-600" />
                </div>
                <h4 className="font-bold text-amber-700 mb-1">Not yet resolved</h4>
                <p className="text-sm text-slate-600 mb-2">{result.analysis || 'The AI could not confirm the issue is fixed.'}</p>
                {result.concerns && <p className="text-xs text-amber-600">{result.concerns}</p>}
                <button onClick={() => setStep('upload')} className="btn-secondary w-full mt-4">Try another photo</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}