import { prisma } from "@/lib/prisma";
import { Swiss } from 'tournament-pairings';
import crypto from 'crypto';

export async function generatePairings(tournamentId: number, roundNumber: number) {
  // 1. Fetch participants and their match history
  const participants = await prisma.player.findMany({
    where: { tournamentId },
    include: {
      matchesAsWhite: { select: { blackPlayerId: true } },
      matchesAsBlack: { select: { whitePlayerId: true } },
    },
  });

  // 2. Format the players EXACTLY how the Swiss library wants them
  const formattedPlayers = participants.map((p: any) => {
    // Collect opponents so the library knows who they already played
    const pastOpponents = [
      ...p.matchesAsWhite.map((m: any) => m.blackPlayerId), 
      ...p.matchesAsBlack.map((m: any) => m.whitePlayerId)
    ].filter(id => id !== null && id !== undefined); // Remove empty values

    return {
      id: p.id,
      score: p.score || 0,
      rating: p.rating || 1500,
      avoid: pastOpponents,
    };
  });

  // 3. ✨ THE MAGIC: Generate Pairings using the library
  // This automatically handles Byes, Backtracking, and Color balance!
  const pairings = Swiss(formattedPlayers, roundNumber);

  // 4. Map the library output to your Database structure
  const matchesToCreate = pairings.map((p: any) => ({
    id: crypto.randomUUID(),
    round: roundNumber,
    whitePlayerId: p.player1 || p.white,
    blackPlayerId: p.player2 || p.black || null,
    table: 0, // Should be assigned properly
    result: (p.player2 || p.black) === null ? "1/2-1/2" : null,
  }));

  // 5. Save Matches to DB
  if (matchesToCreate.length > 0) {
    await prisma.$transaction(
      matchesToCreate.map(m => prisma.match.create({ data: m }))
    );
  }

  return matchesToCreate;
}