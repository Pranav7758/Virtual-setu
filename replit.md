# Virtual Setu — Digital Document Management System

## Overview
Virtual Setu is a government-style secure document management portal for Indian citizens. Users can register, upload documents, get AI verification, manage their digital identity, and share documents via PIN-protected QR links.

## Architecture

### Frontend (Vite + React 18 + TypeScript)
- **Framework**: React 18 with Vite (port 5000)
- **Styling**: Tailwind CSS + Shadcn/UI (Radix primitives)
- **Routing**: React Router DOM v6
- **State**: TanStack Query v5 + React Context for auth
- **Forms**: React Hook Form + Zod

### Backend (Express + TypeScript)
- **API Server**: Express on port 3001 (`server/index.ts`)
- **Routes**:
  - `POST /api/create-order` — Creates Razorpay payment orders
  - `POST /api/verify-payment` — Verifies Razorpay signatures, updates Supabase plan
  - `POST /api/delete-document` — Secure server-side document deletion

### Database & Auth
- **Supabase**: Auth (email/password + OTP), PostgreSQL DB, File Storage
- **Tables**: `profiles`, `documents`, `subscriptions`, `checklists`
- **Storage Bucket**: `documents` (private, user-scoped RLS)

### Integrations
- **Groq AI**: Document verification via vision/text models (`VITE_GROQ_API_KEY`)
- **Gemini AI**: AI chatbot (`VITE_GEMINI_API_KEY` — hardcoded fallback exists)
- **Razorpay**: Payment processing for Premium/Platinum plans
- **Firebase**: Secondary integration in `src/lib/firebase.ts` (auth, realtime DB, storage)
- **ScraperAPI**: Government page scraping for smart checklist (`VITE_SCRAPER_API_KEY`)

## Key Files
- `src/App.tsx` — Root with providers and routes
- `src/hooks/useAuth.tsx` — Supabase auth context
- `src/hooks/useUserPlan.ts` — Plan limits (free/premium/platinum)
- `src/integrations/supabase/client.ts` — Supabase client
- `src/integrations/supabase/types.ts` — DB type definitions
- `src/lib/groqVerify.ts` — AI document verification
- `src/lib/checklistService.ts` — Smart checklist with scraping + AI
- `src/components/DocumentUpload.tsx` — File upload with AI verify
- `src/components/DocumentList.tsx` — Document list with delete
- `src/components/AIChatbot.tsx` — Gemini-powered chatbot
- `server/index.ts` — Express API server
- `vite.config.ts` — Vite config with API middleware plugin

## Workflows
- **Start application**: `npm run dev` → port 5000 (Vite frontend)
- **API server**: `npm run server` → port 3001 (Express backend)

## Environment Secrets Required
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side only)
- `VITE_GROQ_API_KEY` — Groq API key for document AI verification
- `RAZORPAY_KEY_ID` — Razorpay key ID
- `RAZORPAY_KEY_SECRET` — Razorpay secret key
- `VITE_RAZORPAY_KEY_ID` — Razorpay key ID (frontend)
- `VITE_SCRAPER_API_KEY` — ScraperAPI key for government page scraping

## Plans & Limits
- **Free**: 5 documents, basic AI chatbot
- **Premium** (₹299/yr): 100 documents, full AI, QR sharing
- **Platinum** (₹599/yr): Unlimited docs, all features, no PIN delay

## Supabase Schema
Migrations in `supabase/migrations/`:
1. `20250917...` — profiles, documents tables + RLS + storage
2. `20260417...` — subscriptions table + plan column on profiles

## Security Notes
- Supabase service role key is only used server-side (Express API)
- Document deletion goes through server to verify ownership
- Payment verification uses HMAC signature check server-side
- Documents served via signed URLs (10 min expiry)
- Secure viewer blocks copy/print/screenshot via keyboard + focus events
