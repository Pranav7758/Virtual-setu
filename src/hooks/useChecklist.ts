import { useState, useCallback } from 'react';
import { getChecklist, ChecklistData, RequiredDocument } from '@/lib/checklistService';

export type ChecklistStatus = 'idle' | 'loading' | 'success' | 'error';

export interface EnrichedDocument extends RequiredDocument {
  status: 'available' | 'missing';
}

export interface EnrichedChecklist extends Omit<ChecklistData, 'requiredDocuments'> {
  requiredDocuments: EnrichedDocument[];
}

interface UserDocument {
  document_type: string;
  document_name: string;
}

// Known specific document types — "other" is excluded intentionally
const KNOWN_TYPES = new Set([
  'aadhaar', 'pan_card', 'birth_certificate', 'voter_id',
  'driving_license', 'passport', 'income_certificate',
  'caste_certificate', 'domicile_certificate',
]);

const TYPE_KEYWORDS: Record<string, string[]> = {
  aadhaar: ['aadhar', 'aadhaar', 'uid'],
  pan_card: ['pan', 'pan card', 'pancard'],
  birth_certificate: ['birth', '10th', 'ssc', 'class 10'],
  voter_id: ['voter', 'epic', 'voter id'],
  driving_license: ['driving', 'licence', 'license', ' dl '],
  passport: ['passport'],
  income_certificate: ['income', 'salary', 'itr', 'form 16'],
  caste_certificate: ['caste', 'sc cert', 'st cert', 'obc cert'],
  domicile_certificate: ['domicile', 'residence', 'address proof'],
};

function docMatchesRequirement(doc: UserDocument, req: RequiredDocument): boolean {
  const dt = doc.document_type.toLowerCase().trim();
  const rt = (req.document_type ?? '').toLowerCase().trim();
  const dn = ` ${doc.document_name.toLowerCase()} `;
  const rn = req.name.toLowerCase();

  // For known specific types: match if the uploaded doc's type equals the required type
  if (KNOWN_TYPES.has(rt)) {
    if (dt === rt) return true;
    // Also allow name-based fallback for known types (e.g. user named it "My Aadhaar")
    const kws = TYPE_KEYWORDS[rt] ?? [];
    return kws.some((kw) => dn.includes(kw) || dt.includes(kw));
  }

  // For "other" type requirements: NEVER match just because both are "other".
  // Instead require the document name to contain keywords from the requirement name.
  if (rt === 'other') {
    // Build keywords from the requirement name words (length > 3)
    const nameKeywords = rn.split(/\s+/).filter((w) => w.length > 3);
    return nameKeywords.some((kw) => dn.includes(kw));
  }

  return false;
}

function compareWithUserDocs(
  required: RequiredDocument[],
  userDocs: UserDocument[]
): EnrichedDocument[] {
  return required.map((req) => {
    const available = userDocs.some((doc) => docMatchesRequirement(doc, req));
    return { ...req, status: available ? 'available' : 'missing' };
  });
}

export function useChecklist() {
  const [status, setStatus] = useState<ChecklistStatus>('idle');
  const [data, setData] = useState<EnrichedChecklist | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(
    async (
      purposeId: string,
      purposeLabel: string,
      userDocs: UserDocument[],
      forceRefresh = false
    ) => {
      setStatus('loading');
      setError(null);
      try {
        const result = await getChecklist(purposeId, purposeLabel, forceRefresh);
        const enriched: EnrichedChecklist = {
          ...result,
          requiredDocuments: compareWithUserDocs(result.requiredDocuments, userDocs),
        };
        setData(enriched);
        setStatus('success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to generate checklist.';
        setError(msg);
        setStatus('error');
      }
    },
    []
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setData(null);
    setError(null);
  }, []);

  return { status, data, error, fetch, reset };
}
