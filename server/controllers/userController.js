import User from '../models/User.js';

export const updateProfile = async (req, res, next) => {
  try {
    const { upiId, phone } = req.body;
    const updates = {};

    if (upiId !== undefined) {
      const upiRegex = /^[\w.\-]+@[\w]+$/;
      if (upiId && !upiRegex.test(upiId)) {
        const error = new Error('Invalid UPI ID format (e.g. name@upi)');
        error.statusCode = 400;
        throw error;
      }
      updates.upiId = upiId;
    }

    if (phone !== undefined) {
      updates.phone = phone;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};
