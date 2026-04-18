# Virtual Setu — Digital Document Management Platform

A comprehensive digital identity and document management system for Indian citizens. Built with React + Vite + TypeScript + Tailwind CSS + Supabase.

## Architecture

- **Framework**: React 18 + Vite 5 (SPA, no SSR)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router v6
- **Auth & DB**: Supabase (auth + postgres + storage)
- **AI**: GROQ API (document verification + smart checklist)
- **Payments**: Razorpay (premium/platinum plans)
- **PDF Export**: html2canvas + jsPDF

## Project Structure

```
src/
  pages/
    Index.tsx        - Landing page
    Auth.tsx         - Sign in / sign up
    Register.tsx     - New user registration
    Dashboard.tsx    - Main authenticated dashboard (tabs)
    Pricing.tsx      - Subscription plans page
    Share.tsx        - Public QR-code share page
    NotFound.tsx     - 404
  components/
    DigitalIDCard.tsx   - ID card with Print + PDF download
    DocumentUpload.tsx  - File upload component (AI-verified)
    DocumentList.tsx    - Uploaded documents list
    QRCode.tsx          - QR code generator (uses `qrcode` lib)
    SmartChecklist.tsx  - Document checklist
    AIChatbot.tsx       - GROQ-powered chatbot
    ui/                 - shadcn/ui primitives
  lib/
    groqVerify.ts       - GROQ AI document verification (vision + text)
    checklistService.ts - AI checklist generation with localStorage + Supabase cache
    firebase.ts         - Firebase config (legacy, not primary storage)
  hooks/
    useAuth.tsx                 - Auth context + helper (Supabase)
    useDocumentVerification.ts  - Document verification state hook
    useChecklist.ts             - AI checklist fetch + user-doc comparison hook
    useUserPlan.ts              - User plan/limits management
  integrations/
    supabase/        - Supabase client + generated types
server/
  index.ts     - Express API server (Razorpay order creation + payment verification)
  db.ts        - PostgreSQL pool (DATABASE_URL)
supabase/
  migrations/  - SQL schema migrations (profiles, documents, subscriptions)
  functions/   - Edge function: share-docs (PIN-protected document sharing)
```

## Key Features

- **Digital ID Card** (`src/components/DigitalIDCard.tsx`)
  - Real ID-card-style UI with photo, name, email, phone, card ID, QR code
  - **Print** — `window.print()` with `@media print` CSS that isolates only the card
  - **Download PDF** — `html2canvas` captures the card, `jsPDF` generates landscape PDF

- **Document Management** — AI-verified upload, list, verification status badges
- **AI Smart Checklist** — GROQ-powered dynamic checklist generation per application type, with localStorage + Supabase caching
- **AI Chatbot** — GROQ-powered, document-aware assistant
- **QR Share** — PIN-protected public document sharing via Supabase Edge Function
- **Subscriptions** — Free / Premium / Platinum plans via Razorpay

## Running Services

- **Vite dev server** — port `5000` (frontend)
- **Express API server** — port `3001` (Razorpay payment endpoints: `/api/create-order`, `/api/verify-payment`)
- Vite proxies `/api/*` requests to port 3001

## Environment Variables Required

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) |
| `RAZORPAY_KEY_ID` | Razorpay key ID (server-side) |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key (server-side) |
| `VITE_RAZORPAY_KEY_ID` | Razorpay key ID (frontend, for checkout) |
| `VITE_GROQ_API_KEY` | GROQ API key (document verification + AI features) |
| `VITE_SCRAPER_API_KEY` | ScraperAPI key (optional, for smart checklist) |

## Dev Commands

```bash
npm run dev      # Start Vite frontend (port 5000)
npm run server   # Start Express API server (port 3001)
```
