import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SUPABASE_URL, sbHeaders } from './_shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Missing token' });

    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/doc_shares?token=eq.${encodeURIComponent(token)}&select=token`,
      { headers: sbHeaders() }
    );
    const rows = await checkRes.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: 'Share not found' });
    }

    const delRes = await fetch(
      `${SUPABASE_URL}/rest/v1/doc_shares?token=eq.${encodeURIComponent(token)}`,
      { method: 'DELETE', headers: sbHeaders({ Prefer: 'return=minimal' }) }
    );
    if (!delRes.ok) {
      const errText = await delRes.text();
      throw new Error(`Delete failed: ${errText}`);
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('revoke-doc-share error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
