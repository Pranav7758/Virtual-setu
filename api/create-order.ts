import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PLAN_PRICES, RAZORPAY_KEY_ID, createRazorpayOrder } from './_shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { plan } = req.body;
    if (!plan || !PLAN_PRICES[plan]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    const order = await createRazorpayOrder(PLAN_PRICES[plan]);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    console.error('create-order error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
