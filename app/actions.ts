'use server';

import { Player, RegistrationStatus, Match } from '@/types';
import { prisma } from '@/lib/prisma';
import { revalidatePath, unstable_cache } from 'next/cache';
import { sendMatchNotificationSMS } from '@/services/smsService';
import { generateTournamentAnalysis } from '@/services/geminiService';
import { redis } from '@/lib/redis';
import cloudinary from '@/lib/cloudinary';
import { rankingManager } from '@/lib/glicko';
import { Swiss } from 'tournament-pairings';
import crypto from 'crypto';
// @ts-ignore
import { Player as GlickoPlayer } from 'glicko2.ts';

function safeRevalidatePath(path: string, type?: 'layout' | 'page') {
  try {
    revalidatePath(path, type);
  } catch (e) {}
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Manual Swiss Pairing Fallback
 * Used if the external library fails or returns empty pairings.
 */
function manualSwissFallback(players: any[], pastMatches: any[], round: number) {
  console.log(`🛡️ [Swiss] Executing FIDE Dutch System for ${players.length} players (Round ${round})...`);
  
  const history = players.reduce((acc: any, p) => {
    const myMatches = pastMatches.filter(m => m.whitePlayerId === p.id || m.blackPlayerId === p.id)
      .sort((a, b) => a.round - b.round);

    acc[p.id] = {
      opponents: new Set(myMatches.map(m => m.whitePlayerId === p.id ? m.blackPlayerId : m.whitePlayerId).filter(id => id !== null)),
      colors: myMatches.map(m => m.whitePlayerId === p.id ? 'W' : 'B'),
      hasHadBye: myMatches.some(m => m.whitePlayerId === p.id && m.blackPlayerId === null)
    };
    return acc;
  }, {});

  let pool = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.rating - a.rating;
  });

  const pairings: { white: string, black: string | null }[] = [];
  const pairedIds = new Set<string>();

  if (pool.length % 2 !== 0) {
    let byeCandidateIndex = -1;
    for (let i = pool.length - 1; i >= 0; i--) {
      if (!history[pool[i].id].hasHadBye) {
        byeCandidateIndex = i;
        break;
      }
    }
    if (byeCandidateIndex === -1) byeCandidateIndex = pool.length - 1;
    
    const byePlayer = pool[byeCandidateIndex];
    pairings.push({ white: byePlayer.id, black: null });
    pairedIds.add(byePlayer.id);
    pool.splice(byeCandidateIndex, 1);
  }

  const buckets: any = {};
  pool.forEach(p => {
    const s = p.score.toString();
    if (!buckets[s]) buckets[s] = [];
    buckets[s].push(p);
  });

  const sortedScores = Object.keys(buckets).map(Number).sort((a, b) => b - a);
  let floaters: any[] = [];

  const canPlayColor = (playerId: string, color: 'W' | 'B') => {
    const pHistory = (history as any)[playerId].colors;
    if (pHistory.length < 2) return true;
    const lastTwo = pHistory.slice(-2);
    return !(lastTwo[0] === color && lastTwo[1] === color);
  };

  const tryPair = (p1: any, p2: any) => {
    if (pairedIds.has(p1.id) || pairedIds.has(p2.id)) return null;
    if ((history as any)[p1.id].opponents.has(p2.id)) return null;

    const p1CanW = canPlayColor(p1.id, 'W');
    const p1CanB = canPlayColor(p1.id, 'B');
    const p2CanW = canPlayColor(p2.id, 'W');
    const p2CanB = canPlayColor(p2.id, 'B');

    return { white: p1, black: p2 };
  };

  for (const score of sortedScores) {
    const bucket = buckets[score];
    for (let i = 0; i < bucket.length; i++) {
      const p1 = bucket[i];
      if (pairedIds.has(p1.id)) continue;

      for (let j = i + 1; j < bucket.length; j++) {
        const p2 = bucket[j];
        if (pairedIds.has(p2.id)) continue;

        const pair = tryPair(p1, p2);
        if (pair) {
          pairings.push({ white: pair.white.id, black: pair.black.id });
          pairedIds.add(p1.id);
          pairedIds.add(p2.id);
          break;
        }
      }
    }
    floaters = [...floaters, ...bucket.filter((p: any) => !pairedIds.has(p.id))];
  }

  while (floaters.length >= 2) {
    const p1 = floaters.shift();
    const p2 = floaters.shift();
    pairings.push({ white: p1.id, black: p2.id });
    pairedIds.add(p1.id);
    pairedIds.add(p2.id);
  }
  
  if (floaters.length === 1) {
    pairings.push({ white: floaters[0].id, black: null });
  }

  return pairings;
}

async function autoAssignPositions(tournamentId: number) {
  try {
    const players = await prisma.player.findMany({
      where: { tournamentId, status: RegistrationStatus.APPROVED },
      orderBy: [
        { score: 'desc' },
        { rating: 'desc' }
      ]
    });

    const updates = players.map((p, i) => 
      prisma.player.update({
        where: { id: p.id },
        data: { rank: i + 1 }
      })
    );

    await prisma.$transaction(updates);
  } catch (error) {
    console.error("❌ [Standings] Error auto-assigning positions:", error);
  }
}

async function calculateScoresForRound(round: number, tournamentId: number) {
  const matches = await prisma.match.findMany({
    where: { 
      round: { equals: round },
      whitePlayer: { tournamentId }
    },
    include: {
      whitePlayer: { include: { user: true } },
      blackPlayer: { include: { user: true } }
    }
  });

  const playerUpdates = [];
  const glickoMatches: [GlickoPlayer, GlickoPlayer, number][] = [];
  const glickoPlayersMap = new Map<string, GlickoPlayer>();
  const usersToUpdate = new Set<string>();

  for (const match of matches) {
    if (!match.result || !match.whitePlayer) continue;

    let whiteScore = 0;
    let blackScore = 0;

    if (match.result === "1-0") whiteScore = 1;
    else if (match.result === "0-1") blackScore = 1;
    else if (match.result === "1/2-1/2") {
      whiteScore = 0.5;
      blackScore = 0.5;
    }

    playerUpdates.push(prisma.player.update({
      where: { id: match.whitePlayerId },
      data: { score: { increment: whiteScore } }
    }));

    if (match.blackPlayerId) {
      playerUpdates.push(prisma.player.update({
        where: { id: match.blackPlayerId },
        data: { score: { increment: blackScore } }
      }));
    }

    if (match.whitePlayer.user && match.blackPlayer?.user) {
      const whiteUser = match.whitePlayer.user;
      const blackUser = match.blackPlayer.user;

      if (!glickoPlayersMap.has(whiteUser.id)) {
        glickoPlayersMap.set(whiteUser.id, rankingManager.makePlayer(whiteUser.siteRating, whiteUser.ratingDeviation, whiteUser.volatility));
      }
      if (!glickoPlayersMap.has(blackUser.id)) {
        glickoPlayersMap.set(blackUser.id, rankingManager.makePlayer(blackUser.siteRating, blackUser.ratingDeviation, blackUser.volatility));
      }

      glickoMatches.push([glickoPlayersMap.get(whiteUser.id)!, glickoPlayersMap.get(blackUser.id)!, whiteScore]);
      usersToUpdate.add(whiteUser.id);
      usersToUpdate.add(blackUser.id);
    }
  }

  if (playerUpdates.length > 0) await prisma.$transaction(playerUpdates);

  if (glickoMatches.length > 0) {
    rankingManager.updateRatings(glickoMatches);
    const userRatingUpdates = Array.from(usersToUpdate).map(userId => {
      const gp = glickoPlayersMap.get(userId)!;
      return prisma.user.update({
        where: { id: userId },
        data: {
          siteRating: gp.getRating(),
          ratingDeviation: gp.getRd(),
          volatility: gp.getVol(),
          gamesPlayed: { increment: 1 }
        }
      });
    });
    await prisma.$transaction(userRatingUpdates);
  }

  await autoAssignPositions(tournamentId);
  await invalidateAllCache();
}

export async function getPlayerAction(id: string) {
  try {
    return await prisma.player.findUnique({ where: { id } });
  } catch (error) {
    return null;
  }
}

export async function getPlayersAction(tournamentId: number) {
  return await prisma.player.findMany({
    where: { tournamentId },
    orderBy: { fullName: 'asc' },
  });
}

export async function getApprovedPlayersAction(tournamentId: number = 1) {
  return await prisma.player.findMany({
    where: { tournamentId, status: RegistrationStatus.APPROVED },
    orderBy: [
      { rank: 'asc' },
      { score: 'desc' },
      { rating: 'desc' }
    ],
  });
}

export async function updatePlayerStatusAction(id: string, status: RegistrationStatus) {
  await prisma.player.update({
    where: { id },
    data: { status }
  });
  safeRevalidatePath('/admin');
  return await getPlayersAction((await getPlayerAction(id))?.tournamentId || 0);
}

export async function deletePlayerAction(id: string) {
  const player = await getPlayerAction(id);
  if (player?.paymentReceipt) {
    await cloudinary.uploader.destroy(player.paymentReceipt.split('/').pop()?.split('.')[0] || '');
  }
  await prisma.player.delete({ where: { id } });
  safeRevalidatePath('/admin');
  return await getPlayersAction(player?.tournamentId || 0);
}

export async function savePlayerAction(playerData: any) {
  const { id, tournamentId, ...data } = playerData;
  const newPlayer = await prisma.player.create({
    data: {
      id: id || crypto.randomUUID(),
      tournament: { connect: { id: tournamentId } },
      ...data as any
    }
  });
  safeRevalidatePath(`/admin?tournamentId=${tournamentId}`);
  safeRevalidatePath(`/tournaments/${tournamentId}`);
  return newPlayer;
}

export async function getMatchAction(id: string) {
  try {
    return await prisma.match.findUnique({
      where: { id },
      include: {
        whitePlayer: { select: { fullName: true } },
        blackPlayer: { select: { fullName: true } }
      }
    });
  } catch (error) {
    return null;
  }
}

export async function getMatchesAction(tournamentId: number = 1) {
  return await prisma.match.findMany({
    where: { whitePlayer: { tournamentId } },
    include: {
      whitePlayer: { include: { user: true } },
      blackPlayer: { include: { user: true } }
    },
    orderBy: [{ round: 'desc' }, { table: 'asc' }]
  });
}

export async function invalidateAllCache() {
  if (redis) await redis.flushall();
  safeRevalidatePath('/');
  safeRevalidatePath('/tournaments');
  safeRevalidatePath('/awards');
  safeRevalidatePath('/study');
  safeRevalidatePath('/profile');
  safeRevalidatePath('/admin');
}

export async function getTournamentAction(tournamentId?: number) {
  const tid = tournamentId || 1;
  try {
    let tournament = await prisma.tournament.findUnique({ where: { id: tid } });
    if (!tournament && tid === 1) {
      tournament = await prisma.tournament.create({ data: { id: 1, currentRound: 1, totalRounds: 5, status: 'UPCOMING' } });
    }
    return tournament;
  } catch (error) {
    return { id: tid, currentRound: 1, totalRounds: 5, status: "UPCOMING" };
  }
}

export async function updateTournamentSettingsAction(tournamentId: number, totalRounds: number) {
  try {
    const updated = await prisma.tournament.update({
      where: { id: tournamentId },
      data: { totalRounds }
    });
    await invalidateAllCache();
    return updated;
  } catch (error) {
    return null;
  }
}

export async function advanceRoundAction(tournamentId: number) {
  try {
    const t = await getTournamentAction(tournamentId);
    if (!t || t.status === 'FINISHED') return t;

    const currentRound = Number(t.currentRound);
    const nextRound = currentRound + 1;
    
    await calculateScoresForRound(currentRound, tournamentId);

    if (nextRound > (t.totalRounds || 5)) {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: "FINISHED" }
      });
      await invalidateAllCache();
      return { ...t, status: "FINISHED" };
    }
    
    await prisma.match.deleteMany({
      where: { 
        round: { equals: nextRound },
        whitePlayer: { tournamentId }
      }
    });

    await generateSwissPairingsAction(nextRound, tournamentId);

    const updated = await prisma.tournament.update({
      where: { id: tournamentId },
      data: { currentRound: nextRound }
    });

    await invalidateAllCache();
    return updated;
  } catch (error: any) {
    throw new Error(error.message || "Failed to advance round");
  }
}

export async function finishTournamentAction(tournamentId: number) {
  try {
    const t = await getTournamentAction(tournamentId);
    if (!t) return;
    await calculateScoresForRound(t.currentRound, tournamentId);
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "FINISHED" }
    });
    await invalidateAllCache();
  } catch (error) {}
}

export async function resetTournamentAction(tournamentId: number) {
    try {
        await prisma.player.updateMany({ 
          where: { tournamentId },
          data: { score: 0, rank: null } 
        });
        await prisma.match.deleteMany({
          where: { whitePlayer: { tournamentId } }
        }); 
        
        await prisma.tournament.update({
            where: { id: tournamentId },
            data: { currentRound: 1, status: "UPCOMING" }
        });

        await invalidateAllCache();
    } catch (e) {}
}

export async function updateMatchResultAction(matchId: string, result: string) {
  try {
    const m = await prisma.match.update({
      where: { id: matchId },
      data: { result },
      include: { whitePlayer: { select: { tournamentId: true } } }
    });
    await invalidateAllCache();
    return await getMatchesAction(m.whitePlayer.tournamentId);
  } catch (error) {
    return [];
  }
}

export async function generateSwissPairingsAction(round: number, tournamentId: number) {
  try {
    const players = await prisma.player.findMany({
      where: { status: RegistrationStatus.APPROVED, tournamentId },
      include: {
        matchesAsWhite: { select: { blackPlayerId: true } },
        matchesAsBlack: { select: { whitePlayerId: true } }
      }
    });

    if (players.length < 2) return [];

    const formattedPlayers = players.map(p => {
      const avoid = [
        ...p.matchesAsWhite.map(m => m.blackPlayerId),
        ...p.matchesAsBlack.map(m => m.whitePlayerId)
      ].filter((id): id is string => id !== null);

      return { id: p.id, score: p.score, avoid, rating: p.rating };
    });

    let pairings: any[] = [];
    if (players.length >= 4) {
      try {
        pairings = Swiss(formattedPlayers, round);
      } catch (externalError) {
        pairings = manualSwissFallback(players, await prisma.match.findMany({ where: { whitePlayer: { tournamentId } } }), round);
      }
    } else {
      pairings = manualSwissFallback(players, await prisma.match.findMany({ where: { whitePlayer: { tournamentId } } }), round);
    }

    const matchesToCreate = [];
    const playerUpdates = [];
    let table = 1;

    for (const pair of pairings) {
      const whiteId = pair.white || pair.player1;
      const blackId = pair.black || pair.player2;

      if (whiteId && blackId) {
        matchesToCreate.push({
          id: crypto.randomUUID(),
          whitePlayerId: whiteId as string,
          blackPlayerId: blackId as string,
          round,
          table: table++,
          result: null
        });
        const wPlayer = players.find(p => p.id === whiteId);
        const bPlayer = players.find(p => p.id === blackId);
        if (wPlayer && bPlayer) {
          sendMatchNotificationSMS(wPlayer as any, bPlayer.fullName, "WHITE", round);
          sendMatchNotificationSMS(bPlayer as any, wPlayer.fullName, "BLACK", round);
        }
      } else {
        const byePlayerId = (whiteId || blackId) as string;
        if (byePlayerId) {
          matchesToCreate.push({
            id: crypto.randomUUID(),
            whitePlayerId: byePlayerId,
            blackPlayerId: null, 
            round,
            table: 999, 
            result: "1/2-1/2" 
          });
          playerUpdates.push(prisma.player.update({
            where: { id: byePlayerId },
            data: { score: { increment: 0.5 } }
          }));
        }
      }
    }

    if (matchesToCreate.length > 0) {
      await prisma.$transaction([
        ...matchesToCreate.map(match => prisma.match.create({ data: match })),
        ...playerUpdates,
        prisma.tournament.update({
          where: { id: tournamentId },
          data: { currentRound: round, status: 'ONGOING' }
        })
      ]);
    }

    await invalidateAllCache();
    return await getMatchesAction(tournamentId);
  } catch (error) {
    return [];
  }
}

export async function generateRoundRobinAction(tournamentId: number) {
  try {
    const players = await prisma.player.findMany({
      where: { status: RegistrationStatus.APPROVED, tournamentId }
    });

    if (players.length < 2) return [];

    const n = players.length;
    let rotation = shuffleArray(players.map(p => p.id));
    if (n % 2 !== 0) rotation.push("BYE");

    const roundsToGenerate = rotation.length - 1;
    const matchesToCreate = [];
    const playerUpdates = [];

    for (let round = 1; round <= roundsToGenerate; round++) {
      let tableCount = 1;
      for (let i = 0; i < rotation.length / 2; i++) {
        let p1 = rotation[i];
        let p2 = rotation[rotation.length - 1 - i];
        
        if (p1 === "BYE" || p2 === "BYE") {
          const realPlayerId = p1 === "BYE" ? p2 : p1;
          matchesToCreate.push({ 
            id: crypto.randomUUID(),
            whitePlayerId: realPlayerId, 
            blackPlayerId: null, 
            round, 
            table: 999, 
            result: "1/2-1/2" 
          });
          playerUpdates.push(prisma.player.update({
            where: { id: realPlayerId },
            data: { score: { increment: 0.5 } }
          }));
          continue;
        }

        const matchId = crypto.randomUUID();
        if (Math.random() > 0.5) {
          matchesToCreate.push({ id: matchId, whitePlayerId: p1, blackPlayerId: p2, round, table: tableCount++ });
        } else {
          matchesToCreate.push({ id: matchId, whitePlayerId: p2, blackPlayerId: p1, round, table: tableCount++ });
        }
      }
      
      const fixed = rotation[0];
      const rest = rotation.slice(1);
      const last = rest.pop()!;
      rest.unshift(last);
      rotation = [fixed, ...rest];
    }

    await prisma.$transaction([
      ...matchesToCreate.map(match => prisma.match.create({ data: match })),
      ...playerUpdates,
      prisma.tournament.update({
        where: { id: tournamentId },
        data: { currentRound: 1, totalRounds: roundsToGenerate, status: 'ONGOING' }
      })
    ]);

    await invalidateAllCache();
    return await getMatchesAction(tournamentId);
  } catch (error) {
    return [];
  }
}

export async function recalculateStandingsAction(tournamentId: number) {
  try {
    const matches = await prisma.match.findMany({
      where: { whitePlayer: { tournamentId }, result: { not: null } },
      include: { whitePlayer: true, blackPlayer: true }
    });

    await prisma.player.updateMany({
      where: { tournamentId },
      data: { score: 0 }
    });

    const playerScores: { [key: string]: number } = {};
    const playerGamesPlayed: { [key: string]: number } = {};

    matches.forEach(match => {
      const whiteId = match.whitePlayerId;
      const blackId = match.blackPlayerId;

      if (match.result === "1-0") {
        playerScores[whiteId] = (playerScores[whiteId] || 0) + 1;
        playerGamesPlayed[whiteId] = (playerGamesPlayed[whiteId] || 0) + 1;
        if (blackId) playerGamesPlayed[blackId] = (playerGamesPlayed[blackId] || 0) + 1;
      } else if (match.result === "0-1") {
        if (blackId) playerScores[blackId] = (playerScores[blackId] || 0) + 1;
        playerGamesPlayed[whiteId] = (playerGamesPlayed[whiteId] || 0) + 1;
        if (blackId) playerGamesPlayed[blackId] = (playerGamesPlayed[blackId] || 0) + 1;
      } else if (match.result === "1/2-1/2") {
        playerScores[whiteId] = (playerScores[whiteId] || 0) + 0.5;
        if (blackId) playerScores[blackId] = (playerScores[blackId] || 0) + 0.5;
        playerGamesPlayed[whiteId] = (playerGamesPlayed[whiteId] || 0) + 1;
        if (blackId) playerGamesPlayed[blackId] = (playerGamesPlayed[blackId] || 0) + 1;
      }
    });

    const playerUpdates = Object.entries(playerScores).map(([playerId, score]) => 
      prisma.player.update({ where: { id: playerId }, data: { score } })
    );
    if (playerUpdates.length > 0) await prisma.$transaction(playerUpdates);

    const allUsers = await prisma.user.findMany({ where: { registrations: { some: { tournamentId } } } });
    const glickoMatches: [GlickoPlayer, GlickoPlayer, number][] = [];
    const glickoPlayersMap = new Map<string, GlickoPlayer>();

    for (const user of allUsers) {
      glickoPlayersMap.set(user.id, rankingManager.makePlayer(user.siteRating, user.ratingDeviation, user.volatility));
    }

    matches.forEach(match => {
      if (!match.result || !match.whitePlayer?.userId || !match.blackPlayer?.userId) return;
      const whiteGP = glickoPlayersMap.get(match.whitePlayer.userId);
      const blackGP = glickoPlayersMap.get(match.blackPlayer.userId);
      if (!whiteGP || !blackGP) return;

      let res = 0.5;
      if (match.result === "1-0") res = 1;
      else if (match.result === "0-1") res = 0;
      glickoMatches.push([whiteGP, blackGP, res]);
    });
    
    if (glickoMatches.length > 0) {
      rankingManager.updateRatings(glickoMatches);
      const userRatingUpdates = Array.from(glickoPlayersMap.entries()).map(([userId, gp]) => {
        const user = allUsers.find(u => u.id === userId);
        return prisma.user.update({
          where: { id: userId },
          data: {
            siteRating: gp.getRating(),
            ratingDeviation: gp.getRd(),
            volatility: gp.getVol(),
            gamesPlayed: (playerGamesPlayed[userId] || 0) + (user?.gamesPlayed || 0)
          }
        });
      });
      await prisma.$transaction(userRatingUpdates);
    }
    
    await autoAssignPositions(tournamentId);
    await invalidateAllCache();
  } catch (error) {}
}

export async function uploadImageAction(base64Image: string): Promise<string> {
  try {
    const res = await cloudinary.uploader.upload(base64Image, { upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET });
    return res.secure_url;
  } catch (error) {
    throw new Error("Upload failed");
  }
}

export async function purgeRedisAction(): Promise<void> {
  try {
    if (redis) await redis.flushall();
    await invalidateAllCache();
  } catch (error) {
    throw new Error("Purge failed");
  }
}

export async function getPaymentReceiptAction(playerId: string): Promise<string | null> {
  try {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { paymentReceipt: true }
    });
    return player?.paymentReceipt || null;
  } catch (error) {
    return null;
  }
}

export async function updatePlayerStatsAction(id: string, rank: number | null, score: number) {
  try {
    const updated = await prisma.player.update({
      where: { id: id },
      data: { rank, score }
    });
    await invalidateAllCache();
    return updated;
  } catch (error) {
    console.error("Failed to update player stats:", error);
    return null;
  }
}
