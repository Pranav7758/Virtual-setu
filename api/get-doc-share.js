import crypto from 'crypto';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { token, pin } = req.body;
    if (!token) return res.status(400).json({ error: 'Missing token' });

    const h = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };
    const r = await fetch(`${SUPABASE_URL}/rest/v1/doc_shares?token=eq.${encodeURIComponent(token)}&select=*`, { headers: h });
    const rows = await r.json();
    if (!Array.isArray(rows) || rows.length === 0) return res.status(404).json({ error: 'Share link not found or expired' });

    const entry = rows[0];
    if (new Date(entry.expires_at).getTime() < Date.now()) {
      await fetch(`${SUPABASE_URL}/rest/v1/doc_shares?token=eq.${encodeURIComponent(token)}`,
        { method: 'DELETE', headers: { ...h, Prefer: 'return=minimal' } }).catch(() => {});
      return res.status(404).json({ error: 'Share link not found or expired' });
    }

    const pinHash = crypto.createHash('sha256').update(String(pin || '')).digest('hex');
    if (pinHash !== entry.pin_hash) return res.status(403).json({ error: 'Invalid PIN' });

    res.json({ documentName: entry.document_name, documentType: entry.document_type, signedUrl: entry.signed_url, expiresAt: new Date(entry.expires_at).getTime() });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
