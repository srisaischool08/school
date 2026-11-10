import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { requirePermission } from '../rbac.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

async function getStudent(req, res) {
  const student = await prisma.student.findUnique({
    where: { userId: req.user.id },
    include: { class: true },
  });
  if (!student) res.status(404).json({ message: 'Student profile not found.' });
  return student;
}

function parseDate(value, endOfDay = false) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function getAttendanceStats(records) {
  const sessions = { MORNING: { total: 0, present: 0 }, AFTERNOON: { total: 0, present: 0 } };
  const byDay = new Map();
  for (const record of records) {
    const dateKey = new Date(record.date).toISOString().slice(0, 10);
    const day = byDay.get(dateKey) || { morning: null, afternoon: null };
    const status = record.status?.toUpperCase();
    const keys = record.session === 'FULL_DAY' ? ['MORNING', 'AFTERNOON'] : [record.session];
    for (const session of keys) {
      if (!sessions[session]) continue;
      const present = status === 'PRESENT';
      sessions[session].total += 1;
      if (present) sessions[session].present += 1;
      day[session === 'MORNING' ? 'morning' : 'afternoon'] = status;
    }
    byDay.set(dateKey, day);
  }
  const daily = [...byDay.entries()].map(([date, day]) => ({
    date,
    morning: day.morning,
    afternoon: day.afternoon,
    percentage: (() => {
      const recordedSessions = Number(Boolean(day.morning)) + Number(Boolean(day.afternoon));
      const presentSessions = Number(day.morning === 'PRESENT') + Number(day.afternoon === 'PRESENT');
      return recordedSessions ? (presentSessions / recordedSessions) * 100 : 0;
    })(),
  })).sort((first, second) => second.date.localeCompare(first.date));
  const total = sessions.MORNING.total + sessions.AFTERNOON.total;
  const present = sessions.MORNING.present + sessions.AFTERNOON.present;
  const formatSession = (key, label) => ({
    session: label,
    totalSessions: sessions[key].total,
    present: sessions[key].present,
    absent: sessions[key].total - sessions[key].present,
    percentage: sessions[key].total ? (sessions[key].present / sessions[key].total) * 100 : 0,
  });
  return {
    daily,
    sessions: [formatSession('MORNING', 'Morning Session'), formatSession('AFTERNOON', 'Afternoon Session')],
    overallPercentage: total ? Number(((present / total) * 100).toFixed(2)) : 0,
    monthly: Object.entries(daily.reduce((months, day) => {
      const month = day.date.slice(0, 7);
      const summary = months[month] || { month, days: 0, percentageTotal: 0 };
      summary.days += 1;
      summary.percentageTotal += day.percentage;
      months[month] = summary;
      return months;
    }, {})).map(([, month]) => ({
      month: month.month,
      days: month.days,
      percentage: month.days ? month.percentageTotal / month.days : 0,
    })).sort((first, second) => second.month.localeCompare(first.month)),
  };
}

router.get('/dashboard', requirePermission('student:read_profile'), async (req, res) => {
  const student = await getStudent(req, res);
  if (!student) return;
  const [attendance, assignments, upcomingExams, unreadNotifications, fees] = await Promise.all([
    prisma.attendance.findMany({ where: { studentId: student.id } }),
    student.classId ? prisma.assignment.findMany({
      where: { classId: student.classId, publishedAt: { lte: new Date() } },
      include: { submissions: { where: { studentId: student.id } } },
    }) : Promise.resolve([]),
    student.classId ? prisma.exam.count({ where: { classId: student.classId, examDate: { gte: new Date() } } }) : Promise.resolve(0),
    prisma.notification.count({ where: { studentId: student.id, isRead: false } }),
    prisma.fee.findMany({ where: { studentId: student.id }, include: { payments: true } }),
  ]);
  const attendanceStats = getAttendanceStats(attendance);
  const pendingAssignments = assignments.filter((assignment) => assignment.submissions[0]?.status !== 'COMPLETED').length;
  const overdueAssignments = assignments.filter((assignment) => assignment.submissions[0]?.status !== 'COMPLETED' && assignment.dueDate < new Date()).length;
  res.json({
    student: {
      id: student.id,
      name: student.name,
      studentId: student.studentId,
      className: student.class ? `${student.class.name}-${student.class.section}` : 'Not assigned',
    },
    summary: {
      attendancePercentage: attendanceStats.overallPercentage,
      pendingAssignments,
      overdueAssignments,
      upcomingExams,
      unreadNotifications,
      pendingFees: fees.reduce((sum, fee) => {
        const paid = fee.payments.length ? fee.payments.reduce((paymentTotal, payment) => paymentTotal + payment.amount, 0) : fee.paidAmount;
        return sum + Math.max(0, fee.amount - paid);
      }, 0),
    },
  });
});

router.get('/profile', requirePermission('student:read_profile'), async (req, res) => {
  const student = await getStudent(req, res);
  if (!student) return;
  const attendance = await prisma.attendance.findMany({ where: { studentId: student.id } });
  const { id, name, studentId, roomNumber, academicYear, gender, subjects, email, section, rollNumber, dob, parentName, parentContact, address, class: schoolClass } = student;
  res.json({
    student: { id, name, studentId, roomNumber, academicYear, gender, subjects, email, section, rollNumber, dob, parentName, parentContact, address, class: schoolClass },
    attendancePercentage: getAttendanceStats(attendance).overallPercentage,
  });
});

router.put('/profile', requirePermission('student:read_profile'), async (req, res) => {
  const student = await getStudent(req, res);
  if (!student) return;
  const { name, gender, dob, email, address } = req.body || {};
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    return res.status(400).json({ message: 'Name must be between 2 and 100 characters.' });
  }
  if (gender !== undefined && gender !== null && !['Male', 'Female'].includes(gender)) {
    return res.status(400).json({ message: 'Gender must be Male or Female.' });
  }
  if (email !== undefined && email !== null && email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Enter a valid email address.' });
  }
  const parsedDob = dob ? parseDate(dob) : null;
  if (dob && !parsedDob) return res.status(400).json({ message: 'Enter a valid date of birth.' });
  if (address !== undefined && address !== null && String(address).length > 500) {
    return res.status(400).json({ message: 'Address cannot exceed 500 characters.' });
  }
  const updated = await prisma.student.update({
    where: { id: student.id },
    data: {
      name: name.trim(),
      gender: gender || null,
      dob: parsedDob,
      email: email ? email.trim() : null,
      address: address ? String(address).trim() : null,
    },
    include: { class: true },
  });
  res.json({ message: 'Profile updated successfully.', student: updated });
});

router.get('/attendance', requirePermission('student:read_attendance'), async (req, res) => {
  const student = await getStudent(req, res);
  if (!student) return;
  const from = parseDate(req.query.from);
  const to = parseDate(req.query.to, true);
  if (from === undefined || to === undefined || (from && to && from > to)) {
    return res.status(400).json({ message: 'Select a valid date range.' });
  }
  const academicYear = req.query.academicYear === 'true';
  const academicYearStart = student.academicYear?.match(/^(\d{4})/);
  const academicYearWhere = academicYear && academicYearStart ? {
    gte: new Date(`${academicYearStart[1]}-04-01T00:00:00.000Z`),
    lt: new Date(`${Number(academicYearStart[1]) + 1}-04-01T00:00:00.000Z`),
  } : null;
  const date = academicYearWhere || (from || to ? { ...(from && { gte: from }), ...(to && { lte: to }) } : undefined);
  const attendance = await prisma.attendance.findMany({
    where: { studentId: student.id, ...(date && { date }) },
    orderBy: [{ date: 'desc' }, { session: 'asc' }],
  });
  const summary = getAttendanceStats(attendance);
  const selectedMonth = typeof req.query.month === 'string' && /^\d{4}-\d{2}$/.test(req.query.month) ? req.query.month : null;
  const monthRecords = selectedMonth ? attendance.filter((record) => new Date(record.date).toISOString().slice(0, 7) === selectedMonth) : attendance;
  const monthStats = getAttendanceStats(monthRecords);
  const subjects = (student.subjects || '').split('|').map((subject) => subject.trim()).filter(Boolean);
  res.json({
    attendance,
    ...summary,
    selectedMonth,
    monthlyAttendance: monthStats.overallPercentage,
    subjectWise: subjects.map((subject) => ({ subject, percentage: monthStats.overallPercentage })),
    from: req.query.from || null,
    to: req.query.to || null,
    academicYear: academicYear ? student.academicYear : null,
  });
});

router.get('/academics', requirePermission('student:read_academics'), async (req, res) => {
  const student = await getStudent(req, res);
  if (!student) return;
  const subjects = (student.subjects || '').split('|').map((name, index) => ({
    id: `${student.id}-subject-${index}`,
    name: name.trim(),
    code: name.trim().replace(/[^A-Za-z0-9]+/g, '-').toUpperCase(),
  })).filter((subject) => subject.name);
  res.json({ class: student.class, subjects });
});

router.get('/assignments', requirePermission('student:read_assignments'), async (req, res) => {
  const student = await getStudent(req, res);
  if (!student) return;
  const assignments = student.classId ? await prisma.assignment.findMany({
    where: { classId: student.classId, publishedAt: { lte: new Date() } },
    include: {
      subject: true,
      submissions: { where: { studentId: student.id }, select: { id: true, status: true, submittedAt: true } },
    },
    orderBy: [{ dueDate: 'asc' }, { publishedAt: 'desc' }],
  }) : [];
  res.json({ assignments: assignments.map(({ submissions, ...assignment }) => ({
    ...assignment,
    status: submissions[0]?.status === 'COMPLETED' ? 'COMPLETED' : assignment.dueDate < new Date() ? 'OVERDUE' : 'PENDING',
    completedAt: submissions[0]?.submittedAt || null,
  })) });
});

router.patch('/assignments/:assignmentId/completion', requirePermission('student:read_assignments'), async (req, res) => {
  const student = await getStudent(req, res);
  if (!student) return;
  if (typeof req.body.completed !== 'boolean') return res.status(400).json({ message: 'Completion status must be true or false.' });
  const assignment = await prisma.assignment.findFirst({ where: { id: req.params.assignmentId, classId: student.classId } });
  if (!assignment) return res.status(404).json({ message: 'Assignment not found for your class.' });
  const completedAt = req.body.completed ? new Date() : null;
  const submission = await prisma.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId: assignment.id, studentId: student.id } },
    create: { assignmentId: assignment.id, studentId: student.id, status: req.body.completed ? 'COMPLETED' : 'PENDING', submittedAt: completedAt, importBatchId: student.importBatchId },
    update: { status: req.body.completed ? 'COMPLETED' : 'PENDING', submittedAt: completedAt },
  });
  res.json({ submission });
});

router.get('/exams-results', requirePermission('student:read_results'), async (req, res) => {
  const student = await getStudent(req, res);
  if (!student) return;
  const results = await prisma.result.findMany({
    where: { studentId: student.id },
    include: { exam: { include: { subject: true } } },
    orderBy: { exam: { examDate: 'desc' } },
  });
  const totals = results.reduce((summary, result) => ({
    maxMarks: summary.maxMarks + result.exam.maxMarks,
    marks: summary.marks + result.marks,
  }), { maxMarks: 0, marks: 0 });
  const percentage = totals.maxMarks ? (totals.marks / totals.maxMarks) * 100 : 0;
  const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : results.length ? 'F' : 'N/A';
  const ranks = results.map((result) => result.rank).filter((rank) => Number.isInteger(rank));
  res.json({ results, summary: { ...totals, percentage, grade, rank: ranks.length ? Math.min(...ranks) : null } });
});

router.get('/notifications', requirePermission('student:read_notifications'), async (req, res) => {
  const student = await getStudent(req, res);
  if (!student) return;
  const [notifications, assignments] = await Promise.all([
    prisma.notification.findMany({ where: { studentId: student.id }, orderBy: { createdAt: 'desc' } }),
    student.classId ? prisma.assignment.findMany({
      where: { classId: student.classId, publishedAt: { lte: new Date() } },
      include: { subject: true, submissions: { where: { studentId: student.id } } },
      orderBy: { publishedAt: 'desc' },
    }) : Promise.resolve([]),
  ]);
  const now = new Date();
  const approaching = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const generated = assignments.flatMap((assignment) => {
    const subject = assignment.subject?.name || 'your class';
    const completed = assignment.submissions[0]?.status === 'COMPLETED';
    const items = [{
      id: `assignment-new-${assignment.id}`,
      title: 'New Assignment',
      message: `You have received a new ${subject} assignment. Please check the assignment details.`,
      type: 'NEW_ASSIGNMENT',
      createdAt: assignment.publishedAt,
    }];
    if (!completed) {
      items.push({
        id: `assignment-pending-${assignment.id}`,
        title: 'Assignment Pending',
        message: `Your ${subject} assignment is still pending. Please complete it.`,
        type: 'ASSIGNMENT_PENDING',
        createdAt: assignment.dueDate,
      });
      if (assignment.dueDate >= now && assignment.dueDate <= approaching) {
        items.push({
          id: `assignment-deadline-${assignment.id}`,
          title: 'Assignment Deadline Approaching',
          message: `Your ${subject} assignment deadline is approaching. Please complete it before the due date.`,
          type: 'ASSIGNMENT_DEADLINE',
          createdAt: assignment.dueDate,
        });
      }
    }
    return items;
  });
  res.json({ notifications: [...notifications, ...generated].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

router.get('/fees', requirePermission('student:read_fees'), async (req, res) => {
  const student = await getStudent(req, res);
  if (!student) return;
  const fees = await prisma.fee.findMany({
    where: { studentId: student.id },
    include: { payments: { orderBy: { paidAt: 'desc' } } },
    orderBy: [{ dueDate: 'asc' }, { title: 'asc' }],
  });
  const summary = fees.reduce((totals, fee) => {
    const paid = fee.payments.length ? fee.payments.reduce((sum, payment) => sum + payment.amount, 0) : fee.paidAmount;
    totals.committed += fee.amount;
    totals.paid += paid;
    return totals;
  }, { committed: 0, paid: 0 });
  summary.pending = Math.max(0, summary.committed - summary.paid);
  res.json({ fees, summary });
});

export default router;
