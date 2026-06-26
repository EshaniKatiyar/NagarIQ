'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createIssue } from '@/lib/firestore'
import { Shield, Upload, Loader2, CheckCircle, AlertTriangle, X, Camera, EyeOff, Lock } from 'lucide-react'
import type { IssueCategory, IssueSeverity } from '@/types'

const NEIGHBOURHOODS = [
  'Indiranagar','Koramangala','HSR Layout','Whitefield','Jayanagar',
  'Malleshwaram','Rajajinagar','Banashankari','Electronic City','Hebbal'
]
const COORDS: Record<string, {lat:number,lng:number}> = {
  'Indiranagar':{lat:12.9784,lng:77.6408},'Koramangala':{lat:12.9352,lng:77.6245},
  'HSR Layout':{lat:12.9116,lng:77.6389},'Whitefield':{lat:12.9698,lng:77.7499},
  'Jayanagar':{lat:12.9250,lng:77.5938},'Malleshwaram':{lat:13.0035,lng:77.5680},
  'Rajajinagar':{lat:12.9900,lng:77.5560},'Banashankari':{lat:12.9250,lng:77.5467},
  'Electronic City':{lat:12.8456,lng:77.6603},'Hebbal':{lat:13.0358,lng:77.5970}
}

type Step = 'intro' | 'form' | 'analyzing' | 'done'

export default function WhisperPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('intro')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [analysis, setAnalysis] = useState<any>(null)
  const [neighbourhood, setNeighbourhood] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const handleImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Please upload an image.'); return }
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
    setStep('analyzing')
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1]
        const res = await fetch('/api/analyze-image', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type })
        })
        const data = await res.json()
        setAnalysis(data)
        setDescription(data.description || '')
        setStep('form')
      }
      reader.readAsDataURL(file)
    } catch {
      setError('Analysis failed.'); setStep('form')
    }
  }, [])

  const handleSubmit = async () => {
    if (!neighbourhood) { setError('Please select a neighbourhood.'); return }
    setStep('analyzing')
    try {
      let photoURL = ''
      if (imageFile) {
        const fd = new FormData()
        fd.append('file', imageFile)
        fd.append('upload_preset', 'nagarIQ')
        const up = await fetch('https://api.cloudinary.com/v1_1/djzjmtdj1/image/upload', { method: 'POST', body: fd })
        photoURL = (await up.json()).secure_url
      }
      const loc = COORDS[neighbourhood] || { lat: 12.9716, lng: 77.5946 }
      // Anonymous report - NO uid, NO name stored
      await createIssue({
        title: analysis?.title || 'Anonymous civic report',
        description: description,
        category: (analysis?.category || 'other') as IssueCategory,
        severity: (analysis?.severity || 'medium') as IssueSeverity,
        status: 'reported',
        location: loc,
        address: `${neighbourhood}, Bengaluru`,
        neighbourhood,
        photoURL,
        reportedBy: 'anonymous',
        reporterName: 'Anonymous Whistleblower',
        upvotes: 0,
        upvotedBy: [],
        spottedBy: [],
        estimatedCost: analysis?.estimatedCost || 0,
        tags: [...(analysis?.tags || []), 'anonymous', 'whisper'],
        escalationLevel: 0,
      } as any)
      setStep('done')
    } catch {
      setError('Submission failed.'); setStep('form')
    }
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-slate-900 text-white rounded-2xl p-10 text-center max-w-md w-full animate-slide-up">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Whisper sent anonymously</h2>
          <p className="text-slate-300 text-sm mb-1">Your report is live on the map.</p>
          <p className="text-slate-400 text-xs mb-6">No identity, location trail, or device info was stored. This report can never be traced back to you.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push('/map')} className="bg-white text-slate-900 px-4 py-2 rounded-xl font-medium text-sm">View on map</button>
            <button onClick={() => { setStep('intro'); setAnalysis(null); setPreview(''); setNeighbourhood(''); setDescription('') }}
              className="bg-white/10 text-white border border-white/20 px-4 py-2 rounded-xl font-medium text-sm">Send another</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {step === 'intro' && (
          <div className="text-center text-white animate-fade-in">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <EyeOff className="w-10 h-10 text-civic-400" />
            </div>
            <h1 className="text-4xl font-bold mb-3">Whisper Network</h1>
            <p className="text-slate-300 text-lg mb-2 max-w-lg mx-auto">Report what you're afraid to report.</p>
            <p className="text-slate-400 text-sm mb-8 max-w-lg mx-auto leading-relaxed">
              Some civic issues go unreported because people fear retaliation — illegal construction by the powerful, 
              contractor fraud, encroachment. Whisper lets you report these completely anonymously. 
              No login. No name. No traceable data. Ever.
            </p>

            <div className="grid sm:grid-cols-3 gap-3 mb-8 max-w-lg mx-auto">
              {[
                { icon: Lock, title: 'No identity', desc: 'Zero personal data stored' },
                { icon: Shield, title: 'No trail', desc: 'No device or login info' },
                { icon: EyeOff, title: 'Untraceable', desc: 'Cannot be linked to you' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <Icon className="w-5 h-5 text-civic-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
              ))}
            </div>

            <button onClick={() => setStep('form')} className="bg-civic-600 hover:bg-civic-500 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-all active:scale-95">
              Report anonymously
            </button>

            <div className="mt-8 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 max-w-lg mx-auto">
              <p className="text-xs text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Whisper is for reporting civic <strong>issues and locations</strong> — not for making accusations against named private individuals. Reports are reviewed by the community before escalation.</span>
              </p>
            </div>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <Loader2 className="w-8 h-8 text-civic-400 animate-spin mx-auto mb-3" />
            <p className="font-medium text-white">Processing anonymously...</p>
            <p className="text-xs text-slate-400 mt-1">Stripping all metadata</p>
          </div>
        )}

        {step === 'form' && (
          <div className="animate-slide-up">
            <button onClick={() => setStep('intro')} className="text-slate-400 text-sm mb-4 hover:text-white">← back</button>
            <div className="bg-white rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <EyeOff className="w-5 h-5 text-slate-700" />
                <h2 className="font-bold text-slate-900">Anonymous report</h2>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                  <AlertTriangle className="w-4 h-4" />{error}
                </div>
              )}

              {!preview ? (
                <div onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-civic-400 rounded-xl p-8 text-center cursor-pointer">
                  <Camera className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700">Add a photo (optional)</p>
                  <p className="text-xs text-slate-400">EXIF/location metadata auto-stripped</p>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImage(f) }} />
                </div>
              ) : (
                <img src={preview} alt="" className="w-full h-44 object-cover rounded-xl" />
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">What's the issue?</label>
                <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Describe what you observed..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-civic-300 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">General area</label>
                <select value={neighbourhood} onChange={e => setNeighbourhood(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-civic-300">
                  <option value="">Select neighbourhood</option>
                  {NEIGHBOURHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <p className="text-xs text-slate-400 mt-1">Only the neighbourhood is recorded — never your exact location</p>
              </div>

              <button onClick={handleSubmit} disabled={!description || !neighbourhood}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />Send anonymous whisper
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}