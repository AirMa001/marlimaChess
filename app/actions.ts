'use server';

import { Player, RegistrationStatus, Match } from '@/types';
import { prisma } from '@/lib/prisma';
import { revalidatePath, unstable_cache } from 'next/cache';
import { sendMatchNotificationSMS } from '@/services/smsService';
import { generateTournamentAnalysis } from '@/services/geminiService';
import { redis } from '@/lib/redis';
import cloudinary from '@/lib/cloudinary';

function safeRevalidatePath(path: string, type?: 'layout' | 'page') {
  try {
    revalidatePath(path, type);
  } catch (e) {
    // console.warn(`⚠️ [Next.js] revalidatePath failed for ${path}`);
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const CACHE_KEYS = {
  ALL_PLAYERS: 'players:all',
  APPROVED_PLAYERS: 'players:approved',
  MATCHES: 'matches:all',
  TOURNAMENT: 'tournament:state',
};

const BYE_PLAYER_ID = 'BYE_VIRTUAL_ID';

async function invalidateAllCache() {
  if (!redis) return;
  console.log("🧹 [Redis] Invalidation triggered. Clearing all cached data...");
  try {
    await Promise.all([
      redis.del(CACHE_KEYS.ALL_PLAYERS),
      redis.del(CACHE_KEYS.APPROVED_PLAYERS),
      redis.del(CACHE_KEYS.MATCHES),
      redis.del(CACHE_KEYS.TOURNAMENT),
    ]);
    // Wrap revalidatePath in a try-catch as it can fail in certain contexts
    try {
      safeRevalidatePath('/', 'layout');
    } catch (revalidateError) {
      console.warn("⚠️ [Next.js] revalidatePath failed (expected if outside request context)");
    }
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
      timeout: 60000, // 60 seconds
    });
    return uploadResponse.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw new Error("Failed to upload image to Cloudinary");
  }
}

export async function getPaymentReceiptAction(playerId: string) {
  try {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { paymentReceipt: true }
    });
    return player?.paymentReceipt || null;
  } catch (error) {
    console.error("Failed to fetch receipt:", error);
    return null;
  }
}

export async function purgeRedisAction() {
  try {
    await invalidateAllCache();
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

export async function getPlayersAction() {
  try {
    // Try to get from Redis
    if (redis) {
      try {
        const cached = await redis.get<Player[]>(CACHE_KEYS.ALL_PLAYERS);
        if (cached && Array.isArray(cached)) {
          console.log("⚡ [Redis] Serving all players from cache");
          return cached;
        } else if (cached) {
          console.warn("⚠️ [Redis] Cached data for all players is not an array. Ignoring cache.");
        }
      } catch (cacheError) {
        console.error("❌ [Redis] Cache fetch error (falling back to DB):", cacheError);
      }
    }

    console.log("🗄️ [DB] Cache miss. Fetching all players from Database...");
    const players = await prisma.player.findMany({
      select: {
        id: true,
        fullName: true,
        department: true,
        phoneNumber: true,
        chessUsername: true,
        platform: true,
        rating: true,
        status: true,
        registeredAt: true,
        rank: true,
        score: true,
        // Excluded: paymentReceipt, paymentReference
      },
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
    if (redis) {
      try {
        console.log("🔄 [Redis] Updating cache with fresh data from DB...");
        await redis.set(CACHE_KEYS.ALL_PLAYERS, formattedPlayers);
      } catch (cacheError) {
        console.error("❌ [Redis] Cache store error:", cacheError);
      }
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
    if (redis) {
      try {
        const cached = await redis.get<Player[]>(CACHE_KEYS.APPROVED_PLAYERS);
        if (cached && Array.isArray(cached)) {
          console.log("⚡ [Redis] Serving approved players from cache");
          return cached;
        } else if (cached) {
          console.warn("⚠️ [Redis] Cached data for approved players is not an array. Ignoring cache.");
        }
      } catch (cacheError) {
        console.error("❌ [Redis] Cache fetch error (falling back to DB):", cacheError);
      }
    }

    console.log("🗄️ [DB] Cache miss. Fetching approved players from Database...");
    const players = await prisma.player.findMany({
      where: { status: 'APPROVED' },
      select: {
        id: true,
        fullName: true,
        department: true,
        chessUsername: true,
        platform: true,
        rating: true,
        score: true,
        rank: true,
        registeredAt: true,
        status: true,
        // Excluded: phoneNumber, paymentReference, paymentReceipt
      },
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
    if (redis) {
      try {
        console.log("🔄 [Redis] Updating approved players cache...");
        await redis.set(CACHE_KEYS.APPROVED_PLAYERS, formattedPlayers);
      } catch (cacheError) {
        console.error("❌ [Redis] Cache store error:", cacheError);
      }
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
    safeRevalidatePath('/admin');
    safeRevalidatePath('/participants');
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
    safeRevalidatePath('/admin');
    safeRevalidatePath('/participants');
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
    safeRevalidatePath('/admin');
    safeRevalidatePath('/admin/standings');
    safeRevalidatePath('/participants');
    return await getPlayersAction();
  } catch (error) {
    console.error("Failed to update player stats:", error);
    return [];
  }
}

export async function deletePlayerAction(id: string) {
  try {
    // 1. Delete all matches where this player is either white or black
    await prisma.match.deleteMany({
      where: {
        OR: [
          { whitePlayerId: id },
          { blackPlayerId: id }
        ]
      }
    });

    // 2. Delete the player
    await prisma.player.delete({
      where: { id }
    });

    await invalidateAllCache();
    safeRevalidatePath('/admin');
    safeRevalidatePath('/participants');
    return await getPlayersAction();
  } catch (error) {
    console.error("Failed to delete player:", error);
    return [];
  }
}

// --- Tournament State Actions ---

export async function recalculateStandingsAction() {
  await autoAssignPositions();
  await invalidateAllCache();
  return { success: true };
}

async function autoAssignPositions() {
  console.log("🏆 [Standings] Recalculating official positions using Buchholz tie-breaker...");
  try {
    const players = await prisma.player.findMany({
      where: { status: RegistrationStatus.APPROVED }
    });

    const matches = await prisma.match.findMany({
      where: { result: { not: null } }
    });

    // Create a map for quick score lookups
    const scoreMap = new Map(players.map(p => [p.id, p.score]));

    // Calculate Tie-Break Score (Buchholz) for each player
    const playersWithTieBreak = players.map(player => {
      // Find all opponents this player has faced
      const opponentsIds = matches
        .filter(m => m.whitePlayerId === player.id || m.blackPlayerId === player.id)
        .map(m => m.whitePlayerId === player.id ? m.blackPlayerId : m.whitePlayerId);

      // Sum up the current scores of all opponents
      const buchholzScore = opponentsIds.reduce((sum, id) => sum + (scoreMap.get(id) || 0), 0);

      return {
        ...player,
        buchholzScore
      };
    });

    // Sort: 1. Points (desc), 2. Buchholz (desc), 3. Rating (desc fallback)
    playersWithTieBreak.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.buchholzScore !== a.buchholzScore) return b.buchholzScore - a.buchholzScore;
      return b.rating - a.rating;
    });

    // Update each player's rank based on their sorted order
    const updates = playersWithTieBreak.map((player, index) => 
      prisma.player.update({
        where: { id: player.id },
        data: { rank: index + 1 }
      })
    );

    await prisma.$transaction(updates);
    console.log("✅ [Standings] Positions updated successfully with Buchholz tie-breakers.");
  } catch (error) {
    console.error("❌ [Standings] Error auto-assigning positions:", error);
  }
}

async function calculateScoresForRound(round: number) {
  const matches = await prisma.match.findMany({
    where: { round: { equals: round } }
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

  // Auto-calculate official ranks after score updates
  await autoAssignPositions();
  
  await invalidateAllCache();
}

export async function getTournamentAction() {
  try {
    // Try Redis
    if (redis) {
      try {
        const cached = await redis.get<any>(CACHE_KEYS.TOURNAMENT);
        if (cached && typeof cached.currentRound !== 'undefined') {
          console.log("⚡ [Redis] Serving tournament state from cache");
          return cached;
        } else if (cached) {
          console.warn("⚠️ [Redis] Cached tournament state is invalid. Purging...");
          await redis.del(CACHE_KEYS.TOURNAMENT);
        }
      } catch (e) {}
    }

    console.log("🗄️ [DB] Cache miss. Fetching tournament state...");
    let tournament = await prisma.tournament.findUnique({ where: { id: 1 } });
    if (!tournament) {
      tournament = await prisma.tournament.create({ data: { id: 1, currentRound: 1, totalRounds: 5 } });
    }

    // Store in Redis
    if (redis) {
      try {
        await redis.set(CACHE_KEYS.TOURNAMENT, tournament);
      } catch (e) {}
    }

    return tournament;
  } catch (error) {
    return { currentRound: 1, totalRounds: 5, status: "IN_PROGRESS" };
  }
}

export async function updateTournamentSettingsAction(totalRounds: number) {
  try {
    const updated = await prisma.tournament.upsert({
      where: { id: 1 },
      update: { totalRounds },
      create: { id: 1, currentRound: 1, totalRounds }
    });
    await invalidateAllCache();
    return updated;
  } catch (error) {
    console.error("Failed to update tournament settings:", error);
    return null;
  }
}

export async function advanceRoundAction() {
  console.log("🚀 [Tournament] Advancing to next round...");
  try {
    const t = await getTournamentAction();
    if (t.status === 'FINISHED') {
      console.warn("⚠️ Tournament is already finished.");
      return t;
    }

    const currentRound = Number(t.currentRound);
    if (isNaN(currentRound)) {
      throw new Error(`Invalid current round: ${t.currentRound}`);
    }
    
    const nextRound = currentRound + 1;
    
    // 1. Calculate scores for the round just ended
    await calculateScoresForRound(currentRound);

    // 2. Check if we have reached the tournament limit
    if (nextRound > (t.totalRounds || 5)) {
      console.log(`🏁 [Tournament] Round limit (${t.totalRounds}) reached. Finalizing tournament.`);
      await prisma.tournament.update({
        where: { id: 1 },
        data: { status: "FINISHED" }
      });
      await invalidateAllCache();
      safeRevalidatePath('/admin/matches');
      safeRevalidatePath('/admin/standings');
      safeRevalidatePath('/participants');
      return { ...t, status: "FINISHED" };
    }
    
    // 3. Clean slate for the next round (delete any orphaned matches for nextRound)
    console.log(`Clearing orphaned matches for Round ${nextRound}...`);
    await prisma.match.deleteMany({
      where: { round: { equals: nextRound } }
    });

    console.log(`Generating new Swiss pairings for Round ${nextRound}...`);
    // 4. Generate Swiss pairings for the NEXT round
    await generateSwissPairingsAction(nextRound);

    // 5. Update the tournament state to the next round
    const updated = await prisma.tournament.update({
      where: { id: 1 },
      data: { currentRound: nextRound }
    });

    await invalidateAllCache();
    safeRevalidatePath('/admin/matches');
    safeRevalidatePath('/admin/standings');
    safeRevalidatePath('/participants');
    
    console.log(`✅ Tournament advanced to Round ${nextRound}`);
    return updated;
  } catch (error: any) {
    console.error("❌ Advance Round Error:", error);
    throw new Error(error.message || "Failed to advance round");
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
    safeRevalidatePath('/admin/matches');
    safeRevalidatePath('/admin/standings');
    safeRevalidatePath('/participants');
  } catch (error) {}
}

export async function resetTournamentAction() {
    console.log("🧹 [Tournament] Resetting all match data and scores...");
    try {
        await prisma.player.updateMany({ data: { score: 0, rank: null } });
        await prisma.match.deleteMany({}); 
        
        // Force round back to 1
        await prisma.tournament.upsert({
            where: { id: 1 },
            update: { currentRound: 1, status: "IN_PROGRESS" },
            create: { id: 1, currentRound: 1, status: "IN_PROGRESS" }
        });

        await invalidateAllCache();
        safeRevalidatePath('/admin/matches');
        safeRevalidatePath('/admin/standings');
        safeRevalidatePath('/participants');
        console.log("✅ Tournament reset complete.");
    } catch (e) {
        console.error("❌ Reset Error:", e);
    }
}

// --- Match Actions ---

export async function getMatchesAction() {
  try {
    // Try Redis
    if (redis) {
      try {
        const cached = await redis.get<Match[]>(CACHE_KEYS.MATCHES);
        if (cached && Array.isArray(cached)) {
          console.log("⚡ [Redis] Serving matches from cache");
          return cached;
        }
      } catch (e) {}
    }

    console.log("🗄️ [DB] Cache miss. Fetching all matches...");
    const matches = await prisma.match.findMany({
      include: {
        whitePlayer: {
          select: { id: true, fullName: true }
        },
        blackPlayer: {
          select: { id: true, fullName: true }
        }
      },
      orderBy: [
        { round: 'desc' },
        { table: 'asc' }
      ]
    });
    
    const formattedMatches = matches.map(m => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      whitePlayer: { ...m.whitePlayer } as unknown as Player,
      blackPlayer: { ...m.blackPlayer } as unknown as Player
    })) as Match[];

    // --- Dynamic BYE detection ---
    // If an approved player exists but has NO match in a particular round, 
    // we inject a virtual BYE match for the UI.
    const allApprovedPlayers = await prisma.player.findMany({
      where: { status: RegistrationStatus.APPROVED },
      select: { id: true, fullName: true }
    });

    const rounds = Array.from(new Set(formattedMatches.map(m => m.round)));
    const byeMatches: Match[] = [];

    rounds.forEach(r => {
      const playersInRound = new Set([
        ...formattedMatches.filter(m => m.round === r).map(m => m.whitePlayerId),
        ...formattedMatches.filter(m => m.round === r).map(m => m.blackPlayerId)
      ]);

      allApprovedPlayers.forEach(p => {
        if (!playersInRound.has(p.id)) {
          byeMatches.push({
            id: `bye-${r}-${p.id}`,
            round: r,
            table: 999,
            whitePlayerId: p.id,
            blackPlayerId: 'BYE',
            result: '1/2-1/2',
            createdAt: new Date().toISOString(),
            whitePlayer: p as any,
            blackPlayer: { id: 'BYE', fullName: 'BYE' } as any
          });
        }
      });
    });

    const finalMatches = [...formattedMatches, ...byeMatches].sort((a, b) => {
      if (b.round !== a.round) return b.round - a.round;
      return (a.table || 0) - (b.table || 0);
    });

    // Store in Redis
    try {
      await redis.set(CACHE_KEYS.MATCHES, finalMatches);
    } catch (e) {}

    return finalMatches;
  } catch (error) {
    console.error("Failed to fetch matches:", error);
    return [];
  }
}

export async function createMatchAction(whiteId: string, blackId: string, round: number) {
  try {
    await prisma.match.create({
      data: { whitePlayerId: whiteId, blackPlayerId: blackId, round }
    });
    await invalidateAllCache();
    safeRevalidatePath('/admin/matches');
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
    safeRevalidatePath('/admin/matches');
    return await getMatchesAction();
  } catch (error) {
    return [];
  }
}

export async function deleteMatchAction(matchId: string) {
  try {
    await prisma.match.delete({ where: { id: matchId } });
    await invalidateAllCache();
    safeRevalidatePath('/admin/matches');
    return await getMatchesAction();
  } catch (error) {
     return [];
  }
}

// --- Automated Pairing Actions ---

export async function generateSwissPairingsAction(round: number) {
  console.log(`🎲 [Pairing] Generating Swiss pairings for Round ${round}...`);
  try {
    const players = await prisma.player.findMany({
      where: { status: RegistrationStatus.APPROVED },
      orderBy: [ { score: 'desc' }, { rating: 'desc' } ]
    });

    console.log(`Total approved players: ${players.length}`);
    const pastMatches = await prisma.match.findMany({});
    console.log(`Total past matches: ${pastMatches.length}`);

    if (players.length < 2) {
      console.warn("⚠️ Not enough players to generate pairings.");
      return [];
    }

    let pool = [...players];

    // RANDOMIZE ONLY FOR ROUND 1
    if (round === 1) {
      console.log("🎲 [Pairing] Shuffling players for Round 1 randomization...");
      pool = shuffleArray(pool);
    }

    const pairings: { white: string, black: string }[] = [];

    if (pool.length % 2 !== 0) {
        const byePlayer = pool.pop()!;
        console.log(`🎁 [Bye] Assigned to: ${byePlayer.fullName}. Awarding 0.5 pts.`);
        await prisma.player.update({
            where: { id: byePlayer.id },
            data: { score: { increment: 0.5 } }
        });
        // We don't create a Match record for BYE because of foreign key constraints
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
                // Pure random color selection for every match
                if (Math.random() > 0.5) {
                    pairings.push({ white: p1.id, black: p2.id });
                } else {
                    pairings.push({ white: p2.id, black: p1.id });
                }
                
                pairedIds.add(p1.id);
                pairedIds.add(p2.id);
                found = true;
                break;
            }
        }

        if (!found) {
            console.log(`Force pairing for ${p1.fullName} (no unplayed opponent found)`);
            for (let j = i + 1; j < pool.length; j++) {
                const p2 = pool[j];
                if (!pairedIds.has(p2.id)) {
                    // Randomize color for forced pairing
                    if (Math.random() > 0.5) {
                      pairings.push({ white: p1.id, black: p2.id });
                    } else {
                      pairings.push({ white: p2.id, black: p1.id });
                    }
                    pairedIds.add(p1.id);
                    pairedIds.add(p2.id);
                    break;
                }
            }
        }
    }

    console.log(`Pairings to create: ${pairings.length}`);
    if (pairings.length > 0) {
        await prisma.match.createMany({
            data: pairings.map((p, index) => ({
                whitePlayerId: p.white,
                blackPlayerId: p.black,
                round,
                table: index + 1,
                result: p.isBye ? "1/2-1/2" : null // Automatically award 0.5 pts for BYE
            }))
        });
        console.log("✅ Matches created in DB.");

        // IMPORTANT: Update tournament state to this round
        await prisma.tournament.upsert({
          where: { id: 1 },
          update: { currentRound: round, status: 'IN_PROGRESS' },
          create: { id: 1, currentRound: round, status: 'IN_PROGRESS' }
        });
    }

    await invalidateAllCache();
    safeRevalidatePath('/admin/matches');
    return await getMatchesAction();
  } catch (error) {
    console.error("❌ Swiss Pairing Error:", error);
    return [];
  }
}

export async function generateRoundRobinAction() {
  console.log("🔄 [Round Robin] Generating complete schedule...");
  try {
    const players = await prisma.player.findMany({
      where: { status: RegistrationStatus.APPROVED }
    });

    if (players.length < 2) return [];

    const n = players.length;
    // Shuffle initial list for randomness
    let rotation = shuffleArray(players.map(p => p.id));
    
    // For Round Robin, if odd number of players, add a BYE to make it even
    if (n % 2 !== 0) {
      rotation.push("BYE");
    }

    // A complete round robin requires (Number of Players - 1) rounds
    const roundsToGenerate = rotation.length - 1;
    console.log(`🔄 [Round Robin] Creating complete cycle: ${roundsToGenerate} rounds for ${n} players.`);
    
    const matchesToCreate = [];

    for (let round = 1; round <= roundsToGenerate; round++) {
      let tableCount = 1;
      for (let i = 0; i < rotation.length / 2; i++) {
        let p1 = rotation[i];
        let p2 = rotation[rotation.length - 1 - i];
        
        // If one of the players is a BYE, handle it as a virtual match
        if (p1 === "BYE" || p2 === "BYE") {
          const realPlayerId = p1 === "BYE" ? p2 : p1;
          matchesToCreate.push({ 
            whitePlayerId: realPlayerId, 
            blackPlayerId: BYE_PLAYER_ID, 
            round, 
            table: 999, // Place BYE matches at the very bottom
            result: "1/2-1/2" 
          });
          continue;
        }

        // Randomize colors
        if (Math.random() > 0.5) {
          matchesToCreate.push({ whitePlayerId: p1, blackPlayerId: p2, round, table: tableCount++ });
        } else {
          matchesToCreate.push({ whitePlayerId: p2, blackPlayerId: p1, round, table: tableCount++ });
        }
      }
      
      // Rotate players using the Circle Algorithm (keep the first player fixed)
      const fixed = rotation[0];
      const rest = rotation.slice(1);
      const last = rest.pop()!;
      rest.unshift(last);
      rotation = [fixed, ...rest];
    }

    await prisma.match.createMany({ data: matchesToCreate });

    // Update tournament settings to match the generated schedule
    await prisma.tournament.upsert({
      where: { id: 1 },
      update: { currentRound: 1, totalRounds: roundsToGenerate, status: 'IN_PROGRESS' },
      create: { id: 1, currentRound: 1, totalRounds: roundsToGenerate, status: 'IN_PROGRESS' }
    });

    await invalidateAllCache();
    safeRevalidatePath('/admin/matches');
    return await getMatchesAction();
  } catch (error) {
    console.error("❌ Round Robin Error:", error);
    return [];
  }
}
