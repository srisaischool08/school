import express from 'express';
import { randomBytes } from 'node:crypto';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { requirePermission, ROLE_PERMISSIONS } from '../rbac.js';

const router = express.Router();
const prisma = new PrismaClient();
const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

function parseCsv(buffer) {
  const lines = buffer.toString('utf8').split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { headers: [], rows: [] };
  const parseLine = (line) => {
    const cells = [];
    let value = '';
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"') quoted = !quoted;
      else if (char === ',' && !quoted) { cells.push(value.trim()); value = ''; }
      else value += char;
    }
    cells.push(value.trim());
    return cells;
  };
  const headers = parseLine(lines.shift()).map((header) => header.toLowerCase());
  return { headers, rows: lines.map((line) => Object.fromEntries(parseLine(line).map((value, index) => [headers[index], value]))) };
}

function requiredColumns(headers, required) {
  return required.filter((column) => !headers.includes(column));
}

async function ensureRole(name) {
  const permissionNames = ROLE_PERMISSIONS[name] || [];
  const permissions = await Promise.all(permissionNames.map((permissionName) => prisma.permission.upsert({
    where: { name: permissionName },
    update: {},
    create: { name: permissionName, description: permissionName },
  })));
  return prisma.role.upsert({
    where: { name },
    update: { permissions: { connect: permissions.map(({ id }) => ({ id })) } },
    create: { name, description: `${name} portal access`, permissions: { connect: permissions.map(({ id }) => ({ id })) } },
  });
}

router.use(authMiddleware);

router.get('/dashboard', requirePermission('admin:dashboard'), async (req, res) => {
  const userRole = req.user.role.name;

  const [studentsCount, teachersCount, assignmentsCount, notificationsCount, newEnquiriesCount, latestEnquiries] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.assignment.count(),
    prisma.notification.count({ where: { recipientRole: userRole, isRead: false } }),
    userRole === 'SUPER_ADMIN' ? prisma.admissionEnquiry.count({ where: { status: 'NEW' } }) : Promise.resolve(0),
    userRole === 'SUPER_ADMIN' ? prisma.admissionEnquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }) : Promise.resolve([]),
  ]);

  res.json({
    role: userRole,
    summary: {
      studentsCount,
      teachersCount,
      assignmentsCount,
      notificationsCount,
      newEnquiriesCount,
      latestEnquiries,
    },
  });
});

router.get('/students', requirePermission('admin:students:view'), async (req, res) => {
  const className = typeof req.query.className === 'string' ? req.query.className.trim() : '';
  const classFilter = className ? { class: { name: className } } : {};
  const students = await prisma.student.findMany({
    where: classFilter,
    include: {
      class: {
        include: {
          teacher: { select: { name: true, employeeId: true } },
          subjects: { include: { teacher: { select: { name: true, employeeId: true } } } },
        },
      },
      user: { select: { username: true } },
      fees: { select: { amount: true, paidAmount: true } },
    },
    orderBy: [{ class: { name: 'asc' } }, { rollNumber: 'asc' }],
  });
  const classes = await prisma.schoolClass.findMany({
    where: { students: { some: {} } },
    select: { name: true },
    distinct: ['name'],
    orderBy: { name: 'asc' },
  });
  const classOptions = await prisma.schoolClass.findMany({
    select: { id: true, name: true, section: true },
    orderBy: [{ name: 'asc' }, { section: 'asc' }],
  });
  res.json({
    students: students.map((student) => ({
      ...student,
      classTeacherName: student.class?.teacher?.name || student.class?.subjects?.find((subject) => subject.teacher)?.teacher?.name || 'Teacher 1',
    })),
    classes: classes.map(({ name }) => name),
    classOptions,
  });
});

router.get('/teachers', requirePermission('admin:teachers:view'), async (_req, res) => {
  const teachers = await prisma.teacher.findMany({
    include: {
      user: { select: { username: true } },
      classes: { select: { name: true, section: true, teacherId: true } },
      subjects: { select: { name: true, class: { select: { name: true, section: true } } } },
    },
    orderBy: { employeeId: 'asc' },
  });
  res.json({
    teachers: teachers.map((teacher) => ({
      ...teacher,
      isClassTeacher: teacher.classes.some((schoolClass) => schoolClass.teacherId === teacher.id),
      classTeacherFor: teacher.classes
        .filter((schoolClass) => schoolClass.teacherId === teacher.id)
        .map((schoolClass) => `${schoolClass.name} - Section ${schoolClass.section}`),
      assignedClass: teacher.classes.length
        ? teacher.classes.map((schoolClass) => schoolClass.name).join(', ')
        : teacher.subjects.map((subject) => subject.class?.name).filter(Boolean).join(', ') || 'Assigned School Class',
      assignedSubjects: teacher.subjects.map((subject) => subject.name).join(', ') || 'Assigned Subject',
    })),
  });
});

router.get('/attendance', requirePermission('admin:attendance:manage'), async (req, res) => {
  const className = typeof req.query.className === 'string' ? req.query.className.trim() : '';
  const section = typeof req.query.section === 'string' ? req.query.section.trim() : '';
  const date = typeof req.query.date === 'string' ? req.query.date.trim() : '';
  const month = typeof req.query.month === 'string' ? req.query.month.trim() : '';
  const session = typeof req.query.session === 'string' ? req.query.session.trim() : '';

  const availableClasses = await prisma.schoolClass.findMany({
    where: { students: { some: {} } },
    select: { name: true, section: true, teacher: { select: { name: true } } },
    orderBy: [{ name: 'asc' }, { section: 'asc' }],
  });
  const classNames = [...new Set(availableClasses.map(({ name }) => name))];

  if (req.user.role.name === 'SUPER_ADMIN') {
    const classSummaries = await prisma.schoolClass.findMany({
      where: { students: { some: {} } },
      orderBy: [{ name: 'asc' }, { section: 'asc' }],
      select: { id: true, name: true, students: { select: { id: true } } },
    });

    const sectionSummaries = await Promise.all(classSummaries.map(async (schoolClass) => {
      const latestAttendance = await prisma.attendance.aggregate({
        where: { classId: schoolClass.id },
        _max: { date: true },
      });
      let present = 0;

      if (latestAttendance._max.date) {
        const dayStart = new Date(latestAttendance._max.date);
        dayStart.setUTCHours(0, 0, 0, 0);
        const nextDay = new Date(dayStart);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);
        const records = await prisma.attendance.findMany({
          where: { classId: schoolClass.id, date: { gte: dayStart, lt: nextDay } },
          select: { studentId: true, session: true, status: true },
        });
        const sessionPriority = { FULL_DAY: 1, MORNING: 2, AFTERNOON: 3 };
        const latestByStudent = new Map();
        records.forEach((record) => {
          const current = latestByStudent.get(record.studentId);
          if (!current || (sessionPriority[record.session] || 0) > (sessionPriority[current.session] || 0)) {
            latestByStudent.set(record.studentId, record);
          }
        });
        present = [...latestByStudent.values()].filter((record) => record.status === 'PRESENT').length;
      }

      return {
        name: schoolClass.name,
        totalStudents: schoolClass.students.length,
        present,
      };
    }));

    const byClassName = new Map();
    sectionSummaries.forEach((row) => {
      const current = byClassName.get(row.name) || { name: row.name, totalStudents: 0, present: 0 };
      current.totalStudents += row.totalStudents;
      current.present += row.present;
      byClassName.set(row.name, current);
    });

    return res.json({
      classes: classNames,
      sections: [],
      classTeacher: null,
      summary: null,
      attendance: [],
      summaryRows: [...byClassName.values()].map((row) => ({
        name: row.name,
        totalStudents: row.totalStudents,
        present: row.present,
      })),
    });
  }

  if (!className) return res.json({ classes: classNames, sections: [], classTeacher: null, summary: null, attendance: [] });

  const selectedClass = availableClasses.find((item) => item.name === className && (!section || item.section === section));
  if (!selectedClass) return res.status(400).json({ message: 'Select a valid class and section.' });
  const schoolClass = await prisma.schoolClass.findUnique({
    where: { name_section: { name: selectedClass.name, section: selectedClass.section } },
    include: { teacher: { select: { name: true } }, students: { orderBy: { rollNumber: 'asc' } } },
  });
  const where = { classId: schoolClass.id, ...(session && session !== 'ALL' ? { session } : {}) };
  if (date) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    where.date = { gte: start, lt: end };
  } else if (/^\d{4}-\d{2}$/.test(month)) {
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
    where.date = { gte: start, lt: end };
  }
  const [records, overallRecords] = await Promise.all([
    prisma.attendance.findMany({ where, orderBy: { date: 'desc' } }),
    prisma.attendance.findMany({ where: { classId: schoolClass.id } }),
  ]);
  const byStudent = new Map(schoolClass.students.map((student) => [student.id, []]));
  records.forEach((record) => byStudent.get(record.studentId)?.push(record));
  const overallByStudent = new Map(schoolClass.students.map((student) => [student.id, []]));
  overallRecords.forEach((record) => overallByStudent.get(record.studentId)?.push(record));
  const attendance = schoolClass.students.map((student) => {
    const studentRecords = byStudent.get(student.id) || [];
    const overallStudentRecords = overallByStudent.get(student.id) || [];
    const present = overallStudentRecords.filter((record) => record.status === 'PRESENT').length;
    const absent = overallStudentRecords.length - present;
    const latest = studentRecords[0];
    return {
      studentId: student.studentId,
      name: student.name,
      rollNumber: student.rollNumber,
      class: schoolClass.name,
      section: schoolClass.section,
      classTeacher: schoolClass.teacher?.name || null,
      status: latest ? (latest.status === 'PRESENT' ? 'Present' : 'Absent') : 'No record',
      attendancePercentage: present + absent ? Number(((present / (present + absent)) * 100).toFixed(2)) : 0,
      present,
      absent,
      date: latest?.date || null,
      session: latest?.session || null,
    };
  });
  const selectedByStudent = schoolClass.students.map((student) => {
    const studentRecords = byStudent.get(student.id) || [];
    const presentSessions = studentRecords.filter((record) => record.status === 'PRESENT').length;
    return presentSessions > 0;
  });
  const present = selectedByStudent.filter(Boolean).length;
  const absent = selectedByStudent.length - present;
  const totalRecords = present + absent;
  res.json({
    classes: classNames,
    sections: availableClasses.filter((item) => item.name === className).map((item) => item.section),
    classTeacher: schoolClass.teacher?.name || null,
    summary: {
      totalStudents: schoolClass.students.length,
      present,
      absent,
      presentPercentage: totalRecords ? Number(((present / totalRecords) * 100).toFixed(2)) : 0,
      absentPercentage: totalRecords ? Number(((absent / totalRecords) * 100).toFixed(2)) : 0,
    },
    attendance,
  });
});

router.put('/students/:studentId', requirePermission('admin:students:manage'), async (req, res) => {
  const student = await prisma.student.findUnique({ where: { id: req.params.studentId }, include: { user: true } });
  if (!student) return res.status(404).json({ message: 'Student record not found.' });
  const { name, gender, rollNumber, username, classId, parentName, parentContact, roomNumber, academicYear, subjects, email, address } = req.body || {};
  const cleanName = typeof name === 'string' ? name.trim() : student.name;
  const cleanUsername = typeof username === 'string' ? username.trim() : student.user.username;
  if (!cleanName || !cleanUsername || !classId) return res.status(400).json({ message: 'Name, username, and class are required.' });
  const [existingUser, existingStudentId, schoolClass] = await Promise.all([
    prisma.user.findUnique({ where: { username: cleanUsername } }),
    prisma.student.findUnique({ where: { studentId: req.body?.studentId || student.studentId } }),
    prisma.schoolClass.findUnique({ where: { id: classId } }),
  ]);
  if (!schoolClass) return res.status(400).json({ message: 'Select a valid class and section.' });
  if (existingUser && existingUser.id !== student.userId) return res.status(409).json({ message: 'That username is already in use.' });
  if (existingStudentId && existingStudentId.id !== student.id) return res.status(409).json({ message: 'That Student ID is already in use.' });
  const updated = await prisma.student.update({
    where: { id: student.id },
    data: {
      name: cleanName,
      studentId: typeof req.body?.studentId === 'string' ? req.body.studentId.trim() : student.studentId,
      gender: typeof gender === 'string' ? gender.trim() : student.gender,
      rollNumber: typeof rollNumber === 'string' ? rollNumber.trim() : student.rollNumber,
      class: { connect: { id: schoolClass.id } },
      section: schoolClass.section,
      parentName: typeof parentName === 'string' ? parentName.trim() : student.parentName,
      parentContact: typeof parentContact === 'string' ? parentContact.trim() : student.parentContact,
      roomNumber: typeof roomNumber === 'string' ? roomNumber.trim() : student.roomNumber,
      academicYear: typeof academicYear === 'string' ? academicYear.trim() : student.academicYear,
      subjects: typeof subjects === 'string' ? subjects.trim() : student.subjects,
      email: typeof email === 'string' ? email.trim() : student.email,
      address: typeof address === 'string' ? address.trim() : student.address,
      user: { update: { username: cleanUsername } },
    },
    include: { class: { include: { teacher: { select: { name: true } } } }, user: { select: { username: true } } },
  });
  res.json({ student: updated });
});

router.put('/teachers/:teacherId', requirePermission('admin:teachers:manage'), async (req, res) => {
  const teacher = await prisma.teacher.findUnique({ where: { id: req.params.teacherId }, include: { user: true, classes: true, subjects: true } });
  if (!teacher) return res.status(404).json({ message: 'Teacher record not found.' });
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : teacher.name;
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : teacher.user.username;
  if (!name || !username) return res.status(400).json({ message: 'Teacher name and username are required.' });
  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser && existingUser.id !== teacher.userId) return res.status(409).json({ message: 'That username is already in use.' });
  const classIds = Array.isArray(req.body?.classIds) ? req.body.classIds.filter((id) => typeof id === 'string') : teacher.classes.map((schoolClass) => schoolClass.id);
  const subjectNames = Array.isArray(req.body?.subjects) ? req.body.subjects.map((subject) => String(subject).trim()).filter(Boolean) : teacher.subjects.map((subject) => subject.name);
  const classes = await prisma.schoolClass.findMany({ where: { id: { in: classIds } } });
  if (classes.length !== classIds.length) return res.status(400).json({ message: 'Select valid assigned classes.' });
  const updated = await prisma.$transaction(async (tx) => {
    await tx.schoolClass.updateMany({ where: { teacherId: teacher.id }, data: { teacherId: null } });
    await tx.schoolClass.updateMany({ where: { id: { in: classIds } }, data: { teacherId: teacher.id } });
    await tx.subject.updateMany({ where: { teacherId: teacher.id }, data: { teacherId: null } });
    for (const schoolClass of classes) {
      for (const subjectName of subjectNames) {
        await tx.subject.upsert({ where: { classId_name: { classId: schoolClass.id, name: subjectName } }, update: { teacherId: teacher.id }, create: { classId: schoolClass.id, name: subjectName, code: subjectName.replace(/[^A-Za-z0-9]+/g, '-').toUpperCase(), teacherId: teacher.id } });
      }
    }
    return tx.teacher.update({ where: { id: teacher.id }, data: { name, user: { update: { username } } }, include: { user: { select: { username: true } }, classes: true, subjects: true } });
  });
  res.json({ teacher: updated });
});

router.post('/teachers', requirePermission('admin:teachers:manage'), async (req, res) => {
  const { employeeId, name, username, password, classIds, subjects, email } = req.body || {};
  const cleanEmployeeId = typeof employeeId === 'string' ? employeeId.trim() : '';
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanUsername = typeof username === 'string' ? username.trim() : '';
  const selectedClassIds = Array.isArray(classIds) ? classIds.filter((id) => typeof id === 'string') : [];
  const subjectNames = Array.isArray(subjects) ? subjects.map((subject) => String(subject).trim()).filter(Boolean) : [];
  if (!cleanEmployeeId || !cleanName || !cleanUsername || !selectedClassIds.length || !subjectNames.length) return res.status(400).json({ message: 'Teacher ID, name, username, classes, and subjects are required.' });
  if (password !== undefined && (typeof password !== 'string' || password.length < 8)) return res.status(400).json({ message: 'Password must contain at least 8 characters.' });
  const [existingTeacher, existingUser, classes] = await Promise.all([
    prisma.teacher.findUnique({ where: { employeeId: cleanEmployeeId } }),
    prisma.user.findUnique({ where: { username: cleanUsername } }),
    prisma.schoolClass.findMany({ where: { id: { in: selectedClassIds } } }),
  ]);
  if (existingTeacher || existingUser) return res.status(409).json({ message: 'Teacher ID or username already exists.' });
  if (classes.length !== selectedClassIds.length) return res.status(400).json({ message: 'Select valid assigned classes.' });
  const passwordValue = password || randomBytes(12).toString('base64url');
  const role = await ensureRole('TEACHER');
  const teacher = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { username: cleanUsername, email: typeof email === 'string' ? email.trim() || null : null, passwordHash: await bcrypt.hash(passwordValue, 12), roleId: role.id, teacher: { create: { employeeId: cleanEmployeeId, name: cleanName } } }, include: { teacher: true } });
    await tx.schoolClass.updateMany({ where: { id: { in: selectedClassIds } }, data: { teacherId: user.teacher.id } });
    for (const schoolClass of classes) for (const subjectName of subjectNames) await tx.subject.upsert({ where: { classId_name: { classId: schoolClass.id, name: subjectName } }, update: { teacherId: user.teacher.id }, create: { classId: schoolClass.id, name: subjectName, code: subjectName.replace(/[^A-Za-z0-9]+/g, '-').toUpperCase(), teacherId: user.teacher.id } });
    return user.teacher;
  });
  res.status(201).json({ teacher, ...(password ? {} : { temporaryPassword: passwordValue }) });
});

router.delete('/teachers/:teacherId', requirePermission('admin:teachers:manage'), async (req, res) => {
  const teacher = await prisma.teacher.findUnique({ where: { id: req.params.teacherId }, select: { id: true, userId: true } });
  if (!teacher) return res.status(404).json({ message: 'Teacher record not found.' });
  await prisma.$transaction(async (tx) => {
    await tx.schoolClass.updateMany({ where: { teacherId: teacher.id }, data: { teacherId: null } });
    await tx.subject.updateMany({ where: { teacherId: teacher.id }, data: { teacherId: null } });
    await tx.assignment.updateMany({ where: { teacherId: teacher.id }, data: { teacherId: null } });
    await tx.exam.updateMany({ where: { teacherId: teacher.id }, data: { teacherId: null } });
    await tx.notification.deleteMany({ where: { teacherId: teacher.id } });
    await tx.teacher.delete({ where: { id: teacher.id } });
    await tx.user.delete({ where: { id: teacher.userId } });
  });
  res.json({ message: 'Teacher removed successfully.' });
});

router.post('/students', requirePermission('admin:students:manage'), async (req, res) => {
  const {
    name, studentId, username, password, classId, rollNumber, roomNumber, academicYear,
    dateOfBirth, gender, parentName, parentContact, email, address, subjects,
  } = req.body || {};
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanStudentId = typeof studentId === 'string' ? studentId.trim() : '';
  const cleanUsername = typeof username === 'string' ? username.trim() : '';
  const cleanEmail = typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null;
  const optionalText = (value) => typeof value === 'string' ? value.trim() || null : null;
  if (!cleanName || !cleanStudentId || cleanUsername.length < 3 || typeof classId !== 'string') {
    return res.status(400).json({ message: 'Student name, student ID, username, and class are required.' });
  }
  if (password !== undefined && (typeof password !== 'string' || password.length < 8)) {
    return res.status(400).json({ message: 'Password must contain at least 8 characters.' });
  }
  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ message: 'Enter a valid email address.' });
  }
  const dob = dateOfBirth ? typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : new Date(Number.NaN) : null;
  if (dateOfBirth && Number.isNaN(dob.getTime())) return res.status(400).json({ message: 'Enter a valid date of birth.' });
  const rollNumberValue = optionalText(rollNumber);
  const [existingStudent, existingUsername, existingEmail, schoolClass, existingRollNumber] = await Promise.all([
    prisma.student.findUnique({ where: { studentId: cleanStudentId } }),
    prisma.user.findUnique({ where: { username: cleanUsername } }),
    cleanEmail ? prisma.user.findUnique({ where: { email: cleanEmail } }) : Promise.resolve(null),
    prisma.schoolClass.findUnique({ where: { id: classId } }),
    rollNumberValue
      ? prisma.student.findFirst({ where: { classId, rollNumber: rollNumberValue }, select: { id: true } })
      : Promise.resolve(null),
  ]);
  if (existingStudent || existingUsername || existingEmail) return res.status(409).json({ message: 'Student ID, username, or email already exists.' });
  if (!schoolClass) return res.status(400).json({ message: 'Select a valid class and section.' });
  if (existingRollNumber) return res.status(409).json({ message: 'That roll number is already used in the selected class.' });

  const temporaryPassword = password || randomBytes(12).toString('base64url');
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);
  const studentRole = await ensureRole('STUDENT');

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
          classId: schoolClass.id,
          section: schoolClass.section,
          rollNumber: rollNumberValue,
          roomNumber: optionalText(roomNumber),
          academicYear: optionalText(academicYear),
          dob,
          gender: optionalText(gender),
          parentName: optionalText(parentName),
          parentContact: optionalText(parentContact),
          email: cleanEmail,
          address: optionalText(address),
          subjects: optionalText(subjects),
        },
      },
    },
    include: { student: true },
  });
  res.status(201).json({ student: user.student, ...(password ? {} : { temporaryPassword }) });
});

router.delete('/students/:studentId', requirePermission('admin:students:manage'), async (req, res) => {
  const student = await prisma.student.findUnique({ where: { id: req.params.studentId }, select: { id: true, userId: true } });
  if (!student) return res.status(404).json({ message: 'Student record not found.' });
  const fees = await prisma.fee.findMany({ where: { studentId: student.id }, select: { id: true } });
  await prisma.$transaction(async (tx) => {
    await tx.feePayment.deleteMany({ where: { feeId: { in: fees.map((fee) => fee.id) } } });
    await tx.fee.deleteMany({ where: { studentId: student.id } });
    await tx.assignmentSubmission.deleteMany({ where: { studentId: student.id } });
    await tx.result.deleteMany({ where: { studentId: student.id } });
    await tx.attendance.deleteMany({ where: { studentId: student.id } });
    await tx.notification.deleteMany({ where: { studentId: student.id } });
    await tx.activityLog.deleteMany({ where: { userId: student.userId } });
    await tx.student.delete({ where: { id: student.id } });
    await tx.user.delete({ where: { id: student.userId } });
  });
  res.json({ message: 'Student removed successfully.' });
});

router.post('/import/students', requirePermission('admin:students:manage'), csvUpload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Upload a CSV file in the file field.' });
  const { headers, rows } = parseCsv(req.file.buffer);
  const missing = requiredColumns(headers, ['name', 'studentid', 'username', 'classname', 'section']);
  if (missing.length) return res.status(400).json({ message: `Missing required CSV columns: ${missing.join(', ')}.` });
  const errors = [];
  const credentials = [];
  let imported = 0;
  for (const [index, row] of rows.entries()) {
    const line = index + 2;
    const name = row.name?.trim();
    const studentId = row.studentid?.trim();
    const username = row.username?.trim();
    const className = row.classname?.trim();
    const section = row.section?.trim();
    if (!name || !studentId || !username || !className || !section) { errors.push({ line, message: 'name, studentId, username, className, and section are required.' }); continue; }
    try {
      const schoolClass = await prisma.schoolClass.upsert({ where: { name_section: { name: className, section } }, update: {}, create: { name: className, section } });
      const [existingStudent, existingUser] = await Promise.all([
        prisma.student.findUnique({ where: { studentId } }),
        prisma.user.findUnique({ where: { username } }),
      ]);
      if (existingStudent || existingUser) throw new Error('studentId or username already exists');
      const temporaryPassword = randomBytes(16).toString('base64url');
      const passwordHash = await bcrypt.hash(temporaryPassword, 12);
      const user = await prisma.user.create({
        data: {
          username, email: row.email?.trim() || null, passwordHash,
          roleId: (await ensureRole('STUDENT')).id,
          student: { create: {
            name, studentId, classId: schoolClass.id, section,
            rollNumber: row.rollnumber?.trim() || null, roomNumber: row.roomnumber?.trim() || null,
            academicYear: row.academicyear?.trim() || null, gender: row.gender?.trim() || null,
            parentName: row.parentname?.trim() || null, parentContact: row.parentcontact?.trim() || null,
            email: row.email?.trim() || null, address: row.address?.trim() || null,
            dob: row.dateofbirth ? new Date(row.dateofbirth) : null,
          } },
        },
      });
      imported += 1;
      credentials.push({ username: user.username, temporaryPassword });
    } catch (error) {
      errors.push({ line, message: error.message || 'Unable to import row.' });
    }
  }
  res.status(errors.length && !imported ? 400 : 200).json({ imported, rejected: errors.length, errors, credentials });
});

router.post('/import/teachers', requirePermission('admin:teachers:view'), csvUpload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Upload a CSV file in the file field.' });
  const { headers, rows } = parseCsv(req.file.buffer);
  const missing = requiredColumns(headers, ['name', 'employeeid', 'username']);
  if (missing.length) return res.status(400).json({ message: `Missing required CSV columns: ${missing.join(', ')}.` });
  const errors = [];
  const credentials = [];
  let imported = 0;
  for (const [index, row] of rows.entries()) {
    const line = index + 2;
    const name = row.name?.trim();
    const employeeId = row.employeeid?.trim();
    const username = row.username?.trim();
    if (!name || !employeeId || !username) { errors.push({ line, message: 'name, employeeId, and username are required.' }); continue; }
    try {
      const [existingTeacher, existingUser] = await Promise.all([
        prisma.teacher.findUnique({ where: { employeeId } }),
        prisma.user.findUnique({ where: { username } }),
      ]);
      if (existingTeacher || existingUser) throw new Error('employeeId or username already exists');
      const temporaryPassword = randomBytes(16).toString('base64url');
      const passwordHash = await bcrypt.hash(temporaryPassword, 12);
      const user = await prisma.user.create({
        data: {
          username, email: row.email?.trim() || null, passwordHash,
          roleId: (await ensureRole('TEACHER')).id,
          teacher: { create: { name, employeeId } },
        },
        include: { teacher: true },
      });
      if (row.subject?.trim() && row.classname?.trim() && row.section?.trim()) {
        const schoolClass = await prisma.schoolClass.upsert({
          where: { name_section: { name: row.classname.trim(), section: row.section.trim() } },
          update: {},
          create: { name: row.classname.trim(), section: row.section.trim() },
        });
        await prisma.subject.upsert({
          where: { classId_name: { classId: schoolClass.id, name: row.subject.trim() } },
          update: { teacherId: user.teacher.id },
          create: { classId: schoolClass.id, name: row.subject.trim(), code: row.subject.trim().replace(/[^A-Za-z0-9]+/g, '-').toUpperCase(), teacherId: user.teacher.id },
        });
      }
      imported += 1;
      credentials.push({ username: user.username, temporaryPassword });
    } catch (error) {
      errors.push({ line, message: error.message || 'Unable to import row.' });
    }
  }
  res.status(errors.length && !imported ? 400 : 200).json({ imported, rejected: errors.length, errors, credentials });
});

router.get('/teachers', requirePermission('admin:teachers:view'), async (_req, res) => {
  const teachers = await prisma.teacher.findMany({ include: { classes: true } });
  res.json({ teachers });
});

router.get('/fees', requirePermission('admin:fees:manage'), async (req, res) => {
  const className = typeof req.query.className === 'string' ? req.query.className.trim() : '';
  const [classes, students] = await Promise.all([
    prisma.schoolClass.findMany({
      select: { name: true },
      distinct: ['name'],
      orderBy: { name: 'asc' },
    }),
    className
      ? prisma.student.findMany({
        where: { class: { name: className } },
        include: {
          class: { select: { name: true, section: true } },
          fees: {
            include: { payments: { orderBy: { paidAt: 'desc' } } },
            orderBy: [{ dueDate: 'asc' }, { title: 'asc' }],
          },
        },
        orderBy: [{ rollNumber: 'asc' }, { name: 'asc' }],
      })
      : Promise.resolve([]),
  ]);

  const studentRows = students.map((student) => {
    const fees = student.fees.map((fee) => {
      const effectivePaidAmount = fee.payments.length
        ? fee.payments.reduce((sum, payment) => sum + payment.amount, 0)
        : fee.paidAmount;
      return {
        ...fee,
        effectivePaidAmount,
        pendingAmount: Math.max(0, fee.amount - effectivePaidAmount),
      };
    });
    const totalFee = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const paidAmount = fees.reduce((sum, fee) => sum + fee.effectivePaidAmount, 0);
    const pendingAmount = Math.max(0, totalFee - paidAmount);
    const status = !fees.length
      ? 'No fee records'
      : pendingAmount === 0
        ? 'Paid'
        : paidAmount > 0
          ? 'Partial'
          : fees.some((fee) => fee.dueDate < new Date() && fee.pendingAmount > 0)
            ? 'Overdue'
            : 'Pending';
    return {
      id: student.id,
      studentId: student.studentId,
      name: student.name,
      class: student.class,
      fees,
      totalFee,
      paidAmount,
      pendingAmount,
      status,
    };
  });
  const summary = studentRows.reduce((totals, student) => ({
    totalStudents: totals.totalStudents + 1,
    totalFees: totals.totalFees + student.totalFee,
    totalCollected: totals.totalCollected + student.paidAmount,
    totalPending: totals.totalPending + student.pendingAmount,
  }), { totalStudents: 0, totalFees: 0, totalCollected: 0, totalPending: 0 });

  res.json({
    classes: classes.map(({ name }) => name),
    selectedClass: className || null,
    students: studentRows,
    summary,
  });
});

router.get('/notifications', requirePermission('admin:notifications:manage'), async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { OR: [{ recipientRole: 'SUPER_ADMIN' }, { recipientId: req.user.id }] },
    include: { admissionEnquiry: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ notifications });
});

router.get('/website', requirePermission('admin:website:manage'), async (_req, res) => {
  const content = await prisma.websiteContent.findMany();
  res.json({ content });
});

router.get('/gallery', requirePermission('admin:gallery:view'), async (_req, res) => {
  const gallery = await prisma.galleryImage.findMany({
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    include: { album: true, category: true, event: true, createdBy: { select: { username: true } } },
  });
  const [albums, categories] = await Promise.all([
    prisma.galleryAlbum.findMany({ orderBy: { name: 'asc' } }),
    prisma.galleryCategory.findMany({ orderBy: { name: 'asc' } }),
  ]);
  res.json({ gallery, albums, categories });
});

export default router;
