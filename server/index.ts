import express from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json());

/* ── In-memory share store ── */
interface ShareEntry {
  documentId: string; userId: string; pinHash: string;
  documentName: string; documentType: string;
  signedUrl: string; expiresAt: number;
}
const shareStore = new Map<string, ShareEntry>();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of shareStore) { if (v.expiresAt < now) shareStore.delete(k); }
}, 60_000);

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
// SUPABASE_API_KEY is the actual service role key in this project
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!;

const PLAN_PRICES: Record<string, number> = {
  premium: 29900,
  platinum: 59900,
};

async function createRazorpayOrder(amount: number): Promise<any> {
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency: 'INR',
      payment_capture: 1,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.description || 'Failed to create Razorpay order');
  }
  return res.json();
}

async function updateSupabasePlan(userId: string, plan: string, orderId: string, paymentId: string) {
  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  };

  // Update profiles table plan column (works once migration has been run)
  await fetch(`${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ plan }),
  });

  // Also update user metadata so plan is readable before/without DB migration
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_metadata: { plan } }),
  });

  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  // Insert subscription record (works once migration has been run)
  await fetch(`${SUPABASE_URL}/rest/v1/subscriptions`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({
      user_id: userId,
      plan,
      status: 'active',
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      start_date: new Date().toISOString(),
      end_date: endDate.toISOString(),
    }),
  });
}

app.post('/api/create-order', async (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan || !PLAN_PRICES[plan]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    const amount = PLAN_PRICES[plan];
    const order = await createRazorpayOrder(amount);
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: RAZORPAY_KEY_ID });
  } catch (err: any) {
    console.error('create-order error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

app.post('/api/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, userId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    await updateSupabasePlan(userId, plan, razorpay_order_id, razorpay_payment_id);

    res.json({ success: true, plan });
  } catch (err: any) {
    console.error('verify-payment error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

app.post('/api/delete-document', async (req, res) => {
  try {
    const { documentId, userId, filePath } = req.body;
    if (!documentId || !userId) {
      return res.status(400).json({ error: 'Missing documentId or userId' });
    }

    const baseHeaders = {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    };
    // 'Prefer: return=minimal' suppresses row data — only use it for writes
    const writeHeaders = { ...baseHeaders, Prefer: 'return=minimal' };

    // Verify ownership (no Prefer header so rows are actually returned)
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/documents?id=eq.${documentId}&user_id=eq.${userId}&select=id`,
      { headers: baseHeaders }
    );
    const rows = await checkRes.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(403).json({ error: 'Document not found or access denied' });
    }

    const delRes = await fetch(
      `${SUPABASE_URL}/rest/v1/documents?id=eq.${documentId}&user_id=eq.${userId}`,
      { method: 'DELETE', headers: writeHeaders }
    );
    if (!delRes.ok) {
      const err = await delRes.text();
      throw new Error(`DB delete failed: ${err}`);
    }

    // Delete from storage (best-effort)
    if (filePath) {
      await fetch(`${SUPABASE_URL}/storage/v1/object/documents/${filePath}`, {
        method: 'DELETE',
        headers: writeHeaders,
      }).catch(() => {});
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('delete-document error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/* ── Helper: get doc info + signed URL ── */
async function getDocSignedUrl(userId: string, docId: string) {
  const baseHeaders = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
  const docRes = await fetch(
    `${SUPABASE_URL}/rest/v1/documents?id=eq.${docId}&user_id=eq.${userId}&select=document_name,document_type,file_url`,
    { headers: baseHeaders }
  );
  const docs = await docRes.json();
  if (!Array.isArray(docs) || docs.length === 0) return null;
  const doc = docs[0];
  const signRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/sign/documents/${doc.file_url}`,
    { method: 'POST', headers: baseHeaders, body: JSON.stringify({ expiresIn: 86400 * 2 }) }
  );
  const signData = await signRes.json();
  const signedUrl = signData.signedURL
    ? `${SUPABASE_URL}/storage/v1${signData.signedURL}`
    : signData.signedUrl
      ? `${SUPABASE_URL}/storage/v1${signData.signedUrl}`
      : null;
  if (!signedUrl) return null;
  return { name: doc.document_name, type: doc.document_type, url: signedUrl };
}

/* ── POST /api/create-doc-share ── */
app.post('/api/create-doc-share', async (req, res) => {
  try {
    const { documentId, userId, pin, durationHours } = req.body;
    if (!documentId || !userId || !pin || !durationHours) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const docInfo = await getDocSignedUrl(userId, documentId);
    if (!docInfo) return res.status(403).json({ error: 'Document not found or access denied' });

    const token = crypto.randomBytes(24).toString('hex');
    const pinHash = crypto.createHash('sha256').update(String(pin)).digest('hex');
    shareStore.set(token, {
      documentId, userId, pinHash,
      documentName: docInfo.name, documentType: docInfo.type,
      signedUrl: docInfo.url,
      expiresAt: Date.now() + Number(durationHours) * 3_600_000,
    });
    res.json({ token });
  } catch (err: any) {
    console.error('create-doc-share error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/* ── POST /api/get-doc-share ── */
app.post('/api/get-doc-share', async (req, res) => {
  try {
    const { token, pin } = req.body;
    const entry = token ? shareStore.get(token) : null;
    if (!entry || entry.expiresAt < Date.now()) {
      return res.status(404).json({ error: 'Share link not found or expired' });
    }
    const pinHash = crypto.createHash('sha256').update(String(pin || '')).digest('hex');
    if (pinHash !== entry.pinHash) {
      return res.status(403).json({ error: 'Invalid PIN' });
    }
    res.json({
      documentName: entry.documentName,
      documentType: entry.documentType,
      signedUrl: entry.signedUrl,
      expiresAt: entry.expiresAt,
    });
  } catch (err: any) {
    console.error('get-doc-share error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
