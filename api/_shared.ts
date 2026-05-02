import crypto from 'crypto';

export const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
export const SUPABASE_SERVICE_ROLE_KEY = (
  process.env.SUPABASE_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
)!;
export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!;
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

export const PLAN_PRICES: Record<string, number> = {
  premium: 29900,
  platinum: 59900,
};

export function sbHeaders(extra?: Record<string, string>) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

export async function createRazorpayOrder(amount: number) {
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, currency: 'INR', payment_capture: 1 }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.description || 'Failed to create Razorpay order');
  }
  return res.json();
}

export async function updateSupabasePlan(
  userId: string,
  plan: string,
  orderId: string,
  paymentId: string
) {
  const headers = sbHeaders({ Prefer: 'return=minimal' });

  await fetch(`${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ plan }),
  });

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

  await fetch(`${SUPABASE_URL}/rest/v1/subscriptions`, {
    method: 'POST',
    headers,
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

export async function getDocSignedUrl(userId: string, docId: string) {
  const docRes = await fetch(
    `${SUPABASE_URL}/rest/v1/documents?id=eq.${docId}&user_id=eq.${userId}&select=document_name,document_type,file_url`,
    { headers: sbHeaders() }
  );
  const docs = await docRes.json();
  if (!Array.isArray(docs) || docs.length === 0) return null;
  const doc = docs[0];

  const signRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/sign/documents/${doc.file_url}`,
    {
      method: 'POST',
      headers: sbHeaders(),
      body: JSON.stringify({ expiresIn: 86400 * 2 }),
    }
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

export function hashPin(pin: string) {
  return crypto.createHash('sha256').update(String(pin)).digest('hex');
}
