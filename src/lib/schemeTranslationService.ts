import type { GovScheme } from '@/data/govSchemes';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
const CHUNK_SIZE = 15; // max schemes per API call to stay within token limits

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

// Languages that use Devanagari — scheme names are already in nameHindi
const DEVANAGARI_LANGS = new Set(['hi', 'mr', 'mai', 'kok', 'ne', 'dgo', 'sa', 'brx']);

const SCRIPT_NOTES: Record<string, string> = {
  hi: 'Hindi using Devanagari script (देवनागरी)',
  mr: 'Marathi using Devanagari script (देवनागरी)',
  mai: 'Maithili using Devanagari script',
  kok: 'Konkani using Devanagari script',
  ne: 'Nepali using Devanagari script',
  dgo: 'Dogri using Devanagari script',
  sa: 'Sanskrit using Devanagari script',
  brx: 'Bodo using Devanagari script',
  bn: 'Bengali using Bengali script (বাংলা)',
  as: 'Assamese using Bengali/Assamese script',
  ta: 'Tamil using Tamil script (தமிழ்)',
  te: 'Telugu using Telugu script (తెలుగు)',
  kn: 'Kannada using Kannada script (ಕನ್ನಡ)',
  ml: 'Malayalam using Malayalam script (മലയാളം)',
  pa: 'Punjabi using Gurmukhi script (ਗੁਰਮੁਖੀ)',
  gu: 'Gujarati using Gujarati script (ગુજરાતી)',
  or: 'Odia using Odia script (ଓଡ଼ିଆ)',
  ur: 'Urdu using Urdu/Nastaliq script (اردو)',
  sd: 'Sindhi using Arabic/Sindhi script',
  ks: 'Kashmiri using Arabic script',
  mni: 'Meitei using Meitei Mayek script',
  sat: 'Santali using Ol Chiki script (ᱥᱟᱱᱛᱟᱲᱤ)',
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
  return `vs_scheme_cards_trans_v3_${lang}`;
}
function detailCacheKey(lang: string, id: string) {
  return `vs_scheme_detail_trans_v3_${lang}_${id}`;
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

// ── AI helper — tries Groq first, falls back to Gemini ────────────────────────

async function callAI(systemMsg: string, userMsg: string, maxTokens = 3000): Promise<string> {
  // ── Try Groq ──────────────────────────────────────────────────────────────
  const groqKey = import.meta.env.VITE_GROQ_API_KEY;
  if (groqKey) {
    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemMsg },
            { role: 'user', content: userMsg },
          ],
          temperature: 0.1,
          max_tokens: maxTokens,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const text = json.choices?.[0]?.message?.content?.trim() ?? '';
        if (text) return text;
      }
    } catch { /* fall through to Gemini */ }
  }

  // ── Fallback: Gemini ───────────────────────────────────────────────────────
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const prompt = `${systemMsg}\n\n${userMsg}`;
      const res = await fetch(`${GEMINI_URL}?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: maxTokens },
        }),
      });
      if (res.ok) {
        const json = await res.json();
        return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
      }
    } catch { /* both failed */ }
  }

  return '';
}

function extractJson(text: string): any {
  const match = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

// ── Batch card translation ─────────────────────────────────────────────────────
// Splits into chunks of CHUNK_SIZE to avoid token-limit failures.
// For Devanagari languages (hi, mr, etc.) scheme names come from nameHindi immediately;
// only descriptions are translated via AI.

export async function translateSchemeCards(
  schemes: GovScheme[],
  lang: string,
): Promise<Record<string, CardTranslation>> {
  if (lang === 'en') return {};

  const cached = cacheGet<Record<string, CardTranslation>>(cardsCacheKey(lang));
  if (cached) return cached;

  const langName = LANG_NAMES[lang] ?? lang;
  const scriptNote = SCRIPT_NOTES[lang] ?? `${langName}`;
  const isDevanagari = DEVANAGARI_LANGS.has(lang);

  const result: Record<string, CardTranslation> = {};

  // Pre-fill names for Devanagari languages from existing nameHindi field (instant, no AI needed)
  if (isDevanagari) {
    for (const s of schemes) {
      result[s.id] = { name: s.nameHindi || s.name, description: s.description };
    }
  }

  // Split into chunks
  const chunks: GovScheme[][] = [];
  for (let i = 0; i < schemes.length; i += CHUNK_SIZE) {
    chunks.push(schemes.slice(i, i + CHUNK_SIZE));
  }

  const systemMsg = `You are a government translation assistant. Translate the given Indian government scheme content to ${scriptNote}. Keep a formal, official tone. Preserve the "id" field exactly. Respond ONLY with a JSON array — no markdown, no explanation.`;

  // Translate chunks sequentially to avoid rate limits
  for (const chunk of chunks) {
    if (isDevanagari) {
      // Only translate descriptions (names already filled from nameHindi)
      const input = chunk.map(s => ({ id: s.id, description: s.description }));
      const userMsg = `Translate only the "description" field of each item to ${langName}. Keep "id" unchanged.

Input:
${JSON.stringify(input)}

Output format: [{"id":"...","description":"...translated..."},...]`;

      const raw = await callAI(systemMsg, userMsg, 2500);
      const parsed = extractJson(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item.id && item.description && result[item.id]) {
            result[item.id].description = item.description;
          }
        }
      }
    } else {
      // Translate both name and description
      const input = chunk.map(s => ({ id: s.id, name: s.name, description: s.description }));
      const userMsg = `Translate the "name" and "description" fields of each item to ${langName}. Keep "id" unchanged.

Input:
${JSON.stringify(input)}

Output format: [{"id":"...","name":"...translated...","description":"...translated..."},...]`;

      const raw = await callAI(systemMsg, userMsg, 2500);
      const parsed = extractJson(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item.id && item.name) {
            result[item.id] = { name: item.name, description: item.description ?? '' };
          }
        }
      }
    }
  }

  if (Object.keys(result).length > 0) {
    cacheSet(cardsCacheKey(lang), result);
  }
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
  const scriptNote = SCRIPT_NOTES[lang] ?? `${langName}`;

  const systemMsg = `You are a government translation assistant. Translate all content to ${scriptNote}. Keep a formal, official government tone. Respond ONLY with a valid JSON object — no markdown, no explanation.`;

  const userMsg = `Translate ALL of these fields to ${langName}. Return a JSON object with the same keys.

{
  "name": ${JSON.stringify(scheme.name)},
  "description": ${JSON.stringify(scheme.description)},
  "objective": ${JSON.stringify(scheme.objective ?? '')},
  "ministry": ${JSON.stringify(scheme.ministry)},
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

  const raw = await callAI(systemMsg, userMsg, 4000);
  const parsed = extractJson(raw);
  if (!parsed || typeof parsed !== 'object') return null;

  const result: DetailTranslation = {
    name: parsed.name ?? (DEVANAGARI_LANGS.has(lang) ? scheme.nameHindi : scheme.name),
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
