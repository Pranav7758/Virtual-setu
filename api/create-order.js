const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const PLAN_PRICES = { premium: 29900, platinum: 59900 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { plan } = req.body;
    if (!plan || !PLAN_PRICES[plan]) return res.status(400).json({ error: 'Invalid plan' });

    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: PLAN_PRICES[plan], currency: 'INR', payment_capture: 1 }),
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error?.description || 'Razorpay error'); }
    const order = await r.json();
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
