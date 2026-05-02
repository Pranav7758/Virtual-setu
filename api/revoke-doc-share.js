const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Missing token' });

    const h = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };
    const check = await fetch(`${SUPABASE_URL}/rest/v1/doc_shares?token=eq.${encodeURIComponent(token)}&select=token`, { headers: h });
    const rows = await check.json();
    if (!Array.isArray(rows) || rows.length === 0) return res.status(404).json({ error: 'Share not found' });

    const del = await fetch(`${SUPABASE_URL}/rest/v1/doc_shares?token=eq.${encodeURIComponent(token)}`,
      { method: 'DELETE', headers: { ...h, Prefer: 'return=minimal' } });
    if (!del.ok) throw new Error(`Delete failed: ${await del.text()}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
