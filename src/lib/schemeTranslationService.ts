import type { GovScheme } from '@/data/govSchemes';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

export const LANG_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi (हिन्दी)',
  mr: 'Marathi (मराठी)',
  bn: 'Bengali (বাংলা)',
  ta: 'Tamil (தமிழ்)',
  te: 'Telugu (తెలుగు)',
  kn: 'Kannada (ಕನ್ನಡ)',
  ml: 'Malayalam (മലയാളം)',
  pa: 'Punjabi (ਪੰਜਾਬੀ)',
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

export interface CardTranslation {
  name: string;
  description: string;
}

export interface DetailTranslation {
  name: string;
  description: string;
  objective: string;
  ministry: string;
  eligibility: string[];
  benefits: string[];
  requiredDocuments: string[];
  applicationProcess: string[];
  labels: {
    eligibilityTitle: string;
    benefitsTitle: string;
    documentsTitle: string;
    applyTitle: string;
    applyButton: string;
    launchedLabel: string;
    ministryLabel: string;
  };
}

// ── Cache helpers ──────────────────────────────────────────────────────────────

function cardsCacheKey(lang: string) {
  return `vs_scheme_cards_trans_${lang}`;
}
function detailCacheKey(lang: string, id: string) {
  return `vs_scheme_detail_trans_${lang}_${id}`;
}

function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data as T;
  } catch { return null; }
}

function cacheSet<T>(key: string, data: T) {
  try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

// ── GROQ helper ────────────────────────────────────────────────────────────────

async function groqCall(prompt: string): Promise<string> {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  if (!key) return '';
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 4000,
    }),
  });
  if (!res.ok) return '';
  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() ?? '';
}

function extractJson(text: string): any {
  const match = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

// ── Batch card translation ─────────────────────────────────────────────────────

export async function translateSchemeCards(
  schemes: GovScheme[],
  lang: string,
): Promise<Record<string, CardTranslation>> {
  if (lang === 'en') return {};

  const cached = cacheGet<Record<string, CardTranslation>>(cardsCacheKey(lang));
  if (cached) return cached;

  const langName = LANG_NAMES[lang] ?? lang;
  const input = schemes.map(s => ({ id: s.id, name: s.name, description: s.description }));

  const prompt = `Translate these Indian government scheme names and short descriptions from English to ${langName}.

IMPORTANT RULES:
- Use the correct script for ${langName} (e.g., Devanagari for Hindi/Marathi, Bengali script for Bengali, etc.)
- Keep a formal, official government tone
- Keep 'id' field EXACTLY unchanged
- Translate ONLY the 'name' and 'description' fields
- Respond ONLY with a valid JSON array, no markdown, no explanation

Input:
${JSON.stringify(input)}

Respond with JSON array:
[{"id":"...", "name":"...translated...", "description":"...translated..."}, ...]`;

  const raw = await groqCall(prompt);
  const parsed = extractJson(raw);
  if (!Array.isArray(parsed)) return {};

  const result: Record<string, CardTranslation> = {};
  for (const item of parsed) {
    if (item.id && item.name) {
      result[item.id] = { name: item.name, description: item.description ?? '' };
    }
  }

  cacheSet(cardsCacheKey(lang), result);
  return result;
}

// ── Detail translation ─────────────────────────────────────────────────────────

export async function translateSchemeDetail(
  scheme: GovScheme,
  lang: string,
): Promise<DetailTranslation | null> {
  if (lang === 'en') return null;

  const cached = cacheGet<DetailTranslation>(detailCacheKey(lang, scheme.id));
  if (cached) return cached;

  const langName = LANG_NAMES[lang] ?? lang;

  const prompt = `Translate this Indian government scheme and UI labels from English to ${langName}.

IMPORTANT RULES:
- Use the correct script (e.g., Devanagari for Hindi/Marathi, বাংলা for Bengali, etc.)
- Keep a formal, official government tone
- Respond ONLY with a valid JSON object, no markdown

Translate ALL of these fields to ${langName}:
{
  "name": "${scheme.name}",
  "description": "${scheme.description}",
  "objective": "${scheme.objective ?? ''}",
  "ministry": "${scheme.ministry}",
  "eligibility": ${JSON.stringify(scheme.eligibility)},
  "benefits": ${JSON.stringify(scheme.benefits)},
  "requiredDocuments": ${JSON.stringify(scheme.requiredDocuments)},
  "applicationProcess": ${JSON.stringify(scheme.applicationProcess)},
  "labels": {
    "eligibilityTitle": "Eligibility Criteria",
    "benefitsTitle": "Benefits & Support",
    "documentsTitle": "Required Documents",
    "applyTitle": "How to Apply",
    "applyButton": "Apply / Visit Official Website",
    "launchedLabel": "Launched",
    "ministryLabel": "Ministry"
  }
}`;

  const raw = await groqCall(prompt);
  const parsed = extractJson(raw);
  if (!parsed || typeof parsed !== 'object') return null;

  const result: DetailTranslation = {
    name: parsed.name ?? scheme.name,
    description: parsed.description ?? scheme.description,
    objective: parsed.objective ?? scheme.objective ?? '',
    ministry: parsed.ministry ?? scheme.ministry,
    eligibility: Array.isArray(parsed.eligibility) ? parsed.eligibility : scheme.eligibility,
    benefits: Array.isArray(parsed.benefits) ? parsed.benefits : scheme.benefits,
    requiredDocuments: Array.isArray(parsed.requiredDocuments) ? parsed.requiredDocuments : scheme.requiredDocuments,
    applicationProcess: Array.isArray(parsed.applicationProcess) ? parsed.applicationProcess : scheme.applicationProcess,
    labels: {
      eligibilityTitle: parsed.labels?.eligibilityTitle ?? 'Eligibility Criteria',
      benefitsTitle: parsed.labels?.benefitsTitle ?? 'Benefits & Support',
      documentsTitle: parsed.labels?.documentsTitle ?? 'Required Documents',
      applyTitle: parsed.labels?.applyTitle ?? 'How to Apply',
      applyButton: parsed.labels?.applyButton ?? 'Apply / Visit Official Website',
      launchedLabel: parsed.labels?.launchedLabel ?? 'Launched',
      ministryLabel: parsed.labels?.ministryLabel ?? 'Ministry',
    },
  };

  cacheSet(detailCacheKey(lang, scheme.id), result);
  return result;
}
