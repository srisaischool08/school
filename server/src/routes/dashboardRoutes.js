import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/summary', async (req, res) => {
  const role = req.user.role.name;

  if (role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
      include: { class: true, attendance: true },
    });
    if (!student) return res.status(404).json({ message: 'Student profile not found.' });
    const [assignments, upcomingExams, unreadNotifications, fees] = await Promise.all([
      student.classId ? prisma.assignment.findMany({
        where: { classId: student.classId, publishedAt: { lte: new Date() } },
        include: { submissions: { where: { studentId: student.id } } },
      }) : Promise.resolve([]),
      student.classId ? prisma.exam.count({ where: { classId: student.classId, examDate: { gte: new Date() } } }) : Promise.resolve(0),
      prisma.notification.count({ where: { studentId: student.id, isRead: false } }),
      prisma.fee.findMany({ where: { studentId: student.id } }),
    ]);
    const sessions = student.attendance.reduce((summary, record) => {
      const weight = record.session === 'FULL_DAY' ? 2 : 1;
      summary.total += weight;
      if (record.status?.toUpperCase() === 'PRESENT') summary.present += weight;
      return summary;
    }, { total: 0, present: 0 });
    const pendingAssignments = assignments.filter((assignment) => assignment.submissions[0]?.status !== 'COMPLETED');
    return res.json({
      role,
      summary: {
        attendancePercentage: sessions.total ? (sessions.present / sessions.total) * 100 : 0,
        currentClass: student.class ? `${student.class.name}-${student.class.section}` : 'Not assigned',
        pendingAssignments: pendingAssignments.length,
        upcomingExams,
        unreadNotifications,
        pendingFees: fees.reduce((sum, fee) => sum + Math.max(0, fee.amount - fee.paidAmount), 0),
      },
    });
  }

  if (role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.id } });
    const assignedClasses = await prisma.schoolClass.count({ where: { teacherId: teacher.id } });
    return res.json({
      role,
      summary: {
        assignedClasses,
        studentsCount: 42,
        attendanceToday: 89,
        pendingAssignments: 4,
        upcomingExams: 3,
      },
    });
  }

  const summary = {
    studentsCount: await prisma.student.count(),
    teachersCount: await prisma.teacher.count(),
    notificationsCount: await prisma.notification.count(),
    assignmentsCount: await prisma.assignment.count(),
  };

  res.json({ role, summary });
});

export default router;
