import React, { use } from 'react';
import { getMatchesAction, getTournamentAction } from '@/app/actions';
import AdminMatchesClient from '@/components/AdminMatchesClient';

export const dynamic = 'force-dynamic';

export default function AdminMatches({ searchParams }: { searchParams: Promise<{ tournamentId?: string }> }) {
  const { tournamentId } = use(searchParams);
  const tid = tournamentId ? parseInt(tournamentId) : 1;

  const [matches, tournament] = use(Promise.all([
    getMatchesAction(tid),
    getTournamentAction(tid)
  ]));

  if (!tournament) return <div>Tournament not found</div>;

  return (
    <AdminMatchesClient 
      initialMatches={matches as any}
      initialRound={tournament.currentRound}
      initialStatus={tournament.status}
      totalRounds={tournament.totalRounds || 5}
      tournamentId={tid}
    />
  );
}