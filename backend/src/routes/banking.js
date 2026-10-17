import { Router } from 'express';
import {
  addMoney,
  billPayment,
  fundTransfer,
  getBalance,
  listTransactions,
} from '../controllers/bankingController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/balance', getBalance);
router.post('/add-money', addMoney);
router.post('/transfer', fundTransfer);
router.post('/bill-pay', billPayment);
router.get('/transactions', listTransactions);

export default router;
