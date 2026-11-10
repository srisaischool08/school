import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const permissions = [
  'admin:dashboard', 'admin:students:view', 'admin:teachers:view',
  'admin:attendance:manage', 'admin:academics:manage', 'admin:exams:manage',
  'admin:results:manage', 'admin:fees:manage', 'admin:notifications:manage',
  'admin:events:manage', 'admin:assignments:manage', 'admin:gallery:view',
  'admin:gallery:create', 'admin:gallery:update', 'admin:gallery:delete',
  'admin:website:manage', 'admin:users:manage', 'admin:roles:manage',
  'admin:system:manage', 'admin:activity-logs:view', 'admin:admissions:view',
  'admin:admissions:manage',
];

const records = await Promise.all(
  permissions.map((name) => prisma.permission.upsert({
    where: { name },
    update: {},
    create: { name, description: name },
  })),
);

const role = await prisma.role.upsert({
  where: { name: 'SUPER_ADMIN' },
  update: { permissions: { connect: records.map(({ id }) => ({ id })) } },
  create: {
    name: 'SUPER_ADMIN',
    description: 'Super Admin portal access',
    permissions: { connect: records.map(({ id }) => ({ id })) },
  },
});

const passwordHash = await bcrypt.hash('Password@123', 12);
const existing = await prisma.user.findUnique({ where: { username: 'superadmin' } });
const user = existing
  ? await prisma.user.update({
    where: { id: existing.id },
    data: { passwordHash, roleId: role.id, isActive: true, email: 'superadmin@srisai.edu' },
  })
  : await prisma.user.create({
    data: {
      username: 'superadmin',
      email: 'superadmin@srisai.edu',
      passwordHash,
      roleId: role.id,
      admin: { create: { name: 'Super Admin', adminLevel: 'SUPER_ADMIN' } },
    },
  });

console.log(`Restored ${user.username} as ${role.name}.`);
await prisma.$disconnect();
