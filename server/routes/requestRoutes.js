import { Router } from 'express';
import {
  createRequest, getSent, getReceived, getReceipt, reviewRequest, acceptRequest, rejectRequest, cancelRequest, confirmRequest,
} from '../controllers/requestController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.post('/', createRequest);
router.get('/sent', getSent);
router.get('/received', getReceived);
router.get('/:id/receipt', getReceipt);
router.post('/:id/review', reviewRequest);
router.patch('/:id/accept', acceptRequest);
router.patch('/:id/reject', rejectRequest);
router.patch('/:id/cancel', cancelRequest);
router.patch('/:id/confirm', confirmRequest);

export default router;
