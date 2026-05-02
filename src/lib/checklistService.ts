import { supabase } from '@/integrations/supabase/client';

/*
  Optional Supabase cache table (run once in your Supabase SQL editor):

  create table if not exists public.checklists (
    id            uuid primary key default gen_random_uuid(),
    document_type text unique not null,
    required_documents jsonb not null default '[]',
    steps         jsonb not null default '[]',
    notes         jsonb not null default '[]',
    created_at    timestamptz not null default now()
  );
  alter table public.checklists enable row level security;
  create policy "read"   on public.checklists for select using (true);
  create policy "insert" on public.checklists for insert with check (true);
  create policy "update" on public.checklists for update using (true);
*/

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const SCRAPER_URL = 'https://api.scraperapi.com';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const LS_PREFIX = 'vs_checklist_';

/** Maps i18n language codes → human-readable language names for GROQ prompts */
const LANG_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi (हिन्दी, Devanagari script)',
  mr: 'Marathi (मराठी, Devanagari script)',
  bn: 'Bengali (বাংলা)',
  ta: 'Tamil (தமிழ்)',
  te: 'Telugu (తెలుగు)',
  kn: 'Kannada (ಕನ್ನಡ)',
  ml: 'Malayalam (മലയാളം)',
  pa: 'Punjabi (ਪੰਜਾਬੀ, Gurmukhi script)',
  gu: 'Gujarati (ગુજરાતી)',
  or: 'Odia (ଓଡ଼ିଆ)',
  as: 'Assamese (অসমীয়া)',
  ur: 'Urdu (اردو)',
  mai: 'Maithili (मैथिली)',
  kok: 'Konkani (कोंकणी)',
  sd: 'Sindhi (سنڌي)',
  ne: 'Nepali (नेपाली)',
  mni: 'Meitei/Manipuri (মৈতৈলোন্)',
  brx: 'Bodo (बड़ो)',
  dgo: 'Dogri (डोगरी)',
  ks: 'Kashmiri (کٲشُر)',
  sa: 'Sanskrit (संस्कृतम्)',
  sat: 'Santali (ᱥᱟᱱᱛᱟᱲᱤ)',
};

/** URLs of official Indian government pages for each purpose */
const GOVT_URLS: Record<string, string> = {
  passport_application:
    'https://www.passportindia.gov.in/AppOnlineProject/online/reqDocsForFreshPassport',
  pan_card_application:
    'https://www.incometaxindia.gov.in/Pages/tax-services/apply-for-pan.aspx',
  driving_license:
    'https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do',
  voter_id_registration:
    'https://voters.eci.gov.in/',
  bank_account_opening:
    'https://rbi.org.in/Scripts/PublicationReportDetails.aspx?UrlPage=&ID=508',
  aadhaar_enrollment:
    'https://uidai.gov.in/en/my-aadhaar/get-aadhaar.html',
  job_application:
    'https://www.ncs.gov.in/',
  college_admission:
    'https://www.ugc.gov.in/e_res/English/Documents/forms/Form-1.pdf',
};

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RequiredDocument {
  name: string;
  description: string;
  required: boolean;
  document_type: string;
}

export interface ChecklistData {
  documentType: string;
  requiredDocuments: RequiredDocument[];
  steps: string[];
  notes: string[];
  generatedAt: number;
  fromCache: boolean;
  source: 'scraped' | 'ai' | 'cache';
}

// ─── localStorage cache (per language) ──────────────────────────────────────

function lsCacheKey(purposeId: string, lang: string) {
  return `${LS_PREFIX}${purposeId}_${lang}`;
}

function lsGet(purposeId: string, lang: string): ChecklistData | null {
  try {
    const raw = localStorage.getItem(lsCacheKey(purposeId, lang));
    if (!raw) return null;
    const data: ChecklistData = JSON.parse(raw);
    if (Date.now() - data.generatedAt > CACHE_TTL_MS) {
      localStorage.removeItem(lsCacheKey(purposeId, lang));
      return null;
    }
    return { ...data, fromCache: true };
  } catch {
    return null;
  }
}

function lsSet(purposeId: string, lang: string, data: ChecklistData): void {
  try {
    localStorage.setItem(lsCacheKey(purposeId, lang), JSON.stringify(data));
  } catch { /* quota exceeded */ }
}

// ─── Supabase cache (per language) ──────────────────────────────────────────

function dbKey(purposeId: string, lang: string) {
  return lang === 'en' ? purposeId : `${purposeId}_${lang}`;
}

async function supabaseGet(purposeId: string, lang: string): Promise<ChecklistData | null> {
  try {
    const { data, error } = await supabase
      .from('checklists')
      .select('*')
      .eq('document_type', dbKey(purposeId, lang))
      .maybeSingle();
    if (error || !data) return null;
    const age = Date.now() - new Date(data.created_at as string).getTime();
    if (age > CACHE_TTL_MS) return null;
    return {
      documentType: data.document_type as string,
      requiredDocuments: data.required_documents as RequiredDocument[],
      steps: data.steps as string[],
      notes: data.notes as string[],
      generatedAt: new Date(data.created_at as string).getTime(),
      fromCache: true,
      source: 'cache',
    };
  } catch {
    return null;
  }
}

async function supabaseSave(purposeId: string, lang: string, data: ChecklistData): Promise<void> {
  try {
    await supabase.from('checklists').upsert(
      {
        document_type: dbKey(purposeId, lang),
        required_documents: data.requiredDocuments,
        steps: data.steps,
        notes: data.notes,
      },
      { onConflict: 'document_type' }
    );
  } catch { /* table may not exist yet */ }
}

// ─── ScraperAPI ──────────────────────────────────────────────────────────────

async function scrapeGovPage(url: string): Promise<string> {
  const apiKey = import.meta.env.VITE_SCRAPER_API_KEY;
  if (!apiKey) throw new Error('VITE_SCRAPER_API_KEY not set');

  const endpoint =
    `${SCRAPER_URL}?api_key=${apiKey}` +
    `&url=${encodeURIComponent(url)}` +
    `&render=false`;

  const res = await fetch(endpoint, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`ScraperAPI ${res.status}`);

  const html = await res.text();
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 9000);
}

// ─── GROQ extraction from scraped content ────────────────────────────────────

async function extractFromScrapedText(
  purposeLabel: string,
  scrapedText: string,
  langName: string
): Promise<ChecklistData['requiredDocuments'] | null> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) return null;

  const langInstruction = langName === 'English'
    ? ''
    : `\n\nIMPORTANT: Respond ENTIRELY in ${langName}. All "name" and "description" values must be written in ${langName}.`;

  const prompt = `You are an expert on Indian government document requirements.

Below is raw text scraped from an official Indian government website about: "${purposeLabel}"

Your job is to extract the required documents from this text.${langInstruction}

Scraped text:
"""
${scrapedText}
"""

Return ONLY valid JSON in this exact format:
[
  {
    "name": "Document name",
    "description": "What it is and why needed (1 sentence)",
    "required": true,
    "document_type": "<one of: aadhaar, pan_card, voter_id, driving_license, passport, birth_certificate, income_certificate, caste_certificate, domicile_certificate, other>"
  }
]

Rules:
- Extract ONLY documents actually mentioned in the text
- If the text doesn't contain useful document info, return []
- Map each document to the closest document_type from the allowed list
- Return ONLY the JSON array, nothing else`;

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1200,
    }),
  });

  if (!res.ok) return null;

  const raw = await res.json();
  const content: string = raw.choices?.[0]?.message?.content ?? '[]';

  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as RequiredDocument[];
    return parsed.length >= 3 ? parsed : null;
  } catch {
    return null;
  }
}

// ─── GROQ full generation (fallback) ─────────────────────────────────────────

async function generateWithGroq(
  purposeId: string,
  purposeLabel: string,
  langName: string
): Promise<ChecklistData> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ API key not configured.');

  const langInstruction = langName === 'English'
    ? ''
    : `\n\nIMPORTANT: Respond ENTIRELY in ${langName}. All "name", "description", "steps", and "notes" values must be written in ${langName} script. Do NOT use English for any content values.`;

  const prompt = `You are an expert on Indian government document requirements.

A user in India wants to: "${purposeLabel}"${langInstruction}

Generate a comprehensive checklist in EXACTLY this JSON format (no other text):
{
  "requiredDocuments": [
    {
      "name": "Full document name",
      "description": "What it is and why it is needed (1 sentence)",
      "required": true,
      "document_type": "<one of: aadhaar, pan_card, voter_id, driving_license, passport, birth_certificate, income_certificate, caste_certificate, domicile_certificate, other>"
    }
  ],
  "steps": [
    "Step 1: ...",
    "Step 2: ..."
  ],
  "notes": [
    "Fee and timing info",
    "Official website or helpline"
  ]
}

Rules:
- 5–8 documents (mix of required true/false)
- 4–6 concise steps
- 2–3 notes (fees, URLs, helplines)
- Map each document to the closest document_type from the allowed list
- Focus on 2024 Indian government requirements
- Return ONLY valid JSON`;

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 1800,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI service error (${res.status}): ${text.slice(0, 120)}`);
  }

  const raw = await res.json();
  const content: string = raw.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content);

  return {
    documentType: purposeId,
    requiredDocuments: (parsed.requiredDocuments ?? []) as RequiredDocument[],
    steps: (parsed.steps ?? []) as string[],
    notes: (parsed.notes ?? []) as string[],
    generatedAt: Date.now(),
    fromCache: false,
    source: 'ai',
  };
}

// ─── Combined: scrape → extract → fallback ───────────────────────────────────

async function generateChecklist(
  purposeId: string,
  purposeLabel: string,
  lang: string
): Promise<ChecklistData> {
  const langName = LANG_NAMES[lang] ?? 'English';
  const govUrl = GOVT_URLS[purposeId];
  const scraperKey = import.meta.env.VITE_SCRAPER_API_KEY;

  if (scraperKey && govUrl) {
    try {
      console.info(`[Checklist] Scraping ${govUrl} for lang=${lang}…`);
      const text = await scrapeGovPage(govUrl);

      if (text.length > 200) {
        const extracted = await extractFromScrapedText(purposeLabel, text, langName);

        if (extracted && extracted.length >= 3) {
          const langInstruction = langName === 'English'
            ? ''
            : ` Respond ENTIRELY in ${langName}. All steps and notes must be in ${langName}.`;

          const enrichPrompt = `Based on the following scraped document requirements for "${purposeLabel}" in India, generate the application steps and important notes.${langInstruction}

Documents found:
${extracted.map((d) => `- ${d.name}`).join('\n')}

Return ONLY valid JSON:
{
  "steps": ["Step 1: ...", "Step 2: ..."],
  "notes": ["Note 1", "Note 2"]
}`;

          let steps: string[] = [];
          let notes: string[] = [];

          try {
            const groqKey = import.meta.env.VITE_GROQ_API_KEY;
            if (groqKey) {
              const r = await fetch(GROQ_URL, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${groqKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'llama-3.3-70b-versatile',
                  messages: [{ role: 'user', content: enrichPrompt }],
                  temperature: 0.2,
                  max_tokens: 600,
                  response_format: { type: 'json_object' },
                }),
              });
              if (r.ok) {
                const rd = await r.json();
                const rc = JSON.parse(rd.choices?.[0]?.message?.content ?? '{}');
                steps = rc.steps ?? [];
                notes = rc.notes ?? [];
              }
            }
          } catch { /* steps/notes enrichment failure */ }

          return {
            documentType: purposeId,
            requiredDocuments: extracted,
            steps,
            notes,
            generatedAt: Date.now(),
            fromCache: false,
            source: 'scraped',
          };
        }
      }
    } catch (err) {
      console.warn('[Checklist] Scraping failed, falling back to AI:', err);
    }
  }

  return generateWithGroq(purposeId, purposeLabel, langName);
}

// ─── Built-in fallback data (English only, no API keys needed) ───────────────

const BUILTIN: Record<string, { docs: RequiredDocument[]; steps: string[]; notes: string[] }> = {
  passport_application: {
    docs: [
      { name: 'Aadhaar Card', description: 'Primary proof of identity and address', required: true, document_type: 'aadhaar' },
      { name: 'PAN Card', description: 'Income tax proof required for adult passports', required: true, document_type: 'pan_card' },
      { name: 'Birth Certificate', description: 'Proof of date of birth (or Class 10 certificate)', required: true, document_type: 'birth_certificate' },
      { name: 'Proof of Address', description: 'Utility bill / bank statement not older than 3 months', required: true, document_type: 'domicile_certificate' },
      { name: 'Passport Size Photo', description: '2 recent colour photos, 3.5×4.5 cm, white background', required: true, document_type: 'other' },
      { name: 'Existing Passport', description: 'Old passport required only for renewal', required: false, document_type: 'passport' },
    ],
    steps: ['Register on passportindia.gov.in', 'Fill Form-1 (fresh/renewal)', 'Pay fee ₹1,500–₹2,000 online', 'Book appointment at nearest PSK', 'Visit PSK with originals + photocopies', 'Biometric capture & document verification', 'Police verification (may be skipped if Aadhaar-linked)', 'Passport dispatched by Speed Post'],
    notes: ['Carry self-attested copies of all documents to PSK', 'Linking Aadhaar can bypass police verification', 'Tatkal costs ₹2,000–₹3,500 extra for expedited delivery'],
  },
  pan_card_application: {
    docs: [
      { name: 'Aadhaar Card', description: 'Most accepted identity + address proof for PAN', required: true, document_type: 'aadhaar' },
      { name: 'Proof of Identity', description: 'Voter ID / Driving License / Passport (any one)', required: true, document_type: 'voter_id' },
      { name: 'Proof of Address', description: 'Utility bill / bank statement (any one)', required: true, document_type: 'domicile_certificate' },
      { name: 'Proof of Date of Birth', description: 'Birth certificate / Class 10 certificate', required: true, document_type: 'birth_certificate' },
      { name: 'Passport Size Photo', description: '2 recent colour photos for offline application', required: true, document_type: 'other' },
    ],
    steps: ['Visit NSDL or UTIITSL portal', 'Choose Form 49A (Indian citizen)', 'Fill details — name must match Aadhaar exactly', 'Pay ₹107 (Indian address) online', 'Upload scanned documents & photo', 'Note 15-digit Acknowledgement Number', 'e-PAN sent to email within 2–3 working days', 'Physical PAN card in 15–20 working days'],
    notes: ['Instant free e-PAN is available if Aadhaar is linked to mobile (incometax.gov.in)', 'PAN–Aadhaar linking is mandatory', 'One person cannot hold more than one PAN card'],
  },
  driving_license: {
    docs: [
      { name: 'Aadhaar Card', description: 'Identity and address proof accepted at all RTOs', required: true, document_type: 'aadhaar' },
      { name: 'Proof of Age', description: 'Birth certificate / Class 10 certificate / Passport', required: true, document_type: 'birth_certificate' },
      { name: 'Proof of Address', description: 'Aadhaar / utility bill / bank passbook', required: true, document_type: 'domicile_certificate' },
      { name: 'Learning Licence', description: 'Valid LL obtained at least 30 days before DL test', required: true, document_type: 'other' },
      { name: 'Passport Size Photo', description: '2 recent colour photos, white background', required: true, document_type: 'other' },
      { name: 'Medical Certificate (Form 1A)', description: 'Required for commercial / heavy vehicle licence only', required: false, document_type: 'other' },
    ],
    steps: ['Register on Sarathi portal (parivahan.gov.in)', 'Apply for Learning Licence — Form 1 & 2, pay ₹200', 'Appear for LL test at RTO', 'Wait 30 days after obtaining LL', 'Apply for DL online, upload documents', 'Book driving test slot at RTO', 'Appear for driving skill test', 'DL issued within 7 days if passed'],
    notes: ['Age 18+ required for motor car; 16+ for gearless mopeds', "Learner's Licence is valid for 6 months", 'Smart card DL dispatched by post — keep acknowledgement as proof'],
  },
  voter_id_registration: {
    docs: [
      { name: 'Proof of Age', description: 'Birth certificate / Aadhaar / Class 10 certificate', required: true, document_type: 'birth_certificate' },
      { name: 'Proof of Address', description: 'Aadhaar / utility bill / bank passbook', required: true, document_type: 'domicile_certificate' },
      { name: 'Passport Size Photo', description: 'One recent colour photo (3.5×4.5 cm)', required: true, document_type: 'other' },
    ],
    steps: ['Visit voters.eci.gov.in or Voter Helpline App', 'Select "New Voter Registration" — fill Form 6', 'Upload photograph and supporting documents', 'Submit and note your Reference ID', 'BLO may visit to verify address', 'EPIC card dispatched within 30 days of verification'],
    notes: ['Must be 18+ as of 1 Jan of the registration year', 'NRIs register via Form 6A using Indian passport', 'Check status online at voters.eci.gov.in after 4–6 weeks'],
  },
  bank_account_opening: {
    docs: [
      { name: 'Aadhaar Card', description: 'Officially Valid Document (OVD) for KYC', required: true, document_type: 'aadhaar' },
      { name: 'PAN Card', description: 'Mandatory for all bank accounts under income tax rules', required: true, document_type: 'pan_card' },
      { name: 'Proof of Address', description: 'Utility bill / Passport / Voter ID', required: true, document_type: 'domicile_certificate' },
      { name: 'Passport Size Photo', description: '2 recent colour photos for account opening form', required: true, document_type: 'other' },
      { name: 'Bank Statement (existing)', description: 'Last 6 months — only if transferring primary relationship', required: false, document_type: 'income_certificate' },
    ],
    steps: ['Choose account type — Savings, Current, Salary, or Jan Dhan', 'Visit branch or apply online via bank app/website', 'Fill KYC form with Aadhaar and PAN details', 'Submit self-attested copies of all OVDs', 'Deposit initial minimum balance (₹0–₹5,000)', 'Account activated within 1–3 working days', 'Debit card and welcome kit arrive within 7–10 days'],
    notes: ['Video KYC (V-KYC) available with most banks — no branch visit needed', 'Jan Dhan (PMJDY) accounts need only Aadhaar and have zero minimum balance', 'Link mobile + Aadhaar immediately to enable UPI and online banking'],
  },
  aadhaar_enrollment: {
    docs: [
      { name: 'Proof of Identity', description: 'Passport / PAN / Voter ID / Driving License / NREGS Card', required: true, document_type: 'voter_id' },
      { name: 'Proof of Address', description: 'Bank passbook / utility bill / Passport / rental agreement', required: true, document_type: 'domicile_certificate' },
      { name: 'Proof of Date of Birth', description: 'Birth certificate / Class 10 certificate (optional but recommended)', required: false, document_type: 'birth_certificate' },
    ],
    steps: ['Locate nearest Aadhaar Enrollment Centre (uidai.gov.in)', 'Fill Enrolment Form — available at centre or download from UIDAI', 'Submit POI and POA documents', 'Biometric capture — fingerprints, iris, photograph', 'Collect acknowledgement slip with Enrolment ID (EID)', 'Track status on uidai.gov.in or mAadhaar app', 'Aadhaar card delivered within 90 days; e-Aadhaar downloadable earlier'],
    notes: ['Aadhaar enrollment is completely free at UIDAI-authorised centres', 'Address update is available self-service at myaadhaar.uidai.gov.in', 'Link mobile number to Aadhaar to use OTP-based online services'],
  },
  job_application: {
    docs: [
      { name: 'Aadhaar Card', description: 'Primary identity proof required by all employers', required: true, document_type: 'aadhaar' },
      { name: 'PAN Card', description: 'Mandatory for salary processing and Form 16', required: true, document_type: 'pan_card' },
      { name: 'Educational Certificates', description: 'Degree / diploma / mark sheets for all qualifying exams', required: true, document_type: 'other' },
      { name: 'Experience Certificate', description: 'Relieving letter and experience letter from previous employer', required: true, document_type: 'other' },
      { name: 'Bank Account Details', description: 'Cancelled cheque or bank passbook for salary credit', required: true, document_type: 'income_certificate' },
      { name: 'Passport Size Photo', description: '4–6 recent colour photos for employer records', required: true, document_type: 'other' },
      { name: 'Passport', description: 'Required for MNCs, government jobs, or security-clearance roles', required: false, document_type: 'passport' },
      { name: 'Salary Slips', description: 'Last 3 months payslips from current/previous employer', required: false, document_type: 'income_certificate' },
    ],
    steps: ['Prepare updated resume and LinkedIn profile', 'Collect and self-attest all educational + experience certificates', 'Apply via company portal, Naukri, LinkedIn, or walk-in', 'Clear aptitude test / technical rounds / HR interview', 'Submit documents for Background Verification (BGV)', 'Sign offer letter; complete joining formalities on Day 1', 'Submit originals within 30 days (some employers require this)'],
    notes: ['Government jobs require documents attested by a Gazetted Officer', 'PF and ESI enrollment happen on joining — provide Aadhaar and bank details', 'Police Verification Certificate may be needed for banking, PSU, or security roles'],
  },
  college_admission: {
    docs: [
      { name: 'Class 10 Marksheet', description: 'Board-certified 10th standard marksheet and passing certificate', required: true, document_type: 'other' },
      { name: 'Class 12 Marksheet', description: 'Board-certified 12th standard marksheet — primary admission criterion', required: true, document_type: 'other' },
      { name: 'Transfer Certificate (TC)', description: 'Issued by last school/college — mandatory for migration', required: true, document_type: 'other' },
      { name: 'Aadhaar Card', description: 'Identity proof required by all universities and UGC', required: true, document_type: 'aadhaar' },
      { name: 'Passport Size Photo', description: '6–10 recent colour photos for forms and college ID card', required: true, document_type: 'other' },
      { name: 'Caste / Category Certificate', description: 'SC/ST/OBC/EWS certificate for reservation benefits', required: false, document_type: 'caste_certificate' },
      { name: 'Income Certificate', description: 'Required for scholarship, fee waiver, or EWS category claims', required: false, document_type: 'income_certificate' },
      { name: 'Migration Certificate', description: 'Required if moving from a different state board or university', required: false, document_type: 'other' },
    ],
    steps: ['Check eligibility — minimum percentage, entrance exam score (JEE/NEET/CET)', 'Fill university or state centralised admission form online', 'Upload scanned documents as per portal specifications', 'Pay application fee online', 'Attend counselling / merit-based allotment rounds', 'Accept seat and pay college fees within deadline', 'Report on joining date with all originals for verification'],
    notes: ['Carry multiple sets of self-attested photocopies on joining day', 'SC/ST/OBC certificates must be from a competent authority of the home state', 'Keep migration certificate issued by previous board for inter-state admissions'],
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getChecklist(
  purposeId: string,
  purposeLabel: string,
  lang: string,
  forceRefresh = false
): Promise<ChecklistData> {
  if (!forceRefresh) {
    // 1. localStorage
    const cached = lsGet(purposeId, lang);
    if (cached) return cached;

    // 2. Supabase
    const dbCached = await supabaseGet(purposeId, lang);
    if (dbCached) {
      lsSet(purposeId, lang, dbCached);
      return dbCached;
    }

    // 3. Built-in (English only)
    if (lang === 'en' && BUILTIN[purposeId]) {
      const b = BUILTIN[purposeId];
      const data: ChecklistData = {
        documentType: purposeId,
        requiredDocuments: b.docs,
        steps: b.steps,
        notes: b.notes,
        generatedAt: Date.now(),
        fromCache: false,
        source: 'ai',
      };
      lsSet(purposeId, lang, data);
      return data;
    }
  }

  // 4. Generate fresh (scrape → AI)
  const data = await generateChecklist(purposeId, purposeLabel, lang);
  lsSet(purposeId, lang, data);
  supabaseSave(purposeId, lang, data);
  return data;
}
