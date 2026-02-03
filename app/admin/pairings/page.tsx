import React from 'react';
import { getApprovedPlayersAction, getTournamentAction } from '@/app/actions';
import AdminPairingsClient from '@/components/AdminPairingsClient';

export default async function AdminPairings() {
  const [players, tournament] = await Promise.all([
    getApprovedPlayersAction(),
    getTournamentAction()
  ]);

  return (
    <AdminPairingsClient 
      initialPlayerCount={players.length}
      initialRound={tournament.currentRound}
    />
  );
}
