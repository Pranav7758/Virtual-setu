import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SUPABASE_URL, sbHeaders, hashPin } from './_shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { token, pin } = req.body;
    if (!token) return res.status(400).json({ error: 'Missing token' });

    const selectRes = await fetch(
      `${SUPABASE_URL}/rest/v1/doc_shares?token=eq.${encodeURIComponent(token)}&select=*`,
      { headers: sbHeaders() }
    );
    const rows = await selectRes.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: 'Share link not found or expired' });
    }

    const entry = rows[0];
    if (new Date(entry.expires_at).getTime() < Date.now()) {
      await fetch(
        `${SUPABASE_URL}/rest/v1/doc_shares?token=eq.${encodeURIComponent(token)}`,
        { method: 'DELETE', headers: sbHeaders({ Prefer: 'return=minimal' }) }
      ).catch(() => {});
      return res.status(404).json({ error: 'Share link not found or expired' });
    }

    const pinHash = hashPin(pin || '');
    if (pinHash !== entry.pin_hash) {
      return res.status(403).json({ error: 'Invalid PIN' });
    }

    res.json({
      documentName: entry.document_name,
      documentType: entry.document_type,
      signedUrl: entry.signed_url,
      expiresAt: new Date(entry.expires_at).getTime(),
    });
  } catch (err: any) {
    console.error('get-doc-share error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
