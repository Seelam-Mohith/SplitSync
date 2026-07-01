import { Router } from 'express';
import { getMyGroups, createGroup } from '../controllers/groupController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, getMyGroups);
router.post('/', protect, createGroup);

export default router;
