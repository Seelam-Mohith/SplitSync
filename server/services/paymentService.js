import Payment from '../models/Payment.js';
import Group from '../models/Group.js';
import GroupMember from '../models/GroupMember.js';

export const ensureMonthlyPayments = async (groupId) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const group = await Group.findById(groupId).lean();
  if (!group) return [];

  const members = await GroupMember.find({ groupId }).lean();
  if (members.length === 0) return [];

  const dueDate = new Date(year, month - 1, group.dueDay);
  if (dueDate < now) {
    dueDate.setMonth(dueDate.getMonth() + 1);
    dueDate.setDate(group.dueDay);
  }

  for (const m of members) {
    await Payment.findOneAndUpdate(
      { groupId, memberId: m.userId, month, year },
      {
        $setOnInsert: {
          groupId,
          memberId: m.userId,
          month,
          year,
          amount: group.contributionPerMember,
          dueDate,
          status: 'PENDING',
        },
      },
      { upsert: true, new: true, runValidators: true }
    );
  }

  return Payment.find({ groupId, month, year }).lean();
};

export const markMissedPayments = async () => {
  const now = new Date();

  await Payment.updateMany(
    {
      status: 'PENDING',
      dueDate: { $lt: now },
    },
    { $set: { status: 'MISSED' } }
  );
};

export const getDueDate = (group, referenceDate = new Date()) => {
  const due = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    group.dueDay
  );
  if (due < referenceDate) {
    due.setMonth(due.getMonth() + 1);
  }
  return due;
};
