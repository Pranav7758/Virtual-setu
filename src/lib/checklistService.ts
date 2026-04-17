import { supabase } from '@/integrations/supabase/client';

/*
  SQL to create the optional Supabase cache table (run once in your Supabase SQL editor):

  create table if not exists public.checklists (
    id            uuid primary key default gen_random_uuid(),
    document_type text unique not null,
    required_documents jsonb not null default '[]',
    steps         jsonb not null default '[]',
    notes         jsonb not null default '[]',
    created_at    timestamptz not null default now()
  );
  alter table public.checklists enable row level security;
  create policy "Anyone can read checklists" on public.checklists for select using (true);
  create policy "Anyone can insert checklists" on public.checklists for insert with check (true);
  create policy "Anyone can update checklists" on public.checklists for update using (true);
*/

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const LS_PREFIX = 'vs_checklist_';

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
}

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
  } catch {
    /* storage quota — ignore */
  }
}

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
  } catch {
    /* table may not exist yet — silent fallback */
  }
}

async function generateWithGroq(
  purposeId: string,
  purposeLabel: string
): Promise<ChecklistData> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ API key not configured.');

  const prompt = `You are an expert on Indian government document requirements.

A user in India wants to apply for / obtain: "${purposeLabel}"

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
    "Important note about fees or timing",
    "Website or helpline info"
  ]
}

Rules:
- Include 5–8 documents (mix of required true/false)
- Include 4–6 concise application steps
- Include 2–3 notes (fees, URLs, helplines)
- Map each document to the closest document_type from the allowed list
- Focus on 2024 Indian government requirements
- Return ONLY valid JSON`;

  const response = await fetch(GROQ_API_URL, {
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

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI service error (${response.status}): ${text.slice(0, 120)}`);
  }

  const raw = await response.json();
  const content: string = raw.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content);

  return {
    documentType: purposeId,
    requiredDocuments: (parsed.requiredDocuments ?? []) as RequiredDocument[],
    steps: (parsed.steps ?? []) as string[],
    notes: (parsed.notes ?? []) as string[],
    generatedAt: Date.now(),
    fromCache: false,
  };
}

export async function getChecklist(
  purposeId: string,
  purposeLabel: string,
  forceRefresh = false
): Promise<ChecklistData> {
  if (!forceRefresh) {
    const cached = lsGet(purposeId) ?? await supabaseGet(purposeId);
    if (cached) return cached;
  }

  const data = await generateWithGroq(purposeId, purposeLabel);
  lsSet(purposeId, data);
  supabaseSave(purposeId, data).catch(() => {});
  return data;
}
