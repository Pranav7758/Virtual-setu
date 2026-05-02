import crypto from 'crypto';

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, userId } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan || !userId)
      return res.status(400).json({ error: 'Missing required fields' });
    const expected = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    if (expected !== razorpay_signature) return res.status(400).json({ error: 'Invalid payment signature' });
    const h = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}`, { method: 'PATCH', headers: h, body: JSON.stringify({ plan }) });
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_metadata: { plan } }),
    });
    const end = new Date(); end.setFullYear(end.getFullYear() + 1);
    await fetch(`${SUPABASE_URL}/rest/v1/subscriptions`, {
      method: 'POST', headers: h,
      body: JSON.stringify({ user_id: userId, plan, status: 'active', razorpay_order_id, razorpay_payment_id, start_date: new Date().toISOString(), end_date: end.toISOString() }),
    });
    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
