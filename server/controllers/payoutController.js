import crypto from 'crypto';
import Group from '../models/Group.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import GroupMember from '../models/GroupMember.js';
import { ensureMonthlyPayments } from '../services/paymentService.js';

export const createRazorpayOrder = async (req, res, next) => {
  try {
    const razorpay = (await import('../config/razorpay.js')).default;
    const { paymentId } = req.params;

    let payment = await Payment.findById(paymentId)
      .populate('groupId', 'ownerId name')
      .lean();

    if (!payment) {
      const error = new Error('Payment not found');
      error.statusCode = 404;
      throw error;
    }

    if (payment.memberId.toString() !== req.user._id.toString()) {
      const error = new Error('You can only pay your own dues');
      error.statusCode = 403;
      throw error;
    }

    if (payment.status !== 'PENDING') {
      const error = new Error(`Payment cannot be made for status: ${payment.status}`);
      error.statusCode = 400;
      throw error;
    }

    const owner = await User.findById(payment.groupId.ownerId).lean();
    if (!owner?.upiId) {
      const error = new Error('Group owner has not set up UPI for receiving payments');
      error.statusCode = 400;
      throw error;
    }

    const order = await razorpay.orders.create({
      amount: payment.amount * 100,
      currency: 'INR',
      receipt: `pay_${payment._id}`,
      notes: {
        paymentId: payment._id.toString(),
        groupId: payment.groupId._id.toString(),
        groupName: payment.groupId.name,
        month: payment.month.toString(),
        year: payment.year.toString(),
      },
    });

    await Payment.findByIdAndUpdate(paymentId, {
      razorpayOrderId: order.id,
    });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: payment.amount,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        groupName: payment.groupId.name,
        upiId: owner.upiId,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      const error = new Error('Payment verification failed');
      error.statusCode = 400;
      throw error;
    }

    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: 'VERIFIED',
        submittedAt: new Date(),
        verifiedAt: new Date(),
        verifiedBy: req.user._id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      },
      { new: true }
    )
      .populate('memberId', 'name email avatar')
      .populate('verifiedBy', 'name')
      .lean();

    triggerPayout(payment).catch(() => {});

    res.json({ success: true, data: { payment } });
  } catch (error) {
    next(error);
  }
};

const triggerPayout = async (payment) => {
  try {
    const razorpay = (await import('../config/razorpay.js')).default;
    const group = await Group.findById(payment.groupId).lean();
    if (!group) return;

    const owner = await User.findById(group.ownerId).lean();
    if (!owner?.upiId) return;

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

    await Payment.findByIdAndUpdate(payment._id, {
      payoutId: payout.id,
      payoutStatus: payout.status === 'processed' ? 'COMPLETED' : 'INITIATED',
    });
  } catch (err) {
    console.error('Payout failed:', err.message);
    await Payment.findByIdAndUpdate(payment._id, {
      payoutStatus: 'FAILED',
    }).catch(() => {});
  }
};
