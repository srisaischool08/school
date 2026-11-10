import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

const admissionEnquirySchema = z.object({
  studentName: z.string().trim().min(2).max(120),
  dateOfBirth: z.string().optional().or(z.literal('')),
  gender: z.string().trim().max(30).optional().or(z.literal('')),
  classApplyingFor: z.string().trim().min(1).max(60),
  parentName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(25),
  email: z.string().trim().email().max(160).optional().or(z.literal('')),
  address: z.string().trim().min(10).max(500),
  previousSchool: z.string().trim().max(160).optional().or(z.literal('')),
  message: z.string().trim().max(1000).optional().or(z.literal('')),
});

router.get('/content', async (_req, res) => {
  const [home, about, academics, achievements, gallery] = await Promise.all([
    prisma.websiteContent.findUnique({ where: { section: 'home' } }).catch(() => null),
    prisma.websiteContent.findUnique({ where: { section: 'about' } }).catch(() => null),
    prisma.websiteContent.findUnique({ where: { section: 'academics' } }).catch(() => null),
    prisma.websiteContent.findUnique({ where: { section: 'achievements' } }).catch(() => null),
    prisma.websiteContent.findUnique({ where: { section: 'gallery' } }).catch(() => null),
  ]);

  res.json({
    home: home || { title: 'Excellence Through Care', content: 'We nurture confident learners and responsible citizens.' },
    about: about || { title: 'About SRISAI MODEL SCHOOL', content: 'SRISAI MODEL SCHOOL is dedicated to academic excellence and holistic child development.' },
    academics: academics || { title: 'Academics', content: 'Our curriculum is designed to balance strong academics and life skills.' },
    achievements: achievements || { title: 'Achievements', content: 'Students regularly win competitions, sports, and innovation awards.' },
    gallery: gallery || { title: 'Gallery', content: 'A glimpse into our school life and events.' },
  });
});

router.get('/events', async (_req, res) => {
  const events = await prisma.event.findMany({ orderBy: { eventDate: 'asc' } });
  res.json({ events });
});

router.post('/admission-enquiries', async (req, res) => {
  try {
    const payload = admissionEnquirySchema.parse(req.body);
    const enquiry = await prisma.$transaction(async (transaction) => {
      const createdEnquiry = await transaction.admissionEnquiry.create({
        data: {
          ...payload,
          dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : null,
          gender: payload.gender || null,
          email: payload.email || null,
          previousSchool: payload.previousSchool || null,
          message: payload.message || null,
          enquiryNumber: `ENQ-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`,
        },
      });

      await transaction.notification.create({
        data: {
          title: 'New Admission Enquiry',
          message: `New admission enquiry received from ${createdEnquiry.studentName} for ${createdEnquiry.classApplyingFor}.`,
          type: 'ADMISSION_ENQUIRY',
          recipientRole: 'SUPER_ADMIN',
          admissionEnquiryId: createdEnquiry.id,
        },
      });

      return createdEnquiry;
    });

    res.status(201).json({
      message: 'Thank you for your enquiry. Our school team will contact you shortly.',
      enquiryNumber: enquiry.enquiryNumber,
    });
  } catch (error) {
    return res.status(400).json({ message: error?.issues?.[0]?.message || 'Please check the enquiry details and try again.' });
  }
});

router.get('/gallery', async (_req, res) => {
  const gallery = await prisma.galleryImage.findMany({
    where: { published: true },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    include: { album: true, category: true, event: true },
  });
  res.json({ gallery });
});

export default router;
