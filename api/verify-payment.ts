import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { RAZORPAY_KEY_SECRET, updateSupabasePlan } from './_shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      userId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
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
}
