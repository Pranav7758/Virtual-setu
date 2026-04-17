# Virtual Setu — Digital Document Management Platform

A comprehensive digital identity and document management system for Indian citizens. Built with React + Vite + TypeScript + Tailwind CSS + Supabase.

## Architecture

- **Framework**: React 18 + Vite 5 (SPA, no SSR)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router v6
- **Auth & DB**: Supabase (auth + postgres)
- **AI**: Google Gemini API (chatbot)
- **File Storage**: Firebase
- **PDF Export**: html2canvas + jsPDF

## Project Structure

```
src/
  pages/
    Index.tsx        - Landing page
    Auth.tsx         - Sign in / sign up
    Register.tsx     - New user registration
    Dashboard.tsx    - Main authenticated dashboard (tabs)
    Share.tsx        - Public QR-code share page
    NotFound.tsx     - 404
  components/
    DigitalIDCard.tsx   - ID card with Print + PDF download
    DocumentUpload.tsx  - File upload component
    DocumentList.tsx    - Uploaded documents list
    QRCode.tsx          - QR code generator (uses `qrcode` lib)
    SmartChecklist.tsx  - Document checklist
    AIChatbot.tsx       - Gemini-powered chatbot
    ui/                 - shadcn/ui primitives
  lib/
    groqVerify.ts       - GROQ AI document verification (vision + text)
    checklistService.ts - AI checklist generation with localStorage + Supabase cache
  hooks/
    useAuth.tsx                 - Auth context + helper
    useDocumentVerification.ts  - Document verification state hook
    useChecklist.ts             - AI checklist fetch + user-doc comparison hook
  integrations/
    supabase/        - Supabase client + types
```

## Key Features

- **Digital ID Card** (`src/components/DigitalIDCard.tsx`)
  - Real ID-card-style UI with photo, name, email, phone, card ID, QR code
  - **Print** — `window.print()` with `@media print` CSS that isolates only the card
  - **Download PDF** — `html2canvas` captures the card, `jsPDF` generates landscape PDF
  - Uses `useRef` to target the card element

- **Document Management** — upload, list, verification status badges
- **AI Smart Checklist** — GROQ-powered dynamic checklist generation per application type, with localStorage + Supabase caching and user-document comparison
- **AI Chatbot** — Gemini-powered, document-aware assistant
- **QR Share** — PIN-protected public document sharing

## Environment Variables Required

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase measurement ID |
| `VITE_GEMINI_API_KEY` | Google Gemini API key |

## Dev Server

Runs on port `5000`, host `0.0.0.0` — configured for Replit's preview pane.

```bash
npm run dev
```
