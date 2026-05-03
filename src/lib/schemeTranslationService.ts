import type { GovScheme } from '@/data/govSchemes';

const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

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

export const DEVANAGARI_LANGS = new Set(['hi', 'mr', 'mai', 'kok', 'ne', 'dgo', 'sa', 'brx']);

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

function cardsCacheKey(lang: string) { return `vs_scheme_cards_trans_v4_${lang}`; }
function detailCacheKey(lang: string, id: string) { return `vs_scheme_detail_trans_v4_${lang}_${id}`; }

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

// ── Sarvam AI translate — calls server-side proxy ─────────────────────────────
// Sends an array of texts, gets back array of translated texts in same order.
async function callSarvam(texts: string[], lang: string): Promise<string[]> {
  try {
    const res = await fetch('/api/sarvam/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, target_lang: lang }),
    });
    if (!res.ok) {
      console.error('[Sarvam] proxy error', res.status, await res.text());
      return texts;
    }
    const json = await res.json();
    const translations: string[] = json.translations ?? texts;
    return translations;
  } catch (e: any) {
    console.error('[Sarvam] fetch threw:', e.message);
    return texts;
  }
}

// ── Batch card translation ─────────────────────────────────────────────────────

export async function translateSchemeCards(
  schemes: GovScheme[],
  lang: string,
): Promise<Record<string, CardTranslation>> {
  if (lang === 'en') return {};

  const cached = cacheGet<Record<string, CardTranslation>>(cardsCacheKey(lang));
  if (cached) return cached;

  const isDevanagari = DEVANAGARI_LANGS.has(lang);
  const result: Record<string, CardTranslation> = {};

  if (isDevanagari) {
    // Names come from nameHindi — only translate descriptions
    const descriptions = schemes.map(s => s.description);
    const translated = await callSarvam(descriptions, lang);
    for (let i = 0; i < schemes.length; i++) {
      result[schemes[i].id] = {
        name: schemes[i].nameHindi || schemes[i].name,
        description: translated[i] || schemes[i].description,
      };
    }
  } else {
    // Translate both names and descriptions in one parallel batch
    const names = schemes.map(s => s.name);
    const descs = schemes.map(s => s.description);
    const translated = await callSarvam([...names, ...descs], lang);
    const n = schemes.length;
    for (let i = 0; i < n; i++) {
      result[schemes[i].id] = {
        name: translated[i] || schemes[i].name,
        description: translated[n + i] || schemes[i].description,
      };
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

  const isDevanagari = DEVANAGARI_LANGS.has(lang);

  const eligibility = scheme.eligibility ?? [];
  const benefits = scheme.benefits ?? [];
  const requiredDocuments = scheme.requiredDocuments ?? [];
  const applicationProcess = scheme.applicationProcess ?? [];

  const labelTexts = [
    'Eligibility Criteria',
    'Benefits & Support',
    'Required Documents',
    'How to Apply',
    'Apply / Visit Official Website',
    'Launched',
    'Ministry',
  ];

  // Build flat array of all texts to translate in one parallel batch
  const sourceTexts = [
    scheme.name,
    scheme.description,
    scheme.objective ?? '',
    scheme.ministry,
    ...eligibility,
    ...benefits,
    ...requiredDocuments,
    ...applicationProcess,
    ...labelTexts,
  ];

  const translated = await callSarvam(sourceTexts, lang);

  // Walk the result array with an index pointer
  let i = 0;
  const nameT        = translated[i++] || scheme.name;
  const descT        = translated[i++] || scheme.description;
  const objectiveT   = translated[i++] || (scheme.objective ?? '');
  const ministryT    = translated[i++] || scheme.ministry;
  const eligibilityT = eligibility.map(e => translated[i++] || e);
  const benefitsT    = benefits.map(b => translated[i++] || b);
  const docsT        = requiredDocuments.map(d => translated[i++] || d);
  const stepsT       = applicationProcess.map(s => translated[i++] || s);
  const labT         = labelTexts.map(l => translated[i++] || l);

  const result: DetailTranslation = {
    name: isDevanagari ? (scheme.nameHindi || nameT) : nameT,
    description: descT,
    objective: objectiveT,
    ministry: ministryT,
    eligibility: eligibilityT,
    benefits: benefitsT,
    requiredDocuments: docsT,
    applicationProcess: stepsT,
    labels: {
      eligibilityTitle: labT[0],
      benefitsTitle:    labT[1],
      documentsTitle:   labT[2],
      applyTitle:       labT[3],
      applyButton:      labT[4],
      launchedLabel:    labT[5],
      ministryLabel:    labT[6],
    },
  };

  cacheSet(detailCacheKey(lang, scheme.id), result);
  return result;
}
