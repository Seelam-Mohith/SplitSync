import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'Group reference is required'],
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Member reference is required'],
    },
    month: {
      type: Number,
      required: [true, 'Month is required'],
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'SUBMITTED', 'VERIFIED', 'MISSED'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'PENDING',
    },
    submittedAt: {
      type: Date,
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

paymentSchema.index({ groupId: 1, memberId: 1, month: 1, year: 1 }, { unique: true });
paymentSchema.index({ groupId: 1, status: 1 });
paymentSchema.index({ memberId: 1, groupId: 1 });
paymentSchema.index({ groupId: 1, month: 1, year: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
