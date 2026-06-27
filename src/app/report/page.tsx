'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/ui/AuthProvider'
import SafetyActionsPanel from '@/components/ui/SafetyActionsPanel'
import { Upload, Mic, MicOff, MapPin, Loader2, CheckCircle, AlertTriangle, X, Camera } from 'lucide-react'
import { createIssue, findNearbyIssues, awardPoints } from '@/lib/firestore'
import { analyzeIssueImage, translateAndExtractFromVoice, identifyDepartment } from '@/lib/gemini'
import type { IssueCategory, IssueSeverity } from '@/types'


type Step = 'upload' | 'analyzing' | 'confirm' | 'locating' | 'submitting' | 'done'

interface AIAnalysis {
  isValidIssue: boolean
  isFakeOrIrrelevant: boolean
  category: IssueCategory
  severity: IssueSeverity
  title: string
  description: string
  estimatedCost: number
  tags: string[]
  confidence: number
}

const NEIGHBOURHOODS = [
  'Indiranagar','Koramangala','HSR Layout','Whitefield','Jayanagar',
  'Malleshwaram','Rajajinagar','Banashankari','Electronic City','Hebbal'
]

export default function ReportPage() {
  const { user, signIn, ensureUser, refreshProfile } = useAuth()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  
  const [step, setStep] = useState<Step>('upload')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState('')
  const [neighbourhood, setNeighbourhood] = useState('')
  const [nearbyCount, setNearbyCount] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [error, setError] = useState('')
  const [issueId, setIssueId] = useState('')
  
  const recognitionRef = useRef<any>(null)

  const handleImageSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Please upload an image file.'); return }
    setImageFile(file)
    const preview = URL.createObjectURL(file)
    setImagePreview(preview)
    setStep('analyzing')
    setError('')

    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1]
        const result = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type })
        })
        const data = await result.json()
        if (data.isFakeOrIrrelevant || !data.isValidIssue) {
          setError('This image doesn\'t appear to show a civic issue. Please upload a photo of the actual problem.')
          setStep('upload')
          return
        }
        setAnalysis(data)
        setStep('confirm')
        getLocationAndNearby()
      }
      reader.readAsDataURL(file)
    } catch (e) {
      setError('AI analysis failed. Please try again.')
      setStep('upload')
    }
  }, [])

  const getLocationAndNearby = useCallback(async () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords
      setLocation({ lat, lng })
      try {
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`)
        const data = await res.json()
        if (data.results[0]) setAddress(data.results[0].formatted_address)
      } catch {}
      const nearby = await findNearbyIssues(lat, lng)
      setNearbyCount(nearby.length)
    })
  }, [])

  const startVoiceRecording = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setError('Voice recording not supported in this browser.'); return }
    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-IN'
    recognition.onresult = async (e: any) => {
      const transcript = e.results[0][0].transcript
      setVoiceTranscript(transcript)
      setIsRecording(false)
      setStep('analyzing')
      try {
        const res = await fetch('/api/voice-extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript })
        })
        const data = await res.json()
        setAnalysis({ ...data, isValidIssue: true, isFakeOrIrrelevant: false, confidence: 80 })
        setStep('confirm')
        getLocationAndNearby()
      } catch { setError('Could not process voice. Please try again.'); setStep('upload') }
    }
    recognition.onerror = () => { setIsRecording(false); setError('Voice recording failed.') }
    recognition.start()
    recognitionRef.current = recognition
    setIsRecording(true)
  }, [getLocationAndNearby])

  const stopVoiceRecording = useCallback(() => {
    recognitionRef.current?.stop()
    setIsRecording(false)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!analysis) { setError('Please complete all steps.'); return }
    // Guest reporting: ensure a user exists (anonymous if not signed in)
    const activeUser = await ensureUser()
    if (!activeUser) { setError('Could not start a session. Please try again.'); return }
    let finalLocation = location
    // Known neighbourhood coords — resolve even if dropbox onChange didn't fire
    const KNOWN_COORDS: Record<string,{lat:number,lng:number}> = {
      'Indiranagar':{lat:12.9784,lng:77.6408},'Koramangala':{lat:12.9352,lng:77.6245},
      'HSR Layout':{lat:12.9116,lng:77.6389},'Whitefield':{lat:12.9698,lng:77.7499},
      'Jayanagar':{lat:12.9250,lng:77.5938},'Malleshwaram':{lat:13.0035,lng:77.5680},
      'Rajajinagar':{lat:12.9900,lng:77.5560},'Banashankari':{lat:12.9250,lng:77.5467},
      'Electronic City':{lat:12.8456,lng:77.6603},'Hebbal':{lat:13.0358,lng:77.5970}
    }
    if (!finalLocation && KNOWN_COORDS[neighbourhood.trim()]) {
      finalLocation = KNOWN_COORDS[neighbourhood.trim()]
    }
    // For custom neighbourhoods without coords, geocode the name (free OpenStreetMap)
    if (!finalLocation && neighbourhood.trim()) {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(neighbourhood.trim() + ', Bengaluru, India')}&format=json&limit=1`
        )
        const geoData = await geoRes.json()
        if (geoData[0]) {
          finalLocation = { lat: parseFloat(geoData[0].lat), lng: parseFloat(geoData[0].lon) }
        }
      } catch {}
    }
    if (!finalLocation) finalLocation = { lat: 12.9716, lng: 77.5946 }
    setStep('submitting')
    try {
      let photoURL = ''
      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)
        formData.append('upload_preset', 'nagarIQ')
        const uploadRes = await fetch('https://api.cloudinary.com/v1_1/djzjmtdj1/image/upload', { method: 'POST', body: formData })
        const uploadData = await uploadRes.json()
        photoURL = uploadData.secure_url
        if (!photoURL) throw new Error('Upload failed')


      }
      const department = await identifyDepartment(analysis.category, address)
      const slaDeadline = new Date()
      slaDeadline.setDate(slaDeadline.getDate() + 14)

      const id = await createIssue({
        title: analysis.title,
        description: analysis.description,
        category: analysis.category,
        severity: analysis.severity,
        status: 'reported',
        location: finalLocation,
        address,
        neighbourhood: neighbourhood || 'Unknown',
        photoURL,
        reportedBy: activeUser.uid,
        reporterName: activeUser.isAnonymous ? 'Guest Citizen' : (activeUser.displayName || 'Citizen'),
        reporterAvatar: activeUser.photoURL || undefined,
        upvotes: 0,
        upvotedBy: [],
        spottedBy: [],
        department,
        estimatedCost: analysis.estimatedCost,
        aiDescription: analysis.description,
        tags: analysis.tags,
        slaDeadline,
        escalationLevel: 0,
      })
      setIssueId(id)
      await awardPoints(activeUser.uid, 10, 'report')
      await refreshProfile()
      setStep('done')
    } catch (e) {
      setError('Submission failed. Please try again.')
      setStep('confirm')
    }
  }, [user, analysis, location, imageFile, address, neighbourhood, ensureUser, refreshProfile])

  if (step === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4 animate-slide-up">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Issue reported!</h2>
            <p className="text-slate-500 mb-6">Your report is live. AI is monitoring for nearby duplicates and will generate a Civic Brief if a pattern emerges.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => router.push('/map')} className="btn-primary">View on map</button>
              <button onClick={() => { setStep('upload'); setAnalysis(null); setImagePreview(''); setVoiceTranscript('') }} className="btn-secondary">Report another</button>
            </div>
          </div>
          {analysis && (
            <SafetyActionsPanel category={analysis.category} severity={analysis.severity} title={analysis.title} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Report a civic issue</h1>
          <p className="text-slate-500">Photo or voice — AI handles the rest.</p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {(step === 'upload') && (
          <div className="space-y-4 animate-fade-in">
            <div
              onClick={() => fileRef.current?.click()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImageSelect(f) }}
              onDragOver={e => e.preventDefault()}
              className="card p-10 border-2 border-dashed border-civic-200 hover:border-civic-400 cursor-pointer transition-all text-center group">
              <Camera className="w-12 h-12 text-civic-300 group-hover:text-civic-500 mx-auto mb-4 transition-colors" />
              <p className="font-semibold text-slate-700 mb-1">Upload a photo</p>
              <p className="text-sm text-slate-400">Drag & drop or click to select • JPG, PNG, WEBP</p>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageSelect(f) }} />
            </div>

            <div className="flex items-center gap-3 text-slate-400">
              <div className="flex-1 h-px bg-slate-200" /><span className="text-sm">or</span><div className="flex-1 h-px bg-slate-200" />
            </div>

            <button
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-medium transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'card text-slate-700 hover:bg-slate-50'}`}>
              {isRecording ? <><MicOff className="w-5 h-5" /> Stop recording</> : <><Mic className="w-5 h-5 text-civic-500" /> Report by voice</>}
            </button>
            {voiceTranscript && <p className="text-sm text-slate-500 italic px-2">"{voiceTranscript}"</p>}
          </div>
        )}

        {step === 'analyzing' && (
          <div className="card p-12 text-center animate-fade-in">
            <div className="w-16 h-16 bg-civic-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-civic-600 animate-spin" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Gemini Vision is analyzing...</h3>
            <p className="text-sm text-slate-500">Categorizing issue, checking for duplicates, estimating severity</p>
          </div>
        )}

        {step === 'confirm' && analysis && (
          <div className="space-y-4 animate-slide-up">
            {imagePreview && (
              <div className="card overflow-hidden">
                <img src={imagePreview} alt="Issue" className="w-full h-56 object-cover" />
                <div className="p-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-700 font-medium">Genuine civic issue detected — {analysis.confidence}% confidence</span>
                </div>
              </div>
            )}

            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-slate-900">AI analysis</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-400 mb-1">Category</p>
                  <span className="font-medium capitalize text-slate-800">{analysis.category.replace(/([A-Z])/g, ' $1')}</span>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Severity</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium severity-${analysis.severity}`}>{analysis.severity}</span>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400 mb-1">Title</p>
                  <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-civic-300"
                    value={analysis.title} onChange={e => setAnalysis(a => a ? { ...a, title: e.target.value } : a)} />
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400 mb-1">Description</p>
                  <textarea rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-civic-300 resize-none"
                    value={analysis.description} onChange={e => setAnalysis(a => a ? { ...a, description: e.target.value } : a)} />
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Estimated fix cost</p>
                  <span className="font-medium text-slate-800">₹{analysis.estimatedCost?.toLocaleString()}</span>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {analysis.tags?.map(t => <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">{t}</span>)}
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-civic-500" />
                <h3 className="font-semibold text-slate-900">Location</h3>
              </div>
              {location ? (
                <p className="text-sm text-slate-600 mb-3">{address || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}</p>
              ) : (
                <button onClick={getLocationAndNearby} className="text-sm text-civic-600 hover:underline mb-3">Detect my location</button>
              )}
              {nearbyCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-700">
                  ⚠ {nearbyCount} similar issue{nearbyCount > 1 ? 's' : ''} found within 200m — this may strengthen a Civic Brief.
                </div>
              )}
              <select
                className="mt-3 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-civic-300"
                value={NEIGHBOURHOODS.includes(neighbourhood) ? neighbourhood : (neighbourhood ? '__other__' : '')}
                onChange={e => {
                  if (e.target.value === '__other__') { setNeighbourhood(' '); setLocation(null); return }
                  setNeighbourhood(e.target.value)
                  const coords: Record<string,{lat:number,lng:number}> = {
                    'Indiranagar':{lat:12.9784,lng:77.6408},'Koramangala':{lat:12.9352,lng:77.6245},
                    'HSR Layout':{lat:12.9116,lng:77.6389},'Whitefield':{lat:12.9698,lng:77.7499},
                    'Jayanagar':{lat:12.9250,lng:77.5938},'Malleshwaram':{lat:13.0035,lng:77.5680},
                    'Rajajinagar':{lat:12.9900,lng:77.5560},'Banashankari':{lat:12.9250,lng:77.5467},
                    'Electronic City':{lat:12.8456,lng:77.6603},'Hebbal':{lat:13.0358,lng:77.5970}
                  }
                  if (coords[e.target.value]) setLocation(coords[e.target.value])
                }}>
                <option value="">Select neighbourhood</option>
                {NEIGHBOURHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                <option value="__other__">Other (type below)</option>
              </select>
              {neighbourhood !== '' && !NEIGHBOURHOODS.includes(neighbourhood) && (
                <input autoFocus
                  className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-civic-300"
                  placeholder="Enter your neighbourhood / area name"
                  value={neighbourhood.trim()}
                  onChange={e => setNeighbourhood(e.target.value || ' ')} />
              )}
            </div>

            {!user && (
              <div className="rounded-xl p-4 bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-800 mb-1">You can submit as a guest — no account needed.</p>
                <p className="text-xs text-amber-700">Want to earn civic points and track your reports? <button onClick={signIn} className="underline font-medium hover:text-amber-900">Sign in with Google</button></p>
              </div>
            )}

            <button onClick={handleSubmit} disabled={!neighbourhood || !neighbourhood.trim()}
              className="w-full btn-primary py-3.5 text-base font-semibold disabled:opacity-50">
              {user ? 'Submit report' : 'Submit as guest'}
            </button>
          </div>
        )}

        {step === 'submitting' && (
          <div className="card p-12 text-center animate-fade-in">
            <Loader2 className="w-10 h-10 text-civic-600 animate-spin mx-auto mb-4" />
            <p className="font-medium text-slate-700">Uploading & submitting your report...</p>
          </div>
        )}
      </div>
    </div>
  )
}