const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { documentId, userId, filePath } = req.body;
    if (!documentId || !userId) return res.status(400).json({ error: 'Missing documentId or userId' });
    const base = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };
    const write = { ...base, Prefer: 'return=minimal' };
    const check = await fetch(`${SUPABASE_URL}/rest/v1/documents?id=eq.${documentId}&user_id=eq.${userId}&select=id`, { headers: base });
    const rows = await check.json();
    if (!Array.isArray(rows) || rows.length === 0) return res.status(403).json({ error: 'Document not found or access denied' });
    const del = await fetch(`${SUPABASE_URL}/rest/v1/documents?id=eq.${documentId}&user_id=eq.${userId}`, { method: 'DELETE', headers: write });
    if (!del.ok) throw new Error(`DB delete failed: ${await del.text()}`);
    if (filePath) await fetch(`${SUPABASE_URL}/storage/v1/object/documents/${filePath}`, { method: 'DELETE', headers: write }).catch(() => {});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
