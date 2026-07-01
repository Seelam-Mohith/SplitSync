import Group from '../models/Group.js';
import GroupMember from '../models/GroupMember.js';

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
