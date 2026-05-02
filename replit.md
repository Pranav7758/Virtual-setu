# Virtual Setu — Digital Document Management System

## Overview
Virtual Setu is an official Indian government-style secure document management portal for citizens. Users can register, upload documents, get AI verification, manage their digital identity, and share documents via PIN-protected, time-limited QR links.

## Architecture

### Frontend (Vite + React 18 + TypeScript)
- **Framework**: React 18 with Vite (port 5000)
- **Styling**: Tailwind CSS + Shadcn/UI (Radix primitives)
- **Routing**: React Router DOM v6
- **State**: TanStack Query v5 + React Context for auth
- **Forms**: React Hook Form + Zod

### Backend (Express for dev / Vercel Serverless for production)
- **Dev API Server**: Express on port 3001 (`server/index.ts`) — used in Replit only
- **Production API**: Vercel Serverless Functions in `api/` directory (one file per route)
  - `api/create-order.ts` — POST /api/create-order — Creates Razorpay payment orders
  - `api/verify-payment.ts` — POST /api/verify-payment — Verifies Razorpay signatures, updates Supabase plan
  - `api/delete-document.ts` — POST /api/delete-document — Secure server-side document deletion
  - `api/create-doc-share.ts` — POST /api/create-doc-share — Creates time-limited PIN-protected share token (stored in Supabase `doc_shares` table)
  - `api/get-doc-share.ts` — POST /api/get-doc-share — Validates share token + PIN, returns signed document URL
  - `api/revoke-doc-share.ts` — POST /api/revoke-doc-share — Revokes a share token
  - `api/_shared.ts` — Shared helpers (Supabase client, Razorpay, doc signed URL) — NOT a serverless function
- **Share store**: Previously in-memory (broken on Vercel) → now persisted in Supabase `doc_shares` table

### Database & Auth
- **Supabase**: Auth (email/password + OTP), PostgreSQL DB, File Storage
- **Tables**: `profiles`, `documents`, `subscriptions`, `checklists`
- **Storage Bucket**: `documents` (private, user-scoped RLS)
- **Document expiry**: Stored in localStorage, keyed `vs_expiry_{userId}_{docId}`

### Integrations
- **Groq AI**: Document verification via vision/text models + Government Schemes AI live search (`VITE_GROQ_API_KEY`)
- **Razorpay**: Payment processing for Premium/Platinum plans
- **ScraperAPI**: Government page scraping for smart checklist (`VITE_SCRAPER_API_KEY`)

## Government UI Design System
- **Palette**: Navy `#003580`, Saffron `#FF6200`, Green `#138808`
- **Font**: Noto Sans (official gov portal style)
- **Border-radius**: 0.25rem (sharp/official — no pill shapes)
- **Cards**: White, 1px `#cdd3da` border, minimal shadow
- **No 3D transforms** — flat official look
- **Ashoka Chakra SVG** in header (24-spoke, `#003580`)
- **Two-tier header**: government identity bar (navy) + logo/header (white) + nav bar (light blue)
- **Tricolor stripe** at top (saffron / white / green, 4px)
- **Table layout** for document lists (`gov-table` class)
- **Status pills** with uppercase/small-caps (`status-pill`, `status-verified`, `status-pending`, `status-rejected`)

## Key Files
- `src/App.tsx` — Root with providers and routes (includes `/s/:token` for QR share)
- `src/hooks/useAuth.tsx` — Supabase auth context
- `src/hooks/useUserPlan.ts` — Plan limits (free/premium/platinum)
- `src/integrations/supabase/client.ts` — Supabase client
- `src/lib/groqVerify.ts` — AI document verification
- `src/lib/documentExpiry.ts` — localStorage expiry store
- `src/lib/activityLog.ts` — localStorage activity log
- `src/components/GovLayout.tsx` — Official header (Ashoka Chakra, two-tier nav), footer, exports: `GovCard`, `GovPageHeader`, `GovSectionHeader`
- `src/components/DocumentUpload.tsx` — File upload with AI verify
- `src/components/DocumentList.tsx` — Document table with QR share, view, download, delete
- `src/components/ShareDocModal.tsx` — Emergency QR share modal (PIN + duration → token → QR)
- `src/components/QRCode.tsx` — QR code renderer using `qrcode` lib
- `src/components/AIChatbot.tsx` — Groq-powered chatbot
- `src/pages/ShareSingle.tsx` — Public per-document share page at `/s/:token` (PIN unlock → secure viewer)
- `src/pages/Share.tsx` — Public all-documents share at `/i/:uid`
- `server/index.ts` — Express API server
- `vite.config.ts` — Vite config with API middleware plugin (mirrors server routes for dev)
- `src/index.css` — Government design system CSS (flat official, Noto Sans)

## Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/` | Index | Official portal homepage |
| `/auth` | Auth | Citizen login |
| `/register` | Register | New registration |
| `/dashboard` | Dashboard | Citizen dashboard (tabs: overview, documents, checklist, digital-id, profile) |
| `/pricing` | Pricing | Plans page |
| `/features` | Features | Features overview |
| `/about` | About | About the portal |
| `/scan` | Scan | QR document verification |
| `/help` | Help | Help & support |
| `/i/:uid` | Share | All-documents public share view |
| `/s/:token` | ShareSingle | Per-document emergency share (PIN protected, time-limited) |

## Workflows (Replit dev only)
- **Start application**: `npm run dev` → port 5000 (Vite frontend)
- **API server**: `npm run server` → port 3001 (Express backend)

## Vercel Deployment
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Framework**: Vite
- **API**: `api/*.ts` files auto-detected as Node.js serverless functions (maxDuration: 30s)
- **SPA routing**: catch-all rewrite `/(.*) → /index.html` in `vercel.json`
- **Excluded files**: `server/`, `supabase/`, `.local/` (via `.vercelignore`)
- **Required migration**: Run `supabase/migrations/20260502000002_doc_shares.sql` in Supabase SQL Editor before deploying

### Vercel Environment Variables (set in Vercel dashboard)
| Variable | Where used | Notes |
|----------|-----------|-------|
| `RAZORPAY_KEY_ID` | Server (api/) | Secret — never expose to client |
| `RAZORPAY_KEY_SECRET` | Server (api/) | Secret — never expose to client |
| `SUPABASE_API_KEY` | Server (api/) | Service role key — never expose to client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server (api/) | Fallback for SUPABASE_API_KEY |
| `VITE_SUPABASE_URL` | Server + Client | Used by both api/ functions and frontend |
| `VITE_SUPABASE_ANON_KEY` | Client (bundled) | Public anon key |
| `VITE_GROQ_API_KEY` | Client (bundled) | AI features |
| `VITE_RAZORPAY_KEY_ID` | Client (bundled) | Razorpay checkout modal |
| `VITE_SCRAPER_API_KEY` | Client (bundled) | Smart checklist scraping |

## Environment Secrets
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — Razorpay payment keys (server-only)
- `VITE_RAZORPAY_KEY_ID` — Razorpay key (client-side for modal init)
- `SUPABASE_API_KEY` — Supabase service role key (server-only, preferred over SUPABASE_SERVICE_ROLE_KEY)
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — Supabase client credentials
- `VITE_GROQ_API_KEY` — Groq AI for document verification
- `VITE_SCRAPER_API_KEY` — ScraperAPI for checklist scraping

## Plan Limits
| Plan | Documents | Features |
|------|-----------|---------|
| Free | 5 | Basic upload/view |
| Premium | 100 | QR sharing, AI assistant, all features |
| Platinum | Unlimited | All premium features |
