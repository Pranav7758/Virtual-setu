const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const CACHE_PREFIX = 'vs_scheme_ai_';
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

export interface AISchemeResult {
  id: string;
  name: string;
  nameHindi: string;
  category: string;
  ministry: string;
  launchDate: string;
  status: 'active' | 'inactive';
  description: string;
  eligibility: string[];
  benefits: string[];
  requiredDocuments: string[];
  applicationProcess: string[];
  officialUrl: string;
  isAI: true;
}

interface CacheEntry {
  results: AISchemeResult[];
  fetchedAt: number;
}

const LANG_NAMES: Record<string, string> = {
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

// Scripts used per language (for explicit prompt instructions)
const LANG_SCRIPTS: Record<string, string> = {
  hi: 'Devanagari script (देवनागरी)',
  mr: 'Devanagari script (देवनागरी)',
  mai: 'Devanagari script (देवनागरी)',
  kok: 'Devanagari script (देवनागरी)',
  ne: 'Devanagari script (देवनागरी)',
  dgo: 'Devanagari script (देवनागरी)',
  sa: 'Devanagari script (देवनागरी)',
  brx: 'Devanagari script',
  bn: 'Bengali script (বাংলা হরফ)',
  as: 'Bengali script (অসমীয়া)',
  ta: 'Tamil script (தமிழ் எழுத்து)',
  te: 'Telugu script (తెలుగు లిపి)',
  kn: 'Kannada script (ಕನ್ನಡ ಲಿಪಿ)',
  ml: 'Malayalam script (മലയാളം ലിപി)',
  pa: 'Gurmukhi script (ਗੁਰਮੁਖੀ)',
  gu: 'Gujarati script (ગુજરાતી લિપિ)',
  or: 'Odia script (ଓଡ଼ିଆ ଅକ୍ଷର)',
  ur: 'Nastaliq/Urdu script (اردو)',
  sd: 'Sindhi/Arabic script (سنڌي)',
  ks: 'Kashmiri/Arabic script (کٲشُر)',
  mni: 'Meitei Mayek script',
  sat: 'Ol Chiki script (ᱥᱟᱱᱛᱟᱲᱤ)',
};

function cacheKey(query: string, lang: string) {
  return `${CACHE_PREFIX}${query.trim().toLowerCase().replace(/\s+/g, '_').slice(0, 60)}__${lang}`;
}

function fromCache(query: string, lang: string): AISchemeResult[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(query, lang));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.fetchedAt > CACHE_TTL) return null;
    return entry.results;
  } catch { return null; }
}

function toCache(query: string, lang: string, results: AISchemeResult[]) {
  try {
    const entry: CacheEntry = { results, fetchedAt: Date.now() };
    localStorage.setItem(cacheKey(query, lang), JSON.stringify(entry));
  } catch {}
}

export async function searchSchemesWithAI(query: string, lang = 'en'): Promise<AISchemeResult[]> {
  const normalizedLang = lang.split('-')[0];
  const key = import.meta.env.VITE_GROQ_API_KEY;
  if (!key || !query.trim()) return [];

  const cached = fromCache(query.trim().toLowerCase(), normalizedLang);
  if (cached) return cached;

  const langName = LANG_NAMES[normalizedLang] ?? 'English';
  const script = LANG_SCRIPTS[normalizedLang];
  const isNonEnglish = normalizedLang !== 'en';

  const langInstruction = isNonEnglish
    ? `
⚠️ LANGUAGE REQUIREMENT — MANDATORY:
The user speaks ${langName}${script ? ` (uses ${script})` : ''}.
You MUST write EVERY text field in ${langName} using the correct native script.
This includes: name, ministry, description, every item in eligibility[], benefits[], requiredDocuments[], and applicationProcess[].
Do NOT use English for any of these fields.
Only "nameHindi" must remain in Hindi Devanagari (हिन्दी देवनागरी).
Only "category", "status", "launchDate", "officialUrl", and "id" may be in English/Latin.`
    : '';

  const prompt = `You are an expert on Indian government schemes and welfare programmes.${langInstruction}

The user is searching for: "${query}"

Find up to 4 relevant Indian government schemes that match this search. Include recent schemes from 2023, 2024, 2025 if relevant. Focus on schemes that are less commonly known or recently launched.

Respond ONLY with a valid JSON array. No markdown, no explanation, just raw JSON starting with [ and ending with ].

Each object in the array must have exactly these fields:
{
  "name": "Full scheme name${isNonEnglish ? ` written in ${langName}` : ''}",
  "nameHindi": "योजना का नाम हिन्दी देवनागरी में",
  "category": "one of: Education|Healthcare|Agriculture|Business|Employment|Housing|Social Welfare|Women & Children|Senior Citizens|Financial Inclusion|Skill Development|Rural Development|Environment & Energy",
  "ministry": "Ministry name${isNonEnglish ? ` in ${langName}` : ' in English'}",
  "launchDate": "YYYY-MM-DD",
  "status": "active",
  "description": "2-3 sentence description${isNonEnglish ? ` in ${langName}` : ' in English'}",
  "eligibility": ["${isNonEnglish ? `each item in ${langName}` : 'criterion 1'}", "${isNonEnglish ? '' : 'criterion 2'}"],
  "benefits": ["${isNonEnglish ? `each item in ${langName}` : 'benefit 1'}"],
  "requiredDocuments": ["${isNonEnglish ? `each item in ${langName}` : 'doc 1'}"],
  "applicationProcess": ["${isNonEnglish ? `each step in ${langName}` : 'step 1'}"],
  "officialUrl": "https://..."
}

If no relevant Indian government schemes match "${query}", return an empty array: []`;

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 2500,
      }),
    });

    if (!res.ok) return [];
    const json = await res.json();
    const text = json.choices?.[0]?.message?.content?.trim() ?? '';

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];

    const raw: any[] = JSON.parse(match[0]);
    const results: AISchemeResult[] = raw.slice(0, 4).map((s, i) => ({
      id: `ai_${Date.now()}_${i}`,
      name: s.name ?? 'Unknown Scheme',
      nameHindi: s.nameHindi ?? '',
      category: s.category ?? 'Social Welfare',
      ministry: s.ministry ?? 'Government of India',
      launchDate: s.launchDate ?? '2024-01-01',
      status: s.status === 'inactive' ? 'inactive' : 'active',
      description: s.description ?? '',
      eligibility: Array.isArray(s.eligibility) ? s.eligibility : [],
      benefits: Array.isArray(s.benefits) ? s.benefits : [],
      requiredDocuments: Array.isArray(s.requiredDocuments) ? s.requiredDocuments : [],
      applicationProcess: Array.isArray(s.applicationProcess) ? s.applicationProcess : [],
      officialUrl: s.officialUrl ?? 'https://india.gov.in',
      isAI: true,
    }));

    toCache(query.trim().toLowerCase(), normalizedLang, results);
    return results;
  } catch {
    return [];
  }
}
