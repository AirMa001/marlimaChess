import React, { use } from 'react';
import { getPlayersAction } from '@/app/actions';
import AdminStandingsClient from '@/components/AdminStandingsClient';

export const dynamic = 'force-dynamic';

export default function AdminStandings({ searchParams }: { searchParams: Promise<{ tournamentId?: string }> }) {
  const { tournamentId } = use(searchParams);
  const tid = tournamentId ? parseInt(tournamentId) : 1;
  
  const players = use(getPlayersAction(tid));

  return <AdminStandingsClient initialPlayers={players as any} tournamentId={tid} />;
}
