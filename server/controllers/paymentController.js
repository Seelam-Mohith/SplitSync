import Payment from '../models/Payment.js';
import Group from '../models/Group.js';
import GroupMember from '../models/GroupMember.js';
import {
  ensureMonthlyPayments,
  markMissedPayments,
} from '../services/paymentService.js';

export const getMyPayments = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const membership = await GroupMember.findOne({
      groupId,
      userId: req.user._id,
    });
    if (!membership) {
      const error = new Error('You are not a member of this group');
      error.statusCode = 403;
      throw error;
    }

    await markMissedPayments();
    await ensureMonthlyPayments(groupId);

    if (membership.role === 'OWNER') {
      const payments = await Payment.find({ groupId })
        .populate('memberId', 'name email avatar')
        .populate('verifiedBy', 'name')
        .sort({ year: -1, month: -1 })
        .lean();

      return res.json({ success: true, data: { payments } });
    }

    const payments = await Payment.find({ groupId, memberId: req.user._id })
      .populate('verifiedBy', 'name')
      .sort({ year: -1, month: -1 })
      .lean();

    res.json({ success: true, data: { payments } });
  } catch (error) {
    next(error);
  }
};

export const getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate('memberId', 'name email avatar')
      .populate('verifiedBy', 'name')
      .populate('groupId', 'ownerId')
      .lean();

    if (!payment) {
      const error = new Error('Payment not found');
      error.statusCode = 404;
      throw error;
    }

    const isMember =
      payment.memberId._id.toString() === req.user._id.toString();
    const isOwner =
      payment.groupId.ownerId.toString() === req.user._id.toString();

    if (!isMember && !isOwner) {
      const error = new Error('Not authorized');
      error.statusCode = 403;
      throw error;
    }

    res.json({ success: true, data: { payment } });
  } catch (error) {
    next(error);
  }
};

export const submitPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      const error = new Error('Payment not found');
      error.statusCode = 404;
      throw error;
    }

    if (payment.memberId.toString() !== req.user._id.toString()) {
      const error = new Error('You can only submit your own payment');
      error.statusCode = 403;
      throw error;
    }

    if (payment.status !== 'PENDING') {
      const error = new Error(
        `Cannot submit payment with status: ${payment.status}`
      );
      error.statusCode = 400;
      throw error;
    }

    payment.status = 'SUBMITTED';
    payment.submittedAt = new Date();
    await payment.save();

    const populated = await Payment.findById(payment._id)
      .populate('memberId', 'name email avatar')
      .populate('verifiedBy', 'name')
      .lean();

    res.json({ success: true, data: { payment: populated } });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { remarks } = req.body;

    const payment = await Payment.findById(paymentId)
      .populate('groupId', 'ownerId')
      .lean();

    if (!payment) {
      const error = new Error('Payment not found');
      error.statusCode = 404;
      throw error;
    }

    if (payment.groupId.ownerId.toString() !== req.user._id.toString()) {
      const error = new Error('Only the group owner can verify payments');
      error.statusCode = 403;
      throw error;
    }

    if (payment.status !== 'SUBMITTED') {
      const error = new Error(
        `Cannot verify payment with status: ${payment.status}`
      );
      error.statusCode = 400;
      throw error;
    }

    const updated = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedBy: req.user._id,
        ...(remarks !== undefined && { remarks }),
      },
      { new: true, runValidators: true }
    )
      .populate('memberId', 'name email avatar')
      .populate('verifiedBy', 'name')
      .lean();

    res.json({ success: true, data: { payment: updated } });
  } catch (error) {
    next(error);
  }
};

export const rejectPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { remarks } = req.body;

    const payment = await Payment.findById(paymentId)
      .populate('groupId', 'ownerId')
      .lean();

    if (!payment) {
      const error = new Error('Payment not found');
      error.statusCode = 404;
      throw error;
    }

    if (payment.groupId.ownerId.toString() !== req.user._id.toString()) {
      const error = new Error('Only the group owner can reject payments');
      error.statusCode = 403;
      throw error;
    }

    if (payment.status !== 'SUBMITTED') {
      const error = new Error(
        `Cannot reject payment with status: ${payment.status}`
      );
      error.statusCode = 400;
      throw error;
    }

    const updated = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: 'PENDING',
        submittedAt: null,
        ...(remarks !== undefined && { remarks }),
      },
      { new: true, runValidators: true }
    )
      .populate('memberId', 'name email avatar')
      .populate('verifiedBy', 'name')
      .lean();

    res.json({ success: true, data: { payment: updated } });
  } catch (error) {
    next(error);
  }
};

export const updatePayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { status, amount, dueDate, remarks } = req.body;

    const payment = await Payment.findById(paymentId)
      .populate('groupId', 'ownerId');

    if (!payment) {
      const error = new Error('Payment not found');
      error.statusCode = 404;
      throw error;
    }

    if (payment.groupId.ownerId.toString() !== req.user._id.toString()) {
      const error = new Error('Only the group owner can edit payments');
      error.statusCode = 403;
      throw error;
    }

    const allowedStatuses = ['PENDING', 'SUBMITTED', 'VERIFIED', 'MISSED'];
    if (status && !allowedStatuses.includes(status)) {
      const error = new Error(`Invalid status: ${status}`);
      error.statusCode = 400;
      throw error;
    }

    if (status) payment.status = status;
    if (amount !== undefined) payment.amount = amount;
    if (dueDate) payment.dueDate = new Date(dueDate);
    if (remarks !== undefined) payment.remarks = remarks;

    if (status === 'VERIFIED' && !payment.verifiedAt) {
      payment.verifiedAt = new Date();
      payment.verifiedBy = req.user._id;
    }

    if (status === 'SUBMITTED' && !payment.submittedAt) {
      payment.submittedAt = new Date();
    }

    if (status === 'PENDING') {
      payment.submittedAt = null;
      payment.verifiedAt = null;
      payment.verifiedBy = null;
    }

    await payment.save();

    const populated = await Payment.findById(payment._id)
      .populate('memberId', 'name email avatar')
      .populate('verifiedBy', 'name')
      .lean();

    res.json({ success: true, data: { payment: populated } });
  } catch (error) {
    next(error);
  }
};

export const getPaymentDashboard = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const group = await Group.findById(groupId).lean();
    if (!group) {
      const error = new Error('Group not found');
      error.statusCode = 404;
      throw error;
    }

    await ensureMonthlyPayments(groupId);

    const payments = await Payment.find({ groupId, month, year })
      .populate('memberId', 'name email avatar')
      .lean();

    const allPayments = await Payment.find({ groupId })
      .populate('memberId', 'name email avatar')
      .lean();

    const totalMembers = await GroupMember.countDocuments({
      groupId,
      userId: { $ne: group.ownerId },
    });

    const stats = {
      collected: 0,
      remaining: 0,
      totalExpected: totalMembers * group.contributionPerMember,
      paidCount: 0,
      pendingCount: 0,
      submittedCount: 0,
      missedCount: 0,
      totalMembers,
      contributionPerMember: group.contributionPerMember,
      month,
      year,
    };

    payments.forEach((p) => {
      if (p.memberId._id.toString() === group.ownerId.toString()) return;
      if (p.status === 'VERIFIED') {
        stats.collected += p.amount;
        stats.paidCount++;
      } else if (p.status === 'SUBMITTED') {
        stats.submittedCount++;
      } else if (p.status === 'MISSED') {
        stats.missedCount++;
      } else {
        stats.pendingCount++;
      }
    });

    stats.remaining = Math.max(0, stats.totalExpected - stats.collected);
    stats.percentage =
      stats.totalExpected > 0
        ? Math.round((stats.collected / stats.totalExpected) * 100)
        : 0;

    const monthlyHistory = {};
    allPayments.forEach((p) => {
      const key = `${p.year}-${String(p.month).padStart(2, '0')}`;
      if (!monthlyHistory[key]) {
        monthlyHistory[key] = {
          month: p.month,
          year: p.year,
          payments: [],
        };
      }
      monthlyHistory[key].payments.push(p);
    });

    const history = Object.values(monthlyHistory).sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });

    res.json({
      success: true,
      data: { stats, payments, history },
    });
  } catch (error) {
    next(error);
  }
};
