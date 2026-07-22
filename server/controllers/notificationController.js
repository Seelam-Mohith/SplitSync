import FcmToken from '../models/FcmToken.js';
import { checkAndSendReminders, sendPushToUser } from '../services/notificationService.js';

export const getStatus = async (req, res, next) => {
  try {
    const count = await FcmToken.countDocuments({ userId: req.user._id });
    res.json({ success: true, data: { enabled: count > 0 } });
  } catch (error) {
    next(error);
  }
};

export const saveToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required' });
    }

    await FcmToken.findOneAndUpdate(
      { userId: req.user._id, token },
      { userId: req.user._id, token, platform: 'web' },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ success: true, message: 'Notification token saved' });
  } catch (error) {
    next(error);
  }
};

export const removeToken = async (req, res, next) => {
  try {
    const token = req.body?.token;

    if (token) {
      await FcmToken.findOneAndDelete({ userId: req.user._id, token });
    } else {
      await FcmToken.deleteMany({ userId: req.user._id });
    }

    res.json({ success: true, message: 'Notifications disabled' });
  } catch (error) {
    next(error);
  }
};

export const checkReminders = async (_req, res, next) => {
  try {
    const result = await checkAndSendReminders();
    res.json({
      success: true,
      message: `Checked ${result.checked} payments, sent ${result.sent} notifications`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const sendTestNotification = async (req, res, next) => {
  try {
    const result = await sendPushToUser(
      req.user._id,
      'SplitSync Test',
      'Push notifications are working! You will receive payment reminders here.',
      { url: '/dashboard' }
    );

    if (result.reason === 'firebase_not_configured') {
      return res.status(500).json({ success: false, message: 'Push notifications not configured on server. Firebase credentials missing.' });
    }

    if (result.sent === 0) {
      return res.status(400).json({ success: false, message: 'No notification tokens found. Enable notifications in Settings first.' });
    }

    res.json({ success: true, message: `Test notification sent to ${result.sent} device(s)` });
  } catch (error) {
    next(error);
  }
};
