import prisma from '../lib/prisma.js';
import { hashToken, verifyAccessToken } from '../utils/crypto.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const payload = verifyAccessToken(token);
    const tokenHash = hashToken(token);

    const session = await prisma.session.findFirst({
      where: {
        id: payload.sessionId,
        userId: payload.userId,
        tokenHash,
        revokedAt: null,
      },
      include: { user: true },
    });

    if (!session) {
      return res.status(401).json({ message: 'Session expired or revoked. Please log in again.' });
    }

    await prisma.session.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    });

    req.user = session.user;
    req.session = session;
    req.token = token;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}
