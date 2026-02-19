import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const stats = await prisma.player.groupBy({
    by: ['tournamentId', 'status'],
    _count: { id: true }
  });
  console.log('Player Stats:', JSON.stringify(stats, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
