import { Router } from 'express';
import { createGroup } from '../controllers/groupController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/', protect, createGroup);

export default router;
