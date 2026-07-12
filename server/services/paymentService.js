import Payment from '../models/Payment.js';
import Group from '../models/Group.js';
import GroupMember from '../models/GroupMember.js';

export const ensureMonthlyPayments = async (groupId) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const existing = await Payment.find({
    groupId,
    month,
    year,
  }).lean();

  const group = await Group.findById(groupId).lean();
  if (!group) return existing;

  const ownerHasRecord = existing.some(
    (p) => p.memberId.toString() === group.ownerId.toString()
  );

  if (existing.length > 0 && ownerHasRecord) return existing;

  if (existing.length > 0 && !ownerHasRecord) {
    const dueDate = new Date(year, month - 1, group.dueDay);
    if (dueDate < now) {
      dueDate.setMonth(dueDate.getMonth() + 1);
      dueDate.setDate(group.dueDay);
    }
    await Payment.create({
      groupId,
      memberId: group.ownerId,
      month,
      year,
      amount: group.contributionPerMember,
      dueDate,
      status: 'PENDING',
    }).catch(() => {});
    return Payment.find({ groupId, month, year }).lean();
  }

  const members = await GroupMember.find({
    groupId,
  }).lean();

  if (members.length === 0) return [];

  const dueDate = new Date(year, month - 1, group.dueDay);
  if (dueDate < now) {
    dueDate.setMonth(dueDate.getMonth() + 1);
    dueDate.setDate(group.dueDay);
  }

  const records = members.map((m) => ({
    groupId,
    memberId: m.userId,
    month,
    year,
    amount: group.contributionPerMember,
    dueDate,
    status: 'PENDING',
  }));

  const created = await Payment.insertMany(records, { ordered: false }).catch(
    () => []
  );

  return created.length > 0 ? created : existing;
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
