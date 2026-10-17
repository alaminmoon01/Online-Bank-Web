import prisma from '../lib/prisma.js';

export async function listSessions(req, res) {
  const sessions = await prisma.session.findMany({
    where: { userId: req.user.id, revokedAt: null },
    orderBy: { lastActiveAt: 'desc' },
  });

  return res.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      deviceName: s.deviceName,
      browser: s.browser,
      os: s.os,
      ipAddress: s.ipAddress,
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
      current: s.id === req.session.id,
    })),
  });
}

export async function revokeSession(req, res) {
  const { id } = req.params;

  const session = await prisma.session.findFirst({
    where: { id, userId: req.user.id, revokedAt: null },
  });

  if (!session) {
    return res.status(404).json({ message: 'Session not found.' });
  }

  await prisma.session.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

  return res.json({
    message: session.id === req.session.id
      ? 'Current session revoked. You will be logged out.'
      : 'Device session revoked.',
    revokedCurrent: session.id === req.session.id,
  });
}

export async function revokeOtherSessions(req, res) {
  const result = await prisma.session.updateMany({
    where: {
      userId: req.user.id,
      revokedAt: null,
      NOT: { id: req.session.id },
    },
    data: { revokedAt: new Date() },
  });

  return res.json({
    message: `Revoked ${result.count} other session(s).`,
    count: result.count,
  });
}

export async function listLoginActivity(req, res) {
  const activities = await prisma.loginActivity.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return res.json({ activities });
}
