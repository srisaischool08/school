import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { ROLE_PERMISSIONS } from '../src/rbac.js';

const prisma = new PrismaClient();
const teacherFile = process.argv[2] || 'dummy_teachers.csv';
const studentFile = process.argv[3] || 'dummy_students.csv';
const batchKey = process.env.IMPORT_BATCH_KEY || 'DEVELOPMENT_CSV_2026';

function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(',').map((header) => header.trim().toLowerCase().replace(/[\s_-]+/g, ''));
  return lines.filter(Boolean).map((line) => Object.fromEntries(line.split(',').map((value, index) => [headers[index], value.trim()])));
}

function required(rows, columns, label) {
  if (!rows.length) throw new Error(`${label} CSV has no data rows.`);
  const missing = columns.filter((column) => !(column in rows[0]));
  if (missing.length) throw new Error(`${label} CSV is missing columns: ${missing.join(', ')}.`);
}

function validateUnique(rows, fields, label) {
  const seen = new Set();
  for (const [index, row] of rows.entries()) {
    const key = fields.map((field) => row[field]).join('\u0000');
    if (fields.some((field) => !row[field])) throw new Error(`${label} row ${index + 2} is missing ${fields.join(', ')}.`);
    if (seen.has(key)) throw new Error(`${label} contains a duplicate ${fields.join(' + ')} at row ${index + 2}.`);
    seen.add(key);
  }
}

export async function run() {
  const teachers = parseCsv(await readFile(teacherFile, 'utf8'));
  const students = parseCsv(await readFile(studentFile, 'utf8'));
  required(teachers, ['teacherid', 'teachername', 'username', 'initialpassword', 'assignedclasses', 'assignedsection', 'isclassteacher', 'active'], 'Teacher');
  if (!('assignedsubject' in teachers[0]) && !('subjects' in teachers[0])) throw new Error('Teacher CSV is missing the Subjects column.');
  required(students, ['studentid', 'studentname', 'username', 'initialpassword', 'class', 'section', 'rollnumber', 'subjects'], 'Student');
  validateUnique(teachers, ['teacherid'], 'Teacher CSV');
  validateUnique(teachers, ['username'], 'Teacher CSV');
  validateUnique(students, ['studentid'], 'Student CSV');
  validateUnique(students, ['username'], 'Student CSV');
  validateUnique(students, ['class', 'section', 'rollnumber'], 'Student CSV');
  if (await prisma.importBatch.findUnique({ where: { batchKey } })) throw new Error(`${batchKey} already exists; clear it before re-importing.`);
  const batch = await prisma.importBatch.create({ data: { batchKey, sourceType: 'DEVELOPMENT_CSV', isDemo: true } });
  const teacherRole = await ensureRole('TEACHER');
  const studentRole = await ensureRole('STUDENT');

  for (const row of teachers) {
    const assignedSubject = row.assignedsubject || row.subjects;
    if (!assignedSubject) throw new Error(`Teacher ${row.teachername} is missing a Subjects value.`);
    const assignedClasses = row.assignedclasses.split('|').map((value) => value.trim()).filter(Boolean);
    const user = await prisma.user.create({ data: { username: row.username, email: row.email || null, passwordHash: await bcrypt.hash(row.initialpassword, 12), roleId: teacherRole.id, teacher: { create: { name: row.teachername, employeeId: row.teacherid, importBatchId: batch.id } } }, include: { teacher: true } });
    for (const assignedClass of assignedClasses) {
      const schoolClass = await prisma.schoolClass.upsert({ where: { name_section: { name: assignedClass, section: row.assignedsection } }, update: {}, create: { name: assignedClass, section: row.assignedsection } });
      const subject = await prisma.subject.upsert({ where: { classId_name: { classId: schoolClass.id, name: assignedSubject } }, update: { teacherId: user.teacher.id }, create: { classId: schoolClass.id, name: assignedSubject, code: assignedSubject.replace(/[^A-Za-z0-9]+/g, '-').toUpperCase(), teacherId: user.teacher.id } });
      if (row.isclassteacher.toLowerCase() === 'true') await prisma.schoolClass.update({ where: { id: schoolClass.id }, data: { teacherId: user.teacher.id } });
      await prisma.assignment.create({ data: { title: `${subject.name} assignment`, description: 'Development assignment imported with the teacher dataset.', classId: schoolClass.id, subjectId: subject.id, teacherId: user.teacher.id, dueDate: new Date(Date.now() + 7 * 86400000), importBatchId: batch.id } });
    }
  }

  for (const row of students) {
    const schoolClass = await prisma.schoolClass.upsert({ where: { name_section: { name: row.class, section: row.section } }, update: {}, create: { name: row.class, section: row.section } });
    const user = await prisma.user.create({ data: { username: row.username, email: row.email || null, passwordHash: await bcrypt.hash(row.initialpassword, 12), roleId: studentRole.id, student: { create: { name: row.studentname, studentId: row.studentid, classId: schoolClass.id, section: row.section, rollNumber: row.rollnumber, roomNumber: row.roomnumber || null, academicYear: row.academicyear || null, gender: ['Male', 'Female'].includes(row.gender) ? row.gender : null, subjects: row.subjects || null, parentName: row.parentname || null, parentContact: row.parentcontact || null, email: row.email || null, address: row.address || null, importBatchId: batch.id } } }, include: { student: true } });
    const feePlan = [
      ['Tuition Fee', 'TUITION', 10000],
      ['Dress Fee', 'DRESS', 5000],
      ['Bus Fee', 'BUS', 15000],
    ];
    for (const [index, [title, category, amount]] of feePlan.entries()) {
      const paidAmount = Math.min(amount, (Number(row.rollnumber.slice(-2)) * 137 + index * 500) % (amount + 1));
      await prisma.fee.create({
        data: {
          studentId: user.student.id,
          title,
          category,
          amount,
          paidAmount,
          balance: Math.max(0, amount - paidAmount),
          dueDate: new Date('2027-03-31T00:00:00.000Z'),
          status: paidAmount >= amount ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'PENDING',
          importBatchId: batch.id,
        },
      });
    }
    for (let day = 0; day < 5; day += 1) {
      const date = new Date(Date.UTC(2026, 8, 1 + day));
      for (const session of ['MORNING', 'AFTERNOON']) {
        await prisma.attendance.create({
          data: {
            studentId: user.student.id,
            classId: schoolClass.id,
            date,
            session,
            status: (Number(row.rollnumber.slice(-2)) + day + (session === 'AFTERNOON' ? 1 : 0)) % 7 === 0 ? 'ABSENT' : 'PRESENT',
            importBatchId: batch.id,
          },
        });
      }
    }
  }
  console.log(`Imported ${teachers.length} teachers and ${students.length} students into ${batchKey}.`);
}

async function ensureRole(name) {
  const permissions = await Promise.all((ROLE_PERMISSIONS[name] || []).map((permissionName) => prisma.permission.upsert({ where: { name: permissionName }, update: {}, create: { name: permissionName, description: permissionName } })));
  return prisma.role.upsert({
    where: { name },
    update: { permissions: { connect: permissions.map(({ id }) => ({ id })) } },
    create: { name, description: `${name} portal access`, permissions: { connect: permissions.map(({ id }) => ({ id })) } },
  });
}

if (process.argv[1]?.endsWith('import-development-csv.js')) {
  run().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
}
