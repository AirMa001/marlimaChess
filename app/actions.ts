'use server';

import { RegistrationStatus } from '@/types';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redis } from '@/lib/redis';
import cloudinary from '@/lib/cloudinary';
import { Tournament, Match, Manager } from 'tournament-organizer/components';
import crypto from 'crypto';

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
    orderBy: [
      { rank: 'asc' },
      { rating: 'desc' },
      { fullName: 'asc' }
    ]
  });
  
  const matches = await prisma.match.findMany({ 
    where: { 
      OR: [
        { whitePlayer: { tournamentId } },
        { blackPlayer: { tournamentId } }
      ]
    },
    orderBy: { round: 'asc' } 
  });

  console.log(`🔍 [Engine] DB Query returned ${matches.length} matches for Tournament ${tournamentId}`);

  // Create tournament manually
  const t = new Tournament(tInfo.id.toString(), tInfo.name || "Tournament");
  
  t.set({
    stageOne: { format: 'swiss', rounds: tInfo.totalRounds || 5 },
    sorting: 'none',
    seating: true, // Rule 3: Color Fairness
    scoring: { 
      win: 1, 
      draw: 0.5, 
      loss: 0, 
      // @ts-ignore
      bye: 0.5, // Rule 1: Bye Points
      tiebreaks: ['solkoff', 'median buchholz', 'sonneborn berger'] 
    }
  });

  // 1. Hydrate Players
  for (const p of players) {
    t.createPlayer(p.fullName, p.id);
  }

  // 2. Hydrate Matches Manually
  if (matches.length > 0) {
    t.set({ status: 'stage-one', round: tInfo.currentRound });
    
    for (const dbm of matches) {
      const p1 = t.getPlayer(dbm.whitePlayerId);
      if (!p1) continue;

      const em = new Match(dbm.id, dbm.round, dbm.table || 0);
      
      if (!dbm.blackPlayerId) {
        // Rule 1: Bye Points (0.5 pts)
        let p1Wins = 0, draws = 0;
        if (dbm.result === '1-0') p1Wins = 1;
        else if (dbm.result === '1/2-1/2') draws = 1;
        else draws = 1; // Default to 0.5

        em.set({
          bye: true,
          active: false,
          player1: { id: dbm.whitePlayerId, win: p1Wins, draw: draws },
          player2: { id: null }
        });
        p1.addMatch({ id: em.getId(), opponent: null, bye: true, win: p1Wins, draw: draws });
      } else {
        const p2 = t.getPlayer(dbm.blackPlayerId);
        if (!p2) continue;

        let p1Wins = 0, p2Wins = 0, draws = 0;
        if (dbm.result === '1-0') p1Wins = 1;
        else if (dbm.result === '0-1') p2Wins = 1;
        else if (dbm.result === '1/2-1/2') draws = 1;

        em.set({
          active: !dbm.result,
          player1: { id: dbm.whitePlayerId, win: p1Wins, loss: p2Wins, draw: draws },
          player2: { id: dbm.blackPlayerId, win: p2Wins, loss: p1Wins, draw: draws }
        });

        // Rule 3: Seating 1 (White) and -1 (Black)
        p1.addMatch({ id: em.getId(), opponent: p2.getId(), win: p1Wins, loss: p2Wins, draw: draws, seating: 1 });
        p2.addMatch({ id: em.getId(), opponent: p1.getId(), win: p2Wins, loss: p1Wins, draw: draws, seating: -1 });
      }

      // @ts-ignore
      t.matches.push(em);
    }
  } else if (tInfo.status !== 'UPCOMING') {
     t.set({ status: 'stage-one', round: 1 });
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
      { score: 'desc' }
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
    console.log(`🚀 [Pairings] Starting Generation for Tournament ${tournamentId}`);
    const { t, tInfo } = await getTournamentEngine(tournamentId);
    
    if (!tInfo) throw new Error("Tournament metadata not found");
    if (tInfo.status === 'FINISHED') {
      console.warn("   ⚠️ Cannot advance: Tournament is already FINISHED");
      return tInfo;
    }

    const currentRound = Number(tInfo.currentRound);
    let nextRound;
    if (tInfo.status === 'UPCOMING') {
      nextRound = 1;
    } else {
      nextRound = currentRound + 1;
    }

    // Check if we reached the end
    if (nextRound > (tInfo.totalRounds || 5)) {
      console.log("   🏁 Reached max rounds. Finishing tournament...");
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: 'FINISHED' }
      });
      await recalculateStandingsAction(tournamentId);
      return { ...tInfo, status: 'FINISHED' };
    }

    // Rule 1: Bye Assignment Logic (Odd number of players)
    const activePlayers = t.getActivePlayers();
    let byeRecipient: any = null;
    if (activePlayers.length % 2 !== 0) {
      const standings = t.getStandings();
      // Identify lowest-ranked eligible player (no previous bye)
      byeRecipient = [...standings].reverse().find(s => {
        const p = s.player;
        return !p.getMatches().some((m: any) => m.bye === true);
      });

      if (byeRecipient) {
        console.log(`🎯 Manual Bye assigned to ${byeRecipient.player.getName()} (Lowest eligible)`);
        // Force the engine to skip this player during pairing
        byeRecipient.player.set({ active: false });
      }
    }

    // Trigger Pairing Engine
    if (nextRound === 1) {
      t.startTournament();
    } else {
      t.nextRound();
    }

    // Re-activate bye recipient and manually assign the Bye
    if (byeRecipient) {
      byeRecipient.player.set({ active: true });
      t.assignBye(byeRecipient.player.getId(), nextRound);
    }

    const allRoundMatches = t.getMatchesByRound(nextRound);
    const standingsForPts = t.getStandings();
    const playerPointsMap = new Map();
    standingsForPts.forEach((s: any) => {
      const pts = s.matchPoints ?? s.points ?? s.score ?? 0;
      playerPointsMap.set(s.player.getId(), pts);
    });

    const nonByeMatches = allRoundMatches.filter(m => !m.isBye());
    const byeMatch = allRoundMatches.find(m => m.isBye());

    const getPlayerPts = (pId: string | null) => pId ? (playerPointsMap.get(pId) || 0) : 0;

    // Rule 2: Top Board Priority Sorting
    // Primary: Max points of either player (desc); Secondary: Sum of points (desc)
    nonByeMatches.sort((a, b) => {
      const aP1Id = a.getPlayer1()?.id;
      const aP2Id = a.getPlayer2()?.id;
      const bP1Id = b.getPlayer1()?.id;
      const bP2Id = b.getPlayer2()?.id;

      const aP1Pts = getPlayerPts(aP1Id);
      const aP2Pts = getPlayerPts(aP2Id);
      const bP1Pts = getPlayerPts(bP1Id);
      const bP2Pts = getPlayerPts(bP2Id);

      const aMax = Math.max(aP1Pts, aP2Pts);
      const bMax = Math.max(bP1Pts, bP2Pts);
      if (bMax !== aMax) return bMax - aMax;

      const aSum = aP1Pts + aP2Pts;
      const bSum = bP1Pts + bP2Pts;
      return bSum - aSum;
    });

    const matchesToCreate = [];
    let table = 1;

    // Process non-bye matches for top boards
    for (const m of nonByeMatches) {
      const p1 = t.getPlayer(m.getPlayer1().id!);
      const p2 = t.getPlayer(m.getPlayer2().id!);
      if (p1 && p2) {
        const p1Pts = getPlayerPts(p1.getId());
        const p2Pts = getPlayerPts(p2.getId());
        // Rule 4: Board Logging
        console.log(`⚔️ Board ${table} (${p1Pts} vs ${p2Pts}): ${p1.getName()} vs ${p2.getName()}`);
        matchesToCreate.push({
          id: crypto.randomUUID(),
          whitePlayerId: p1.getId(),
          blackPlayerId: p2.getId(),
          round: nextRound,
          table: table++,
          result: null
        });
      }
    }

    // Rule 2: Bye match on the absolute last board
    if (byeMatch) {
      const p1 = t.getPlayer(byeMatch.getPlayer1().id!);
      if (p1) {
        const p1Pts = getPlayerPts(p1.getId());
        // Rule 4: Board Logging (for Bye)
        console.log(`⚔️ Board ${table} (${p1Pts} vs 0): ${p1.getName()} vs BYE`);
        matchesToCreate.push({
          id: crypto.randomUUID(),
          whitePlayerId: p1.getId(),
          blackPlayerId: null,
          round: nextRound,
          table: table++,
          result: '1/2-1/2' // Rule 1: Bye = Draw (0.5 pts)
        });
      }
    }

    console.log(`   🧹 Clearing RD ${nextRound} records...`);
    await prisma.match.deleteMany({
      where: { round: nextRound, whitePlayer: { tournamentId } }
    });

    if (matchesToCreate.length > 0) {
      await prisma.match.createMany({ data: matchesToCreate });
    }

    const updated = await prisma.tournament.update({
      where: { id: tournamentId },
      data: { currentRound: nextRound, status: 'ONGOING' }
    });

    await recalculateStandingsAction(tournamentId);
    console.log(`✅ [Pairings] Round ${nextRound} successfully deployed.`);
    return updated;
  } catch (error: any) {
    console.error(`❌ [Pairings] Critical Failure:`, error.message);
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
    console.log(`📊 [Standings] Recalculating for Tournament ${tournamentId}. Players: ${standings.length}`);

    const playerUpdates = standings.map((s, i) => {
      // @ts-ignore
      const matchPoints = s.matchPoints ?? s.points ?? s.score ?? 0;
      console.log(`   👤 ${s.player.getName()}: ${matchPoints} pts (Rank ${i + 1})`);
      
      const updateData: any = {
        score: matchPoints,
        rank: i + 1,
      };

      // @ts-ignore
      if (s.tiebreaks) {
        updateData.buc1 = s.tiebreaks.medianBuchholz || 0;
        updateData.bucT = s.tiebreaks.solkoff || 0;
      }

      return prisma.player.update({
        where: { id: s.player.getId() },
        data: updateData
      }).catch(err => {
        console.error(`❌ [Standings] Failed to update player ${s.player.getId()}:`, err.message);
        return prisma.player.update({
          where: { id: s.player.getId() },
          data: { score: matchPoints, rank: i + 1 }
        });
      });
    });

    if (playerUpdates.length > 0) {
      await Promise.all(playerUpdates);
      console.log(`✅ [Standings] Saved ${playerUpdates.length} player updates.`);
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
