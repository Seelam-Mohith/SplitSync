import { Router } from 'express';
import {
  getMyGroups,
  createGroup,
  joinGroup,
  getGroup,
  updateGroup,
  deleteGroup,
  removeMember,
  transferOwnership,
  regenerateInviteCode,
} from '../controllers/groupController.js';
import { protect, isGroupOwner } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, getMyGroups);
router.post('/', protect, createGroup);
router.post('/join', protect, joinGroup);
router.get('/:id', protect, getGroup);
router.put('/:id', protect, isGroupOwner, updateGroup);
router.delete('/:id', protect, isGroupOwner, deleteGroup);
router.delete('/:id/members/:userId', protect, isGroupOwner, removeMember);
router.put('/:id/transfer', protect, isGroupOwner, transferOwnership);
router.put('/:id/invite', protect, isGroupOwner, regenerateInviteCode);

export default router;
