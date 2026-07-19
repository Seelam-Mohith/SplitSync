import mongoose from 'mongoose';

const fcmTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    platform: {
      type: String,
      enum: ['web'],
      default: 'web',
    },
  },
  { timestamps: true }
);

fcmTokenSchema.index({ userId: 1, token: 1 }, { unique: true });
fcmTokenSchema.index({ userId: 1 });

const FcmToken = mongoose.model('FcmToken', fcmTokenSchema);

export default FcmToken;
