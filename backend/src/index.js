import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth.js';
import bankingRoutes from './routes/banking.js';
import sessionRoutes from './routes/sessions.js';

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, module: 'Authentication & Account Security' });
});

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/banking', bankingRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected server error.' });
});

app.listen(port, () => {
  console.log(`SecureBank API running on http://localhost:${port}`);
});
