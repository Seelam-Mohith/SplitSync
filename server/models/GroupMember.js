import mongoose from 'mongoose';

const groupMemberSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'Group reference is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    role: {
      type: String,
      enum: {
        values: ['OWNER', 'MEMBER'],
        message: '{VALUE} is not a valid group role',
      },
      default: 'MEMBER',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

groupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });
groupMemberSchema.index({ userId: 1 });
groupMemberSchema.index(
  { groupId: 1, role: 1 },
  {
    unique: true,
    partialFilterExpression: { role: 'OWNER' },
  }
);

const GroupMember = mongoose.model('GroupMember', groupMemberSchema);

export default GroupMember;
