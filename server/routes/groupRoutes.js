import { Router } from 'express';
import { getMyGroups, createGroup, joinGroup } from '../controllers/groupController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, getMyGroups);
router.post('/', protect, createGroup);
router.post('/join', protect, joinGroup);

export default router;
