import { Router } from 'express';
import { register, verifyOtp, resendOtp, login, me } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', login);
router.get('/me', protect, me);

export default router;
