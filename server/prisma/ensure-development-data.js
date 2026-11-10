import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { run } from './import-development-csv.js';

const prisma = new PrismaClient();
const batchKey = process.env.IMPORT_BATCH_KEY || 'DEVELOPMENT_CSV_2026';

export async function ensureDevelopmentData() {
  const batch = await prisma.importBatch.findUnique({ where: { batchKey } });
  if (batch) return false;
  await run();
  return true;
}

if (process.argv[1]?.endsWith('ensure-development-data.js')) {
  ensureDevelopmentData()
    .then((created) => console.log(created ? `Created ${batchKey} development data.` : `${batchKey} already exists.`))
    .catch((error) => { console.error(error.message); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
}
