import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { ROLE_PERMISSIONS } from '../src/rbac.js';

const prisma = new PrismaClient();

async function bootstrapAdmin() {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: { name: 'SUPER_ADMIN' } },
    select: { id: true },
  });
  if (existingAdmin) {
    console.log('A SUPER_ADMIN account already exists; initial admin setup was skipped.');
    return;
  }

  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!username || username.length < 3) {
    throw new Error('ADMIN_USERNAME must contain at least 3 characters.');
  }
  if (!password || password.length < 16) {
    throw new Error('ADMIN_PASSWORD must contain at least 16 characters.');
  }

  if (await prisma.user.findUnique({ where: { username } })) {
    throw new Error(`ADMIN_USERNAME "${username}" already belongs to a non-admin account.`);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction(async (transaction) => {
    const permissions = await Promise.all(
      ROLE_PERMISSIONS.SUPER_ADMIN.map((name) => transaction.permission.upsert({
        where: { name },
        update: {},
        create: { name, description: name },
      })),
    );

    const role = await transaction.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: { permissions: { connect: permissions.map(({ id }) => ({ id })) } },
      create: {
        name: 'SUPER_ADMIN',
        description: 'Super Admin portal access',
        permissions: { connect: permissions.map(({ id }) => ({ id })) },
      },
    });

    await transaction.user.create({
      data: {
        username,
        email: process.env.ADMIN_EMAIL?.trim() || null,
        passwordHash,
        roleId: role.id,
        admin: {
          create: {
            name: process.env.ADMIN_DISPLAY_NAME?.trim() || 'School Administrator',
            adminLevel: 'SUPER_ADMIN',
          },
        },
      },
    });
  });

  console.log(`Created the initial SUPER_ADMIN account "${username}".`);
}

bootstrapAdmin()
  .catch((error) => {
    console.error('Initial admin setup failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
