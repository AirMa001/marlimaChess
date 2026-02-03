import React from 'react';
import { getApprovedPlayersAction } from '@/app/actions';
import AdminStandingsClient from '@/components/AdminStandingsClient';

export default async function AdminStandings() {
  const players = await getApprovedPlayersAction();

  return <AdminStandingsClient initialPlayers={players} />;
}