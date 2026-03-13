'use server';

import { RegistrationStatus } from '@/types';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redis } from '@/lib/redis';
import cloudinary from '@/lib/cloudinary';
import { rankingManager } from '@/lib/glicko';
import Manager from 'tournament-organizer';
import crypto from 'crypto';
// @ts-ignore
import { Player as GlickoPlayer } from 'glicko2.ts';

function safeRevalidatePath(path: string, type?: 'layout' | 'page') {
  try {
    revalidatePath(path, type);
  } catch (e) {}
}

export async function getTournamentEngine(tournamentId: number) {
  const tInfo = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tInfo) throw new Error("Tournament not found");

  const players = await prisma.player.findMany({ 
    where: { tournamentId, status: RegistrationStatus.APPROVED },
    orderBy: { registeredAt: 'asc' }
  });
  
  const matches = await prisma.match.findMany({ 
    where: { whitePlayer: { tournamentId }, result: { not: null } },
    orderBy: { round: 'asc' } 
  });

  const manager = new Manager();
  const t = manager.createTournament(tInfo.name || "Tournament", {
    stageOne: { format: 'swiss', rounds: tInfo.totalRounds || 5 },
    sorting: 'none',
    scoring: { win: 1, draw: 0.5, loss: 0, tiebreaks: ['solkoff', 'median buchholz', 'sonneborn berger'] }
  });

  for (const p of players) {
    t.createPlayer(p.fullName, p.id);
  }

  if (players.length < 2) return { t, tInfo };
  t.startTournament();

  const maxRound = matches.reduce((max, m) => Math.max(max, m.round), 0);
  
  for (let r = 1; r <= maxRound; r++) {
    const roundMatches = matches.filter(m => m.round === r);
    const activeEngineMatches = t.getActiveMatches();
    
    const usedEngineMatches = new Set<string>();
    
    // Replay DB state to engine
    for (let i = 0; i < roundMatches.length; i++) {
      const dbm = roundMatches[i];
      if (!dbm.blackPlayerId) {
         // 🧹 CLEAR PLAYER FROM ENGINE-GENERATED MATCHES FOR THIS ROUND FIRST
         const existingMatch = activeEngineMatches.find(m => 
            !usedEngineMatches.has(m.getId()) &&
            (m.getPlayer1()?.id === dbm.whitePlayerId || m.getPlayer2()?.id === dbm.whitePlayerId)
         );
         if (existingMatch) {
            const op1Id = existingMatch.getPlayer1().id;
            const op2Id = existingMatch.getPlayer2().id;
            if (op1Id) try { t.getPlayer(op1Id).removeMatch(existingMatch.getId()); } catch(e){}
            if (op2Id) try { t.getPlayer(op2Id).removeMatch(existingMatch.getId()); } catch(e){}
            usedEngineMatches.add(existingMatch.getId());
         }

         try { t.assignBye(dbm.whitePlayerId, r); } catch(e){}
         continue;
      }
      
      let em = activeEngineMatches.find(m => 
        !usedEngineMatches.has(m.getId()) && 
        (m.getPlayer1()?.id === dbm.whitePlayerId || m.getPlayer2()?.id === dbm.whitePlayerId)
      );
      if (!em) {
         em = activeEngineMatches.find(m => !usedEngineMatches.has(m.getId()) && !m.hasEnded());
      }
      
      if (em) {
         usedEngineMatches.add(em.getId());
         const p1 = t.getPlayer(dbm.whitePlayerId);
         const p2 = t.getPlayer(dbm.blackPlayerId);
         if (p1 && p2) {
             // ♟️ SYNC ENGINE PLAYER LINKS ♟️
             // Remove match from whoever the engine thought was playing
             const oldP1Id = em.getPlayer1().id;
             const oldP2Id = em.getPlayer2().id;
             if (oldP1Id && oldP1Id !== p1.getId()) try { t.getPlayer(oldP1Id).removeMatch(em.getId()); } catch(e){}
             if (oldP2Id && oldP2Id !== p2.getId()) try { t.getPlayer(oldP2Id).removeMatch(em.getId()); } catch(e){}

             // Assign ACTUAL players
             em.set({ player1: p1.getValues(), player2: p2.getValues() });
             
             // Ensure players know they are in this match
             if (!p1.getMatches().some((m: any) => m.id === em.getId())) {
                try { p1.addMatch({ id: em.getId(), opponent: p2.getId() }); } catch(e){}
             }
             if (!p2.getMatches().some((m: any) => m.id === em.getId())) {
                try { p2.addMatch({ id: em.getId(), opponent: p1.getId() }); } catch(e){}
             }

             if (dbm.result === '1-0') t.enterResult(em.getId(), 1, 0);
             else if (dbm.result === '0-1') t.enterResult(em.getId(), 0, 1);
             else if (dbm.result === '1/2-1/2') t.enterResult(em.getId(), 0, 0, 1);
         }
      }
    }
    
    if (r < maxRound) {
       t.nextRound();
    }
  }

  return { t, tInfo };
}

export async function getPlayerAction(id: string) {
  try {
    return await prisma.player.findUnique({ where: { id } });
  } catch (error) {
    return null;
  }
}

export async function getPlayersAction(tournamentId: number = 1) {
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
  return await getPlayersAction(await getPlayerAction(id).then(p => p?.tournamentId || 0));
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
  const { id, tournamentId, userId, ...data } = playerData;
  const newPlayer = await prisma.player.create({
    data: {
      id: id || crypto.randomUUID(),
      tournament: { connect: { id: tournamentId } },
      ...(userId ? { user: { connect: { id: userId } } } : {}),
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
    where: { 
      OR: [
        { whitePlayer: { tournamentId } },
        { blackPlayer: { tournamentId } }
      ]
    },
    include: {
      whitePlayer: { include: { user: true } },
      blackPlayer: { include: { user: true } }
    },
    orderBy: [{ round: 'desc' }, { table: 'asc' }]
  });
}

export async function invalidateAllCache() {
  try {
    if (redis) {
      console.log("🧹 [Cache] Flushing Redis...");
      await redis.flushall();
    }
  } catch (error) {
    console.error("❌ [Redis] Flush error:", error);
  }

  const paths = ['/', '/tournaments', '/awards', '/study', '/profile', '/admin'];
  
  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch (e) {}
  }
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
    return { id: tid, currentRound: 1, totalRounds: 5, status: 'UPCOMING' };
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
    const { t, tInfo } = await getTournamentEngine(tournamentId);
    if (!tInfo || tInfo.status === 'FINISHED') return tInfo;

    const currentRound = Number(tInfo.currentRound);
    const nextRound = currentRound + 1;

    // Check if we reached the end
    if (nextRound > (tInfo.totalRounds || 5)) {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: 'FINISHED' }
      });
      await recalculateStandingsAction(tournamentId);
      return { ...tInfo, status: 'FINISHED' };
    }

    if (nextRound > 1) {
      t.nextRound(); // Generates new pairings for next round
    }
    
    const matchesToCreate = [];
    const activeMatches = t.getActiveMatches();
    let table = 1;

    // Delete existing rounds to prevent duplicates
    await prisma.match.deleteMany({
      where: { round: { equals: nextRound }, whitePlayer: { tournamentId } }
    });

    for (const m of activeMatches) {
       if (m.isBye()) {
          const p1 = m.getPlayer1();
          if (p1) {
            matchesToCreate.push({
              id: crypto.randomUUID(),
              whitePlayerId: p1.id as string,
              blackPlayerId: null,
              round: nextRound,
              table: 999,
              result: '1/2-1/2' 
            });
          }
       } else {
          const p1 = m.getPlayer1();
          const p2 = m.getPlayer2();
          if (p1 && p2) {
             matchesToCreate.push({
               id: crypto.randomUUID(),
               whitePlayerId: p1.id as string,
               blackPlayerId: p2.id as string,
               round: nextRound,
               table: table++,
               result: null
             });
          }
       }
    }

    if (matchesToCreate.length > 0) {
      await prisma.match.createMany({ data: matchesToCreate });
    }

    const updated = await prisma.tournament.update({
      where: { id: tournamentId },
      data: { currentRound: nextRound, status: 'ONGOING' }
    });

    await recalculateStandingsAction(tournamentId);
    return updated;
  } catch (error: any) {
    throw new Error(error.message || "Failed to advance round");
  }
}

export async function finishTournamentAction(tournamentId: number) {
  try {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: 'FINISHED' }
    });
    await recalculateStandingsAction(tournamentId);
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
            data: { currentRound: 1, status: 'UPCOMING' }
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
    await recalculateStandingsAction(m.whitePlayer.tournamentId);
    return await getMatchesAction(m.whitePlayer.tournamentId);
  } catch (error) {
    return [];
  }
}

export async function generateSwissPairingsAction(round: number, tournamentId: number) {
  // Alias for backward compatibility if directly called for round 1
  if (round === 1) {
     const tInfo = await prisma.tournament.findUnique({ where: { id: tournamentId } });
     if (tInfo) {
         // Reset round to 0 so advanceRound steps to 1
         await prisma.tournament.update({ where: { id: tournamentId }, data: { currentRound: 0 } });
         await advanceRoundAction(tournamentId);
     }
  } else {
     await advanceRoundAction(tournamentId);
  }
  return await getMatchesAction(tournamentId);
}

export async function generateRoundRobinAction(tournamentId: number) {
  return generateSwissPairingsAction(1, tournamentId);
}

export async function recalculateStandingsAction(tournamentId: number) {
  try {
    const { t } = await getTournamentEngine(tournamentId);
    if (!t) return;
    
    const standings = t.getStandings();
    const playerUpdates = standings.map((s, i) => 
      prisma.player.update({
        where: { id: s.player.getId() },
        data: { 
          score: s.matchPoints || 0,
          rank: i + 1
        }
      })
    );

    // Glicko updates
    const matches = await prisma.match.findMany({
      where: { whitePlayer: { tournamentId }, result: { not: null } },
      include: { whitePlayer: { include: { user: true } }, blackPlayer: { include: { user: true } } }
    });

    const glickoMatches: any[] = [];
    const glickoPlayersMap = new Map();
    const usersToUpdate = new Set();

    for (const match of matches) {
        if (!match.whitePlayer?.user || !match.blackPlayer?.user) continue;
        const whiteUser = match.whitePlayer.user;
        const blackUser = match.blackPlayer.user;
        
        if (!glickoPlayersMap.has(whiteUser.id)) glickoPlayersMap.set(whiteUser.id, rankingManager.makePlayer(whiteUser.siteRating, whiteUser.ratingDeviation, whiteUser.volatility));
        if (!glickoPlayersMap.has(blackUser.id)) glickoPlayersMap.set(blackUser.id, rankingManager.makePlayer(blackUser.siteRating, blackUser.ratingDeviation, blackUser.volatility));
        
        let score = 0.5;
        if (match.result === '1-0') score = 1;
        else if (match.result === '0-1') score = 0;
        
        glickoMatches.push([glickoPlayersMap.get(whiteUser.id), glickoPlayersMap.get(blackUser.id), score]);
        usersToUpdate.add(whiteUser.id);
        usersToUpdate.add(blackUser.id);
    }
    
    const userRatingUpdates: any[] = [];
    if (glickoMatches.length > 0) {
        rankingManager.updateRatings(glickoMatches as any);
        for (const userId of Array.from(usersToUpdate)) {
          const gp = glickoPlayersMap.get(userId);
          userRatingUpdates.push(
            prisma.user.update({
              where: { id: userId as string },
              data: { siteRating: gp.getRating(), ratingDeviation: gp.getRd(), volatility: gp.getVol(), gamesPlayed: { increment: 1 } }
            })
          );
        }
    }

    if (playerUpdates.length > 0 || userRatingUpdates.length > 0) {
      await prisma.$transaction([...playerUpdates, ...userRatingUpdates]);
    }
    await invalidateAllCache();
  } catch (error) {
     console.error(error);
  }
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
