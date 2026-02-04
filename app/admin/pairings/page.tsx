import React from 'react';
import { getApprovedPlayersAction, getTournamentAction, getMatchesAction } from '@/app/actions';
import AdminPairingsClient from '@/components/AdminPairingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminPairings() {
  const [players, tournament, matches] = await Promise.all([
    getApprovedPlayersAction(),
    getTournamentAction(),
    getMatchesAction()
  ]);

  // If we already have matches for the current round, 
  // the 'Pairings' page should suggest generating for the NEXT round.
  const currentRound = tournament.currentRound;
  const hasMatchesForCurrentRound = matches.some(m => m.round === currentRound);
  const targetRound = hasMatchesForCurrentRound ? currentRound + 1 : currentRound;

  return (
    <AdminPairingsClient 
      initialPlayerCount={players.length}
      initialRound={targetRound}
      initialTotalRounds={tournament.totalRounds || 5}
    />
  );
}
