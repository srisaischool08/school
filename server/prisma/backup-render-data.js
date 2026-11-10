import 'dotenv/config';
import { copyFile, cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function backupRenderData() {
  const databases = await prisma.$queryRaw`PRAGMA database_list`;
  const databasePath = databases.find(({ name }) => name === 'main')?.file;
  if (!databasePath) {
    throw new Error('Could not resolve the local SQLite database path.');
  }

  const checkpoints = await prisma.$queryRaw`PRAGMA wal_checkpoint(TRUNCATE)`;
  if (checkpoints[0]?.busy) {
    throw new Error('SQLite could not checkpoint its write-ahead log. Stop the local app and try again.');
  }

  await prisma.$disconnect();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(projectRoot, `render-migration-${timestamp}`);
  await mkdir(backupDir);
  await copyFile(databasePath, path.join(backupDir, 'srisai.db'));

  const uploadDir = process.env.UPLOAD_DIR
    ? path.resolve(projectRoot, process.env.UPLOAD_DIR)
    : path.join(projectRoot, 'uploads');
  const backupUploads = path.join(backupDir, 'uploads');
  if (existsSync(uploadDir)) {
    await cp(uploadDir, backupUploads, { recursive: true, errorOnExist: true, force: false });
  } else {
    await mkdir(backupUploads);
  }

  console.log(`Database and uploads backed up to: ${backupDir}`);
}

backupRenderData()
  .catch((error) => {
    console.error('Render data backup failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
