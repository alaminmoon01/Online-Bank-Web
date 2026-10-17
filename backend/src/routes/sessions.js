import { Router } from 'express';
import {
  listLoginActivity,
  listSessions,
  revokeOtherSessions,
  revokeSession,
} from '../controllers/sessionController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', listSessions);
router.get('/activity/log', listLoginActivity);
router.delete('/others', revokeOtherSessions);
router.delete('/:id', revokeSession);

export default router;
