import crypto from 'crypto';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import prisma from '../lib/prisma.js';
import {
  hashPassword,
  hashToken,
  signAccessToken,
  verifyPassword,
} from '../utils/crypto.js';
import { getClientIp, parseDevice } from '../utils/device.js';

const MAX_FAILED = Number(process.env.MAX_FAILED_ATTEMPTS || 5);
const LOCK_MINUTES = Number(process.env.LOCK_DURATION_MINUTES || 15);
const OTP_TTL_MINUTES = 10;

function generateLoginOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashOtp(otp) {
  return hashToken(String(otp));
}

function isLocked(user) {
  return Boolean(user.lockUntil && user.lockUntil.getTime() > Date.now());
}

function lockRemainingMs(user) {
  if (!user.lockUntil) return 0;
  return Math.max(0, user.lockUntil.getTime() - Date.now());
}

async function recordActivity(userId, { success, reason, device }) {
  await prisma.loginActivity.create({
    data: {
      userId,
      success,
      reason,
      ipAddress: device.ipAddress,
      userAgent: device.userAgent,
      deviceName: device.deviceName,
    },
  });
}

async function createSession(user, device) {
  const token = signAccessToken({ userId: user.id, sessionId: 'pending' });
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      deviceName: device.deviceName,
      browser: device.browser,
      os: device.os,
      ipAddress: device.ipAddress,
      userAgent: device.userAgent,
    },
  });

  const finalToken = signAccessToken({ userId: user.id, sessionId: session.id });
  await prisma.session.update({
    where: { id: session.id },
    data: { tokenHash: hashToken(finalToken) },
  });

  return { session, token: finalToken };
}

function publicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    balance: user.balance,
    twoFactorEnabled: user.twoFactorEnabled,
    createdAt: user.createdAt,
  };
}

export async function register(req, res) {
  try {
    const { fullName, email, phone, password, confirmPassword } = req.body;

    if (!fullName?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Password and confirm password do not match.' });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const user = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        passwordHash: await hashPassword(password),
      },
    });

    return res.status(201).json({
      message: 'Account created successfully. You can now log in.',
      user: publicUser(user),
    });
  } catch (error) {
    console.error('register error', error);
    return res.status(500).json({ message: 'Registration failed.' });
  }
}

export async function login(req, res) {
  try {
    const { email, password, otp, twoFactorCode } = req.body;
    const device = parseDevice(req.headers['user-agent'], getClientIp(req));

    if (!email?.trim() || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (isLocked(user)) {
      const minutes = Math.ceil(lockRemainingMs(user) / 60000);
      await recordActivity(user.id, {
        success: false,
        reason: 'Account locked',
        device,
      });
      return res.status(423).json({
        message: `Account temporarily locked due to repeated failed logins. Try again in about ${minutes} minute(s).`,
        locked: true,
        lockUntil: user.lockUntil,
      });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      const shouldLock = attempts >= MAX_FAILED;
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockUntil: shouldLock
            ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
            : null,
          loginOtpHash: null,
          loginOtpExpires: null,
        },
      });

      await recordActivity(user.id, {
        success: false,
        reason: shouldLock ? 'Account locked after failed attempts' : 'Invalid password',
        device,
      });

      if (shouldLock) {
        return res.status(423).json({
          message: `Too many failed attempts. Account locked for ${LOCK_MINUTES} minutes.`,
          locked: true,
          lockUntil: updated.lockUntil,
        });
      }

      return res.status(401).json({
        message: `Invalid email or password. ${MAX_FAILED - attempts} attempt(s) remaining before lock.`,
        attemptsRemaining: MAX_FAILED - attempts,
      });
    }

    // Step 1: password OK → issue login OTP (always required)
    if (!otp) {
      const loginOtp = generateLoginOtp();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginOtpHash: hashOtp(loginOtp),
          loginOtpExpires: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
        },
      });

      console.log(`[SecureBank OTP] ${user.email}: ${loginOtp}`);

      return res.status(200).json({
        requiresOTP: true,
        message: 'Enter the 6-digit OTP to continue.',
        // Demo only (no email/SMS provider configured)
        demoOtp: loginOtp,
      });
    }

    const otpFresh = user.loginOtpHash
      && user.loginOtpExpires
      && user.loginOtpExpires.getTime() > Date.now()
      && user.loginOtpHash === hashOtp(String(otp).replace(/\s/g, ''));

    if (!otpFresh) {
      await recordActivity(user.id, {
        success: false,
        reason: 'Invalid or expired OTP',
        device,
      });
      return res.status(401).json({
        message: 'Invalid or expired OTP. Sign in again to get a new code.',
        requiresOTP: true,
      });
    }

    // Optional authenticator 2FA (Payel) — after OTP
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(200).json({
          requires2FA: true,
          requiresOTP: true,
          message: 'Enter your authenticator 2FA code to finish login.',
        });
      }

      const ok = authenticator.verify({
        token: String(twoFactorCode).replace(/\s/g, ''),
        secret: user.twoFactorSecret,
      });

      if (!ok) {
        await recordActivity(user.id, {
          success: false,
          reason: 'Invalid 2FA code',
          device,
        });
        return res.status(401).json({
          message: 'Invalid 2FA code.',
          requires2FA: true,
          requiresOTP: true,
        });
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockUntil: null,
        loginOtpHash: null,
        loginOtpExpires: null,
      },
    });

    const { session, token } = await createSession(user, device);
    await recordActivity(user.id, { success: true, reason: 'Login success', device });

    return res.json({
      message: 'Login successful.',
      token,
      sessionId: session.id,
      user: publicUser(user),
    });
  } catch (error) {
    console.error('login error', error);
    return res.status(500).json({ message: 'Login failed.' });
  }
}

export async function me(req, res) {
  return res.json({ user: publicUser(req.user), sessionId: req.session.id });
}

export async function logout(req, res) {
  await prisma.session.update({
    where: { id: req.session.id },
    data: { revokedAt: new Date() },
  });
  return res.json({ message: 'Logged out successfully.' });
}

export async function setup2FA(req, res) {
  try {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(req.user.email, 'SecureBank', secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { twoFactorSecret: secret, twoFactorEnabled: false },
    });

    return res.json({
      message: 'Scan the QR code with your authenticator app, then verify with a code.',
      secret,
      qrCodeDataUrl,
    });
  } catch (error) {
    console.error('setup2FA error', error);
    return res.status(500).json({ message: 'Could not start 2FA setup.' });
  }
}

export async function verify2FA(req, res) {
  try {
    const { code } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user?.twoFactorSecret) {
      return res.status(400).json({ message: 'Start 2FA setup first.' });
    }

    const ok = authenticator.verify({
      token: String(code || '').replace(/\s/g, ''),
      secret: user.twoFactorSecret,
    });

    if (!ok) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    });

    return res.json({
      message: 'Two-factor authentication enabled.',
      user: publicUser(updated),
    });
  } catch (error) {
    console.error('verify2FA error', error);
    return res.status(500).json({ message: 'Could not enable 2FA.' });
  }
}

export async function disable2FA(req, res) {
  try {
    const { password, code } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!(await verifyPassword(password || '', user.passwordHash))) {
      return res.status(401).json({ message: 'Incorrect password.' });
    }

    if (user.twoFactorEnabled) {
      const ok = authenticator.verify({
        token: String(code || '').replace(/\s/g, ''),
        secret: user.twoFactorSecret,
      });
      if (!ok) {
        return res.status(401).json({ message: 'Invalid 2FA code.' });
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });

    return res.json({
      message: 'Two-factor authentication disabled.',
      user: publicUser(updated),
    });
  } catch (error) {
    console.error('disable2FA error', error);
    return res.status(500).json({ message: 'Could not disable 2FA.' });
  }
}
