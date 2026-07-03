import Group from '../models/Group.js';
import GroupMember from '../models/GroupMember.js';

export const getGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('ownerId', 'name email avatar')
      .lean();

    if (!group) {
      const error = new Error('Group not found');
      error.statusCode = 404;
      throw error;
    }

    const membership = await GroupMember.findOne({
      groupId: group._id,
      userId: req.user._id,
    });

    if (!membership) {
      const error = new Error('You are not a member of this group');
      error.statusCode = 403;
      throw error;
    }

    const memberCount = await GroupMember.countDocuments({ groupId: group._id });
    const members = await GroupMember.find({ groupId: group._id })
      .populate('userId', 'name email avatar')
      .lean();

    res.json({
      success: true,
      data: {
        group: { ...group, role: membership.role, memberCount, members },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateGroup = async (req, res, next) => {
  try {
    const allowed = ['name', 'description', 'monthlyCost', 'contributionPerMember', 'maxMembers', 'dueDay'];
    const updates = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const group = await Group.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('ownerId', 'name email avatar')
      .lean();

    if (!group) {
      const error = new Error('Group not found');
      error.statusCode = 404;
      throw error;
    }

    res.json({ success: true, data: { group } });
  } catch (error) {
    next(error);
  }
};

export const deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);

    if (!group) {
      const error = new Error('Group not found');
      error.statusCode = 404;
      throw error;
    }

    await GroupMember.deleteMany({ groupId: group._id });

    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const target = await GroupMember.findOne({
      groupId: req.params.id,
      userId,
    });

    if (!target) {
      const error = new Error('Member not found in this group');
      error.statusCode = 404;
      throw error;
    }

    if (target.role === 'OWNER') {
      const error = new Error('Cannot remove the group owner');
      error.statusCode = 400;
      throw error;
    }

    await GroupMember.findByIdAndDelete(target._id);

    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

export const transferOwnership = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      const error = new Error('Target userId is required');
      error.statusCode = 400;
      throw error;
    }

    if (userId === req.user._id.toString()) {
      const error = new Error('You are already the owner');
      error.statusCode = 400;
      throw error;
    }

    const target = await GroupMember.findOne({
      groupId: req.params.id,
      userId,
    });

    if (!target) {
      const error = new Error('Target user is not a member of this group');
      error.statusCode = 404;
      throw error;
    }

    await GroupMember.findOneAndUpdate(
      { groupId: req.params.id, userId: req.user._id },
      { role: 'MEMBER' }
    );

    await GroupMember.findOneAndUpdate(
      { groupId: req.params.id, userId },
      { role: 'OWNER' }
    );

    await Group.findByIdAndUpdate(req.params.id, { ownerId: userId });

    const group = await Group.findById(req.params.id)
      .populate('ownerId', 'name email avatar')
      .lean();

    const memberCount = await GroupMember.countDocuments({ groupId: group._id });
    const members = await GroupMember.find({ groupId: group._id })
      .populate('userId', 'name email avatar')
      .lean();

    res.json({
      success: true,
      data: { group: { ...group, role: 'MEMBER', memberCount, members } },
    });
  } catch (error) {
    next(error);
  }
};

export const joinGroup = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      const error = new Error('Invite code is required');
      error.statusCode = 400;
      throw error;
    }

    const group = await Group.findOne({ inviteCode: inviteCode.toLowerCase() });

    if (!group) {
      const error = new Error('Invalid invite code');
      error.statusCode = 404;
      throw error;
    }

    const existing = await GroupMember.findOne({
      groupId: group._id,
      userId: req.user._id,
    });

    if (existing) {
      const error = new Error('You are already a member of this group');
      error.statusCode = 409;
      throw error;
    }

    const memberCount = await GroupMember.countDocuments({
      groupId: group._id,
    });

    if (memberCount >= group.maxMembers) {
      const error = new Error('Group is full');
      error.statusCode = 400;
      throw error;
    }

    await GroupMember.create({
      groupId: group._id,
      userId: req.user._id,
      role: 'MEMBER',
    });

    const populated = await Group.findById(group._id)
      .populate('ownerId', 'name email avatar')
      .lean();

    res.status(200).json({
      success: true,
      data: { group: { ...populated, role: 'MEMBER', memberCount: memberCount + 1 } },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyGroups = async (req, res, next) => {
  try {
    const memberships = await GroupMember.find({ userId: req.user._id })
      .populate({
        path: 'groupId',
        select:
          'name description subscriptionType monthlyCost contributionPerMember maxMembers dueDay inviteCode ownerId',
        populate: { path: 'ownerId', select: 'name email avatar' },
      })
      .lean();

    const groups = await Promise.all(
      memberships.map(async (m) => {
        const group = m.groupId;
        if (!group) return null;
        const memberCount = await GroupMember.countDocuments({
          groupId: group._id,
        });
        return { ...group, role: m.role, memberCount };
      })
    );

    const filtered = groups.filter(Boolean);

    res.json({
      success: true,
      data: { groups: filtered },
    });
  } catch (error) {
    next(error);
  }
};

export const createGroup = async (req, res, next) => {
  try {
    const {
      name,
      description,
      subscriptionType,
      monthlyCost,
      contributionPerMember,
      maxMembers,
      dueDay,
    } = req.body;

    if (!name || monthlyCost === undefined || !dueDay || !maxMembers) {
      const error = new Error(
        'Name, monthly cost, due day, and max members are required'
      );
      error.statusCode = 400;
      throw error;
    }

    const group = await Group.create({
      name,
      description,
      subscriptionType,
      monthlyCost,
      contributionPerMember,
      maxMembers,
      dueDay,
      ownerId: req.user._id,
    });

    await GroupMember.create({
      groupId: group._id,
      userId: req.user._id,
      role: 'OWNER',
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('ownerId', 'name email avatar')
      .lean();

    res.status(201).json({
      success: true,
      data: {
        group: populatedGroup,
      },
    });
  } catch (error) {
    next(error);
  }
};
