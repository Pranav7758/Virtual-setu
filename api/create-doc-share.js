const crypto = require('crypto');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getDocSignedUrl(userId, docId) {
  const h = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };
  const r = await fetch(`${SUPABASE_URL}/rest/v1/documents?id=eq.${docId}&user_id=eq.${userId}&select=document_name,document_type,file_url`, { headers: h });
  const docs = await r.json();
  if (!Array.isArray(docs) || docs.length === 0) return null;
  const doc = docs[0];
  const sr = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/documents/${doc.file_url}`,
    { method: 'POST', headers: h, body: JSON.stringify({ expiresIn: 86400 * 2 }) });
  const sd = await sr.json();
  const signedUrl = sd.signedURL ? `${SUPABASE_URL}/storage/v1${sd.signedURL}` : sd.signedUrl ? `${SUPABASE_URL}/storage/v1${sd.signedUrl}` : null;
  if (!signedUrl) return null;
  return { name: doc.document_name, type: doc.document_type, url: signedUrl };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { documentId, userId, pin, durationHours } = req.body;
    if (!documentId || !userId || !pin || !durationHours) return res.status(400).json({ error: 'Missing required fields' });
    const docInfo = await getDocSignedUrl(userId, documentId);
    if (!docInfo) return res.status(403).json({ error: 'Document not found or access denied' });
    const token = crypto.randomBytes(24).toString('hex');
    const pinHash = crypto.createHash('sha256').update(String(pin)).digest('hex');
    const expiresAt = new Date(Date.now() + Number(durationHours) * 3600000).toISOString();
    const h = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
    const ins = await fetch(`${SUPABASE_URL}/rest/v1/doc_shares`, {
      method: 'POST', headers: h,
      body: JSON.stringify({ token, document_id: documentId, user_id: userId, pin_hash: pinHash, document_name: docInfo.name, document_type: docInfo.type, signed_url: docInfo.url, expires_at: expiresAt }),
    });
    if (!ins.ok) throw new Error(`Failed to create share: ${await ins.text()}`);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
