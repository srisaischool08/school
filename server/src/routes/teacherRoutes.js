import express from 'express';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { requirePermission } from '../rbac.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

async function getTeacher(req, res) {
  const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.id } });
  if (!teacher) res.status(404).json({ message: 'Teacher profile not found.' });
  return teacher;
}

async function getTeachingClasses(teacherId) {
  return prisma.schoolClass.findMany({
    where: { OR: [{ teacherId }, { subjects: { some: { teacherId } } }] },
    include: {
      students: { orderBy: { rollNumber: 'asc' } },
      subjects: { orderBy: { name: 'asc' } },
    },
    orderBy: [{ name: 'asc' }, { section: 'asc' }],
  });
}

function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

router.get('/profile', requirePermission('teacher:read_profile'), async (req, res) => {
  const teacher = await getTeacher(req, res);
  if (!teacher) return;
  const [profile, classes] = await Promise.all([
    prisma.teacher.findUnique({
      where: { id: teacher.id },
      include: { subjects: { include: { class: true }, orderBy: { name: 'asc' } } },
    }),
    getTeachingClasses(teacher.id),
  ]);
  res.json({
    teacher: {
      id: profile.id,
      name: profile.name,
      employeeId: profile.employeeId,
      subjects: profile.subjects,
      classes: classes.map((schoolClass) => ({ id: schoolClass.id, name: schoolClass.name, section: schoolClass.section, studentCount: schoolClass.students.length, isClassTeacher: schoolClass.teacherId === teacher.id })),
    },
  });
});

router.get('/dashboard', requirePermission('teacher:read_profile'), async (req, res) => {
  const teacher = await getTeacher(req, res);
  if (!teacher) return;
  const classes = await getTeachingClasses(teacher.id);
  const students = classes.flatMap((schoolClass) => schoolClass.students);
  const classTeacherIds = classes.filter((schoolClass) => schoolClass.teacherId === teacher.id).map((schoolClass) => schoolClass.id);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const [attendance, assignments, upcomingExams, unreadNotifications] = await Promise.all([
    classTeacherIds.length ? prisma.attendance.findMany({ where: { classId: { in: classTeacherIds }, date: today } }) : Promise.resolve([]),
    prisma.assignment.count({ where: { teacherId: teacher.id, dueDate: { gte: new Date() } } }),
    classes.length ? prisma.exam.count({ where: { classId: { in: classes.map((schoolClass) => schoolClass.id) }, examDate: { gte: new Date() } } }) : Promise.resolve(0),
    prisma.notification.count({ where: { teacherId: teacher.id, isRead: false } }),
  ]);
  const sessionCount = attendance.reduce((count, record) => count + (record.session === 'FULL_DAY' ? 2 : 1), 0);
  const presentCount = attendance.reduce((count, record) => count + (record.status?.toUpperCase() === 'PRESENT' ? record.session === 'FULL_DAY' ? 2 : 1 : 0), 0);
  res.json({ teacher: { name: teacher.name, employeeId: teacher.employeeId }, summary: {
    assignedClasses: classes.length,
    isClassTeacher: classTeacherIds.length > 0,
    studentsCount: new Set(students.map((student) => student.id)).size,
    attendanceToday: sessionCount ? (presentCount / sessionCount) * 100 : 0,
    attendanceRecordsToday: attendance.length,
    pendingAssignments: assignments,
    upcomingExams,
    unreadNotifications,
  } });
});

router.get('/classes', requirePermission('teacher:read_classes'), async (req, res) => {
  const teacher = await getTeacher(req, res);
  if (!teacher) return;
  const classes = (await getTeachingClasses(teacher.id)).map((schoolClass) => ({
    ...schoolClass,
    isClassTeacher: schoolClass.teacherId === teacher.id,
    subjects: schoolClass.subjects.filter((subject) => subject.teacherId === teacher.id),
  }));
  res.json({ classes });
});

router.get('/students', requirePermission('teacher:read_students'), async (req, res) => {
  const teacher = await getTeacher(req, res);
  if (!teacher) return;
  const classes = await getTeachingClasses(teacher.id);
  const students = classes.flatMap((schoolClass) => schoolClass.students.map((student) => ({
    ...student,
    class: { id: schoolClass.id, name: schoolClass.name, section: schoolClass.section },
    isClassTeacher: schoolClass.teacherId === teacher.id,
  })));
  res.json({ students, classes: classes.map((schoolClass) => ({ id: schoolClass.id, name: schoolClass.name, section: schoolClass.section, isClassTeacher: schoolClass.teacherId === teacher.id })) });
});

router.post('/students', requirePermission('teacher:manage_students'), async (req, res) => {
  const teacher = await getTeacher(req, res);
  if (!teacher) return;
  const { name, studentId, username, classId, roomNumber, parentName, parentContact, email, address, dateOfBirth, gender } = req.body || {};
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanStudentId = typeof studentId === 'string' ? studentId.trim() : '';
  const cleanUsername = typeof username === 'string' ? username.trim() : '';
  const cleanEmail = typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null;
  if (!cleanName || !cleanStudentId || cleanUsername.length < 3 || typeof classId !== 'string') {
    return res.status(400).json({ message: 'Name, student ID, username, and class are required.' });
  }
  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return res.status(400).json({ message: 'Enter a valid email address.' });
  const dob = dateOfBirth ? new Date(dateOfBirth) : null;
  if (dateOfBirth && (typeof dateOfBirth !== 'string' || Number.isNaN(dob.getTime()))) return res.status(400).json({ message: 'Enter a valid date of birth.' });
  const [schoolClass, existingStudent, existingUser, existingEmail, currentRolls] = await Promise.all([
    prisma.schoolClass.findFirst({ where: { id: classId, teacherId: teacher.id } }),
    prisma.student.findUnique({ where: { studentId: cleanStudentId } }),
    prisma.user.findUnique({ where: { username: cleanUsername } }),
    cleanEmail ? prisma.user.findUnique({ where: { email: cleanEmail } }) : Promise.resolve(null),
    prisma.student.findMany({ where: { classId }, select: { rollNumber: true } }),
  ]);
  if (!schoolClass) return res.status(403).json({ message: 'Only the class teacher can add students to this class.' });
  if (existingStudent || existingUser || existingEmail) return res.status(409).json({ message: 'Student ID, username, or email already exists.' });
  const nextRoll = currentRolls.reduce((highest, record) => Math.max(highest, Number(record.rollNumber) || 0), 0) + 1;
  const temporaryPassword = randomBytes(12).toString('base64url');
  const [studentRole, passwordHash] = await Promise.all([
    prisma.role.upsert({ where: { name: 'STUDENT' }, update: {}, create: { name: 'STUDENT', description: 'Student portal access' } }),
    bcrypt.hash(temporaryPassword, 10),
  ]);
  const user = await prisma.user.create({
    data: {
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      roleId: studentRole.id,
      student: {
        create: {
          name: cleanName,
          studentId: cleanStudentId,
          classId,
          section: schoolClass.section,
          rollNumber: `${String(Number(schoolClass.name.replace('Class ', '')) || 0).padStart(2, '0')}${String(nextRoll).padStart(2, '0')}`,
          roomNumber: typeof roomNumber === 'string' ? roomNumber.trim() || null : null,
          parentName: typeof parentName === 'string' ? parentName.trim() || null : null,
          parentContact: typeof parentContact === 'string' ? parentContact.trim() || null : null,
          email: cleanEmail,
          address: typeof address === 'string' ? address.trim() || null : null,
          dob,
          gender: typeof gender === 'string' ? gender.trim() || null : null,
          academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        },
      },
    },
    include: { student: true },
  });
  res.status(201).json({ student: user.student, temporaryPassword });
});

router.delete('/students/:studentId', requirePermission('teacher:manage_students'), async (req, res) => {
  const teacher = await getTeacher(req, res);
  if (!teacher) return;
  const student = await prisma.student.findFirst({
    where: { id: req.params.studentId, class: { teacherId: teacher.id } },
    select: { id: true, userId: true },
  });
  if (!student) return res.status(404).json({ message: 'Student was not found in one of your class-teacher rosters.' });
  const fees = await prisma.fee.findMany({ where: { studentId: student.id }, select: { id: true } });
  const feeIds = fees.map((fee) => fee.id);
  await prisma.$transaction(async (tx) => {
    await tx.feePayment.deleteMany({ where: { feeId: { in: feeIds } } });
    await tx.fee.deleteMany({ where: { studentId: student.id } });
    await tx.assignmentSubmission.deleteMany({ where: { studentId: student.id } });
    await tx.result.deleteMany({ where: { studentId: student.id } });
    await tx.attendance.deleteMany({ where: { studentId: student.id } });
    await tx.notification.deleteMany({ where: { OR: [{ studentId: student.id }, { recipientId: student.userId }] } });
    await tx.activityLog.deleteMany({ where: { userId: student.userId } });
    await tx.fileDocument.deleteMany({ where: { OR: [{ uploadedById: student.userId }, { ownerId: student.id }] } });
    await tx.student.delete({ where: { id: student.id } });
    await tx.user.delete({ where: { id: student.userId } });
  });
  res.json({ message: 'Student and associated records were removed from your class roster.' });
});

router.get('/attendance', requirePermission('teacher:manage_attendance'), async (req, res) => {
  const teacher = await getTeacher(req, res);
  if (!teacher) return;
  const { classId, date } = req.query;
  if (classId && typeof classId !== 'string') return res.status(400).json({ message: 'Select a valid class.' });
  const parsedDate = date ? parseDate(date) : null;
  if (date && !parsedDate) return res.status(400).json({ message: 'Select a valid attendance date.' });
  const classes = await prisma.schoolClass.findMany({ where: { teacherId: teacher.id, ...(classId && { id: classId }) } });
  const classIds = classes.map((schoolClass) => schoolClass.id);
  if (classId && classIds.length === 0) return res.status(403).json({ message: 'Only the class teacher can access this class attendance.' });
  if (!classIds.length) return res.json({ classes: [], students: [], attendance: [] });
  const where = { classId: { in: classIds }, ...(parsedDate && { date: parsedDate }) };
  const [students, attendance] = await Promise.all([
    prisma.student.findMany({ where: { classId: { in: classIds } }, include: { class: true }, orderBy: [{ classId: 'asc' }, { rollNumber: 'asc' }] }),
    prisma.attendance.findMany({ where, include: { student: true, class: true }, orderBy: [{ date: 'desc' }, { session: 'asc' }, { student: { rollNumber: 'asc' } }] }),
  ]);
  res.json({ classes: classes.map(({ id, name, section }) => ({ id, name, section })), students, attendance });
});

router.post('/attendance', requirePermission('teacher:manage_attendance'), async (req, res) => {
  const teacher = await getTeacher(req, res);
  if (!teacher) return;
  const { classId, date, session, records } = req.body || {};
  const parsedDate = parseDate(date);
  if (!classId || !parsedDate || !['MORNING', 'AFTERNOON'].includes(session) || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: 'Class, date, session, and student attendance records are required.' });
  }
  const schoolClass = await prisma.schoolClass.findFirst({ where: { id: classId, teacherId: teacher.id }, include: { students: { select: { id: true } } } });
  if (!schoolClass) return res.status(403).json({ message: 'Only the class teacher can record attendance for this class.' });
  const studentIds = [...new Set(records.map((record) => record.studentId))];
  if (records.length !== schoolClass.students.length || studentIds.length !== records.length || studentIds.some((id) => !schoolClass.students.some((student) => student.id === id)) || records.some((record) => !['PRESENT', 'ABSENT'].includes(record.status))) {
    return res.status(400).json({ message: 'Attendance must contain one valid status for every student in this class.' });
  }
  const savedAttendance = await prisma.$transaction(records.map((record) => prisma.attendance.upsert({
    where: { studentId_date_session: { studentId: record.studentId, date: parsedDate, session } },
    create: { studentId: record.studentId, classId, date: parsedDate, session, status: record.status },
    update: { classId, status: record.status },
  })));
  res.json({ attendance: savedAttendance });
});

router.delete('/attendance/:attendanceId', requirePermission('teacher:manage_attendance'), async (req, res) => {
  const teacher = await getTeacher(req, res);
  if (!teacher) return;
  const record = await prisma.attendance.findFirst({ where: { id: req.params.attendanceId, class: { teacherId: teacher.id } } });
  if (!record) return res.status(404).json({ message: 'Attendance record not found in your class-teacher classes.' });
  await prisma.attendance.delete({ where: { id: record.id } });
  res.json({ message: 'Attendance record deleted.' });
});

router.get('/assignments', requirePermission('teacher:manage_assignments'), async (req, res) => {
  const teacher = await getTeacher(req, res);
  if (!teacher) return;
  const assignments = await prisma.assignment.findMany({
    where: { teacherId: teacher.id },
    include: {
      class: { include: { students: { select: { id: true, name: true, studentId: true, rollNumber: true } } } },
      subject: true,
      submissions: { include: { student: { select: { id: true, name: true, studentId: true, rollNumber: true } } } },
    },
    orderBy: { publishedAt: 'desc' },
  });
  res.json({ assignments });
});

router.post('/assignments', requirePermission('teacher:manage_assignments'), async (req, res) => {
  const teacher = await getTeacher(req, res);
  if (!teacher) return;
  const { title, description, classId, subjectId, dueDate } = req.body || {};
  const due = new Date(dueDate);
  if (typeof title !== 'string' || !title.trim() || typeof classId !== 'string' || !dueDate || Number.isNaN(due.getTime())) {
    return res.status(400).json({ message: 'Title, class, and valid due date are required.' });
  }
  const schoolClass = await prisma.schoolClass.findFirst({
    where: { id: classId, OR: [{ teacherId: teacher.id }, { subjects: { some: { teacherId: teacher.id } } }] },
  });
  if (!schoolClass) return res.status(403).json({ message: 'You can only post assignments to a class you teach.' });
  if (subjectId) {
    const subject = await prisma.subject.findFirst({ where: { id: subjectId, classId } });
    if (!subject || (subject.teacherId !== teacher.id && schoolClass.teacherId !== teacher.id)) {
      return res.status(400).json({ message: 'Select a subject you teach in this class.' });
    }
  }
  const assignment = await prisma.assignment.create({
    data: { title: title.trim(), description: typeof description === 'string' ? description.trim() || null : null, classId, subjectId: subjectId || null, dueDate: due, teacherId: teacher.id },
    include: { class: true, subject: true },
  });
  res.status(201).json({ assignment });
});

router.get('/notifications', requirePermission('teacher:read_notifications'), async (req, res) => {
  const teacher = await getTeacher(req, res);
  if (!teacher) return;
  const notifications = await prisma.notification.findMany({ where: { teacherId: teacher.id }, orderBy: { createdAt: 'desc' } });
  res.json({ notifications });
});

export default router;
