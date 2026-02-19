import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tournaments = await prisma.tournament.findMany();
  console.log('Tournaments:', JSON.stringify(tournaments, null, 2));

  const players = await prisma.player.findMany();
  console.log('Total Players:', players.length);
  console.log('Approved Players:', players.filter(p => p.status === 'APPROVED').length);
  
  const matches = await prisma.match.findMany();
  console.log('Total Matches:', matches.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
