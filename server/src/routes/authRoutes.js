import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.string().optional(),
});

function serializeUser(user) {
  const profile = user.student ?? user.teacher ?? user.admin ?? null;
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role?.name,
    active: user.isActive,
    profile,
  };
}

router.post('/login', async (req, res) => {
  try {
    const payload = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { username: payload.username },
      include: { role: true, student: true, teacher: true, admin: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const passwordMatches = await bcrypt.compare(payload.password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const requestedRole = payload.role?.toUpperCase();
    if (requestedRole && requestedRole !== user.role.name) {
      return res.status(403).json({ message: 'Selected role does not match your account.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role.name },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '30d' },
    );

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        module: 'AUTH',
        details: `User logged in as ${user.role.name}`,
      },
    });

    res.json({
      token,
      user: serializeUser(user),
      message: 'Login successful',
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Login failed.' });
  }
});

router.post('/logout', authMiddleware, async (req, res) => {
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      action: 'LOGOUT',
      module: 'AUTH',
      details: 'User logged out',
    },
  });

  res.json({ message: 'Logout successful' });
});

router.get('/me', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { role: true, student: true, teacher: true, admin: true },
  });

  res.json({ user: serializeUser(user) });
});

router.post('/reset-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Current and new passwords are required and new password must be at least 6 characters.' });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!valid) {
    return res.status(400).json({ message: 'Current password is incorrect.' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });

  res.json({ message: 'Password updated successfully.' });
});

export default router;
