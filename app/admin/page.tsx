import React, { use } from 'react';
import { getPlayersAction } from '@/app/actions';
import AdminRegistrationsClient from '@/components/AdminRegistrationsClient';

export const dynamic = 'force-dynamic';

export default function AdminRegistrations({ searchParams }: { searchParams: Promise<{ tournamentId?: string }> }) {
  const { tournamentId } = use(searchParams);
  const tid = tournamentId ? parseInt(tournamentId) : 1;
  
  const players = use(getPlayersAction(tid));

  return <AdminRegistrationsClient initialPlayers={players as any} tournamentId={tid} />;
}
