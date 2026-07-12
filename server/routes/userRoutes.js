import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { updateProfile } from '../controllers/userController.js';

const router = Router();

router.use(protect);

router.put('/profile', updateProfile);

export default router;
