import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const batchKey = process.env.IMPORT_BATCH_KEY || 'DEVELOPMENT_CSV_2026';

async function run() {
  const batch = await prisma.importBatch.findUnique({ where: { batchKey } });
  if (!batch) { console.log(`${batchKey} does not exist; nothing removed.`); return; }
  await prisma.$transaction(async (tx) => {
    const students = await tx.student.findMany({ where: { importBatchId: batch.id }, select: { id: true, userId: true } });
    const teachers = await tx.teacher.findMany({ where: { importBatchId: batch.id }, select: { id: true, userId: true } });
    const studentIds = students.map(({ id }) => id);
    const teacherIds = teachers.map(({ id }) => id);
    const userIds = [...students, ...teachers].map(({ userId }) => userId);
    const assignments = await tx.assignment.findMany({ where: { importBatchId: batch.id }, select: { id: true } });
    const exams = await tx.exam.findMany({ where: { importBatchId: batch.id }, select: { id: true } });
    const fees = await tx.fee.findMany({ where: { importBatchId: batch.id }, select: { id: true } });
    await tx.feePayment.deleteMany({ where: { OR: [{ importBatchId: batch.id }, { feeId: { in: fees.map(({ id }) => id) } }] } });
    await tx.assignmentSubmission.deleteMany({ where: { OR: [{ importBatchId: batch.id }, { studentId: { in: studentIds } }, { assignmentId: { in: assignments.map(({ id }) => id) } }] } });
    await tx.result.deleteMany({ where: { OR: [{ importBatchId: batch.id }, { studentId: { in: studentIds } }, { examId: { in: exams.map(({ id }) => id) } }] } });
    await tx.attendance.deleteMany({ where: { OR: [{ importBatchId: batch.id }, { studentId: { in: studentIds } }] } });
    await tx.fee.deleteMany({ where: { OR: [{ importBatchId: batch.id }, { studentId: { in: studentIds } }] } });
    await tx.assignment.deleteMany({ where: { OR: [{ importBatchId: batch.id }, { teacherId: { in: teacherIds } }] } });
    await tx.exam.deleteMany({ where: { OR: [{ importBatchId: batch.id }, { teacherId: { in: teacherIds } }] } });
    await tx.notification.deleteMany({ where: { OR: [{ importBatchId: batch.id }, { studentId: { in: studentIds } }, { teacherId: { in: teacherIds } }] } });
    await tx.student.deleteMany({ where: { id: { in: studentIds }, importBatchId: batch.id } });
    await tx.teacher.deleteMany({ where: { id: { in: teacherIds }, importBatchId: batch.id } });
    await tx.user.deleteMany({ where: { id: { in: userIds } } });
    await tx.importBatch.delete({ where: { id: batch.id } });
  });
  console.log(`Removed only ${batchKey} records.`);
}
run().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
