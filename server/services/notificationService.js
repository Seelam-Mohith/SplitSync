import { messaging } from '../config/firebase.js';
import FcmToken from '../models/FcmToken.js';
import Payment from '../models/Payment.js';
import Group from '../models/Group.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getReminderTitle(daysUntilDue, amount, groupName) {
  if (daysUntilDue === 3) {
    return { title: 'Payment Reminder', body: `₹${amount} due in 3 days for ${groupName}` };
  }
  if (daysUntilDue === 2) {
    return { title: 'Payment Reminder', body: `₹${amount} due in 2 days for ${groupName}` };
  }
  if (daysUntilDue === 1) {
    return { title: 'Payment Reminder', body: `₹${amount} due tomorrow for ${groupName}` };
  }
  if (daysUntilDue === 0) {
    return { title: 'Payment Due Today', body: `₹${amount} is due today for ${groupName}` };
  }
  if (daysUntilDue === -1) {
    return { title: 'Payment Overdue', body: `Deadline missed! ₹${amount} for ${groupName} was due yesterday` };
  }
  if (daysUntilDue >= -3) {
    return {
      title: 'Payment Overdue',
      body: `Deadline missed! ₹${amount} for ${groupName} is ${Math.abs(daysUntilDue)} days overdue`,
    };
  }
  return null;
}

export async function checkAndSendReminders() {
  if (!messaging) return { sent: 0, checked: 0 };

  const now = new Date();

  const pendingPayments = await Payment.find({ status: 'PENDING' })
    .populate('groupId', 'name')
    .populate('memberId', 'name')
    .lean();

  let sent = 0;

  for (const payment of pendingPayments) {
    if (!payment.groupId || !payment.memberId) continue;

    const daysUntilDue = Math.ceil((new Date(payment.dueDate) - now) / MS_PER_DAY);
    const msg = getReminderTitle(daysUntilDue, payment.amount, payment.groupId.name);
    if (!msg) continue;

    const tokens = await FcmToken.find({ userId: payment.memberId._id }).lean();
    if (tokens.length === 0) continue;

    const fcmTokens = tokens.map((t) => t.token);

    const message = {
      notification: { title: msg.title, body: msg.body },
      data: {
        groupId: payment.groupId._id.toString(),
        paymentId: payment._id.toString(),
        url: `/groups/${payment.groupId._id}/payments`,
      },
    };

    const result = await messaging.sendEachForMulticast({
      ...message,
      tokens: fcmTokens,
    });

    sent += result.successCount;

    if (result.failureCount > 0) {
      const failedTokens = [];
      result.responses.forEach((resp, idx) => {
        if (!resp.success) {
          if (
            resp.error?.code === 'messaging/invalid-registration-token' ||
            resp.error?.code === 'messaging/registration-token-not-registered'
          ) {
            failedTokens.push(fcmTokens[idx]);
          }
        }
      });
      if (failedTokens.length > 0) {
        await FcmToken.deleteMany({ token: { $in: failedTokens } });
      }
    }
  }

  return { sent, checked: pendingPayments.length };
}

export async function sendPushToUser(userId, title, body, data = {}) {
  if (!messaging) return 0;

  const tokens = await FcmToken.find({ userId }).lean();
  if (tokens.length === 0) return 0;

  const message = {
    notification: { title, body },
    data,
    tokens: tokens.map((t) => t.token),
  };

  const result = await messaging.sendEachForMulticast(message);

  if (result.failureCount > 0) {
    const failedTokens = [];
    result.responses.forEach((resp, idx) => {
      if (!resp.success) {
        if (
          resp.error?.code === 'messaging/invalid-registration-token' ||
          resp.error?.code === 'messaging/registration-token-not-registered'
        ) {
          failedTokens.push(message.tokens[idx]);
        }
      }
    });
    if (failedTokens.length > 0) {
      await FcmToken.deleteMany({ token: { $in: failedTokens } });
    }
  }

  return result.successCount;
}
