import { Router } from 'express';
import { getUploadSignature } from '../controllers/uploadController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.get('/signature', protect, getUploadSignature);

export default router;
