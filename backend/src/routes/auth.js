import { Router } from 'express';
import {
  disable2FA,
  login,
  logout,
  me,
  register,
  setup2FA,
  verify2FA,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me);
router.post('/logout', requireAuth, logout);

router.post('/2fa/setup', requireAuth, setup2FA);
router.post('/2fa/verify', requireAuth, verify2FA);
router.post('/2fa/disable', requireAuth, disable2FA);

export default router;
