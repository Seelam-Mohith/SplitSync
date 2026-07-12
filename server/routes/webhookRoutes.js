import crypto from 'crypto';
import { Router } from 'express';
import Payment from '../models/Payment.js';
import Group from '../models/Group.js';
import User from '../models/User.js';

const router = Router();

router.post('/razorpay', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured') {
      const paymentEntity = payload.payment.entity;
      const notes = paymentEntity.notes || {};
      const paymentId = notes.paymentId;

      if (paymentId) {
        const payment = await Payment.findById(paymentId)
          .populate('groupId', 'ownerId')
          .lean();

        if (payment && payment.status !== 'VERIFIED') {
          await Payment.findByIdAndUpdate(paymentId, {
            status: 'VERIFIED',
            submittedAt: new Date(),
            verifiedAt: new Date(),
            razorpayPaymentId: paymentEntity.id,
          });

          const group = await Group.findById(payment.groupId._id).lean();
          if (group) {
            const owner = await User.findById(group.ownerId).lean();
            if (owner?.upiId) {
              try {
                const razorpay = (await import('../config/razorpay.js')).default;
                const payout = await razorpay.payouts.create({
                  account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
                  fund_account_id: owner.upiId,
                  amount: payment.amount * 100,
                  currency: 'INR',
                  mode: 'UPI',
                  purpose: 'payout',
                  reference_id: `pay_${payment._id}`,
                  narration: `Payout for ${payment.month}/${payment.year}`,
                });

                await Payment.findByIdAndUpdate(paymentId, {
                  payoutId: payout.id,
                  payoutStatus: payout.status === 'processed' ? 'COMPLETED' : 'INITIATED',
                });
              } catch (payoutErr) {
                console.error('Webhook payout failed:', payoutErr.message);
                await Payment.findByIdAndUpdate(paymentId, {
                  payoutStatus: 'FAILED',
                }).catch(() => {});
              }
            }
          }
        }
      }
    }

    if (event === 'payout.processed') {
      const payoutEntity = payload.payout.entity;
      if (payoutEntity.reference_id) {
        const paymentId = payoutEntity.reference_id.replace('pay_', '');
        await Payment.findByIdAndUpdate(paymentId, {
          payoutStatus: 'COMPLETED',
        }).catch(() => {});
      }
    }

    if (event === 'payout.failed') {
      const payoutEntity = payload.payout.entity;
      if (payoutEntity.reference_id) {
        const paymentId = payoutEntity.reference_id.replace('pay_', '');
        await Payment.findByIdAndUpdate(paymentId, {
          payoutStatus: 'FAILED',
        }).catch(() => {});
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.json({ success: true });
  }
});

export default router;
