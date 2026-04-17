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

function compareWithUserDocs(
  required: RequiredDocument[],
  userDocs: UserDocument[]
): EnrichedDocument[] {
  return required.map((req) => {
    const available = userDocs.some((doc) => {
      const dt = doc.document_type.toLowerCase();
      const rt = (req.document_type ?? '').toLowerCase();
      const rn = req.name.toLowerCase();
      const dn = doc.document_name.toLowerCase();

      if (dt === rt) return true;
      if (dt.includes(rt) || rt.includes(dt)) return true;

      const keywords: Record<string, string[]> = {
        aadhaar: ['aadhar', 'aadhaar', 'uid'],
        pan_card: ['pan', 'pan card'],
        birth_certificate: ['birth', '10th', 'ssc'],
        voter_id: ['voter', 'epic'],
        driving_license: ['driving', 'dl', 'license'],
        passport: ['passport'],
        income_certificate: ['income', 'salary', 'itr'],
        caste_certificate: ['caste', 'sc', 'st', 'obc'],
        domicile_certificate: ['domicile', 'residence'],
      };
      const kws = keywords[rt] ?? rn.split(' ').filter((w) => w.length > 3);
      return kws.some((kw) => dn.includes(kw) || dt.includes(kw));
    });
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
