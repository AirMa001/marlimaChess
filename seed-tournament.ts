
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ORGANIZER_ID = 'cmmomqc9v0000xaheocqeu64x';

const participants = [
  { name: 'Magnus Carlsen', username: 'DrNykterstein', rating: 2850 },
  { name: 'Hikaru Nakamura', username: 'GMHikaru', rating: 2800 },
  { name: 'Fabiano Caruana', username: 'FabianoCaruana', rating: 2790 },
  { name: 'Ian Nepomniachtchi', username: 'lachesisQ', rating: 2770 },
  { name: 'Alireza Firouzja', username: 'alireza2003', rating: 2760 },
  { name: 'Anish Giri', username: 'AnishGiri', rating: 2750 },
  { name: 'Wesley So', username: 'GMWesleySo1993', rating: 2740 },
  { name: 'Richard Rapport', username: 'R_Rapport', rating: 2730 },
  { name: 'Levon Aronian', username: 'LevonAronian', rating: 2720 },
  { name: 'Ding Liren', username: 'DingLiren', rating: 2810 },
  { name: 'Gukesh D', username: 'GukeshD', rating: 2745 },
  { name: 'Praggnanandhaa R', username: 'rpragchess', rating: 2725 },
  { name: 'Nodirbek Abdusattorov', username: 'Nodirbek7', rating: 2735 },
  { name: 'Vidit Gujrathi', username: 'viditchess', rating: 2715 },
  { name: 'Arjun Erigaisi', username: 'ArjunErigaisi', rating: 2720 },
];

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create the Tournament
  const tournament = await prisma.tournament.create({
    data: {
      name: `Elite Masters ${new Date().toLocaleDateString()}`,
      description: 'A high-stakes tournament for elite grandmasters.',
      timeControl: '10+5',
      location: 'Marlima Arena',
      totalRounds: 6,
      status: 'UPCOMING',
      organizerId: ORGANIZER_ID,
      startDate: new Date(),
    },
  });

  console.log(`🏆 Tournament created: ${tournament.name} (ID: ${tournament.id})`);

  // 2. Create the Players
  const playersData = participants.map((p) => ({
    fullName: p.name,
    chessUsername: p.username,
    externalRating: p.rating,
    rating: p.rating,
    status: 'APPROVED',
    department: 'Grandmaster',
    phoneNumber: '08000000000',
    platform: 'chess.com',
    tournamentId: tournament.id,
  }));

  const createdPlayers = await prisma.player.createMany({
    data: playersData,
  });

  console.log(`👥 Created ${createdPlayers.count} participants.`);
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
