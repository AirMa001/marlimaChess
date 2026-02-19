import React, { use } from 'react';
import { getApprovedPlayersAction, getTournamentAction, getMatchesAction } from '@/app/actions';
import AdminPairingsClient from '@/components/AdminPairingsClient';

export const dynamic = 'force-dynamic';

export default function AdminPairings({ searchParams }: { searchParams: Promise<{ tournamentId?: string }> }) {
  const { tournamentId } = use(searchParams);
  const tid = tournamentId ? parseInt(tournamentId) : 1;

  const [players, tournament, matches] = use(Promise.all([
    getApprovedPlayersAction(tid),
    getTournamentAction(tid),
    getMatchesAction(tid)
  ]));

  if (!tournament) return <div>Tournament not found</div>;

  const currentRound = tournament.currentRound;
  const hasMatchesForCurrentRound = matches.some(m => m.round === currentRound);
  const targetRound = hasMatchesForCurrentRound ? currentRound + 1 : currentRound;

  return (
    <AdminPairingsClient 
      initialPlayerCount={players.length}
      initialRound={targetRound}
      initialTotalRounds={tournament.totalRounds || 5}
      tournamentId={tid}
    />
  );
}