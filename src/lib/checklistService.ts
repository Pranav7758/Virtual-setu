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

// ─── localStorage cache ──────────────────────────────────────────────────────

function lsGet(key: string): ChecklistData | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const data: ChecklistData = JSON.parse(raw);
    if (Date.now() - data.generatedAt > CACHE_TTL_MS) {
      localStorage.removeItem(LS_PREFIX + key);
      return null;
    }
    return { ...data, fromCache: true };
  } catch {
    return null;
  }
}

function lsSet(key: string, data: ChecklistData): void {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(data));
  } catch { /* quota exceeded */ }
}

// ─── Supabase cache ──────────────────────────────────────────────────────────

async function supabaseGet(documentType: string): Promise<ChecklistData | null> {
  try {
    const { data, error } = await supabase
      .from('checklists')
      .select('*')
      .eq('document_type', documentType)
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

async function supabaseSave(documentType: string, data: ChecklistData): Promise<void> {
  try {
    await supabase.from('checklists').upsert(
      {
        document_type: documentType,
        required_documents: data.requiredDocuments,
        steps: data.steps,
        notes: data.notes,
      },
      { onConflict: 'document_type' }
    );
  } catch { /* table may not exist yet */ }
}

// ─── ScraperAPI ──────────────────────────────────────────────────────────────

/** Fetch a government page via ScraperAPI and return cleaned plain text */
async function scrapeGovPage(url: string): Promise<string> {
  const apiKey = import.meta.env.VITE_SCRAPER_API_KEY;
  if (!apiKey) throw new Error('VITE_SCRAPER_API_KEY not set');

  const endpoint =
    `${SCRAPER_URL}?api_key=${apiKey}` +
    `&url=${encodeURIComponent(url)}` +
    `&render=false`;           // static HTML is enough; saves credits

  const res = await fetch(endpoint, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`ScraperAPI ${res.status}`);

  const html = await res.text();

  // Strip scripts, styles, nav, footer noise → plain text
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 9000); // keep within GROQ context window

  return cleaned;
}

// ─── GROQ extraction from scraped content ────────────────────────────────────

async function extractFromScrapedText(
  purposeLabel: string,
  scrapedText: string
): Promise<ChecklistData['requiredDocuments'] | null> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) return null;

  const prompt = `You are an expert on Indian government document requirements.

Below is raw text scraped from an official Indian government website about: "${purposeLabel}"

Your job is to extract the required documents from this text.

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
      model: 'llama3-70b-8192',
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
    return parsed.length >= 3 ? parsed : null; // too few = extraction failed
  } catch {
    return null;
  }
}

// ─── GROQ full generation (fallback) ─────────────────────────────────────────

async function generateWithGroq(
  purposeId: string,
  purposeLabel: string
): Promise<ChecklistData> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ API key not configured.');

  const prompt = `You are an expert on Indian government document requirements.

A user in India wants to: "${purposeLabel}"

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
      model: 'llama3-70b-8192',
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
  purposeLabel: string
): Promise<ChecklistData> {
  const govUrl = GOVT_URLS[purposeId];
  const scraperKey = import.meta.env.VITE_SCRAPER_API_KEY;

  // Try web scraping if we have both keys and a target URL
  if (scraperKey && govUrl) {
    try {
      console.info(`[Checklist] Scraping ${govUrl} …`);
      const text = await scrapeGovPage(govUrl);

      if (text.length > 200) {
        const extracted = await extractFromScrapedText(purposeLabel, text);

        if (extracted && extracted.length >= 3) {
          // Scraping succeeded → still ask GROQ for steps + notes using the real data
          const enrichPrompt = `Based on the following scraped document requirements for "${purposeLabel}" in India,
generate the application steps and important notes.

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
                  model: 'llama3-70b-8192',
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
          } catch { /* steps/notes enrichment failure — keep empty */ }

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
      console.warn('[Checklist] Scraping failed, falling back to AI generation:', err);
    }
  }

  // Fallback: pure AI generation
  return generateWithGroq(purposeId, purposeLabel);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function getChecklist(
  purposeId: string,
  purposeLabel: string,
  forceRefresh = false
): Promise<ChecklistData> {
  if (!forceRefresh) {
    const cached = lsGet(purposeId) ?? (await supabaseGet(purposeId));
    if (cached) return cached;
  }

  const data = await generateChecklist(purposeId, purposeLabel);
  lsSet(purposeId, data);
  supabaseSave(purposeId, data).catch(() => {});
  return data;
}
