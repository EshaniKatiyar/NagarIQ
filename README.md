# NagarIQ - Autonomous Civic Intelligence Platform

> **Most civic apps help citizens complain. NagarIQ helps them compel.**

An autonomous, AI-native platform that converts a single citizen report into legally enforceable pressure on local government — built solo, end-to-end, and deployed in production on Google Cloud.

**Live App:** https://nagariq-135934398714.asia-south1.run.app

---

## The Problem

Every Indian city loses lives and money to problems everyone already knows about — drains that flood each monsoon, unlit roads where accidents recur, potholes "reported" a dozen times and fixed zero. The failure was never *awareness*. It's that citizens have **no leverage**: a complaint vanishes into a municipal inbox, with no way to apply pressure, prove it was ignored, or compel a response.

NagarIQ exists to close that gap. Where ordinary civic apps help citizens *ask*, NagarIQ helps them **measure, predict, and compel**.

---

## Flagship Features

| Feature | What it does |
|---|---|
| **Autonomous Swarm Agent** | A Gemini-powered agent that runs with no human prompting — perceives the live issue cluster, reasons through root cause and responsibility, decides an action, and exposes its full reasoning trace. |
| **RTI Receipt** | AI drafts a complete, filing-ready Right to Information application — turning an unresolved complaint into a legally binding 30-day demand for government response. |
| **Accountability Center** | Live countdowns on every escalated issue against its legal deadline; breaches are auto-recorded and escalated. |
| **Civic Twin** | Each neighbourhood as a living organism — a 0–100 health score and a heartbeat that races from 60 to 140 BPM as conditions decline. |
| **Proof Engine** | Every civic action cryptographically chained with SHA-256 — complaints can't be deleted, resolutions can't be backdated. |
| **Time Machine** | Predicts a neighbourhood's health 30/60/90 days ahead, translating neglect into projected accidents and cost. |

Plus the full baseline: AI image/video reporting, 9 Gemini endpoints, live geo-mapping, community verification, real-time tracking, impact dashboards, gamification, interim AI safety guidance, anonymous (Whisper Network) and guest reporting, proximity hazard alerts, and a civic AI assistant.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  INTELLIGENCE   Google Gemini — 9 AI endpoints           │
│                 (vision, categorization, agent reasoning, │
│                  brief + RTI drafting, verification)      │
├─────────────────────────────────────────────────────────┤
│  APPLICATION    Next.js 14 (App Router) · TypeScript      │
│                 Tailwind · Recharts · Leaflet/OSM         │
├─────────────────────────────────────────────────────────┤
│  DATA & IDENTITY  Cloud Firestore (real-time sync)        │
│                   Firebase Auth (Google + Anonymous)      │
│                   Cloudinary (image/video media)          │
├─────────────────────────────────────────────────────────┤
│  INTEGRITY      Web Crypto SHA-256 hash chain             │
├─────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE Docker → Google Cloud Build → Cloud Run   │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Recharts, Leaflet + OpenStreetMap
- **AI:** Google Gemini (Vision + text)
- **Backend / Data:** Firebase Auth, Cloud Firestore, Cloudinary, Next.js serverless API routes
- **Integrity:** Web Crypto SHA-256 hash chain
- **Deployment:** Docker, Google Cloud Build, Google Cloud Run

---

## Google Technologies

- **Google Gemini API** — reasoning engine behind every AI feature and agent
- **Google Cloud Run** — production hosting (containerized)
- **Google Cloud Build** — container build & deploy
- **Firebase Authentication** — Google Sign-In + anonymous guest access
- **Cloud Firestore** — real-time data sync

---

## Running Locally

```bash
# 1. Clone
git clone https://github.com/EshaniKatiyar/NagarIQ.git
cd NagarIQ

# 2. Install
npm install

# 3. Environment — create .env with:
#   NEXT_PUBLIC_FIREBASE_API_KEY=...
#   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
#   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
#   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
#   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
#   NEXT_PUBLIC_FIREBASE_APP_ID=...
#   GEMINI_API_KEY=...

# 4. Run
npm run dev   # http://localhost:3000

# 5. (Optional) seed demo data — visit /seed and click "Clear all + reseed fresh"
```

---

## Engineering Challenges Solved

- **Real agentic reasoning, not automation** — the Swarm Agent runs a genuine perceive → reason → decide → act loop via Gemini, exposing its decision trace rather than hiding behind thresholds.
- **Production Firestore hardening** — defensive stripping of undefined values and field-level fallbacks to guarantee write integrity across all AI-generated documents.
- **Resilient location pipeline** — multi-tier coordinate resolution (GPS → known-area map → geocoding → safe fallback) so every report is mappable, with deterministic offsets so overlapping pins remain individually visible.
- **Containerized cloud deployment** — Dockerized standalone Next.js build deployed via Cloud Build to Cloud Run, with environment integrity verified across build contexts.

---

## Vision

Civic technology can do more than collect complaints. With autonomous agents, it can measure a community's health, predict its decline, and place real instruments of accountability into ordinary hands — so local governance becomes something citizens can *hold to account*, not merely hope in.

A city should answer to the people who live in it. NagarIQ is a step toward making that automatic.
