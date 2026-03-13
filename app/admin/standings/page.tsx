import React, { use } from 'react';
import { getApprovedPlayersAction, getMatchesAction, getTournamentAction } from '@/app/actions';
import AdminStandingsClient from '@/components/AdminStandingsClient';

export const dynamic = 'force-dynamic';

export default function AdminStandings({ searchParams }: { searchParams: Promise<{ tournamentId?: string }> }) {
  const { tournamentId } = use(searchParams);
  const tid = tournamentId ? parseInt(tournamentId) : 1;
  
  const [players, matches, tournament] = use(Promise.all([
    getApprovedPlayersAction(tid),
    getMatchesAction(tid),
    getTournamentAction(tid)
  ]));

  return (
    <AdminStandingsClient 
      initialPlayers={players as any} 
      initialMatches={matches as any}
      currentRound={tournament?.currentRound || 0}
      tournamentId={tid} 
    />
  );
}
