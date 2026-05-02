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

function cacheKey(query: string) {
  return `${CACHE_PREFIX}${query.trim().toLowerCase().replace(/\s+/g, '_').slice(0, 60)}`;
}

function fromCache(cacheQ: string): AISchemeResult[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(cacheQ));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.fetchedAt > CACHE_TTL) return null;
    return entry.results;
  } catch { return null; }
}

function toCache(cacheQ: string, results: AISchemeResult[]) {
  try {
    const entry: CacheEntry = { results, fetchedAt: Date.now() };
    localStorage.setItem(cacheKey(cacheQ), JSON.stringify(entry));
  } catch {}
}

export async function searchSchemesWithAI(query: string, lang = 'en'): Promise<AISchemeResult[]> {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  if (!key || !query.trim()) return [];

  const cacheQ = `${query.trim().toLowerCase()}__${lang}`;
  const cached = fromCache(cacheQ);
  if (cached) return cached;

  const LANG_NAMES: Record<string, string> = {
    en: 'English', hi: 'Hindi (हिन्दी, Devanagari)', mr: 'Marathi (मराठी, Devanagari)',
    bn: 'Bengali (বাংলা)', ta: 'Tamil (தமிழ்)', te: 'Telugu (తెలుగు)',
    kn: 'Kannada (ಕನ್ನಡ)', ml: 'Malayalam (മലയാളം)', pa: 'Punjabi (ਪੰਜਾਬੀ, Gurmukhi)',
    gu: 'Gujarati (ગુજરાતી)', or: 'Odia (ଓଡ଼ିଆ)', as: 'Assamese (অসমীয়া)',
    ur: 'Urdu (اردو)', mai: 'Maithili (मैथिली)', kok: 'Konkani (कोंकणी)',
    sd: 'Sindhi (سنڌي)', ne: 'Nepali (नेपाली)', mni: 'Meitei/Manipuri (মৈতৈলোন্)',
    brx: 'Bodo (बड़ो)', dgo: 'Dogri (डोगरी)', ks: 'Kashmiri (کٲشُر)',
    sa: 'Sanskrit (संस्कृतम्)', sat: 'Santali (ᱥᱟᱱᱛᱟᱲᱤ)',
  };
  const langName = LANG_NAMES[lang] ?? 'English';
  const inLang = lang !== 'en' ? ` Write ALL text fields in ${langName} using the correct script.` : '';

  const prompt = `You are an expert on Indian government schemes and welfare programmes. The user is searching for: "${query}"

Find up to 4 relevant Indian government schemes matching this search. Include schemes from 2023, 2024 and 2025 if relevant. Focus on schemes NOT commonly known, or recently launched ones.${inLang}

Respond ONLY with a valid JSON array. No markdown, no explanation, just raw JSON.

Format:
[
  {
    "name": "Full scheme name${lang !== 'en' ? ` in ${langName}` : ''}",
    "nameHindi": "हिन्दी में नाम",
    "category": "one of: Education|Healthcare|Agriculture|Business|Employment|Housing|Social Welfare|Women & Children|Senior Citizens|Financial Inclusion|Skill Development|Rural Development|Environment & Energy",
    "ministry": "Ministry name${lang !== 'en' ? ` in ${langName}` : ''}",
    "launchDate": "YYYY-MM-DD",
    "status": "active",
    "description": "2-3 sentence description${lang !== 'en' ? ` in ${langName}` : ''}",
    "eligibility": ["criterion 1", "criterion 2", "criterion 3"],
    "benefits": ["benefit 1", "benefit 2", "benefit 3"],
    "requiredDocuments": ["doc 1", "doc 2"],
    "applicationProcess": ["step 1", "step 2", "step 3"],
    "officialUrl": "https://..."
  }
]

If no relevant Indian govt schemes match "${query}", return an empty array: []`;

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
        max_tokens: 2000,
      }),
    });

    if (!res.ok) return [];
    const json = await res.json();
    const text = json.choices?.[0]?.message?.content?.trim() ?? '';

    // Extract JSON array from response
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

    toCache(cacheQ, results);
    return results;
  } catch {
    return [];
  }
}
