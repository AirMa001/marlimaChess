import React from 'react';
import { getMatchesAction, getTournamentAction } from '@/app/actions';
import AdminMatchesClient from '@/components/AdminMatchesClient';

export const dynamic = 'force-dynamic';

export default async function AdminMatches() {
  const [matches, tournament] = await Promise.all([
    getMatchesAction(),
    getTournamentAction()
  ]);

  return (
    <AdminMatchesClient 
      initialMatches={matches}
      initialRound={tournament.currentRound}
      initialStatus={tournament.status}
    />
  );
}