'use server';

import { Player, RegistrationStatus, Match } from '@/types';
import { prisma } from '@/lib/prisma';
import { revalidatePath, unstable_cache } from 'next/cache';
import { sendMatchNotificationSMS } from '@/services/smsService';
import { generateTournamentAnalysis } from '@/services/geminiService';
import { redis } from '@/lib/redis';
import cloudinary from '@/lib/cloudinary';

const CACHE_KEYS = {
  ALL_PLAYERS: 'players:all',
  APPROVED_PLAYERS: 'players:approved',
  MATCHES: 'matches:all',
  TOURNAMENT: 'tournament:state',
};

async function invalidateAllCache() {
  console.log("🧹 [Redis] Invalidation triggered. Clearing all cached data...");
  try {
    await Promise.all([
      redis.del(CACHE_KEYS.ALL_PLAYERS),
      redis.del(CACHE_KEYS.APPROVED_PLAYERS),
      redis.del(CACHE_KEYS.MATCHES),
      redis.del(CACHE_KEYS.TOURNAMENT),
    ]);
  } catch (error) {
    console.error("❌ [Redis] Cache Invalidation Error:", error);
  }
}

export const getCachedAnalysis = unstable_cache(
  async (players: Player[]) => {
    return await generateTournamentAnalysis(players);
  },
  ['tournament-analysis'],
  { revalidate: 3600, tags: ['analysis'] } // Cache for 1 hour or until revalidated
);

export async function uploadImageAction(base64Image: string) {
  try {
    const uploadResponse = await cloudinary.uploader.upload(base64Image, {
      folder: 'marlima_chess_receipts',
    });
    return uploadResponse.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw new Error("Failed to upload image to Cloudinary");
  }
}

export async function getPlayersAction() {
  try {
    // Try to get from Redis
    try {
      const cached = await redis.get<Player[]>(CACHE_KEYS.ALL_PLAYERS);
      if (cached) {
        console.log("⚡ [Redis] Serving all players from cache");
        return cached;
      }
    } catch (cacheError) {
      console.error("❌ [Redis] Cache fetch error (falling back to DB):", cacheError);
    }

    console.log("🗄️ [DB] Cache miss. Fetching all players from Database...");
    const players = await prisma.player.findMany({
      orderBy: [
        { score: 'desc' }, 
        { rating: 'desc' }
      ]
    });
    
    const formattedPlayers = players.map(p => ({
      ...p,
      registeredAt: p.registeredAt.toISOString(),
      status: p.status as RegistrationStatus, 
      platform: p.platform as any 
    })) as Player[];

    // Store in Redis
    try {
      console.log("🔄 [Redis] Updating cache with fresh data from DB...");
      await redis.set(CACHE_KEYS.ALL_PLAYERS, formattedPlayers);
    } catch (cacheError) {
      console.error("❌ [Redis] Cache store error:", cacheError);
    }
    
    return formattedPlayers;
  } catch (error) {
    console.error("Failed to fetch players:", error);
    return [];
  }
}

export async function getApprovedPlayersAction() {
  try {
    // Try to get from Redis
    try {
      const cached = await redis.get<Player[]>(CACHE_KEYS.APPROVED_PLAYERS);
      if (cached) {
        console.log("⚡ [Redis] Serving approved players from cache");
        return cached;
      }
    } catch (cacheError) {
      console.error("❌ [Redis] Cache fetch error (falling back to DB):", cacheError);
    }

    console.log("🗄️ [DB] Cache miss. Fetching approved players from Database...");
    const players = await prisma.player.findMany({
      where: { status: 'APPROVED' },
      orderBy: [
        { score: 'desc' }, 
        { rating: 'desc' }
      ]
    });
    
    const formattedPlayers = players.map(p => ({
      ...p,
      registeredAt: p.registeredAt.toISOString(),
      status: p.status as RegistrationStatus, 
      platform: p.platform as any 
    })) as Player[];

    // Store in Redis
    try {
      console.log("🔄 [Redis] Updating approved players cache...");
      await redis.set(CACHE_KEYS.APPROVED_PLAYERS, formattedPlayers);
    } catch (cacheError) {
      console.error("❌ [Redis] Cache store error:", cacheError);
    }

    return formattedPlayers;
  } catch (error) {
    console.error("Failed to fetch approved players:", error);
    return [];
  }
}

export async function savePlayerAction(playerData: Player) {
  try {
    const player = await prisma.player.create({
      data: {
        id: playerData.id,
        fullName: playerData.fullName,
        department: playerData.department,
        phoneNumber: playerData.phoneNumber,
        chessUsername: playerData.chessUsername,
        platform: playerData.platform,
        rating: playerData.rating,
        status: playerData.status,
        paymentReference: playerData.paymentReference,
        paymentReceipt: playerData.paymentReceipt,
        registeredAt: new Date(playerData.registeredAt),
      }
    });
    
    await invalidateAllCache();
    revalidatePath('/admin');
    revalidatePath('/participants');
    return player;
  } catch (error) {
    console.error("Failed to create player:", error);
    throw new Error("Failed to create player");
  }
}

export async function updatePlayerStatusAction(id: string, status: RegistrationStatus) {
  try {
    await prisma.player.update({
      where: { id },
      data: { status }
    });
    await invalidateAllCache();
    revalidatePath('/admin');
    revalidatePath('/participants');
    return await getPlayersAction();
  } catch (error) {
    console.error("Failed to update status:", error);
    return [];
  }
}

export async function updatePlayerStatsAction(id: string, rank: number | null, score: number) {
  try {
    await prisma.player.update({
      where: { id },
      data: { rank, score }
    });
    await invalidateAllCache();
    revalidatePath('/admin');
    revalidatePath('/admin/standings');
    revalidatePath('/participants');
    return await getPlayersAction();
  } catch (error) {
    console.error("Failed to update player stats:", error);
    return [];
  }
}

export async function deletePlayerAction(id: string) {
  try {
    await prisma.player.delete({
      where: { id }
    });
    await invalidateAllCache();
    revalidatePath('/admin');
    revalidatePath('/participants');
    return await getPlayersAction();
  } catch (error) {
    console.error("Failed to delete player:", error);
    return [];
  }
}

// --- Tournament State Actions ---

async function calculateScoresForRound(round: number) {
  const matches = await prisma.match.findMany({
    where: { round }
  });

  for (const match of matches) {
    if (!match.result) continue;

    let whitePoints = 0;
    let blackPoints = 0;

    if (match.result === "1-0") {
      whitePoints = 1;
    } else if (match.result === "0-1") {
      blackPoints = 1;
    } else if (match.result === "1/2-1/2") {
      whitePoints = 0.5;
      blackPoints = 0.5;
    }

    await prisma.player.update({
      where: { id: match.whitePlayerId },
      data: { score: { increment: whitePoints } }
    });

    await prisma.player.update({
      where: { id: match.blackPlayerId },
      data: { score: { increment: blackPoints } }
    });
  }
  await invalidateAllCache();
}

export async function getTournamentAction() {
  try {
    // Try Redis
    try {
      const cached = await redis.get<any>(CACHE_KEYS.TOURNAMENT);
      if (cached) {
        console.log("⚡ [Redis] Serving tournament state from cache");
        return cached;
      }
    } catch (e) {}

    console.log("🗄️ [DB] Cache miss. Fetching tournament state...");
    let tournament = await prisma.tournament.findUnique({ where: { id: 1 } });
    if (!tournament) {
      tournament = await prisma.tournament.create({ data: { id: 1, currentRound: 1 } });
    }

    // Store in Redis
    try {
      await redis.set(CACHE_KEYS.TOURNAMENT, tournament);
    } catch (e) {}

    return tournament;
  } catch (error) {
    return { currentRound: 1, status: "IN_PROGRESS" };
  }
}

export async function advanceRoundAction() {
  try {
    const t = await getTournamentAction();
    
    // 1. Calculate scores for the round just ended
    await calculateScoresForRound(t.currentRound);
    
    const nextRound = t.currentRound + 1;

    // 2. Generate Swiss pairings for the NEXT round
    await generateSwissPairingsAction(nextRound);

    // 3. Update the tournament state to the next round
    const updated = await prisma.tournament.update({
      where: { id: 1 },
      data: { currentRound: nextRound }
    });

    await invalidateAllCache();
    revalidatePath('/admin/matches');
    revalidatePath('/admin/standings');
    revalidatePath('/participants');
    return updated;
  } catch (error) {
    console.error("Advance Round Error:", error);
    return null;
  }
}

export async function finishTournamentAction() {
  try {
    const t = await getTournamentAction();
    await calculateScoresForRound(t.currentRound);
    await prisma.tournament.update({
      where: { id: 1 },
      data: { status: "FINISHED" }
    });
    await invalidateAllCache();
    revalidatePath('/admin/matches');
    revalidatePath('/admin/standings');
    revalidatePath('/participants');
  } catch (error) {}
}

export async function resetTournamentAction() {
    try {
        await prisma.player.updateMany({ data: { score: 0, rank: null } });
        await prisma.match.deleteMany({}); 
        await prisma.tournament.update({
            where: { id: 1 },
            data: { currentRound: 1, status: "IN_PROGRESS" }
        });
        await invalidateAllCache();
        revalidatePath('/admin/matches');
        revalidatePath('/admin/standings');
    } catch (e) {}
}

// --- Match Actions ---

export async function getMatchesAction() {
  try {
    // Try Redis
    try {
      const cached = await redis.get<Match[]>(CACHE_KEYS.MATCHES);
      if (cached) {
        console.log("⚡ [Redis] Serving matches from cache");
        return cached;
      }
    } catch (e) {}

    console.log("🗄️ [DB] Cache miss. Fetching all matches...");
    const matches = await prisma.match.findMany({
      include: {
        whitePlayer: true,
        blackPlayer: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const formattedMatches = matches.map(m => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      whitePlayer: { ...m.whitePlayer, registeredAt: m.whitePlayer.registeredAt.toISOString() } as unknown as Player,
      blackPlayer: { ...m.blackPlayer, registeredAt: m.blackPlayer.registeredAt.toISOString() } as unknown as Player
    })) as Match[];

    // Store in Redis
    try {
      await redis.set(CACHE_KEYS.MATCHES, formattedMatches);
    } catch (e) {}

    return formattedMatches;
  } catch (error) {
    return [];
  }
}

export async function createMatchAction(whiteId: string, blackId: string, round: number) {
  try {
    await prisma.match.create({
      data: { whitePlayerId: whiteId, blackPlayerId: blackId, round }
    });
    await invalidateAllCache();
    revalidatePath('/admin/matches');
    return await getMatchesAction();
  } catch (error) {
    return [];
  }
}

export async function updateMatchResultAction(matchId: string, result: string) {
  try {
    await prisma.match.update({
      where: { id: matchId },
      data: { result }
    });
    await invalidateAllCache();
    revalidatePath('/admin/matches');
    return await getMatchesAction();
  } catch (error) {
    return [];
  }
}

export async function deleteMatchAction(matchId: string) {
  try {
    await prisma.match.delete({ where: { id: matchId } });
    await invalidateAllCache();
    revalidatePath('/admin/matches');
    return await getMatchesAction();
  } catch (error) {
     return [];
  }
}

// --- Automated Pairing Actions ---

export async function generateSwissPairingsAction(round: number) {
  try {
    const players = await prisma.player.findMany({
      where: { status: RegistrationStatus.APPROVED },
      orderBy: [ { score: 'desc' }, { rating: 'desc' } ]
    });

    const pastMatches = await prisma.match.findMany({});

    if (players.length < 2) return [];

    let pool = [...players];
    const pairings: { white: string, black: string }[] = [];

    if (pool.length % 2 !== 0) {
        const byePlayer = pool.pop()!;
        await prisma.player.update({
            where: { id: byePlayer.id },
            data: { score: { increment: 1 } }
        });
        // Create a fake match for the record or just let them have the point
    }

    const pairedIds = new Set<string>();

    for (let i = 0; i < pool.length; i++) {
        const p1 = pool[i];
        if (pairedIds.has(p1.id)) continue;

        let found = false;
        for (let j = i + 1; j < pool.length; j++) {
            const p2 = pool[j];
            if (pairedIds.has(p2.id)) continue;

            const playedBefore = pastMatches.some(m => 
                (m.whitePlayerId === p1.id && m.blackPlayerId === p2.id) ||
                (m.whitePlayerId === p2.id && m.blackPlayerId === p1.id)
            );

            if (!playedBefore) {
                const p1Whites = pastMatches.filter(m => m.whitePlayerId === p1.id).length;
                const p2Whites = pastMatches.filter(m => m.whitePlayerId === p2.id).length;

                if (p1Whites > p2Whites) {
                    pairings.push({ white: p2.id, black: p1.id });
                } else {
                    pairings.push({ white: p1.id, black: p2.id });
                }
                
                pairedIds.add(p1.id);
                pairedIds.add(p2.id);
                found = true;
                break;
            }
        }

        if (!found) {
            for (let j = i + 1; j < pool.length; j++) {
                const p2 = pool[j];
                if (!pairedIds.has(p2.id)) {
                    pairings.push({ white: p1.id, black: p2.id });
                    pairedIds.add(p1.id);
                    pairedIds.add(p2.id);
                    break;
                }
            }
        }
    }

    if (pairings.length > 0) {
        await prisma.match.createMany({
            data: pairings.map(p => ({
                whitePlayerId: p.white,
                blackPlayerId: p.black,
                round
            }))
        });
    }

    await invalidateAllCache();
    revalidatePath('/admin/matches');
    return await getMatchesAction();
  } catch (error) {
    console.error("Swiss Pairing Error:", error);
    return [];
  }
}

export async function generateRoundRobinAction() {
  try {
    const players = await prisma.player.findMany({
      where: { status: RegistrationStatus.APPROVED }
    });

    if (players.length < 2) return [];

    const n = players.length;
    let rotation = [...players.map(p => p.id)];
    if (n % 2 !== 0) rotation.push("BYE");

    const totalRounds = rotation.length - 1;
    const matchesToCreate = [];

    for (let round = 1; round <= totalRounds; round++) {
      for (let i = 0; i < rotation.length / 2; i++) {
        const p1 = rotation[i];
        const p2 = rotation[rotation.length - 1 - i];
        if (p1 === "BYE" || p2 === "BYE") continue;

        if (round % 2 === 1) {
           matchesToCreate.push({ whitePlayerId: p1, blackPlayerId: p2, round });
        } else {
           matchesToCreate.push({ whitePlayerId: p2, blackPlayerId: p1, round });
        }
      }
      const fixed = rotation[0];
      const rest = rotation.slice(1);
      const last = rest.pop()!;
      rest.unshift(last);
      rotation = [fixed, ...rest];
    }

    await prisma.match.createMany({ data: matchesToCreate });
    await invalidateAllCache();
    revalidatePath('/admin/matches');
    return await getMatchesAction();
  } catch (error) {
    return [];
  }
}
