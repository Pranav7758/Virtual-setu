import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SUPABASE_URL, sbHeaders } from './_shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { documentId, userId, filePath } = req.body;
    if (!documentId || !userId) {
      return res.status(400).json({ error: 'Missing documentId or userId' });
    }

    const base = sbHeaders();
    const write = sbHeaders({ Prefer: 'return=minimal' });

    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/documents?id=eq.${documentId}&user_id=eq.${userId}&select=id`,
      { headers: base }
    );
    const rows = await checkRes.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(403).json({ error: 'Document not found or access denied' });
    }

    const delRes = await fetch(
      `${SUPABASE_URL}/rest/v1/documents?id=eq.${documentId}&user_id=eq.${userId}`,
      { method: 'DELETE', headers: write }
    );
    if (!delRes.ok) {
      const errText = await delRes.text();
      throw new Error(`DB delete failed: ${errText}`);
    }

    if (filePath) {
      await fetch(`${SUPABASE_URL}/storage/v1/object/documents/${filePath}`, {
        method: 'DELETE',
        headers: write,
      }).catch(() => {});
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('delete-document error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
