import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.jobCustomColumn.update({
    where: { slug: 'education' },
    data: { isRequired: false }
  });
  console.log('Education isRequired set to false');
}

main().catch(console.error).finally(() => prisma.$disconnect());
