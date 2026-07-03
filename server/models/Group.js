import mongoose from 'mongoose';
import crypto from 'crypto';

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      minlength: [2, 'Group name must be at least 2 characters'],
      maxlength: [60, 'Group name cannot exceed 60 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
      default: '',
    },
    subscriptionType: {
      type: String,
      required: [true, 'Subscription type is required'],
      lowercase: true,
      trim: true,
      enum: {
        values: [
          'netflix',
          'spotify',
          'youtube',
          'jiohotstar',
          'hbo',
          'amazon',
          'apple',
          'other',
        ],
        message: '{VALUE} is not a supported subscription type',
      },
    },
    monthlyCost: {
      type: Number,
      required: [true, 'Monthly cost is required'],
      min: [0, 'Monthly cost cannot be negative'],
    },
    contributionPerMember: {
      type: Number,
      required: [true, 'Contribution per member is required'],
      min: [0, 'Contribution cannot be negative'],
    },
    maxMembers: {
      type: Number,
      required: [true, 'Maximum members is required'],
      min: [1, 'Group must allow at least 1 member'],
      max: [100, 'Maximum members cannot exceed 100'],
    },
    dueDay: {
      type: Number,
      required: [true, 'Due day is required'],
      min: [1, 'Due day must be between 1 and 28'],
      max: [28, 'Due day must be between 1 and 28'],
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Group owner is required'],
      index: true,
    },
    inviteCode: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

groupSchema.index({ name: 'text', description: 'text' });

groupSchema.pre('validate', function (next) {
  if (!this.inviteCode) {
    this.inviteCode = crypto.randomBytes(4).toString('hex');
  }
  next();
});

groupSchema.pre('save', function (next) {
  if (this.isModified('ownerId')) {
    this.inviteCode = undefined;
    this.inviteCode = crypto.randomBytes(4).toString('hex');
  }
  next();
});

const Group = mongoose.model('Group', groupSchema);

export default Group;
