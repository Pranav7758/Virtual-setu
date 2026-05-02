import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { SUPABASE_URL, sbHeaders, getDocSignedUrl, hashPin } from './_shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { documentId, userId, pin, durationHours } = req.body;
    if (!documentId || !userId || !pin || !durationHours) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const docInfo = await getDocSignedUrl(userId, documentId);
    if (!docInfo) return res.status(403).json({ error: 'Document not found or access denied' });

    const token = crypto.randomBytes(24).toString('hex');
    const pinHash = hashPin(pin);
    const expiresAt = new Date(Date.now() + Number(durationHours) * 3_600_000).toISOString();

    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/doc_shares`, {
      method: 'POST',
      headers: sbHeaders({ Prefer: 'return=minimal' }),
      body: JSON.stringify({
        token,
        document_id: documentId,
        user_id: userId,
        pin_hash: pinHash,
        document_name: docInfo.name,
        document_type: docInfo.type,
        signed_url: docInfo.url,
        expires_at: expiresAt,
      }),
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      throw new Error(`Failed to create share: ${errText}`);
    }

    res.json({ token });
  } catch (err: any) {
    console.error('create-doc-share error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
