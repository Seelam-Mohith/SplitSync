import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { saveToken, removeToken, checkReminders, sendTestNotification, getStatus } from '../controllers/notificationController.js';

const router = Router();

router.get('/status', protect, getStatus);
router.post('/token', protect, saveToken);
router.delete('/token', protect, removeToken);
router.post('/test', protect, sendTestNotification);
router.get('/check-reminders', checkReminders);

export default router;
