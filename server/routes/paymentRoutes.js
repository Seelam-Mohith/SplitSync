import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  getMyPayments,
  getPayment,
  submitPayment,
  verifyPayment,
  rejectPayment,
  updatePayment,
  getPaymentDashboard,
} from '../controllers/paymentController.js';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from '../controllers/payoutController.js';

const router = Router();

router.use(protect);

router.get('/group/:groupId', getMyPayments);
router.get('/group/:groupId/dashboard', getPaymentDashboard);
router.get('/:paymentId', getPayment);
router.put('/:paymentId/submit', submitPayment);
router.put('/:paymentId/verify', verifyPayment);
router.put('/:paymentId/reject', rejectPayment);
router.put('/:paymentId', updatePayment);
router.post('/:paymentId/razorpay-order', createRazorpayOrder);
router.post('/:paymentId/razorpay-verify', verifyRazorpayPayment);

export default router;
