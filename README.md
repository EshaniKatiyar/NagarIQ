# CivicPulse 🏙️
> AI-powered civic intelligence platform — Community Hero track, Vibe2Ship Hackathon

## Setup (15 minutes)

### 1. Get your API keys (all free)

**Gemini API Key (free)**
→ https://aistudio.google.com/app/apikey

**Firebase (free Spark plan)**
→ https://console.firebase.google.com → New project → Add web app
→ Enable: Authentication (Google), Firestore, Storage
→ Firestore rules: allow read, write: if request.auth != null;

**Google Maps API Key (free $200/mo credit)**
→ https://console.cloud.google.com → APIs & Services → Credentials
→ Enable: Maps JavaScript API, Geocoding API, Places API

### 2. Install & run
```bash
npm install
cp .env.local .env.local.bak  # already has placeholders
# Fill in your keys in .env.local
npm run dev
```

### 3. Seed demo data
After signing in, open browser console and run:
```js
import { seedDemoData } from '@/lib/seedData'
await seedDemoData('your-firebase-uid')
```

### 4. Deploy to Google Cloud Run
```bash
# Build and push
gcloud builds submit --tag gcr.io/YOUR_PROJECT/civicpulse

# Deploy
gcloud run deploy civicpulse \
  --image gcr.io/YOUR_PROJECT/civicpulse \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=xxx,NEXT_PUBLIC_FIREBASE_API_KEY=xxx,...
```

## Features implemented
- ✅ Image & video issue reporting (Gemini Vision)
- ✅ AI-powered issue categorization (auto, no dropdowns)
- ✅ Fake report detection (Gemini Vision validation)
- ✅ Geo-location + manual pin drop
- ✅ Smart duplicate clustering (geo + semantic)
- ✅ Community upvotes + "I spotted this too"
- ✅ Real-time issue tracking (Firebase)
- ✅ Civic Issue Brief generator (AI-drafted, shareable)
- ✅ Agentic escalation pipeline (dept routing + SLA + auto-escalate)
- ✅ Root cause analysis agent
- ✅ Before/after photo verification (Gemini Vision)
- ✅ Multilingual reporting (Gemini translation)
- ✅ Voice reporting (Web Speech API + Gemini)
- ✅ Impact dashboard (charts, heatmaps)
- ✅ SLA transparency board (per-department)
- ✅ Department rating system
- ✅ Gamification (points, badges, leaderboard)
- ✅ Neighbourhood squads
- ✅ Citizen AI chatbot (Gemini)
- ✅ QR code generation (profile + issues)
- ✅ WhatsApp sharing
- ✅ PWA / offline queuing ready
- ✅ Cloud Run deployment (Dockerfile included)

## Tech stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| AI | Gemini 1.5 Flash, Gemini Vision |
| Database | Firebase Firestore (real-time) |
| Auth | Firebase Auth (Google) |
| Storage | Firebase Storage |
| Maps | Google Maps JS API, Geocoding API |
| Deploy | Google Cloud Run |
| Charts | Recharts |
| QR | qrcode.js |

All Google technologies. All free tier. ✓
