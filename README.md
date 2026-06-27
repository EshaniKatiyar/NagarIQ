<div align="center">

# NagarIQ

### Your neighbourhood is alive.

**A civic intelligence platform that turns citizen reports into measurable pressure on local government.**

[Live App](https://nagariq-135934398714.asia-south1.run.app) · [Report an Issue](https://nagariq-135934398714.asia-south1.run.app/report) · [See the Heartbeat](https://nagariq-135934398714.asia-south1.run.app/pulse)

Built for **Vibe2Ship** — Coding Ninjas × Google for Developers

</div>

---

## Why this exists

Every year, Indian cities lose lives and livelihoods to problems everyone already knows about. An open drain that floods a street each monsoon. A broken streetlight on a road where accidents keep happening. A pothole that has been "reported" a dozen times and fixed zero.

The failure isn't awareness. It's that the system gives citizens **no leverage**. You report a problem, it disappears into a municipal inbox, and you have no way to know if anyone read it, no way to apply pressure, and no proof it was ever ignored.

NagarIQ exists to change that equation.

> Most civic apps help people **ask** the government to act.
> NagarIQ helps them **measure, predict, and compel** action.

It treats a neighbourhood not as a list of complaints, but as a **living system** with a heartbeat that weakens as problems accumulate — and it hands ordinary citizens the same instruments of accountability that, until now, only the persistent and well-connected could use.

---

## The four ideas that carry the product

NagarIQ is not a pile of features. Four ideas do the real work.

### Civic Twin — the city, alive
Every neighbourhood has a live health score (0–100) and an animated pulse. A healthy zone beats at a calm 60 BPM; a deteriorating one races toward 140. Health decays based on issue severity, category, age, and how many people are affected — turning the slow, invisible decline of a locality into something you can *see and feel* in a single glance.

### Time Machine — the cost of inaction, made concrete
A predictive model projects a neighbourhood's health 30, 60, and 90 days into the future if issues stay unresolved, and estimates the real-world consequences — projected accidents, financial cost. It reframes civic neglect from an abstract "we'll get to it" into "here is what waiting will cost this community."

### Swarm Agent — accountability without waiting for a human
When a zone's health crosses a danger threshold, an AI agent autonomously bundles the most damaging issues, generates a formal Civic Brief, and escalates it to the responsible department — with no one needing to press a button. The neighbourhood advocates for itself.

### RTI Receipt — putting real legal power in a citizen's hand
This is the heart of NagarIQ. The Right to Information Act is the most powerful tool an Indian citizen has against government inaction — and almost no one uses it, because the process is intimidating and opaque. When an issue breaches its deadline, Gemini drafts a complete, filing-ready RTI application: the correct public authority, the precise questions to ask, the fee process, the appeal path. One tap turns a frustrated citizen into someone the system is **legally obligated to answer within 30 days**.

### Proof Engine — a record that cannot be quietly erased
Every civic action — reported, verified, escalated, resolved — is cryptographically hashed and chained using SHA-256. Altering or deleting any past record breaks the chain and exposes the tampering instantly. Complaints can no longer disappear, and resolution dates can no longer be backdated. The truth becomes mathematically permanent.

---

## Supporting features

| Feature | What it does |
|---|---|
| **AI Reporting** | Photo or voice → Gemini Vision auto-categorizes, scores severity, flags fakes, assigns the right department |
| **Interim Safety Actions** | AI suggests immediate harm-reduction steps (barricades, signage) while a permanent fix is pending — because safety can't wait for bureaucracy |
| **Proximity Alerts** | Citizens near a critical hazard are warned in real time |
| **Whisper Network** | Fully anonymous reporting for issues people fear to report under their name — illegal construction, encroachment, contractor fraud |
| **AI Resolution Verification** | An issue is marked resolved only after Gemini Vision confirms the "after" photo genuinely shows it fixed |
| **Gamified Engagement** | Points and a leaderboard make civic participation a habit, not a chore |
| **Civic AI Assistant** | A chat assistant that demystifies escalation rights, departments, and RTI procedure |

---

## Tech stack

**Framework & Frontend**
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Recharts — data visualization
- Leaflet + OpenStreetMap — interactive mapping (free and open-source)
- Lucide — iconography

**Backend & Data**
- Firebase Authentication (Google Sign-In)
- Cloud Firestore — real-time database
- Cloudinary — image hosting
- Next.js API Routes — serverless backend

**AI**
- Google Gemini API (Vision + text) — image analysis, civic chat, brief generation, RTI drafting, safety recommendations, resolution verification

**Integrity**
- Web Crypto API (SHA-256) — the tamper-proof Proof Engine hash chain

**Deployment**
- Docker + Google Cloud Run + Google Cloud Build

---

## Google technologies utilized

- **Google Gemini API** — the intelligence behind every AI feature in the platform
- **Google Cloud Run** — hosts the containerized production application
- **Google Cloud Build** — builds and deploys the container image
- **Firebase Authentication** — secure Google Sign-In
- **Cloud Firestore** — the real-time data layer

---

## Architecture at a glance

```
Citizen (photo / voice)
        │
        ▼
  Gemini Vision  ──►  category · severity · department · fake-check
        │
        ▼
   Cloud Firestore  ──►  feeds the Civic Twin health engine
        │                        │
        ▼                        ▼
   Live Map (Leaflet)      Health score · pulse · Time Machine prediction
        │                        │
        ▼                        ▼
   Swarm Agent  ──►  auto Civic Brief  ──►  RTI Receipt (legal escalation)
        │
        ▼
   Proof Engine  ──►  SHA-256 chained, tamper-evident record
```

---

## Challenges & how I solved them

**Mapping without a paid billing wall.**
Google Maps required upfront billing I wanted to avoid for an accessible civic tool. I rebuilt the entire map layer on **Leaflet + OpenStreetMap**, which is free and open-source — fitting for a project about open civic data — without losing severity-coded markers, clustering, or interactivity.

**Server-side permission failures with Firestore.**
Database writes from server API routes hit `PERMISSION_DENIED` because they lacked the authenticated browser context. I restructured the data flow so authenticated writes happen client-side while the API routes handle only AI inference — cleanly separating concerns and resolving the security boundary.

**Making the Civic Twin's health model meaningful, not arbitrary.**
A health score is only persuasive if it behaves like reality. I designed a decay model where issues compound over time (an ignored problem drains health faster the longer it's neglected), severity and category carry different weights, and community impact amplifies the effect — so the number tells a story a resident would recognize as true.

**A tamper-proof ledger that a non-technical person can trust.**
Implementing a SHA-256 hash chain in the browser was straightforward; making it *legible* was the real challenge. The Proof Engine includes a live "try to tamper" demonstration so anyone — not just engineers — can watch the chain break and understand, viscerally, why the record can't be faked.

**Deploying a stateful Next.js app to Google Cloud Run.**
Build-time vs. runtime environment variables, lazy initialization of Firebase to survive the build step, and Docker standalone output all required careful handling. The result is a fully containerized, reproducible deployment on Google Cloud.

---

## Running locally

```bash
# 1. Clone
git clone https://github.com/EshaniKatiyar/NagarIQ.git
cd NagarIQ

# 2. Install
npm install

# 3. Create .env.local with:
#    GEMINI_API_KEY=...
#    NEXT_PUBLIC_FIREBASE_API_KEY=...
#    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
#    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
#    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
#    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
#    NEXT_PUBLIC_FIREBASE_APP_ID=...

# 4. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Visit `/seed` once to populate demo data.

---

## Project structure

```
src/
├── app/
│   ├── pulse/          # Civic Twin — heartbeat, Time Machine, Swarm Agent
│   ├── ledger/         # Proof Engine — tamper-proof hash chain
│   ├── map/            # Live issue map (Leaflet)
│   ├── report/         # AI-powered reporting
│   ├── whisper/        # Anonymous reporting
│   ├── chat/           # Civic AI assistant
│   ├── dashboard/      # Analytics & SLA board
│   └── api/            # Gemini-powered serverless routes
├── components/ui/      # Navbar, modals, alerts
├── lib/
│   ├── civicTwin.ts    # Health engine, prediction, hash chain
│   ├── gemini.ts       # AI functions
│   ├── firestore.ts    # Data layer
│   └── firebase.ts     # Firebase init
└── types/
```

---

## The vision

NagarIQ is a small proof of a larger idea: that civic technology can do more than collect complaints. It can measure a community's health, predict its decline, and place real instruments of accountability into ordinary hands — so that local governance becomes something citizens can *hold to account*, not merely hope in.

A city should answer to the people who live in it. This is a step toward making that automatic.

<div align="center">

---

**Built by [Eshani Katiyar](https://github.com/EshaniKatiyar)**

*Civic intelligence for living cities.*

</div>