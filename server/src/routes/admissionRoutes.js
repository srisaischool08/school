import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { requirePermission, requireRole } from '../rbac.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware, requireRole('SUPER_ADMIN'), requirePermission('admin:admissions:view'));

router.get('/', async (req, res) => {
  const search = String(req.query.search || '').trim();
  const status = String(req.query.status || '').trim();
  const enquiries = await prisma.admissionEnquiry.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(search ? {
        OR: [
          { enquiryNumber: { contains: search } },
          { studentName: { contains: search } },
          { parentName: { contains: search } },
          { phone: { contains: search } },
          { email: { contains: search } },
        ],
      } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ enquiries });
});

router.patch('/:id', requirePermission('admin:admissions:manage'), async (req, res) => {
  const schema = z.object({
    status: z.enum(['NEW', 'CONTACTED', 'FOLLOW_UP', 'COMPLETED', 'REJECTED']),
    notes: z.string().max(2000).optional().nullable(),
  });

  try {
    const payload = schema.parse(req.body);
    const enquiry = await prisma.admissionEnquiry.update({ where: { id: req.params.id }, data: payload });
    res.json({ enquiry });
  } catch (error) {
    const status = error?.code === 'P2025' ? 404 : 400;
    res.status(status).json({ message: error?.issues?.[0]?.message || 'Unable to update enquiry.' });
  }
});

router.delete('/:id', requirePermission('admin:admissions:manage'), async (req, res) => {
  try {
    await prisma.admissionEnquiry.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (error) {
    res.status(error?.code === 'P2025' ? 404 : 400).json({ message: 'Unable to delete enquiry.' });
  }
});

export default router;